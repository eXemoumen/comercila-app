package com.example.app.offline;

import android.content.Context;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.NetworkRequest;
import android.net.wifi.WifiInfo;
import android.net.wifi.WifiManager;
import android.os.Build;
import android.telephony.SignalStrength;
import android.telephony.TelephonyManager;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.RequiresApi;

/**
 * Monitors network quality and connectivity status
 */
public class NetworkQualityMonitor {
    private static final String TAG = "NetworkQualityMonitor";
    
    private final Context context;
    private final ConnectivityManager connectivityManager;
    private final WifiManager wifiManager;
    private final TelephonyManager telephonyManager;
    
    private NetworkCallback networkCallback;
    private NetworkQualityListener listener;
    
    public enum NetworkType {
        NONE, WIFI, CELLULAR, ETHERNET, OTHER
    }
    
    public enum NetworkQuality {
        EXCELLENT, GOOD, FAIR, POOR, NONE
    }
    
    public static class NetworkInfo {
        public final NetworkType type;
        public final NetworkQuality quality;
        public final boolean isConnected;
        public final boolean isMetered;
        public final int signalStrength; // dBm for WiFi, ASU for cellular
        
        public NetworkInfo(NetworkType type, NetworkQuality quality, boolean isConnected, 
                          boolean isMetered, int signalStrength) {
            this.type = type;
            this.quality = quality;
            this.isConnected = isConnected;
            this.isMetered = isMetered;
            this.signalStrength = signalStrength;
        }
        
        public boolean isSuitableForSync() {
            return isConnected && (quality == NetworkQuality.EXCELLENT || 
                                 quality == NetworkQuality.GOOD ||
                                 (quality == NetworkQuality.FAIR && type == NetworkType.WIFI));
        }
    }
    
    public interface NetworkQualityListener {
        void onNetworkQualityChanged(NetworkInfo networkInfo);
        void onNetworkAvailable(NetworkInfo networkInfo);
        void onNetworkLost();
    }
    
    public NetworkQualityMonitor(Context context) {
        this.context = context.getApplicationContext();
        this.connectivityManager = (ConnectivityManager) context.getSystemService(Context.CONNECTIVITY_SERVICE);
        this.wifiManager = (WifiManager) context.getApplicationContext().getSystemService(Context.WIFI_SERVICE);
        this.telephonyManager = (TelephonyManager) context.getSystemService(Context.TELEPHONY_SERVICE);
    }
    
    public void startMonitoring(NetworkQualityListener listener) {
        this.listener = listener;
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            registerNetworkCallback();
        }
        
        // Initial check
        NetworkInfo currentNetwork = getCurrentNetworkInfo();
        if (listener != null) {
            if (currentNetwork.isConnected) {
                listener.onNetworkAvailable(currentNetwork);
            } else {
                listener.onNetworkLost();
            }
        }
    }
    
    public void stopMonitoring() {
        if (networkCallback != null && connectivityManager != null) {
            try {
                connectivityManager.unregisterNetworkCallback(networkCallback);
            } catch (Exception e) {
                Log.w(TAG, "Error unregistering network callback", e);
            }
        }
        this.listener = null;
    }
    
    @RequiresApi(api = Build.VERSION_CODES.N)
    private void registerNetworkCallback() {
        NetworkRequest.Builder builder = new NetworkRequest.Builder()
                .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
                .addCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED);
        
        networkCallback = new NetworkCallback();
        connectivityManager.registerNetworkCallback(builder.build(), networkCallback);
    }
    
    public NetworkInfo getCurrentNetworkInfo() {
        if (connectivityManager == null) {
            return new NetworkInfo(NetworkType.NONE, NetworkQuality.NONE, false, false, 0);
        }
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            return getCurrentNetworkInfoModern();
        } else {
            return getCurrentNetworkInfoLegacy();
        }
    }
    
    @RequiresApi(api = Build.VERSION_CODES.M)
    private NetworkInfo getCurrentNetworkInfoModern() {
        Network activeNetwork = connectivityManager.getActiveNetwork();
        if (activeNetwork == null) {
            return new NetworkInfo(NetworkType.NONE, NetworkQuality.NONE, false, false, 0);
        }
        
        NetworkCapabilities capabilities = connectivityManager.getNetworkCapabilities(activeNetwork);
        if (capabilities == null) {
            return new NetworkInfo(NetworkType.NONE, NetworkQuality.NONE, false, false, 0);
        }
        
        NetworkType type = getNetworkType(capabilities);
        boolean isConnected = capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED);
        boolean isMetered = !capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_NOT_METERED);
        
        int signalStrength = getSignalStrength(type);
        NetworkQuality quality = determineNetworkQuality(type, signalStrength);
        
        return new NetworkInfo(type, quality, isConnected, isMetered, signalStrength);
    }
    
    @SuppressWarnings("deprecation")
    private NetworkInfo getCurrentNetworkInfoLegacy() {
        android.net.NetworkInfo activeNetwork = connectivityManager.getActiveNetworkInfo();
        if (activeNetwork == null || !activeNetwork.isConnected()) {
            return new NetworkInfo(NetworkType.NONE, NetworkQuality.NONE, false, false, 0);
        }
        
        NetworkType type = NetworkType.OTHER;
        if (activeNetwork.getType() == ConnectivityManager.TYPE_WIFI) {
            type = NetworkType.WIFI;
        } else if (activeNetwork.getType() == ConnectivityManager.TYPE_MOBILE) {
            type = NetworkType.CELLULAR;
        } else if (activeNetwork.getType() == ConnectivityManager.TYPE_ETHERNET) {
            type = NetworkType.ETHERNET;
        }
        
        int signalStrength = getSignalStrength(type);
        NetworkQuality quality = determineNetworkQuality(type, signalStrength);
        boolean isMetered = connectivityManager.isActiveNetworkMetered();
        
        return new NetworkInfo(type, quality, true, isMetered, signalStrength);
    }
    
    @RequiresApi(api = Build.VERSION_CODES.M)
    private NetworkType getNetworkType(NetworkCapabilities capabilities) {
        if (capabilities.hasTransport(NetworkCapabilities.TRANSPORT_WIFI)) {
            return NetworkType.WIFI;
        } else if (capabilities.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR)) {
            return NetworkType.CELLULAR;
        } else if (capabilities.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET)) {
            return NetworkType.ETHERNET;
        }
        return NetworkType.OTHER;
    }
    
    private int getSignalStrength(NetworkType type) {
        try {
            if (type == NetworkType.WIFI && wifiManager != null) {
                WifiInfo wifiInfo = wifiManager.getConnectionInfo();
                if (wifiInfo != null) {
                    return wifiInfo.getRssi(); // dBm
                }
            } else if (type == NetworkType.CELLULAR && telephonyManager != null) {
                // This requires READ_PHONE_STATE permission
                // For now, return a default value
                return -1; // Unknown
            }
        } catch (SecurityException e) {
            Log.w(TAG, "Permission required to get signal strength", e);
        } catch (Exception e) {
            Log.w(TAG, "Error getting signal strength", e);
        }
        return -1; // Unknown
    }
    
    private NetworkQuality determineNetworkQuality(NetworkType type, int signalStrength) {
        if (type == NetworkType.NONE) {
            return NetworkQuality.NONE;
        }
        
        if (type == NetworkType.ETHERNET) {
            return NetworkQuality.EXCELLENT; // Assume wired is always good
        }
        
        if (signalStrength == -1) {
            // Unknown signal strength, assume fair quality
            return NetworkQuality.FAIR;
        }
        
        if (type == NetworkType.WIFI) {
            if (signalStrength >= -50) return NetworkQuality.EXCELLENT;
            if (signalStrength >= -60) return NetworkQuality.GOOD;
            if (signalStrength >= -70) return NetworkQuality.FAIR;
            return NetworkQuality.POOR;
        } else if (type == NetworkType.CELLULAR) {
            // ASU values for cellular (approximate)
            if (signalStrength >= 20) return NetworkQuality.EXCELLENT;
            if (signalStrength >= 15) return NetworkQuality.GOOD;
            if (signalStrength >= 10) return NetworkQuality.FAIR;
            return NetworkQuality.POOR;
        }
        
        return NetworkQuality.FAIR; // Default for other types
    }
    
    @RequiresApi(api = Build.VERSION_CODES.LOLLIPOP)
    private class NetworkCallback extends ConnectivityManager.NetworkCallback {
        @Override
        public void onAvailable(@NonNull Network network) {
            Log.d(TAG, "Network available: " + network);
            NetworkInfo networkInfo = getCurrentNetworkInfo();
            if (listener != null) {
                listener.onNetworkAvailable(networkInfo);
            }
        }
        
        @Override
        public void onLost(@NonNull Network network) {
            Log.d(TAG, "Network lost: " + network);
            if (listener != null) {
                listener.onNetworkLost();
            }
        }
        
        @Override
        public void onCapabilitiesChanged(@NonNull Network network, @NonNull NetworkCapabilities networkCapabilities) {
            Log.d(TAG, "Network capabilities changed: " + network);
            NetworkInfo networkInfo = getCurrentNetworkInfo();
            if (listener != null) {
                listener.onNetworkQualityChanged(networkInfo);
            }
        }
    }
}
