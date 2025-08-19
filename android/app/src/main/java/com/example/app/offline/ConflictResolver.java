package com.example.app.offline;

import android.util.Log;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

/**
 * Handles data conflicts during sync operations
 */
public class ConflictResolver {
    private static final String TAG = "ConflictResolver";
    private final Gson gson = new Gson();
    private final SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US);
    
    public enum ConflictResolution {
        USE_LOCAL,      // Keep local changes
        USE_REMOTE,     // Use server version
        MERGE,          // Attempt to merge changes
        MANUAL,         // Requires manual resolution
        SKIP            // Skip this record
    }
    
    public static class ConflictResult {
        public final ConflictResolution resolution;
        public final String resolvedData;
        public final String conflictReason;
        
        public ConflictResult(ConflictResolution resolution, String resolvedData, String conflictReason) {
            this.resolution = resolution;
            this.resolvedData = resolvedData;
            this.conflictReason = conflictReason;
        }
    }
    
    /**
     * Resolve conflicts between local and remote data
     */
    public ConflictResult resolveConflict(String tableName, String localData, String remoteData) {
        try {
            JsonObject localJson = JsonParser.parseString(localData).getAsJsonObject();
            JsonObject remoteJson = JsonParser.parseString(remoteData).getAsJsonObject();
            
            // Check if data is actually different
            if (localJson.equals(remoteJson)) {
                return new ConflictResult(ConflictResolution.USE_REMOTE, remoteData, "No actual conflict");
            }
            
            // Get timestamps for comparison
            Date localModified = getTimestamp(localJson, "updated_at");
            Date remoteModified = getTimestamp(remoteJson, "updated_at");
            
            if (localModified == null && remoteModified == null) {
                // No timestamps available, use table-specific logic
                return resolveByTableLogic(tableName, localJson, remoteJson);
            }
            
            if (localModified != null && remoteModified != null) {
                // Use timestamp-based resolution
                if (localModified.after(remoteModified)) {
                    Log.d(TAG, "Local version is newer, using local data");
                    return new ConflictResult(ConflictResolution.USE_LOCAL, localData, "Local version newer");
                } else if (remoteModified.after(localModified)) {
                    Log.d(TAG, "Remote version is newer, using remote data");
                    return new ConflictResult(ConflictResolution.USE_REMOTE, remoteData, "Remote version newer");
                } else {
                    // Same timestamp, try to merge
                    return attemptMerge(tableName, localJson, remoteJson);
                }
            }
            
            // Fallback to table-specific logic
            return resolveByTableLogic(tableName, localJson, remoteJson);
            
        } catch (Exception e) {
            Log.e(TAG, "Error resolving conflict", e);
            // On error, prefer remote data to maintain consistency
            return new ConflictResult(ConflictResolution.USE_REMOTE, remoteData, "Error in conflict resolution: " + e.getMessage());
        }
    }
    
    private ConflictResult resolveByTableLogic(String tableName, JsonObject localJson, JsonObject remoteJson) {
        switch (tableName) {
            case OfflineConfig.TABLE_SALES:
                return resolveSalesConflict(localJson, remoteJson);
            case OfflineConfig.TABLE_ORDERS:
                return resolveOrdersConflict(localJson, remoteJson);
            case OfflineConfig.TABLE_STOCK:
                return resolveStockConflict(localJson, remoteJson);
            case OfflineConfig.TABLE_SUPERMARKETS:
                return resolveSupermarketsConflict(localJson, remoteJson);
            default:
                Log.w(TAG, "No specific conflict resolution for table: " + tableName);
                return new ConflictResult(ConflictResolution.USE_REMOTE, gson.toJson(remoteJson), "Default to remote");
        }
    }
    
    private ConflictResult resolveSalesConflict(JsonObject localJson, JsonObject remoteJson) {
        // For sales, payment status changes are critical
        boolean localPaid = localJson.has("is_paid") && localJson.get("is_paid").getAsBoolean();
        boolean remotePaid = remoteJson.has("is_paid") && remoteJson.get("is_paid").getAsBoolean();
        
        if (localPaid != remotePaid) {
            // Payment status conflict - prefer paid status
            if (localPaid) {
                return new ConflictResult(ConflictResolution.USE_LOCAL, gson.toJson(localJson), "Local payment status preferred");
            } else {
                return new ConflictResult(ConflictResolution.USE_REMOTE, gson.toJson(remoteJson), "Remote payment status preferred");
            }
        }
        
        // Try to merge other fields
        return attemptMerge(OfflineConfig.TABLE_SALES, localJson, remoteJson);
    }
    
    private ConflictResult resolveOrdersConflict(JsonObject localJson, JsonObject remoteJson) {
        // For orders, status changes are important
        String localStatus = getStringField(localJson, "status");
        String remoteStatus = getStringField(remoteJson, "status");
        
        if (!localStatus.equals(remoteStatus)) {
            // Status conflict - use more advanced status
            int localStatusLevel = getOrderStatusLevel(localStatus);
            int remoteStatusLevel = getOrderStatusLevel(remoteStatus);
            
            if (localStatusLevel > remoteStatusLevel) {
                return new ConflictResult(ConflictResolution.USE_LOCAL, gson.toJson(localJson), "Local status more advanced");
            } else {
                return new ConflictResult(ConflictResolution.USE_REMOTE, gson.toJson(remoteJson), "Remote status more advanced");
            }
        }
        
        return attemptMerge(OfflineConfig.TABLE_ORDERS, localJson, remoteJson);
    }
    
    private ConflictResult resolveStockConflict(JsonObject localJson, JsonObject remoteJson) {
        // For stock, quantity changes are critical
        int localQuantity = getIntField(localJson, "quantity");
        int remoteQuantity = getIntField(remoteJson, "quantity");
        
        if (localQuantity != remoteQuantity) {
            // Quantity conflict - this needs manual resolution or business logic
            return new ConflictResult(ConflictResolution.MANUAL, null, 
                "Stock quantity conflict: local=" + localQuantity + ", remote=" + remoteQuantity);
        }
        
        return attemptMerge(OfflineConfig.TABLE_STOCK, localJson, remoteJson);
    }
    
    private ConflictResult resolveSupermarketsConflict(JsonObject localJson, JsonObject remoteJson) {
        // For supermarkets, contact info updates are important
        return attemptMerge(OfflineConfig.TABLE_SUPERMARKETS, localJson, remoteJson);
    }
    
    private ConflictResult attemptMerge(String tableName, JsonObject localJson, JsonObject remoteJson) {
        try {
            JsonObject merged = new JsonObject();
            
            // Start with remote data as base
            for (String key : remoteJson.keySet()) {
                merged.add(key, remoteJson.get(key));
            }
            
            // Override with local changes for specific fields
            for (String key : localJson.keySet()) {
                if (shouldPreferLocalField(tableName, key)) {
                    merged.add(key, localJson.get(key));
                }
            }
            
            // Update the modified timestamp
            merged.addProperty("updated_at", new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).format(new Date()));
            
            return new ConflictResult(ConflictResolution.MERGE, gson.toJson(merged), "Successfully merged changes");
            
        } catch (Exception e) {
            Log.e(TAG, "Error attempting merge", e);
            return new ConflictResult(ConflictResolution.USE_REMOTE, gson.toJson(remoteJson), "Merge failed: " + e.getMessage());
        }
    }
    
    private boolean shouldPreferLocalField(String tableName, String fieldName) {
        // Define fields that should prefer local values during merge
        switch (tableName) {
            case OfflineConfig.TABLE_SALES:
                return fieldName.equals("note") || fieldName.equals("payment_note");
            case OfflineConfig.TABLE_ORDERS:
                return fieldName.equals("note");
            case OfflineConfig.TABLE_STOCK:
                return false; // Stock changes should prefer remote
            case OfflineConfig.TABLE_SUPERMARKETS:
                return fieldName.equals("note");
            default:
                return fieldName.equals("note");
        }
    }
    
    private Date getTimestamp(JsonObject json, String field) {
        try {
            if (json.has(field) && !json.get(field).isJsonNull()) {
                String timestamp = json.get(field).getAsString();
                return dateFormat.parse(timestamp);
            }
        } catch (ParseException e) {
            Log.w(TAG, "Error parsing timestamp: " + field, e);
        }
        return null;
    }
    
    private String getStringField(JsonObject json, String field) {
        if (json.has(field) && !json.get(field).isJsonNull()) {
            return json.get(field).getAsString();
        }
        return "";
    }
    
    private int getIntField(JsonObject json, String field) {
        if (json.has(field) && !json.get(field).isJsonNull()) {
            return json.get(field).getAsInt();
        }
        return 0;
    }
    
    private int getOrderStatusLevel(String status) {
        // Define order status hierarchy
        switch (status.toLowerCase()) {
            case "draft": return 1;
            case "pending": return 2;
            case "confirmed": return 3;
            case "processing": return 4;
            case "shipped": return 5;
            case "delivered": return 6;
            case "completed": return 7;
            case "cancelled": return 0;
            default: return 1;
        }
    }
}
