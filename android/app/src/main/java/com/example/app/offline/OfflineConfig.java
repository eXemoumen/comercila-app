package com.example.app.offline;

/**
 * Configuration constants for offline functionality
 */
public final class OfflineConfig {
    
    // Sync intervals (in milliseconds)
    public static final long SYNC_INTERVAL_WIFI = 30_000;        // 30 seconds on WiFi
    public static final long SYNC_INTERVAL_CELLULAR = 300_000;   // 5 minutes on cellular
    public static final long SYNC_INTERVAL_NO_NETWORK = 60_000;  // 1 minute when no network
    
    // Retry configuration
    public static final int MAX_RETRY_ATTEMPTS = 5;
    public static final long INITIAL_RETRY_DELAY = 1_000;        // 1 second
    public static final double RETRY_BACKOFF_MULTIPLIER = 2.0;   // Exponential backoff
    public static final long MAX_RETRY_DELAY = 300_000;          // 5 minutes max
    
    // Batch processing
    public static final int BATCH_SIZE = 10;
    public static final int MAX_CONCURRENT_OPERATIONS = 3;
    
    // Network quality thresholds
    public static final int MIN_SIGNAL_STRENGTH_WIFI = -70;      // dBm
    public static final int MIN_SIGNAL_STRENGTH_CELLULAR = -85;   // dBm
    public static final long NETWORK_TIMEOUT = 10_000;           // 10 seconds
    
    // Database constraints
    public static final int MAX_QUEUE_SIZE = 1000;
    public static final long CLEANUP_INTERVAL = 86_400_000;      // 24 hours
    public static final int DAYS_TO_KEEP_COMPLETED = 7;
    
    // Notification
    public static final String NOTIFICATION_CHANNEL_ID = "offline_sync_channel";
    public static final int NOTIFICATION_ID = 2001;
    
    // Operation types
    public static final String OP_CREATE = "CREATE";
    public static final String OP_UPDATE = "UPDATE";
    public static final String OP_DELETE = "DELETE";
    public static final String OP_SYNC = "SYNC";
    
    // Sync statuses
    public static final String STATUS_PENDING = "pending";
    public static final String STATUS_PROCESSING = "processing";
    public static final String STATUS_COMPLETED = "completed";
    public static final String STATUS_FAILED = "failed";
    public static final String STATUS_CANCELLED = "cancelled";
    
    // Priority levels
    public static final int PRIORITY_HIGH = 1;
    public static final int PRIORITY_MEDIUM = 2;
    public static final int PRIORITY_LOW = 3;
    
    // Table names
    public static final String TABLE_SALES = "sales";
    public static final String TABLE_ORDERS = "orders";
    public static final String TABLE_STOCK = "stock";
    public static final String TABLE_SUPERMARKETS = "supermarkets";
    
    private OfflineConfig() {
        // Prevent instantiation
    }
}
