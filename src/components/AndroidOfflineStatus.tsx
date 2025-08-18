import React from "react";
import { useAndroidOffline } from "@/hooks/useAndroidOffline";
import { RefreshCw, Wifi, WifiOff } from "lucide-react";

export function AndroidOfflineStatus() {
  const { isAndroidOffline, syncStatus, isSyncing, triggerSync } =
    useAndroidOffline();

  // Don't render anything if Android offline is not available or if there's an error
  if (!isAndroidOffline) {
    return null;
  }

  // Add error boundary
  try {
    const getStatusIcon = () => {
      if (isSyncing) return <RefreshCw className="w-4 h-4 animate-spin" />;
      if (syncStatus?.isOnline) return <Wifi className="w-4 h-4" />;
      return <WifiOff className="w-4 h-4" />;
    };

    const getStatusText = () => {
      if (isSyncing) return "Syncing...";
      if (syncStatus?.isOnline) return "Online";
      return "Offline";
    };

    const getLastSyncText = () => {
      if (!syncStatus?.lastSync) return "Never synced";
      const now = new Date();
      const diff = now.getTime() - syncStatus.lastSync.getTime();
      const minutes = Math.floor(diff / 60000);
      if (minutes < 1) return "Just now";
      if (minutes < 60) return `${minutes}m ago`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      return `${days}d ago`;
    };

    return (
      <div className="fixed bottom-4 right-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 max-w-xs">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              {getStatusIcon()}
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {getStatusText()}
              </span>
            </div>
            <button
              onClick={triggerSync}
              disabled={isSyncing}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
              title="Manual sync"
            >
              <RefreshCw
                className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`}
              />
            </button>
          </div>

          <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
            Last sync: {getLastSyncText()}
          </div>

          {(syncStatus?.queueStatus.pending || 0) > 0 && (
            <div className="text-xs text-yellow-600 dark:text-yellow-400">
              ⏳ {syncStatus?.queueStatus.pending || 0} items pending sync
            </div>
          )}

          {(syncStatus?.queueStatus.failed || 0) > 0 && (
            <div className="text-xs text-red-600 dark:text-red-400">
              ❌ {syncStatus?.queueStatus.failed || 0} items failed to sync
            </div>
          )}
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error rendering AndroidOfflineStatus:", error);
    return null; // Don't render anything if there's an error
  }
}
