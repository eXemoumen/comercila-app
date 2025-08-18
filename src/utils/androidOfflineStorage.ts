import { Sale } from './storage';

// Define proper types for our data structures
export interface SaleData extends Sale, Record<string, unknown> {
  // This now extends the Sale interface from storage.ts
}

export interface OfflineQueueData {
  operation: string;
  table: string;
  recordId: string;
  data: Record<string, unknown>;
}

// Android-specific offline storage interface
export interface AndroidOfflineStorage {
  // Database operations
  saveSale(sale: SaleData): Promise<void>;
  getSales(): Promise<SaleData[]>;
  updateSale(sale: SaleData): Promise<void>;
  deleteSale(id: string): Promise<void>;

  // Offline queue operations
  addToOfflineQueue(operation: string, table: string, recordId: string, data: Record<string, unknown>): Promise<void>;
  getOfflineQueueStatus(): Promise<{ pending: number; failed: number }>;

  // Sync operations
  triggerSync(): Promise<void>;
  getSyncStatus(): Promise<{ lastSync: Date | null; isOnline: boolean }>;

  // Network operations
  isNetworkAvailable(): Promise<boolean>;
}

// Mock implementation for non-Android platforms
class MockAndroidOfflineStorage implements AndroidOfflineStorage {
  async saveSale(sale: SaleData): Promise<void> {
    console.log('Mock: Saving sale', sale);
  }

  async getSales(): Promise<SaleData[]> {
    console.log('Mock: Getting sales');
    return [];
  }

  async updateSale(sale: SaleData): Promise<void> {
    console.log('Mock: Updating sale', sale);
  }

  async deleteSale(id: string): Promise<void> {
    console.log('Mock: Deleting sale', id);
  }

  async addToOfflineQueue(operation: string, table: string, recordId: string, data: Record<string, unknown>): Promise<void> {
    console.log('Mock: Adding to offline queue', { operation, table, recordId, data });
  }

  async getOfflineQueueStatus(): Promise<{ pending: number; failed: number }> {
    return { pending: 0, failed: 0 };
  }

  async triggerSync(): Promise<void> {
    console.log('Mock: Triggering sync');
  }

  async getSyncStatus(): Promise<{ lastSync: Date | null; isOnline: boolean }> {
    return { 
      lastSync: null, 
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : false 
    };
  }

  async isNetworkAvailable(): Promise<boolean> {
    return typeof navigator !== 'undefined' ? navigator.onLine : false;
  }
}

// Android implementation using Capacitor bridge
// class AndroidOfflineStorageImpl implements AndroidOfflineStorage {
//   private async callAndroidMethod(method: string, params?: Record<string, unknown>): Promise<unknown> {
//     if (!Capacitor.isNativePlatform()) {
//       throw new Error('Android offline storage is only available on Android devices');
//     }

//     // This would call the Android native methods through Capacitor
//     // For now, we'll simulate the calls
//     console.log(`Android: Calling ${method}`, params);

//     // Simulate Android method calls
//     switch (method) {
//       case 'saveSale':
//         // Store in local storage as fallback
//         if (typeof localStorage !== 'undefined') {
//           const sales = JSON.parse(localStorage.getItem('android_sales') || '[]');
//           sales.push(params);
//           localStorage.setItem('android_sales', JSON.stringify(sales));
//         }
//         break;

//       case 'getSales':
//         if (typeof localStorage !== 'undefined') {
//           return JSON.parse(localStorage.getItem('android_sales') || '[]');
//         }
//         return [];

//       case 'triggerSync':
//         // Simulate sync trigger
//         console.log('Android: Triggering background sync');
//         break;

//       case 'isNetworkAvailable':
//         return typeof navigator !== 'undefined' ? navigator.onLine : false;
//     }
//   }

//   async saveSale(sale: SaleData): Promise<void> {
//     await this.callAndroidMethod('saveSale', sale);
//   }

//   async getSales(): Promise<SaleData[]> {
//     return await this.callAndroidMethod('getSales') as SaleData[];
//   }

//   async updateSale(sale: SaleData): Promise<void> {
//     await this.callAndroidMethod('updateSale', sale);
//   }

//   async deleteSale(id: string): Promise<void> {
//     await this.callAndroidMethod('deleteSale', { id });
//   }

//   async addToOfflineQueue(operation: string, table: string, recordId: string, data: Record<string, unknown>): Promise<void> {
//     await this.callAndroidMethod('addToOfflineQueue', { operation, table, recordId, data });
//   }

//   async getOfflineQueueStatus(): Promise<{ pending: number; failed: number }> {
//     return await this.callAndroidMethod('getOfflineQueueStatus') as { pending: number; failed: number };
//   }

//   async triggerSync(): Promise<void> {
//     await this.callAndroidMethod('triggerSync');
//   }

//   async getSyncStatus(): Promise<{ lastSync: Date | null; isOnline: boolean }> {
//     const isOnline = await this.callAndroidMethod('isNetworkAvailable') as boolean;
//     const lastSync = typeof localStorage !== 'undefined' ? localStorage.getItem('android_last_sync') : null;
//     return {
//       lastSync: lastSync ? new Date(lastSync) : null,
//       isOnline
//     };
//   }

//   async isNetworkAvailable(): Promise<boolean> {
//     return await this.callAndroidMethod('isNetworkAvailable') as boolean;
//   }
// }

// Factory function to get the appropriate implementation
export function getAndroidOfflineStorage(): AndroidOfflineStorage {
  try {
    // Always return mock for now to prevent runtime errors
    console.log('🔧 Using mock Android offline storage for compatibility');
    return new MockAndroidOfflineStorage();
    
    // Original logic commented out for debugging
    /*
    if (typeof window === 'undefined') {
      // Server-side rendering - return mock
      return new MockAndroidOfflineStorage();
    }
    
    if (isAndroid() && Capacitor.isNativePlatform()) {
      return new AndroidOfflineStorageImpl();
    } else {
      return new MockAndroidOfflineStorage();
    }
    */
  } catch (error) {
    console.warn('Error initializing Android offline storage, falling back to mock:', error);
    return new MockAndroidOfflineStorage();
  }
}

// Offline storage manager that combines Android and web storage
export class OfflineStorageManager {
  private androidStorage: AndroidOfflineStorage;
  private isOnline: boolean = false;
  private syncInProgress: boolean = false;

  constructor() {
    try {
      this.androidStorage = getAndroidOfflineStorage();
      this.isOnline = typeof navigator !== 'undefined' ? navigator.onLine : false;
      this.setupNetworkListeners();
    } catch (error) {
      console.warn('Error initializing OfflineStorageManager:', error);
      // Fallback to mock storage
      this.androidStorage = new MockAndroidOfflineStorage();
      this.isOnline = false;
    }
  }

  private setupNetworkListeners() {
    if (typeof window === 'undefined') return;
    
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.triggerSync();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  async saveSale(sale: SaleData): Promise<void> {
    try {
      // Always save to Android storage first
      await this.androidStorage.saveSale(sale);

      // If online, also save to Supabase
      if (this.isOnline) {
        // This would call your existing Supabase save logic
        console.log('Online: Saving to Supabase');
      } else {
        // Add to offline queue for later sync
        await this.androidStorage.addToOfflineQueue('CREATE', 'sales', sale.id, sale);
      }
    } catch (error) {
      console.error('Error saving sale:', error);
      throw error;
    }
  }

  async getSales(): Promise<SaleData[]> {
    try {
      // Always get from Android storage first (offline-first approach)
      const androidSales = await this.androidStorage.getSales();

      // If online, sync with Supabase
      if (this.isOnline && !this.syncInProgress) {
        await this.triggerSync();
      }

      return androidSales;
    } catch (error) {
      console.error('Error getting sales:', error);
      return [];
    }
  }

  async deleteSale(saleId: string): Promise<void> {
    try {
      // Always delete from Android storage first
      await this.androidStorage.deleteSale(saleId);

      // If online, also delete from Supabase
      if (this.isOnline) {
        // This would call your existing Supabase delete logic
        console.log('Online: Deleting from Supabase');
      } else {
        // Add to offline queue for later sync
        await this.androidStorage.addToOfflineQueue('DELETE', 'sales', saleId, { id: saleId });
      }
    } catch (error) {
      console.error('Error deleting sale:', error);
      throw error;
    }
  }

  async triggerSync(): Promise<void> {
    if (this.syncInProgress) {
      console.log('Sync already in progress');
      return;
    }

    this.syncInProgress = true;

    try {
      await this.androidStorage.triggerSync();
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('android_last_sync', new Date().toISOString());
      }
    } catch (error) {
      console.error('Error triggering sync:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  async getSyncStatus(): Promise<{ lastSync: Date | null; isOnline: boolean; queueStatus: { pending: number; failed: number } }> {
    const [syncStatus, queueStatus] = await Promise.all([
      this.androidStorage.getSyncStatus(),
      this.androidStorage.getOfflineQueueStatus()
    ]);

    return {
      ...syncStatus,
      queueStatus
    };
  }

  async isNetworkAvailable(): Promise<boolean> {
    return await this.androidStorage.isNetworkAvailable();
  }
}

// Global instance
export const offlineStorageManager = new OfflineStorageManager();
