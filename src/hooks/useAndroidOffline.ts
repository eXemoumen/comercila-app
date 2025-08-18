import { useState, useEffect, useCallback } from 'react';
import { triggerAndroidSync, getAndroidSyncStatus, isAndroidOfflineAvailable } from '@/utils/hybridStorage';

interface SyncStatus {
  lastSync: Date | null;
  isOnline: boolean;
  queueStatus: {
    pending: number;
    failed: number;
  };
}

interface UseAndroidOfflineReturn {
  isAndroidOffline: boolean;
  syncStatus: SyncStatus | null;
  isSyncing: boolean;
  triggerSync: () => Promise<void>;
  refreshSyncStatus: () => Promise<void>;
}

export function useAndroidOffline(): UseAndroidOfflineReturn {
  const [isAndroidOffline, setIsAndroidOffline] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Check if Android offline is available
  useEffect(() => {
    const checkAndroidOffline = () => {
      try {
        const available = isAndroidOfflineAvailable();
        setIsAndroidOffline(available);

        if (available) {
          console.log('🤖 Android offline functionality is available');
        }
      } catch (error) {
        console.warn('Error checking Android offline availability:', error);
        setIsAndroidOffline(false);
      }
    };

    checkAndroidOffline();
  }, []);

  // Refresh sync status
  const refreshSyncStatus = useCallback(async () => {
    if (!isAndroidOffline) return;

    try {
      const status = await getAndroidSyncStatus();
      setSyncStatus(status);
    } catch (error) {
      console.error('Error refreshing sync status:', error);
    }
  }, [isAndroidOffline]);

  // Trigger manual sync
  const triggerSync = useCallback(async () => {
    if (!isAndroidOffline || isSyncing) return;

    setIsSyncing(true);
    try {
      console.log('🔄 Manual sync triggered');
      await triggerAndroidSync();
      await refreshSyncStatus();
    } catch (error) {
      console.error('Error triggering sync:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [isAndroidOffline, isSyncing, refreshSyncStatus]);

  // Initial sync status load
  useEffect(() => {
    if (isAndroidOffline) {
      refreshSyncStatus();
    }
  }, [isAndroidOffline, refreshSyncStatus]);

  // Auto-refresh sync status periodically
  useEffect(() => {
    if (!isAndroidOffline) return;

    const interval = setInterval(() => {
      refreshSyncStatus();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [isAndroidOffline, refreshSyncStatus]);

  // Listen for network changes
  useEffect(() => {
    if (!isAndroidOffline) return;

    const handleOnline = () => {
      console.log('🌐 Network online - triggering sync');
      triggerSync();
    };

    const handleOffline = () => {
      console.log('📴 Network offline');
      refreshSyncStatus();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isAndroidOffline, triggerSync, refreshSyncStatus]);

  return {
    isAndroidOffline,
    syncStatus,
    isSyncing,
    triggerSync,
    refreshSyncStatus,
  };
}
