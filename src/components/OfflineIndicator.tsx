"use client";

import React, { useState, useEffect } from "react";
import {
  getOfflineSyncStatus,
  forceSyncPendingOperations,
} from "@/utils/hybridStorage";

interface SyncStatus {
  lastSync: string | null;
  isOnline: boolean;
  queueStatus: {
    pending: number;
    failed: number;
  };
}

export const OfflineIndicator: React.FC = () => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    lastSync: null,
    isOnline: true,
    queueStatus: { pending: 0, failed: 0 },
  });
  const [isSyncing, setIsSyncing] = useState(false);

  const updateStatus = () => {
    try {
      const status = getOfflineSyncStatus();
      setSyncStatus(status);
    } catch (error) {
      console.error("Error getting sync status:", error);
    }
  };

  useEffect(() => {
    // Initial status
    updateStatus();

    // Update status every 5 seconds
    const interval = setInterval(updateStatus, 5000);

    // Listen for online/offline events
    const handleOnline = () => updateStatus();
    const handleOffline = () => updateStatus();

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleManualSync = async () => {
    if (!syncStatus.isOnline || isSyncing) return;

    setIsSyncing(true);
    try {
      await forceSyncPendingOperations();
      updateStatus();
    } catch (error) {
      console.error("Manual sync failed:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  const { isOnline, queueStatus } = syncStatus;
  const hasPendingOperations = queueStatus.pending > 0;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div
        className={`
                flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg text-sm font-medium
                ${
                  isOnline
                    ? hasPendingOperations
                      ? "bg-yellow-100 text-yellow-800 border border-yellow-300"
                      : "bg-green-100 text-green-800 border border-green-300"
                    : "bg-red-100 text-red-800 border border-red-300"
                }
            `}
      >
        {/* Status icon */}
        <div
          className={`w-2 h-2 rounded-full ${
            isOnline
              ? hasPendingOperations
                ? "bg-yellow-500 animate-pulse"
                : "bg-green-500"
              : "bg-red-500 animate-pulse"
          }`}
        />

        {/* Status text */}
        <span>
          {isOnline
            ? hasPendingOperations
              ? `${queueStatus.pending} en attente`
              : "En ligne"
            : "Hors ligne"}
        </span>

        {/* Sync button */}
        {isOnline && hasPendingOperations && (
          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className={`
                            ml-2 px-2 py-1 rounded text-xs font-medium
                            ${
                              isSyncing
                                ? "bg-yellow-200 text-yellow-600 cursor-not-allowed"
                                : "bg-yellow-500 text-white hover:bg-yellow-600"
                            }
                        `}
          >
            {isSyncing ? "..." : "Sync"}
          </button>
        )}
      </div>

      {/* Detailed info on hover */}
      {hasPendingOperations && (
        <div className="absolute bottom-full right-0 mb-2 p-2 bg-white border rounded-lg shadow-lg text-xs whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity">
          <div>Opérations en attente: {queueStatus.pending}</div>
          {queueStatus.failed > 0 && (
            <div className="text-red-600">Échecs: {queueStatus.failed}</div>
          )}
          {syncStatus.lastSync && (
            <div className="text-gray-500">
              Dernière sync:{" "}
              {new Date(syncStatus.lastSync).toLocaleTimeString()}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
