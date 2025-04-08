import { Sale, Supermarket, Order, StockHistory } from '@/types';

// Queue for pending operations when offline
interface PendingOperation {
  id: string;
  type: 'sale' | 'supermarket' | 'order' | 'stock';
  operation: 'add' | 'update' | 'delete';
  data: any;
  timestamp: string;
}

const PENDING_OPERATIONS_KEY = 'soap_pending_operations';
const LAST_SYNC_KEY = 'soap_last_sync';

// Get pending operations from localStorage
export const getPendingOperations = (): PendingOperation[] => {
  if (typeof window === 'undefined') return [];
  const operations = localStorage.getItem(PENDING_OPERATIONS_KEY);
  return operations ? JSON.parse(operations) : [];
};

// Add operation to pending queue
export const addPendingOperation = (operation: Omit<PendingOperation, 'id' | 'timestamp'>) => {
  if (typeof window === 'undefined') return;
  const operations = getPendingOperations();
  const newOperation = {
    ...operation,
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
  };
  operations.push(newOperation);
  localStorage.setItem(PENDING_OPERATIONS_KEY, JSON.stringify(operations));
};

// Remove operation from pending queue
export const removePendingOperation = (id: string) => {
  if (typeof window === 'undefined') return;
  const operations = getPendingOperations();
  const filteredOperations = operations.filter(op => op.id !== id);
  localStorage.setItem(PENDING_OPERATIONS_KEY, JSON.stringify(filteredOperations));
};

// Check if we're online
export const isOnline = (): boolean => {
  if (typeof window === 'undefined') return true;
  return navigator.onLine;
};

// Get last sync timestamp
export const getLastSync = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(LAST_SYNC_KEY);
};

// Update last sync timestamp
export const updateLastSync = () => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
};

// Handle offline operations
export const handleOfflineOperation = async (
  type: PendingOperation['type'],
  operation: PendingOperation['operation'],
  data: any
) => {
  if (!isOnline()) {
    // Add to pending operations if offline
    addPendingOperation({ type, operation, data });
    return { success: true, offline: true };
  }

  return { success: true, offline: false };
};

// Process pending operations when coming back online
export const processPendingOperations = async () => {
  if (!isOnline()) return;

  const operations = getPendingOperations();
  if (operations.length === 0) return;

  for (const operation of operations) {
    try {
      // Here you would implement the actual API calls to sync with your backend
      // For now, we'll just remove the operation from the queue
      removePendingOperation(operation.id);
    } catch (error) {
      console.error('Error processing pending operation:', error);
    }
  }

  updateLastSync();
};

// Initialize offline handling
export const initializeOfflineHandling = () => {
  if (typeof window === 'undefined') return;

  // Listen for online/offline events
  window.addEventListener('online', () => {
    processPendingOperations();
  });

  window.addEventListener('offline', () => {
    console.log('Application is offline');
  });
}; 