package com.example.app.offline;

import android.content.Context;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;

import com.example.app.database.AppDatabase;
import com.example.app.database.dao.OfflineQueueDao;
import com.example.app.database.entity.OfflineQueueItem;
import com.google.gson.Gson;

import java.util.Date;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Enhanced offline sync manager with improved error handling, retry logic, and conflict resolution
 */
public class OfflineSyncManager implements NetworkQualityMonitor.NetworkQualityListener {
    private static final String TAG = "OfflineSyncManager";
    
    private final Context context;
    private final AppDatabase database;
    private final OfflineQueueDao queueDao;
    private final SupabaseApiClient apiClient;
    private final NetworkQualityMonitor networkMonitor;
    private final ConflictResolver conflictResolver;
    private final Gson gson;
    
    private final ExecutorService executorService;
    private final Handler mainHandler;
    
    private final AtomicBoolean isSyncing = new AtomicBoolean(false);
    private final AtomicBoolean isNetworkAvailable = new AtomicBoolean(false);
    
    private SyncListener syncListener;
    private Future<?> currentSyncTask;
    
    public interface SyncListener {
        void onSyncStarted();
        void onSyncProgress(int completed, int total);
        void onSyncCompleted(SyncResult result);
        void onSyncError(String error);
        void onNetworkStatusChanged(boolean available, NetworkQualityMonitor.NetworkInfo networkInfo);
    }
    
    public static class SyncResult {
        public final int totalItems;
        public final int successfulItems;
        public final int failedItems;
        public final int conflictItems;
        public final long syncDuration;
        public final String errorMessage;
        
        public SyncResult(int totalItems, int successfulItems, int failedItems, 
                         int conflictItems, long syncDuration, String errorMessage) {
            this.totalItems = totalItems;
            this.successfulItems = successfulItems;
            this.failedItems = failedItems;
            this.conflictItems = conflictItems;
            this.syncDuration = syncDuration;
            this.errorMessage = errorMessage;
        }
        
        public boolean isSuccess() {
            return failedItems == 0 && errorMessage == null;
        }
    }
    
    public OfflineSyncManager(Context context) {
        this.context = context.getApplicationContext();
        this.database = AppDatabase.getInstance(context);
        this.queueDao = database.offlineQueueDao();
        this.apiClient = new SupabaseApiClient(context);
        this.networkMonitor = new NetworkQualityMonitor(context);
        this.conflictResolver = new ConflictResolver();
        this.gson = new Gson();
        
        this.executorService = Executors.newFixedThreadPool(OfflineConfig.MAX_CONCURRENT_OPERATIONS);
        this.mainHandler = new Handler(Looper.getMainLooper());
        
        // Start monitoring network
        networkMonitor.startMonitoring(this);
    }
    
    /**
     * Add an operation to the offline queue
     */
    public void queueOperation(String operationType, String tableName, String recordId, 
                              String data, int priority) {
        executorService.execute(() -> {
            try {
                // Check if similar operation already exists
                List<OfflineQueueItem> existingItems = queueDao.getItemsByTableAndRecord(tableName, recordId);
                
                // Remove duplicate pending operations for the same record
                for (OfflineQueueItem existing : existingItems) {
                    if (OfflineConfig.STATUS_PENDING.equals(existing.status) && 
                        operationType.equals(existing.operationType)) {
                        queueDao.deleteItem(existing);
                        Log.d(TAG, "Removed duplicate operation: " + existing.id);
                    }
                }
                
                // Create new queue item
                OfflineQueueItem item = new OfflineQueueItem();
                item.operationType = operationType;
                item.tableName = tableName;
                item.recordId = recordId;
                item.data = data;
                item.priority = priority;
                item.status = OfflineConfig.STATUS_PENDING;
                item.createdAt = new Date();
                item.retryCount = 0;
                
                queueDao.insertItem(item);
                Log.d(TAG, "Queued operation: " + operationType + " on " + tableName + ":" + recordId);
                
                // Trigger sync if network is available
                if (isNetworkAvailable.get()) {
                    startSync();
                }
                
            } catch (Exception e) {
                Log.e(TAG, "Error queueing operation", e);
            }
        });
    }
    
    /**
     * Start synchronization process
     */
    public void startSync() {
        if (isSyncing.getAndSet(true)) {
            Log.d(TAG, "Sync already in progress");
            return;
        }
        
        if (!isNetworkAvailable.get()) {
            Log.d(TAG, "No network available for sync");
            isSyncing.set(false);
            return;
        }
        
        Log.d(TAG, "Starting sync process");
        notifyOnMainThread(() -> {
            if (syncListener != null) {
                syncListener.onSyncStarted();
            }
        });
        
        currentSyncTask = executorService.submit(this::performSync);
    }
    
    /**
     * Stop ongoing synchronization
     */
    public void stopSync() {
        if (currentSyncTask != null && !currentSyncTask.isDone()) {
            currentSyncTask.cancel(true);
            Log.d(TAG, "Sync cancelled");
        }
        isSyncing.set(false);
    }
    
    private void performSync() {
        long startTime = System.currentTimeMillis();
        int totalItems = 0;
        int successfulItems = 0;
        int failedItems = 0;
        int conflictItems = 0;
        String errorMessage = null;
        
        try {
            // Get pending items ordered by priority
            List<OfflineQueueItem> pendingItems = queueDao.getPendingItems();
            totalItems = pendingItems.size();
            
            Log.d(TAG, "Processing " + totalItems + " pending items");
            
            if (totalItems == 0) {
                Log.d(TAG, "No pending items to sync");
                return;
            }
            
            // Process items in batches
            for (int i = 0; i < pendingItems.size(); i += OfflineConfig.BATCH_SIZE) {
                if (Thread.currentThread().isInterrupted()) {
                    Log.d(TAG, "Sync interrupted");
                    break;
                }
                
                int endIndex = Math.min(i + OfflineConfig.BATCH_SIZE, pendingItems.size());
                List<OfflineQueueItem> batch = pendingItems.subList(i, endIndex);
                
                for (OfflineQueueItem item : batch) {
                    try {
                        SyncItemResult result = syncItem(item);
                        
                        switch (result.status) {
                            case SUCCESS:
                                successfulItems++;
                                break;
                            case FAILED:
                                failedItems++;
                                break;
                            case CONFLICT:
                                conflictItems++;
                                break;
                        }
                        
                        // Update progress
                        final int currentCompleted = successfulItems + failedItems + conflictItems;
                        final int currentTotal = totalItems;
                        notifyOnMainThread(() -> {
                            if (syncListener != null) {
                                syncListener.onSyncProgress(currentCompleted, currentTotal);
                            }
                        });
                        
                    } catch (Exception e) {
                        Log.e(TAG, "Error syncing item: " + item.id, e);
                        failedItems++;
                        updateItemStatus(item, OfflineConfig.STATUS_FAILED, e.getMessage());
                    }
                }
                
                // Check network quality between batches
                NetworkQualityMonitor.NetworkInfo networkInfo = networkMonitor.getCurrentNetworkInfo();
                if (!networkInfo.isSuitableForSync()) {
                    Log.w(TAG, "Network quality degraded, pausing sync");
                    break;
                }
            }
            
            // Cleanup completed items
            cleanupCompletedItems();
            
        } catch (Exception e) {
            Log.e(TAG, "Error during sync", e);
            errorMessage = e.getMessage();
        } finally {
            isSyncing.set(false);
            
            long syncDuration = System.currentTimeMillis() - startTime;
            SyncResult result = new SyncResult(totalItems, successfulItems, failedItems, 
                                             conflictItems, syncDuration, errorMessage);
            
            Log.d(TAG, "Sync completed: " + successfulItems + "/" + totalItems + " successful, " +
                      failedItems + " failed, " + conflictItems + " conflicts in " + syncDuration + "ms");
            
            notifyOnMainThread(() -> {
                if (syncListener != null) {
                    syncListener.onSyncCompleted(result);
                }
            });
        }
    }
    
    private enum SyncItemStatus {
        SUCCESS, FAILED, CONFLICT, RETRY
    }
    
    private static class SyncItemResult {
        final SyncItemStatus status;
        final String message;
        
        SyncItemResult(SyncItemStatus status, String message) {
            this.status = status;
            this.message = message;
        }
    }
    
    private SyncItemResult syncItem(OfflineQueueItem item) {
        Log.d(TAG, "Syncing item: " + item.id + " (" + item.operationType + " on " + item.tableName + ")");
        
        // Mark as processing
        updateItemStatus(item, OfflineConfig.STATUS_PROCESSING, null);
        
        try {
            SupabaseApiClient.ApiResponse response = null;
            
            switch (item.operationType) {
                case OfflineConfig.OP_CREATE:
                    response = apiClient.createRecord(item.tableName, item.data);
                    break;
                case OfflineConfig.OP_UPDATE:
                    response = apiClient.updateRecord(item.tableName, item.recordId, item.data);
                    break;
                case OfflineConfig.OP_DELETE:
                    response = apiClient.deleteRecord(item.tableName, item.recordId);
                    break;
                default:
                    return new SyncItemResult(SyncItemStatus.FAILED, "Unknown operation type: " + item.operationType);
            }
            
            if (response.success) {
                updateItemStatus(item, OfflineConfig.STATUS_COMPLETED, null);
                return new SyncItemResult(SyncItemStatus.SUCCESS, "Operation completed successfully");
            } else {
                return handleSyncError(item, response.error, response.statusCode);
            }
            
        } catch (Exception e) {
            return handleSyncError(item, e.getMessage(), -1);
        }
    }
    
    private SyncItemResult handleSyncError(OfflineQueueItem item, String error, int statusCode) {
        RetryStrategy retryStrategy = getRetryStrategy(item.priority);
        
        if (statusCode == 409) { // Conflict
            return handleConflict(item, error);
        }
        
        if (retryStrategy.shouldRetry(item.retryCount, new RuntimeException(error), statusCode)) {
            long delay = retryStrategy.calculateDelay(item.retryCount);
            if (delay > 0) {
                scheduleRetry(item, delay);
                return new SyncItemResult(SyncItemStatus.RETRY, "Scheduled for retry in " + delay + "ms");
            }
        }
        
        // No more retries, mark as failed
        updateItemStatus(item, OfflineConfig.STATUS_FAILED, error);
        return new SyncItemResult(SyncItemStatus.FAILED, error);
    }
    
    private SyncItemResult handleConflict(OfflineQueueItem item, String error) {
        try {
            // Fetch current remote data
            SupabaseApiClient.ApiResponse remoteResponse = apiClient.fetchRecords(
                item.tableName, "id=eq." + item.recordId);
            
            if (remoteResponse.success && remoteResponse.data != null) {
                ConflictResolver.ConflictResult resolution = conflictResolver.resolveConflict(
                    item.tableName, item.data, remoteResponse.data);
                
                switch (resolution.resolution) {
                    case USE_LOCAL:
                        // Retry with force update
                        return new SyncItemResult(SyncItemStatus.RETRY, "Using local version");
                    case USE_REMOTE:
                        // Accept remote version, mark as completed
                        updateItemStatus(item, OfflineConfig.STATUS_COMPLETED, "Conflict resolved: using remote version");
                        return new SyncItemResult(SyncItemStatus.CONFLICT, "Used remote version");
                    case MERGE:
                        // Update item data with merged version and retry
                        item.data = resolution.resolvedData;
                        queueDao.updateItem(item);
                        return new SyncItemResult(SyncItemStatus.RETRY, "Merged changes");
                    case MANUAL:
                        // Requires manual intervention
                        updateItemStatus(item, OfflineConfig.STATUS_FAILED, "Manual conflict resolution required: " + resolution.conflictReason);
                        return new SyncItemResult(SyncItemStatus.CONFLICT, "Manual resolution required");
                    case SKIP:
                        updateItemStatus(item, OfflineConfig.STATUS_CANCELLED, "Conflict skipped");
                        return new SyncItemResult(SyncItemStatus.CONFLICT, "Skipped");
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Error handling conflict", e);
        }
        
        updateItemStatus(item, OfflineConfig.STATUS_FAILED, "Conflict resolution failed");
        return new SyncItemResult(SyncItemStatus.CONFLICT, "Conflict resolution failed");
    }
    
    private void scheduleRetry(OfflineQueueItem item, long delay) {
        mainHandler.postDelayed(() -> {
            item.retryCount++;
            item.lastRetry = new Date();
            item.status = OfflineConfig.STATUS_PENDING;
            queueDao.updateItem(item);
            
            Log.d(TAG, "Scheduled retry for item " + item.id + " (attempt " + item.retryCount + ")");
        }, delay);
    }
    
    private void updateItemStatus(OfflineQueueItem item, String status, String errorMessage) {
        item.status = status;
        item.errorMessage = errorMessage;
        if (OfflineConfig.STATUS_PROCESSING.equals(status) || OfflineConfig.STATUS_FAILED.equals(status)) {
            item.lastRetry = new Date();
        }
        queueDao.updateItem(item);
    }
    
    private RetryStrategy getRetryStrategy(int priority) {
        switch (priority) {
            case OfflineConfig.PRIORITY_HIGH:
                return RetryStrategy.forHighPriority();
            case OfflineConfig.PRIORITY_LOW:
                return RetryStrategy.forLowPriority();
            default:
                return new RetryStrategy();
        }
    }
    
    private void cleanupCompletedItems() {
        try {
            // Delete completed items older than configured days
            long cutoffTime = System.currentTimeMillis() - (OfflineConfig.DAYS_TO_KEEP_COMPLETED * 24 * 60 * 60 * 1000L);
            
            List<OfflineQueueItem> completedItems = queueDao.getItemsByStatus(OfflineConfig.STATUS_COMPLETED);
            for (OfflineQueueItem item : completedItems) {
                if (item.createdAt != null && item.createdAt.getTime() < cutoffTime) {
                    queueDao.deleteItem(item);
                }
            }
            
            Log.d(TAG, "Cleanup completed");
        } catch (Exception e) {
            Log.e(TAG, "Error during cleanup", e);
        }
    }
    
    private void notifyOnMainThread(Runnable action) {
        if (Looper.myLooper() == Looper.getMainLooper()) {
            action.run();
        } else {
            mainHandler.post(action);
        }
    }
    
    // NetworkQualityListener implementation
    @Override
    public void onNetworkQualityChanged(NetworkQualityMonitor.NetworkInfo networkInfo) {
        Log.d(TAG, "Network quality changed: " + networkInfo.quality + " (" + networkInfo.type + ")");
        notifyOnMainThread(() -> {
            if (syncListener != null) {
                syncListener.onNetworkStatusChanged(networkInfo.isConnected, networkInfo);
            }
        });
    }
    
    @Override
    public void onNetworkAvailable(NetworkQualityMonitor.NetworkInfo networkInfo) {
        Log.d(TAG, "Network available: " + networkInfo.type + " (quality: " + networkInfo.quality + ")");
        isNetworkAvailable.set(true);
        
        notifyOnMainThread(() -> {
            if (syncListener != null) {
                syncListener.onNetworkStatusChanged(true, networkInfo);
            }
        });
        
        // Start sync if network quality is suitable
        if (networkInfo.isSuitableForSync()) {
            startSync();
        }
    }
    
    @Override
    public void onNetworkLost() {
        Log.d(TAG, "Network lost");
        isNetworkAvailable.set(false);
        
        notifyOnMainThread(() -> {
            if (syncListener != null) {
                syncListener.onNetworkStatusChanged(false, null);
            }
        });
        
        // Stop ongoing sync
        stopSync();
    }
    
    // Public API methods
    public void setSyncListener(SyncListener listener) {
        this.syncListener = listener;
    }
    
    public boolean isSyncing() {
        return isSyncing.get();
    }
    
    public boolean isNetworkAvailable() {
        return isNetworkAvailable.get();
    }
    
    public int getPendingItemsCount() {
        return queueDao.getPendingCount();
    }
    
    public int getFailedItemsCount() {
        return queueDao.getFailedCount();
    }
    
    public void shutdown() {
        networkMonitor.stopMonitoring();
        stopSync();
        executorService.shutdown();
    }
}
