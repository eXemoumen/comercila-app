package com.example.app.services;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;
import android.util.Log;

import androidx.core.app.NotificationCompat;

import com.example.app.R;
import com.example.app.database.AppDatabase;
import com.example.app.database.dao.OfflineQueueDao;
import com.example.app.database.dao.SaleDao;
import com.example.app.database.entity.OfflineQueueItem;
import com.example.app.database.entity.Sale;

import java.util.Date;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class OfflineSyncService extends Service {
    private static final String TAG = "OfflineSyncService";
    public static final String ACTION_SYNC_DATA = "com.example.app.SYNC_DATA";
    public static final String ACTION_ADD_TO_QUEUE = "com.example.app.ADD_TO_QUEUE";
    
    private static final String CHANNEL_ID = "offline_sync_channel";
    private static final int NOTIFICATION_ID = 1001;
    
    private AppDatabase database;
    private ExecutorService executorService;
    private boolean isRunning = false;
    
    @Override
    public void onCreate() {
        super.onCreate();
        database = AppDatabase.getInstance(this);
        executorService = Executors.newSingleThreadExecutor();
        createNotificationChannel();
    }
    
    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null) {
            String action = intent.getAction();
            if (ACTION_SYNC_DATA.equals(action)) {
                startSync();
            } else if (ACTION_ADD_TO_QUEUE.equals(action)) {
                // Handle adding items to offline queue
                String operationType = intent.getStringExtra("operation_type");
                String tableName = intent.getStringExtra("table_name");
                String recordId = intent.getStringExtra("record_id");
                String data = intent.getStringExtra("data");
                int priority = intent.getIntExtra("priority", 2);
                
                addToOfflineQueue(operationType, tableName, recordId, data, priority);
            }
        }
        
        return START_STICKY;
    }
    
    private void startSync() {
        if (isRunning) {
            Log.d(TAG, "Sync already running");
            return;
        }
        
        isRunning = true;
        startForeground(NOTIFICATION_ID, createNotification("Synchronizing data..."));
        
        executorService.execute(() -> {
            try {
                Log.d(TAG, "Starting offline sync...");
                
                // Process offline queue
                processOfflineQueue();
                
                // Sync local data with server
                syncLocalData();
                
                Log.d(TAG, "Offline sync completed");
                
            } catch (Exception e) {
                Log.e(TAG, "Error during sync", e);
            } finally {
                isRunning = false;
                stopForeground(true);
                stopSelf();
            }
        });
    }
    
    private void processOfflineQueue() {
        OfflineQueueDao queueDao = database.offlineQueueDao();
        List<OfflineQueueItem> pendingItems = queueDao.getPendingItems();
        
        Log.d(TAG, "Processing " + pendingItems.size() + " pending items");
        
        for (OfflineQueueItem item : pendingItems) {
            try {
                // Mark as processing
                item.status = "processing";
                queueDao.updateItem(item);
                
                // Process based on operation type
                boolean success = processQueueItem(item);
                
                if (success) {
                    item.status = "completed";
                    queueDao.updateItem(item);
                } else {
                    item.status = "failed";
                    item.retryCount++;
                    item.lastRetry = new Date();
                    queueDao.updateItem(item);
                }
                
            } catch (Exception e) {
                Log.e(TAG, "Error processing queue item: " + item.id, e);
                item.status = "failed";
                item.errorMessage = e.getMessage();
                queueDao.updateItem(item);
            }
        }
    }
    
    private boolean processQueueItem(OfflineQueueItem item) {
        // This would contain the actual logic to sync with Supabase
        // For now, we'll simulate the process
        Log.d(TAG, "Processing queue item: " + item.operationType + " on " + item.tableName);
        
        // Simulate network delay
        try {
            Thread.sleep(1000);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        
        // Simulate success/failure based on retry count
        return item.retryCount < 3;
    }
    
    private void syncLocalData() {
        // Sync local data with server
        SaleDao saleDao = database.saleDao();
        List<Sale> pendingSales = saleDao.getSalesBySyncStatus("pending");
        
        Log.d(TAG, "Syncing " + pendingSales.size() + " pending sales");
        
        for (Sale sale : pendingSales) {
            try {
                // Simulate server sync
                sale.syncStatus = "synced";
                sale.lastSyncAttempt = new Date();
                saleDao.updateSale(sale);
                
            } catch (Exception e) {
                Log.e(TAG, "Error syncing sale: " + sale.id, e);
                sale.syncStatus = "failed";
                sale.lastSyncAttempt = new Date();
                saleDao.updateSale(sale);
            }
        }
    }
    
    private void addToOfflineQueue(String operationType, String tableName, String recordId, String data, int priority) {
        OfflineQueueItem item = new OfflineQueueItem();
        item.operationType = operationType;
        item.tableName = tableName;
        item.recordId = recordId;
        item.data = data;
        item.priority = priority;
        item.status = "pending";
        item.createdAt = new Date();
        item.retryCount = 0;
        
        database.offlineQueueDao().insertItem(item);
        Log.d(TAG, "Added item to offline queue: " + operationType + " on " + tableName);
    }
    
    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Offline Sync",
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Notifications for offline data synchronization");
            
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }
    
    private Notification createNotification(String message) {
        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("TopFresh")
            .setContentText(message)
            .setSmallIcon(R.drawable.ic_launcher_foreground)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setOngoing(true)
            .build();
    }
    
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
    
    @Override
    public void onDestroy() {
        super.onDestroy();
        if (executorService != null) {
            executorService.shutdown();
        }
    }
}

