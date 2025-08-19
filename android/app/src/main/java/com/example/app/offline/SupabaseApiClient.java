package com.example.app.offline;

import android.content.Context;
import android.util.Log;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import java.io.IOException;
import java.util.concurrent.TimeUnit;

import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

/**
 * Supabase API client for sync operations
 */
public class SupabaseApiClient {
    private static final String TAG = "SupabaseApiClient";
    private static final MediaType JSON = MediaType.get("application/json; charset=utf-8");
    
    private final OkHttpClient httpClient;
    private final Gson gson;
    private final String baseUrl;
    private final String apiKey;
    
    public SupabaseApiClient(Context context) {
        // TODO: Get these from your app configuration
        this.baseUrl = "https://wiooeufthfytbflgtsnc.supabase.co";
        this.apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indpb29ldWZ0aGZ5dGJmbGd0c25jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxOTI1NjQsImV4cCI6MjA3MDc2ODU2NH0.14ZbYsKHUgqZC6dZMhR_51Yf3F-mG_WRBpKO3cz_E7M";
        
        this.httpClient = new OkHttpClient.Builder()
                .connectTimeout(OfflineConfig.NETWORK_TIMEOUT, TimeUnit.MILLISECONDS)
                .readTimeout(OfflineConfig.NETWORK_TIMEOUT, TimeUnit.MILLISECONDS)
                .writeTimeout(OfflineConfig.NETWORK_TIMEOUT, TimeUnit.MILLISECONDS)
                .build();
                
        this.gson = new Gson();
    }
    
    public static class ApiResponse {
        public final boolean success;
        public final String data;
        public final String error;
        public final int statusCode;
        
        public ApiResponse(boolean success, String data, String error, int statusCode) {
            this.success = success;
            this.data = data;
            this.error = error;
            this.statusCode = statusCode;
        }
        
        public static ApiResponse success(String data, int statusCode) {
            return new ApiResponse(true, data, null, statusCode);
        }
        
        public static ApiResponse error(String error, int statusCode) {
            return new ApiResponse(false, null, error, statusCode);
        }
    }
    
    /**
     * Create a new record in Supabase
     */
    public ApiResponse createRecord(String tableName, String jsonData) {
        try {
            String url = baseUrl + tableName;
            RequestBody body = RequestBody.create(jsonData, JSON);
            
            Request request = new Request.Builder()
                    .url(url)
                    .addHeader("apikey", apiKey)
                    .addHeader("Authorization", "Bearer " + apiKey)
                    .addHeader("Content-Type", "application/json")
                    .addHeader("Prefer", "return=representation")
                    .post(body)
                    .build();
            
            try (Response response = httpClient.newCall(request).execute()) {
                String responseBody = response.body() != null ? response.body().string() : "";
                
                if (response.isSuccessful()) {
                    Log.d(TAG, "Successfully created record in " + tableName);
                    return ApiResponse.success(responseBody, response.code());
                } else {
                    Log.e(TAG, "Failed to create record in " + tableName + ": " + responseBody);
                    return ApiResponse.error(responseBody, response.code());
                }
            }
            
        } catch (IOException e) {
            Log.e(TAG, "Network error creating record in " + tableName, e);
            return ApiResponse.error("Network error: " + e.getMessage(), -1);
        } catch (Exception e) {
            Log.e(TAG, "Unexpected error creating record in " + tableName, e);
            return ApiResponse.error("Unexpected error: " + e.getMessage(), -1);
        }
    }
    
    /**
     * Update an existing record in Supabase
     */
    public ApiResponse updateRecord(String tableName, String recordId, String jsonData) {
        try {
            String url = baseUrl + tableName + "?id=eq." + recordId;
            RequestBody body = RequestBody.create(jsonData, JSON);
            
            Request request = new Request.Builder()
                    .url(url)
                    .addHeader("apikey", apiKey)
                    .addHeader("Authorization", "Bearer " + apiKey)
                    .addHeader("Content-Type", "application/json")
                    .addHeader("Prefer", "return=representation")
                    .patch(body)
                    .build();
            
            try (Response response = httpClient.newCall(request).execute()) {
                String responseBody = response.body() != null ? response.body().string() : "";
                
                if (response.isSuccessful()) {
                    Log.d(TAG, "Successfully updated record " + recordId + " in " + tableName);
                    return ApiResponse.success(responseBody, response.code());
                } else {
                    Log.e(TAG, "Failed to update record " + recordId + " in " + tableName + ": " + responseBody);
                    return ApiResponse.error(responseBody, response.code());
                }
            }
            
        } catch (IOException e) {
            Log.e(TAG, "Network error updating record " + recordId + " in " + tableName, e);
            return ApiResponse.error("Network error: " + e.getMessage(), -1);
        } catch (Exception e) {
            Log.e(TAG, "Unexpected error updating record " + recordId + " in " + tableName, e);
            return ApiResponse.error("Unexpected error: " + e.getMessage(), -1);
        }
    }
    
    /**
     * Delete a record from Supabase
     */
    public ApiResponse deleteRecord(String tableName, String recordId) {
        try {
            String url = baseUrl + tableName + "?id=eq." + recordId;
            
            Request request = new Request.Builder()
                    .url(url)
                    .addHeader("apikey", apiKey)
                    .addHeader("Authorization", "Bearer " + apiKey)
                    .delete()
                    .build();
            
            try (Response response = httpClient.newCall(request).execute()) {
                String responseBody = response.body() != null ? response.body().string() : "";
                
                if (response.isSuccessful()) {
                    Log.d(TAG, "Successfully deleted record " + recordId + " from " + tableName);
                    return ApiResponse.success(responseBody, response.code());
                } else {
                    Log.e(TAG, "Failed to delete record " + recordId + " from " + tableName + ": " + responseBody);
                    return ApiResponse.error(responseBody, response.code());
                }
            }
            
        } catch (IOException e) {
            Log.e(TAG, "Network error deleting record " + recordId + " from " + tableName, e);
            return ApiResponse.error("Network error: " + e.getMessage(), -1);
        } catch (Exception e) {
            Log.e(TAG, "Unexpected error deleting record " + recordId + " from " + tableName, e);
            return ApiResponse.error("Unexpected error: " + e.getMessage(), -1);
        }
    }
    
    /**
     * Fetch records from Supabase for sync
     */
    public ApiResponse fetchRecords(String tableName, String filter) {
        try {
            String url = baseUrl + tableName;
            if (filter != null && !filter.isEmpty()) {
                url += "?" + filter;
            }
            
            Request request = new Request.Builder()
                    .url(url)
                    .addHeader("apikey", apiKey)
                    .addHeader("Authorization", "Bearer " + apiKey)
                    .get()
                    .build();
            
            try (Response response = httpClient.newCall(request).execute()) {
                String responseBody = response.body() != null ? response.body().string() : "";
                
                if (response.isSuccessful()) {
                    Log.d(TAG, "Successfully fetched records from " + tableName);
                    return ApiResponse.success(responseBody, response.code());
                } else {
                    Log.e(TAG, "Failed to fetch records from " + tableName + ": " + responseBody);
                    return ApiResponse.error(responseBody, response.code());
                }
            }
            
        } catch (IOException e) {
            Log.e(TAG, "Network error fetching records from " + tableName, e);
            return ApiResponse.error("Network error: " + e.getMessage(), -1);
        } catch (Exception e) {
            Log.e(TAG, "Unexpected error fetching records from " + tableName, e);
            return ApiResponse.error("Unexpected error: " + e.getMessage(), -1);
        }
    }
    
    /**
     * Check if a conflict exists (record was modified on server)
     */
    public boolean hasConflict(String tableName, String recordId, String lastModified) {
        try {
            String url = baseUrl + tableName + "?id=eq." + recordId + "&select=updated_at";
            
            Request request = new Request.Builder()
                    .url(url)
                    .addHeader("apikey", apiKey)
                    .addHeader("Authorization", "Bearer " + apiKey)
                    .get()
                    .build();
            
            try (Response response = httpClient.newCall(request).execute()) {
                if (response.isSuccessful() && response.body() != null) {
                    String responseBody = response.body().string();
                    JsonObject jsonResponse = JsonParser.parseString(responseBody).getAsJsonArray().get(0).getAsJsonObject();
                    String serverModified = jsonResponse.get("updated_at").getAsString();
                    
                    // Compare timestamps to detect conflicts
                    return !serverModified.equals(lastModified);
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Error checking for conflicts", e);
        }
        
        return false; // Assume no conflict on error
    }
    
    /**
     * Test the connection to Supabase
     */
    public boolean testConnection() {
        try {
            String url = baseUrl.replace("/rest/v1/", "/rest/v1/");
            
            Request request = new Request.Builder()
                    .url(url)
                    .addHeader("apikey", apiKey)
                    .get()
                    .build();
            
            try (Response response = httpClient.newCall(request).execute()) {
                return response.isSuccessful();
            }
        } catch (Exception e) {
            Log.e(TAG, "Connection test failed", e);
            return false;
        }
    }
}
