# Android Offline System Refactor Guide

## Overview

The Android offline system has been completely refactored with improved architecture, better error handling, retry strategies, conflict resolution, and network quality monitoring. This guide explains the new implementation and how to use it.

## Architecture Overview

### Key Components

1. **OfflineSyncManager** - Core sync logic with advanced features
2. **SupabaseApiClient** - HTTP client for Supabase API operations
3. **NetworkQualityMonitor** - Monitors network quality and connectivity
4. **ConflictResolver** - Handles data conflicts during sync
5. **RetryStrategy** - Implements exponential backoff retry logic
6. **OfflineSyncService** - Android service wrapper
7. **NetworkStateReceiver** - Enhanced network state monitoring
8. **OfflineHelper** - Easy-to-use helper class for integration

## Key Improvements

### ✅ Issues Fixed

1. **Real Supabase Integration** - Actual API calls instead of simulation
2. **Advanced Error Handling** - Categorized error handling with specific strategies
3. **Exponential Backoff Retry** - Smart retry strategy with jitter
4. **Network Quality Assessment** - Only sync when network quality is suitable
5. **Conflict Resolution** - Automatic conflict detection and resolution
6. **Batch Processing** - Efficient batch operations
7. **Proper Logging** - Comprehensive logging for debugging
8. **Data Validation** - Validation before sync operations
9. **Modern Network APIs** - Updated to use modern Android networking APIs
10. **Resource Management** - Proper cleanup and resource management

### 🚀 New Features

- **Priority-based Queuing** - High/medium/low priority operations
- **Network Quality Monitoring** - WiFi signal strength, cellular quality assessment
- **Intelligent Sync Timing** - Sync only when network conditions are optimal
- **Conflict Resolution Strategies** - Table-specific conflict resolution logic
- **Progress Notifications** - Real-time sync progress updates
- **Service Binding** - Efficient communication with the sync service
- **Configuration Management** - Centralized configuration constants

## Configuration

### OfflineConfig Constants

```java
// Sync intervals
SYNC_INTERVAL_WIFI = 30_000        // 30 seconds on WiFi
SYNC_INTERVAL_CELLULAR = 300_000   // 5 minutes on cellular

// Retry configuration
MAX_RETRY_ATTEMPTS = 5
INITIAL_RETRY_DELAY = 1_000        // 1 second
RETRY_BACKOFF_MULTIPLIER = 2.0     // Exponential backoff

// Network quality thresholds
MIN_SIGNAL_STRENGTH_WIFI = -70     // dBm
MIN_SIGNAL_STRENGTH_CELLULAR = -85 // dBm

// Batch processing
BATCH_SIZE = 10
MAX_CONCURRENT_OPERATIONS = 3
```

## Usage Guide

### 1. Basic Setup

Initialize the offline helper in your Activity or Application:

```java
public class MainActivity extends BridgeActivity {
    private OfflineHelper offlineHelper;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Initialize offline helper
        offlineHelper = new OfflineHelper(this);

        // Set sync listener for callbacks (optional)
        offlineHelper.setSyncListener(new OfflineSyncManager.SyncListener() {
            @Override
            public void onSyncStarted() {
                Log.d("MainActivity", "Sync started");
            }

            @Override
            public void onSyncProgress(int completed, int total) {
                Log.d("MainActivity", "Sync progress: " + completed + "/" + total);
            }

            @Override
            public void onSyncCompleted(OfflineSyncManager.SyncResult result) {
                if (result.isSuccess()) {
                    Log.d("MainActivity", "Sync completed successfully");
                } else {
                    Log.e("MainActivity", "Sync completed with errors: " + result.errorMessage);
                }
            }

            @Override
            public void onSyncError(String error) {
                Log.e("MainActivity", "Sync error: " + error);
            }

            @Override
            public void onNetworkStatusChanged(boolean available, NetworkQualityMonitor.NetworkInfo networkInfo) {
                if (available) {
                    Log.d("MainActivity", "Network available: " + networkInfo.type);
                } else {
                    Log.d("MainActivity", "Network unavailable");
                }
            }
        });
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (offlineHelper != null) {
            offlineHelper.cleanup();
        }
    }
}
```

### 2. Queueing Operations

#### Create Operations

```java
// Queue a sale for sync
Sale sale = new Sale();
sale.id = "sale_123";
sale.supermarketId = "supermarket_456";
sale.quantity = 100;
sale.totalValue = 1500.0;

offlineHelper.queueSale(sale, true); // High priority

// Or use generic create
offlineHelper.queueCreate(OfflineConfig.TABLE_SALES, sale, OfflineConfig.PRIORITY_HIGH);
```

#### Update Operations

```java
// Update existing sale
sale.isPaid = true;
sale.paymentDate = new Date();

offlineHelper.queueUpdate(OfflineConfig.TABLE_SALES, "sale_123", sale);
```

#### Delete Operations

```java
// Delete a sale
offlineHelper.queueDelete(OfflineConfig.TABLE_SALES, "sale_123");
```

#### Stock Operations

```java
// Update stock with high priority
Stock stock = new Stock();
stock.id = "stock_789";
stock.quantity = 50;

offlineHelper.queueStockUpdate("stock_789", stock, true);
```

### 3. Manual Sync Control

```java
// Trigger manual sync
offlineHelper.triggerSync();

// Stop ongoing sync
offlineHelper.stopSync();

// Check sync status
boolean isSyncing = offlineHelper.isSyncing();
int pendingItems = offlineHelper.getPendingItemsCount();
int failedItems = offlineHelper.getFailedItemsCount();
```

### 4. Network Monitoring

```java
// Check network status
NetworkQualityMonitor.NetworkInfo networkInfo = offlineHelper.getNetworkInfo();

Log.d("Network", "Type: " + networkInfo.type);
Log.d("Network", "Quality: " + networkInfo.quality);
Log.d("Network", "Connected: " + networkInfo.isConnected);
Log.d("Network", "Suitable for sync: " + networkInfo.isSuitableForSync());

// Quick check
boolean canSync = offlineHelper.isNetworkSuitableForSync();
```

## Advanced Configuration

### 1. Supabase Configuration

Update `SupabaseApiClient.java` with your Supabase credentials:

```java
public SupabaseApiClient(Context context) {
    this.baseUrl = "https://your-project.supabase.co/rest/v1/";
    this.apiKey = "your-anon-key-here";
    // ... rest of constructor
}
```

### 2. Custom Retry Strategies

```java
// Create custom retry strategy for critical operations
RetryStrategy criticalRetry = new RetryStrategy(
    10,        // maxRetries
    500,       // initialDelay (ms)
    1.5,       // backoffMultiplier
    60000,     // maxDelay (ms)
    true       // useJitter
);
```

### 3. Custom Conflict Resolution

Extend `ConflictResolver` for custom table-specific logic:

```java
private ConflictResult resolveCustomTableConflict(JsonObject localJson, JsonObject remoteJson) {
    // Your custom conflict resolution logic
    return new ConflictResult(ConflictResolution.USE_LOCAL, gson.toJson(localJson), "Custom resolution");
}
```

## Monitoring and Debugging

### 1. Logging

The system provides comprehensive logging with tags:

- `OfflineSyncManager` - Core sync operations
- `SupabaseApiClient` - API calls and responses
- `NetworkQualityMonitor` - Network status changes
- `ConflictResolver` - Conflict resolution details
- `RetryStrategy` - Retry attempts and delays
- `OfflineSyncService` - Service lifecycle events

### 2. Database Inspection

Query the offline queue directly:

```java
AppDatabase database = AppDatabase.getInstance(context);
OfflineQueueDao queueDao = database.offlineQueueDao();

// Get pending items
List<OfflineQueueItem> pendingItems = queueDao.getPendingItems();

// Get failed items
List<OfflineQueueItem> failedItems = queueDao.getItemsByStatus("failed");

// Get statistics
int pendingCount = queueDao.getPendingCount();
int failedCount = queueDao.getFailedCount();
```

### 3. Notification Monitoring

The service shows notifications during sync operations:

- Sync started
- Progress updates
- Completion status
- Error messages

## Testing

### 1. Network Simulation

Test different network conditions:

```java
// Test poor network conditions
NetworkQualityMonitor monitor = new NetworkQualityMonitor(context);
NetworkQualityMonitor.NetworkInfo info = monitor.getCurrentNetworkInfo();

if (info.quality == NetworkQualityMonitor.NetworkQuality.POOR) {
    // Sync should be delayed
    assertFalse(info.isSuitableForSync());
}
```

### 2. Conflict Testing

Create conflicting data scenarios:

```java
// Create local change
Sale localSale = new Sale();
localSale.id = "test_sale";
localSale.isPaid = true;
localSale.updatedAt = new Date();

// Simulate remote change
Sale remoteSale = new Sale();
remoteSale.id = "test_sale";
remoteSale.isPaid = false;
remoteSale.updatedAt = new Date(System.currentTimeMillis() + 1000);

// Test conflict resolution
ConflictResolver resolver = new ConflictResolver();
ConflictResolver.ConflictResult result = resolver.resolveConflict(
    OfflineConfig.TABLE_SALES,
    gson.toJson(localSale),
    gson.toJson(remoteSale)
);

assertEquals(ConflictResolver.ConflictResolution.USE_REMOTE, result.resolution);
```

## Performance Considerations

1. **Batch Size** - Adjust `BATCH_SIZE` based on device performance
2. **Concurrent Operations** - Limit `MAX_CONCURRENT_OPERATIONS` on older devices
3. **Retry Delays** - Increase delays for cellular networks
4. **Cleanup Frequency** - Regular cleanup of completed items
5. **Memory Usage** - Monitor memory usage during large sync operations

## Troubleshooting

### Common Issues

1. **Sync Not Starting**

   - Check network connectivity
   - Verify service is running
   - Check logs for errors

2. **High Failure Rate**

   - Verify Supabase credentials
   - Check API endpoint URLs
   - Monitor network quality

3. **Conflicts Not Resolving**

   - Check timestamp formats
   - Verify conflict resolution logic
   - Review table-specific rules

4. **Poor Performance**
   - Reduce batch size
   - Increase retry delays
   - Monitor network quality thresholds

### Debug Commands

```bash
# View logs
adb logcat | grep -E "(OfflineSync|NetworkQuality|ConflictResolver)"

# Check service status
adb shell dumpsys activity services | grep OfflineSyncService

# Monitor network changes
adb shell dumpsys connectivity
```

## Migration from Old System

### 1. Update Dependencies

Ensure your `build.gradle` includes:

```gradle
implementation "com.squareup.okhttp3:okhttp:4.12.0"
implementation "com.squareup.okhttp3:logging-interceptor:4.12.0"
implementation "com.google.code.gson:gson:2.10.1"
```

### 2. Replace Old Code

Replace old sync calls:

```java
// Old way
Intent syncIntent = new Intent(context, OfflineSyncService.class);
syncIntent.setAction(OfflineSyncService.ACTION_ADD_TO_QUEUE);
syncIntent.putExtra("operation_type", "CREATE");
// ... more extras
context.startService(syncIntent);

// New way
OfflineHelper helper = new OfflineHelper(context);
helper.queueCreate(OfflineConfig.TABLE_SALES, saleData);
```

### 3. Update Permissions

Ensure AndroidManifest.xml has required permissions:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_DATA_SYNC" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

## Conclusion

The refactored offline system provides a robust, scalable, and maintainable solution for offline data synchronization. It addresses all the issues in the previous implementation while adding advanced features for better user experience and reliability.

Key benefits:

- ✅ Reliable sync operations with proper error handling
- ✅ Intelligent network quality monitoring
- ✅ Automatic conflict resolution
- ✅ Efficient retry strategies
- ✅ Easy-to-use API
- ✅ Comprehensive logging and monitoring
- ✅ Modern Android architecture

The system is designed to work seamlessly in the background, providing users with a smooth offline experience while ensuring data consistency and reliability.
