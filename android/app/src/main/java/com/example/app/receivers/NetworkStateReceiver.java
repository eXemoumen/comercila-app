package com.example.app.receivers;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;

import com.example.app.offline.NetworkQualityMonitor;
import com.example.app.services.OfflineSyncService;

/**
 * Enhanced network state receiver that considers network quality
 */
public class NetworkStateReceiver extends BroadcastReceiver {
    private static final String TAG = "NetworkStateReceiver";
    
    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();
        Log.d(TAG, "Received broadcast: " + action);
        
        if (action == null) {
            return;
        }
        
        // Handle connectivity changes
        if ("android.net.conn.CONNECTIVITY_CHANGE".equals(action) ||
            "android.net.wifi.WIFI_STATE_CHANGED".equals(action)) {
            
            handleNetworkChange(context);
        }
    }
    
    private void handleNetworkChange(Context context) {
        NetworkQualityMonitor networkMonitor = new NetworkQualityMonitor(context);
        NetworkQualityMonitor.NetworkInfo networkInfo = networkMonitor.getCurrentNetworkInfo();
        
        Log.d(TAG, "Network status: " + networkInfo.type + 
                   ", Quality: " + networkInfo.quality + 
                   ", Connected: " + networkInfo.isConnected);
        
        if (networkInfo.isConnected) {
            // Network is available
            if (networkInfo.isSuitableForSync()) {
                Log.d(TAG, "Network suitable for sync, triggering sync service");
                startSyncService(context);
            } else {
                Log.d(TAG, "Network quality poor, skipping sync");
            }
        } else {
            Log.d(TAG, "Network unavailable");
            // Could potentially stop sync service here if needed
        }
    }
    
    private void startSyncService(Context context) {
        try {
            Intent syncIntent = new Intent(context, OfflineSyncService.class);
            syncIntent.setAction(OfflineSyncService.ACTION_SYNC_DATA);
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(syncIntent);
            } else {
                context.startService(syncIntent);
            }
            
            Log.d(TAG, "Sync service started");
        } catch (Exception e) {
            Log.e(TAG, "Error starting sync service", e);
        }
    }
}


