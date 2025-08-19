package com.example.app.services;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.os.Binder;
import android.os.Build;
import android.os.IBinder;
import android.util.Log;

import androidx.core.app.NotificationCompat;

import com.example.app.R;
import com.example.app.offline.OfflineConfig;
import com.example.app.offline.OfflineSyncManager;
import com.example.app.offline.NetworkQualityMonitor;

public class OfflineSyncService extends Service implements OfflineSyncManager.SyncListener {
    private static final String TAG = "OfflineSyncService";
    
    // Actions
    public static final String ACTION_SYNC_DATA = "com.example.app.SYNC_DATA";
    public static final String ACTION_ADD_TO_QUEUE = "com.example.app.ADD_TO_QUEUE";
    public static final String ACTION_STOP_SYNC = "com.example.app.STOP_SYNC";
    
    // Extras for ADD_TO_QUEUE action
    public static final String EXTRA_OPERATION_TYPE = "operation_type";
    public static final String EXTRA_TABLE_NAME = "table_name";
    public static final String EXTRA_RECORD_ID = "record_id";
    public static final String EXTRA_DATA = "data";
    public static final String EXTRA_PRIORITY = "priority";
    
    private OfflineSyncManager syncManager;
    private NotificationManager notificationManager;
    private final IBinder binder = new LocalBinder();
    
    public class LocalBinder extends Binder {
        public OfflineSyncService getService() {
            return OfflineSyncService.this;
        }
    }
    
    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "Service created");
        
        syncManager = new OfflineSyncManager(this);
        syncManager.setSyncListener(this);
        
        notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        createNotificationChannel();
    }
    
    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null) {
            String action = intent.getAction();
            Log.d(TAG, "Received action: " + action);
            
            if (ACTION_SYNC_DATA.equals(action)) {
                syncManager.startSync();
            } else if (ACTION_ADD_TO_QUEUE.equals(action)) {
                handleAddToQueue(intent);
            } else if (ACTION_STOP_SYNC.equals(action)) {
                syncManager.stopSync();
            }
        }
        
        return START_STICKY;
    }
    
    private void handleAddToQueue(Intent intent) {
        String operationType = intent.getStringExtra(EXTRA_OPERATION_TYPE);
        String tableName = intent.getStringExtra(EXTRA_TABLE_NAME);
        String recordId = intent.getStringExtra(EXTRA_RECORD_ID);
        String data = intent.getStringExtra(EXTRA_DATA);
        int priority = intent.getIntExtra(EXTRA_PRIORITY, OfflineConfig.PRIORITY_MEDIUM);
        
        if (operationType != null && tableName != null && recordId != null && data != null) {
            syncManager.queueOperation(operationType, tableName, recordId, data, priority);
            Log.d(TAG, "Queued operation: " + operationType + " on " + tableName);
        } else {
            Log.w(TAG, "Invalid queue operation parameters");
        }
    }
    
    // SyncListener implementation
    @Override
    public void onSyncStarted() {
        Log.d(TAG, "Sync started");
        startForeground(OfflineConfig.NOTIFICATION_ID, createNotification("Synchronizing data..."));
    }
    
    @Override
    public void onSyncProgress(int completed, int total) {
        Log.d(TAG, "Sync progress: " + completed + "/" + total);
        String message = "Synchronizing... " + completed + "/" + total + " items";
        updateNotification(message);
    }
    
    @Override
    public void onSyncCompleted(OfflineSyncManager.SyncResult result) {
        Log.d(TAG, "Sync completed: " + result.successfulItems + "/" + result.totalItems + " successful");
        
        String message;
        if (result.isSuccess()) {
            message = "Sync completed successfully (" + result.successfulItems + " items)";
        } else {
            message = "Sync completed with " + result.failedItems + " failures";
        }
        
        updateNotification(message);
        
        // Stop foreground after a delay to show the result
        new android.os.Handler().postDelayed(() -> {
            stopForeground(true);
            // Keep service running for future sync operations
        }, 3000);
    }
    
    @Override
    public void onSyncError(String error) {
        Log.e(TAG, "Sync error: " + error);
        updateNotification("Sync error: " + error);
        
        // Stop foreground after showing error
        new android.os.Handler().postDelayed(() -> {
            stopForeground(true);
        }, 3000);
    }
    
    @Override
    public void onNetworkStatusChanged(boolean available, NetworkQualityMonitor.NetworkInfo networkInfo) {
        if (available && networkInfo != null) {
            Log.d(TAG, "Network available: " + networkInfo.type + " (quality: " + networkInfo.quality + ")");
        } else {
            Log.d(TAG, "Network unavailable");
        }
    }
    
    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                OfflineConfig.NOTIFICATION_CHANNEL_ID,
                "Offline Sync",
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Notifications for offline data synchronization");
            channel.setShowBadge(false);
            
            if (notificationManager != null) {
                notificationManager.createNotificationChannel(channel);
            }
        }
    }
    
    private Notification createNotification(String message) {
        return new NotificationCompat.Builder(this, OfflineConfig.NOTIFICATION_CHANNEL_ID)
            .setContentTitle("TopFresh Sync")
            .setContentText(message)
            .setSmallIcon(R.drawable.ic_launcher_foreground)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setOngoing(true)
            .setAutoCancel(false)
            .build();
    }
    
    private void updateNotification(String message) {
        if (notificationManager != null) {
            Notification notification = createNotification(message);
            notificationManager.notify(OfflineConfig.NOTIFICATION_ID, notification);
        }
    }
    
    // Public API methods for bound clients
    public OfflineSyncManager getSyncManager() {
        return syncManager;
    }
    
    public void queueOperation(String operationType, String tableName, String recordId, String data, int priority) {
        if (syncManager != null) {
            syncManager.queueOperation(operationType, tableName, recordId, data, priority);
        }
    }
    
    public boolean isSyncing() {
        return syncManager != null && syncManager.isSyncing();
    }
    
    public int getPendingItemsCount() {
        return syncManager != null ? syncManager.getPendingItemsCount() : 0;
    }
    
    public int getFailedItemsCount() {
        return syncManager != null ? syncManager.getFailedItemsCount() : 0;
    }
    
    @Override
    public IBinder onBind(Intent intent) {
        return binder;
    }
    
    @Override
    public void onDestroy() {
        super.onDestroy();
        Log.d(TAG, "Service destroyed");
        
        if (syncManager != null) {
            syncManager.shutdown();
        }
    }
}


