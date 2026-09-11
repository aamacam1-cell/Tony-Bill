import { useState, useEffect, useCallback } from 'react';
import { SyncStatus, SyncApiResponse, SavedInvoiceRecord } from '../types';
import {
  getUnsyncedInvoicesFromIndexedDB,
  markInvoicesAsSyncedInIndexedDB,
  getAllInvoicesFromIndexedDB,
} from '../utils/indexedDb';

export function useOfflineSync(onSyncCompleted?: (allRecords: SavedInvoiceRecord[]) => void) {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [unsyncedCount, setUnsyncedCount] = useState<number>(0);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  // Refresh count of unsynced items in IndexedDB
  const refreshUnsyncedCount = useCallback(async () => {
    try {
      const unsynced = await getUnsyncedInvoicesFromIndexedDB();
      setUnsyncedCount(unsynced.length);
      return unsynced;
    } catch {
      return [];
    }
  }, []);

  // Perform background sync of unsynced invoices to server
  const syncNow = useCallback(async (simulateError = false): Promise<boolean> => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setSyncStatus('idle');
      return false;
    }

    try {
      const unsyncedList = await getUnsyncedInvoicesFromIndexedDB();
      setUnsyncedCount(unsyncedList.length);

      if (unsyncedList.length === 0) {
        setSyncStatus('synced');
        return true;
      }

      setSyncStatus('syncing');
      setLastError(null);

      const url = simulateError
        ? '/api/invoices/sync?simulate_error=true'
        : '/api/invoices/sync';

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ invoices: unsyncedList }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with status ${response.status}`);
      }

      const result: SyncApiResponse = await response.json();

      if (result.success && Array.isArray(result.syncedIds)) {
        // Mark as synced: true in IndexedDB
        await markInvoicesAsSyncedInIndexedDB(result.syncedIds);
        setSyncStatus('synced');
        setLastSyncTime(new Date().toISOString());

        const remainingUnsynced = await getUnsyncedInvoicesFromIndexedDB();
        setUnsyncedCount(remainingUnsynced.length);

        // Notify parent to refresh list if callback provided
        if (onSyncCompleted) {
          const fresh = await getAllInvoicesFromIndexedDB();
          onSyncCompleted(fresh);
        }
        return true;
      } else {
        throw new Error(result.message || 'Sync failed: invalid server response');
      }
    } catch (err: any) {
      console.warn('[Sync] Sync failed (data remains safely in IndexedDB):', err.message);
      setSyncStatus('error');
      setLastError(err.message || 'การเชื่อมต่อขัดข้อง');
      // Refresh count to show user that records are still in IndexedDB
      await refreshUnsyncedCount();
      return false;
    }
  }, [onSyncCompleted, refreshUnsyncedCount]);

  // Listen to browser network changes ('online' / 'offline')
  useEffect(() => {
    const handleOnline = () => {
      console.log('[Network] Browser is ONLINE. Checking unsynced items in IndexedDB...');
      setIsOnline(true);
      // Auto-sync when internet returns (Requirement 4)
      syncNow();
    };

    const handleOffline = () => {
      console.log('[Network] Browser is OFFLINE. Offline mode active.');
      setIsOnline(false);
      setSyncStatus('idle');
      refreshUnsyncedCount();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check on mount
    refreshUnsyncedCount().then((unsynced) => {
      if (navigator.onLine && unsynced.length > 0) {
        syncNow();
      }
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncNow, refreshUnsyncedCount]);

  return {
    isOnline,
    syncStatus,
    unsyncedCount,
    lastSyncTime,
    lastError,
    syncNow,
    refreshUnsyncedCount,
  };
}
