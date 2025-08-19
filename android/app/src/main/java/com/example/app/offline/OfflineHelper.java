package com.example.app.offline;

import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.ServiceConnection;
import android.os.Build;
import android.os.IBinder;
import android.util.Log;

import com.example.app.services.OfflineSyncService;
import com.google.gson.Gson;

/**
 * Helper class for easy integration with the offline sync system
 */
public class OfflineHelper {
    private static final String TAG = "OfflineHelper";
    
    private final Context context;
    private final Gson gson;
    
    private OfflineSyncService syncService;
    private boolean isBound = false;
    
    private final ServiceConnection serviceConnection = new ServiceConnection() {
        @Override
        public void onServiceConnected(ComponentName name, IBinder service) {
            OfflineSyncService.LocalBinder binder = (OfflineSyncService.LocalBinder) service;
            syncService = binder.getService();
            isBound = true;
            Log.d(TAG, "Service connected");
        }
        
        @Override
        public void onServiceDisconnected(ComponentName name) {
            syncService = null;
            isBound = false;
            Log.d(TAG, "Service disconnected");
        }
    };
    
    public OfflineHelper(Context context) {
        this.context = context.getApplicationContext();
        this.gson = new Gson();
        bindToService();
    }
    
    private void bindToService() {
        Intent intent = new Intent(context, OfflineSyncService.class);
        context.bindService(intent, serviceConnection, Context.BIND_AUTO_CREATE);
    }
    
    /**
     * Queue a create operation for offline sync
     */
    public void queueCreate(String tableName, Object data) {
        queueCreate(tableName, data, OfflineConfig.PRIORITY_MEDIUM);
    }
    
    public void queueCreate(String tableName, Object data, int priority) {
        String jsonData = gson.toJson(data);
        String recordId = generateTempId();
        queueOperation(OfflineConfig.OP_CREATE, tableName, recordId, jsonData, priority);
    }
    
    /**
     * Queue an update operation for offline sync
     */
    public void queueUpdate(String tableName, String recordId, Object data) {
        queueUpdate(tableName, recordId, data, OfflineConfig.PRIORITY_MEDIUM);
    }
    
    public void queueUpdate(String tableName, String recordId, Object data, int priority) {
        String jsonData = gson.toJson(data);
        queueOperation(OfflineConfig.OP_UPDATE, tableName, recordId, jsonData, priority);
    }
    
    /**
     * Queue a delete operation for offline sync
     */
    public void queueDelete(String tableName, String recordId) {
        queueDelete(tableName, recordId, OfflineConfig.PRIORITY_MEDIUM);
    }
    
    public void queueDelete(String tableName, String recordId, int priority) {
        queueOperation(OfflineConfig.OP_DELETE, tableName, recordId, "", priority);
    }
    
    private void queueOperation(String operationType, String tableName, String recordId, String data, int priority) {
        if (isBound && syncService != null) {
            // Use bound service for immediate queueing
            syncService.queueOperation(operationType, tableName, recordId, data, priority);
        } else {
            // Use intent for queueing when service is not bound
            Intent intent = new Intent(context, OfflineSyncService.class);
            intent.setAction(OfflineSyncService.ACTION_ADD_TO_QUEUE);
            intent.putExtra(OfflineSyncService.EXTRA_OPERATION_TYPE, operationType);
            intent.putExtra(OfflineSyncService.EXTRA_TABLE_NAME, tableName);
            intent.putExtra(OfflineSyncService.EXTRA_RECORD_ID, recordId);
            intent.putExtra(OfflineSyncService.EXTRA_DATA, data);
            intent.putExtra(OfflineSyncService.EXTRA_PRIORITY, priority);
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent);
            } else {
                context.startService(intent);
            }
        }
        
        Log.d(TAG, "Queued " + operationType + " operation for " + tableName + ":" + recordId);
    }
    
    /**
     * Manually trigger sync
     */
    public void triggerSync() {
        if (isBound && syncService != null) {
            syncService.getSyncManager().startSync();
        } else {
            Intent intent = new Intent(context, OfflineSyncService.class);
            intent.setAction(OfflineSyncService.ACTION_SYNC_DATA);
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent);
            } else {
                context.startService(intent);
            }
        }
        
        Log.d(TAG, "Triggered manual sync");
    }
    
    /**
     * Stop ongoing sync
     */
    public void stopSync() {
        if (isBound && syncService != null) {
            syncService.getSyncManager().stopSync();
        } else {
            Intent intent = new Intent(context, OfflineSyncService.class);
            intent.setAction(OfflineSyncService.ACTION_STOP_SYNC);
            context.startService(intent);
        }
        
        Log.d(TAG, "Stopped sync");
    }
    
    /**
     * Check if sync is currently running
     */
    public boolean isSyncing() {
        if (isBound && syncService != null) {
            return syncService.isSyncing();
        }
        return false;
    }
    
    /**
     * Get number of pending sync items
     */
    public int getPendingItemsCount() {
        if (isBound && syncService != null) {
            return syncService.getPendingItemsCount();
        }
        return 0;
    }
    
    /**
     * Get number of failed sync items
     */
    public int getFailedItemsCount() {
        if (isBound && syncService != null) {
            return syncService.getFailedItemsCount();
        }
        return 0;
    }
    
    /**
     * Set sync listener for callbacks
     */
    public void setSyncListener(OfflineSyncManager.SyncListener listener) {
        if (isBound && syncService != null && syncService.getSyncManager() != null) {
            syncService.getSyncManager().setSyncListener(listener);
        }
    }
    
    /**
     * Get current network info
     */
    public NetworkQualityMonitor.NetworkInfo getNetworkInfo() {
        NetworkQualityMonitor monitor = new NetworkQualityMonitor(context);
        return monitor.getCurrentNetworkInfo();
    }
    
    /**
     * Check if network is suitable for sync
     */
    public boolean isNetworkSuitableForSync() {
        return getNetworkInfo().isSuitableForSync();
    }
    
    private String generateTempId() {
        return "temp_" + System.currentTimeMillis() + "_" + (int)(Math.random() * 1000);
    }
    
    /**
     * Cleanup resources
     */
    public void cleanup() {
        if (isBound) {
            try {
                context.unbindService(serviceConnection);
                isBound = false;
            } catch (Exception e) {
                Log.w(TAG, "Error unbinding service", e);
            }
        }
    }
    
    // Convenience methods for common operations
    
    /**
     * Queue a sale for offline sync
     */
    public void queueSale(Object saleData, boolean isHighPriority) {
        int priority = isHighPriority ? OfflineConfig.PRIORITY_HIGH : OfflineConfig.PRIORITY_MEDIUM;
        queueCreate(OfflineConfig.TABLE_SALES, saleData, priority);
    }
    
    /**
     * Queue an order for offline sync
     */
    public void queueOrder(Object orderData) {
        queueCreate(OfflineConfig.TABLE_ORDERS, orderData, OfflineConfig.PRIORITY_MEDIUM);
    }
    
    /**
     * Queue stock update for offline sync
     */
    public void queueStockUpdate(String stockId, Object stockData, boolean isHighPriority) {
        int priority = isHighPriority ? OfflineConfig.PRIORITY_HIGH : OfflineConfig.PRIORITY_MEDIUM;
        queueUpdate(OfflineConfig.TABLE_STOCK, stockId, stockData, priority);
    }
    
    /**
     * Queue supermarket update for offline sync
     */
    public void queueSupermarketUpdate(String supermarketId, Object supermarketData) {
        queueUpdate(OfflineConfig.TABLE_SUPERMARKETS, supermarketId, supermarketData, OfflineConfig.PRIORITY_LOW);
    }
}
