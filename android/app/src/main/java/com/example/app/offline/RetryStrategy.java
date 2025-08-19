package com.example.app.offline;

import android.util.Log;

import java.util.Random;

/**
 * Implements exponential backoff retry strategy with jitter
 */
public class RetryStrategy {
    private static final String TAG = "RetryStrategy";
    private static final Random random = new Random();
    
    private final int maxRetries;
    private final long initialDelay;
    private final double backoffMultiplier;
    private final long maxDelay;
    private final boolean useJitter;
    
    public RetryStrategy() {
        this(OfflineConfig.MAX_RETRY_ATTEMPTS, 
             OfflineConfig.INITIAL_RETRY_DELAY,
             OfflineConfig.RETRY_BACKOFF_MULTIPLIER,
             OfflineConfig.MAX_RETRY_DELAY,
             true);
    }
    
    public RetryStrategy(int maxRetries, long initialDelay, double backoffMultiplier, 
                        long maxDelay, boolean useJitter) {
        this.maxRetries = maxRetries;
        this.initialDelay = initialDelay;
        this.backoffMultiplier = backoffMultiplier;
        this.maxDelay = maxDelay;
        this.useJitter = useJitter;
    }
    
    /**
     * Calculate delay for the given attempt number
     * @param attempt The attempt number (0-based)
     * @return Delay in milliseconds
     */
    public long calculateDelay(int attempt) {
        if (attempt >= maxRetries) {
            return -1; // No more retries
        }
        
        // Calculate exponential backoff delay
        double delay = initialDelay * Math.pow(backoffMultiplier, attempt);
        
        // Cap at maximum delay
        delay = Math.min(delay, maxDelay);
        
        // Add jitter to prevent thundering herd
        if (useJitter) {
            // Add random jitter of ±25%
            double jitter = 0.25 * delay * (2 * random.nextDouble() - 1);
            delay += jitter;
        }
        
        long finalDelay = Math.max(0, (long) delay);
        Log.d(TAG, "Calculated delay for attempt " + attempt + ": " + finalDelay + "ms");
        
        return finalDelay;
    }
    
    /**
     * Check if we should retry based on the error type
     */
    public boolean shouldRetry(int attempt, Exception error, int httpStatusCode) {
        if (attempt >= maxRetries) {
            Log.d(TAG, "Max retries exceeded (" + maxRetries + ")");
            return false;
        }
        
        // Don't retry on client errors (4xx) except for specific cases
        if (httpStatusCode >= 400 && httpStatusCode < 500) {
            switch (httpStatusCode) {
                case 408: // Request Timeout
                case 429: // Too Many Requests
                case 409: // Conflict - might resolve after retry
                    Log.d(TAG, "Retryable client error: " + httpStatusCode);
                    return true;
                default:
                    Log.d(TAG, "Non-retryable client error: " + httpStatusCode);
                    return false;
            }
        }
        
        // Retry on server errors (5xx) and network errors
        if (httpStatusCode >= 500 || httpStatusCode == -1) {
            Log.d(TAG, "Retryable server/network error: " + httpStatusCode);
            return true;
        }
        
        // Check specific exception types
        if (error != null) {
            String errorMessage = error.getMessage();
            if (errorMessage != null) {
                errorMessage = errorMessage.toLowerCase();
                
                // Network-related errors that are retryable
                if (errorMessage.contains("timeout") ||
                    errorMessage.contains("connection") ||
                    errorMessage.contains("network") ||
                    errorMessage.contains("unreachable")) {
                    Log.d(TAG, "Retryable network error: " + errorMessage);
                    return true;
                }
                
                // Database-related errors that might be temporary
                if (errorMessage.contains("database") ||
                    errorMessage.contains("constraint") ||
                    errorMessage.contains("lock")) {
                    Log.d(TAG, "Retryable database error: " + errorMessage);
                    return true;
                }
            }
        }
        
        Log.d(TAG, "Non-retryable error");
        return false;
    }
    
    /**
     * Get the maximum number of retries
     */
    public int getMaxRetries() {
        return maxRetries;
    }
    
    /**
     * Check if we've exhausted all retry attempts
     */
    public boolean isExhausted(int attempt) {
        return attempt >= maxRetries;
    }
    
    /**
     * Create a retry strategy for high priority operations
     */
    public static RetryStrategy forHighPriority() {
        return new RetryStrategy(
            OfflineConfig.MAX_RETRY_ATTEMPTS + 2, // More retries for high priority
            500, // Shorter initial delay
            1.5, // Gentler backoff
            OfflineConfig.MAX_RETRY_DELAY / 2, // Lower max delay
            true
        );
    }
    
    /**
     * Create a retry strategy for low priority operations
     */
    public static RetryStrategy forLowPriority() {
        return new RetryStrategy(
            OfflineConfig.MAX_RETRY_ATTEMPTS - 1, // Fewer retries for low priority
            OfflineConfig.INITIAL_RETRY_DELAY * 2, // Longer initial delay
            OfflineConfig.RETRY_BACKOFF_MULTIPLIER,
            OfflineConfig.MAX_RETRY_DELAY,
            true
        );
    }
}
