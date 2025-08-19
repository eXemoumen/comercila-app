import {
    getSales as getLocalSales,
    addSale as addLocalSale,
    deleteSale as deleteLocalSale,
    updateSalePayment as updateLocalSalePayment,
    addPayment as addLocalPayment,
    getOrders as getLocalOrders,
    addOrder as addLocalOrder,
    deleteOrder as deleteLocalOrder,
    completeOrder as completeLocalOrder,
    getStockHistory as getLocalStockHistory,
    updateStock as updateLocalStock,
    getFragranceStock as getLocalFragranceStock,
    updateFragranceStock as updateLocalFragranceStock,
    setFragranceStock as setLocalFragranceStock,
    getSupermarkets as getLocalSupermarkets,
    addSupermarket as addLocalSupermarket,
    updateSupermarket as updateLocalSupermarket,
    deleteSupermarket as deleteLocalSupermarket
} from './storage';

import {
    getSupabaseSales,
    addSupabaseSale,
    deleteSupabaseSale,
    updateSupabaseSalePayment,
    addSupabasePayment,
    getSupabaseOrders,
    addSupabaseOrder,
    deleteSupabaseOrder,
    completeSupabaseOrder,
    getSupabaseStockHistory,
    addSupabaseStockEntry,
    getSupabaseFragranceStock,
    updateSupabaseFragranceStock,
    setSupabaseFragranceStock,
    getSupabaseCurrentStock,
    syncFragranceStockWithHistory
} from './supabaseStorage';

import { getMigrationStatus } from './migration';
import { supabase } from '@/lib/supabase';
import type { Sale, Order, Stock, Payment, Supermarket, FragranceStock, Fragrance } from './storage';
// import { isAndroid } from './mobileConfig';
import { offlineStorageManager } from './androidOfflineStorage';
import { networkDetector } from './networkDetection';
import { 
    getOfflineSales, 
    addOfflineSale, 
    getOfflineSupermarkets,
    getOfflineFragranceStock,
    updateOfflineFragranceStock,
    getOfflineCurrentStock,
    syncCacheToOfflineStorage
} from './localOfflineStorage';

// Configuration for which data sources to use (now dynamic based on network)
const USE_SUPABASE = {
    supermarkets: false, // Will be set dynamically
    sales: false, // Will be set dynamically  
    orders: false, // Will be set dynamically
    stock: false, // Will be set dynamically
    fragranceStock: false // Will be set dynamically
};

// Force Supabase usage - but migrate data first (disabled for offline support)
// const FORCE_SUPABASE = false;

// Android offline mode configuration
const USE_ANDROID_OFFLINE = false; // Temporarily disabled to prevent runtime errors
// const USE_ANDROID_OFFLINE = isAndroid();

// Update configuration based on network status and migration
const updateStorageConfig = async () => {
    if (typeof window === 'undefined') return;

    // Set hybrid mode - use both Supabase (when online) and local storage (when offline)
    USE_SUPABASE.supermarkets = true;
    USE_SUPABASE.sales = true;
    USE_SUPABASE.orders = true;
    USE_SUPABASE.stock = true;
    USE_SUPABASE.fragranceStock = true;
    
    // Set migration flags to enable Supabase functionality
    localStorage.setItem('supermarket_migration_done', 'true');
    localStorage.setItem('sales_migration_done', 'true');
    localStorage.setItem('orders_migration_done', 'true');
    localStorage.setItem('stock_migration_done', 'true');
    localStorage.setItem('fragrance_stock_migration_done', 'true');
    localStorage.setItem('full_migration_complete', 'true');
    
    console.log('🔄 Hybrid mode enabled - Supabase when online, local storage when offline');
    
    // Run migration if needed to ensure local data exists
    await runMigrationIfNeeded();
    
    // Sync any cached data to offline storage
    await syncCacheToOfflineStorage();

    // Original migration logic (kept for reference)
    const status = getMigrationStatus();
    if (status) {
        USE_SUPABASE.supermarkets = status.supermarkets;
        USE_SUPABASE.sales = status.sales;
        USE_SUPABASE.orders = status.orders;
        USE_SUPABASE.stock = status.stock;
        USE_SUPABASE.fragranceStock = status.fragranceStock;
    }
};

// Run migration if data exists in localStorage but not in Supabase
const runMigrationIfNeeded = async () => {
    try {
        console.log('🔄 Checking if migration is needed...');
        
        // Check if we have local data
        const hasLocalData = checkLocalDataExists();
        
        if (hasLocalData) {
            console.log('📦 Local data found, running migration...');
            const { runFullMigration } = await import('./migration');
            const result = await runFullMigration();
            console.log('✅ Migration result:', result);
        } else {
            console.log('📦 No local data to migrate');
            // Initialize with default data if Supabase is empty
            await initializeSupabaseWithDefaultData();
        }
    } catch (error) {
        console.error('❌ Migration error:', error);
    }
};

// Initialize Supabase with default data if tables are empty
const initializeSupabaseWithDefaultData = async () => {
    try {
        console.log('🔄 Initializing Supabase with default data...');
        
        // Check if fragrance_stock table is empty
        const { data: fragranceData } = await supabase
            .from('fragrance_stock')
            .select('*')
            .limit(1);
            
        if (!fragranceData || fragranceData.length === 0) {
            console.log('📦 Adding default fragrance stock...');
            const { updateSupabaseFragranceStock } = await import('./supabaseStorage');
            
            // Add default fragrances
            const defaultFragrances = [
                { id: '1', name: 'Lavande', color: '#9F7AEA', quantity: 10 },
                { id: '2', name: 'Rose', color: '#F687B3', quantity: 15 },
                { id: '3', name: 'Citron', color: '#FBBF24', quantity: 12 },
                { id: '4', name: 'Fraîcheur Marine', color: '#60A5FA', quantity: 8 },
                { id: '5', name: 'Vanille', color: '#F59E0B', quantity: 20 },
                { id: '6', name: 'Grenade', color: '#F97316', quantity: 5 },
                { id: '7', name: 'Jasmin', color: '#10B981', quantity: 18 },
                { id: '8', name: 'Amande', color: '#8B5CF6', quantity: 14 }
            ];
            
            for (const fragrance of defaultFragrances) {
                await updateSupabaseFragranceStock(fragrance.id, fragrance.quantity);
            }
            console.log('✅ Default fragrance stock added');
        }
        
        // Check if stock_history table is empty
        const { data: stockData } = await supabase
            .from('stock_history')
            .select('*')
            .limit(1);
            
        if (!stockData || stockData.length === 0) {
            console.log('📦 Adding initial stock history...');
            const { addSupabaseStockEntry } = await import('./supabaseStorage');
            
            // Add initial stock entry
            const totalFragranceStock = 102; // Sum of all default fragrances
            await addSupabaseStockEntry(
                totalFragranceStock,
                'added',
                'Initial stock setup',
                totalFragranceStock,
                undefined
            );
            console.log('✅ Initial stock history added');
        }
        
        console.log('✅ Supabase initialization complete');
    } catch (error) {
        console.error('❌ Error initializing Supabase:', error);
    }
};

// Check if local data exists
const checkLocalDataExists = () => {
    const keys = ['soap_sales', 'soap_orders', 'soap_stock', 'soap_fragrance_stock', 'soap_supermarkets'];
    return keys.some(key => {
        const data = localStorage.getItem(key);
        return data && JSON.parse(data).length > 0;
    });
};

// Initialize storage config
let isInitialized = false;

const initializeStorage = async () => {
    if (isInitialized) return;
    await updateStorageConfig();
    
    // Set up network listener for sync
    networkDetector.addListener(async (isOnline) => {
        if (isOnline) {
            console.log('🌐 Network restored - syncing pending operations...');
            await syncPendingOperations();
        }
    });
    
    isInitialized = true;
};

// Sync pending operations when network is restored
const syncPendingOperations = async () => {
    try {
        // Sync pending sales
        const pendingSales = JSON.parse(localStorage.getItem('pendingSaleOperations') || '[]');
        if (pendingSales.length > 0) {
            console.log('🔄 Syncing', pendingSales.length, 'pending sales...');
            
            const successfulSales = [];
            const failedSales = [];
            
            for (const operation of pendingSales) {
                try {
                    if (operation.type === 'create') {
                        await addSupabaseSale(operation.data);
                        successfulSales.push(operation);
                        console.log('✅ Synced sale:', operation.id);
                    }
                } catch (error) {
                    console.error('❌ Failed to sync sale:', operation.id, error);
                    failedSales.push(operation);
                }
            }
            
            // Keep only failed operations for retry
            localStorage.setItem('pendingSaleOperations', JSON.stringify(failedSales));
            
            if (successfulSales.length > 0) {
                // Clear cached data to force refresh
                localStorage.removeItem('cachedSales');
                console.log('🎉 Successfully synced', successfulSales.length, 'sales');
            }
        }
        
        // TODO: Add sync for other data types (supermarkets, orders, etc.)
        
    } catch (error) {
        console.error('❌ Error during sync:', error);
    }
};

// Hybrid Sales Functions with Android offline support
export const getSales = async (): Promise<Sale[]> => {
    await initializeStorage();
    console.log('🛒 Getting sales data...');

    // Use Android offline storage if available
    if (USE_ANDROID_OFFLINE) {
        console.log('🤖 Using Android offline storage for sales data');
        try {
            const androidSales = await offlineStorageManager.getSales();
            console.log('🤖 Android sales loaded:', androidSales.length, 'records');
            return androidSales;
        } catch (error) {
            console.error('❌ Android offline storage error:', error);
            // Fallback to regular storage
        }
    }

    if (USE_SUPABASE.sales) {
        // Check if we're online
        if (networkDetector.isOnline()) {
            try {
                console.log('📊 Using Supabase for sales data (online)');
                const sales = await getSupabaseSales();
                console.log('📊 Supabase sales loaded:', sales.length, 'records');
                
                // Cache the data for offline access
                localStorage.setItem('cachedSales', JSON.stringify(sales));
                localStorage.setItem('cachedSalesTimestamp', Date.now().toString());
                
                // Also sync to offline storage for true offline access
                await syncCacheToOfflineStorage();
                
                return sales;
            } catch (error) {
                console.warn('❌ Failed to fetch from Supabase, falling back to cache:', error);
            }
        }
        
        // Offline or Supabase failed - try cached data first
        try {
            const cachedSales = localStorage.getItem('cachedSales');
            if (cachedSales) {
                const sales = JSON.parse(cachedSales);
                console.log('📱 Using cached sales data (offline):', sales.length, 'records');
                return sales;
            }
        } catch (error) {
            console.warn('❌ Failed to load cached sales:', error);
        }
        
        // Final fallback to true offline storage
        console.log('💾 Using offline storage for sales data (offline fallback)');
        const offlineSales = await getOfflineSales();
        console.log('💾 Offline sales loaded:', offlineSales.length, 'records');
        return offlineSales;
    } else {
        console.log('💾 Using local storage for sales data');
        return getLocalSales();
    }
};

export const addSale = async (saleData: Omit<Sale, "id">): Promise<Sale | null> => {
    await initializeStorage();
    console.log('➕ Adding sale data...');

    // Use Android offline storage if available
    if (USE_ANDROID_OFFLINE) {
        console.log('🤖 Using Android offline storage to add sale');
        try {
            const sale = { ...saleData, id: Date.now().toString() };
            await offlineStorageManager.saveSale(sale);
            return sale;
        } catch (error) {
            console.error('❌ Android offline storage error:', error);
            // Fallback to regular storage
        }
    }

    if (USE_SUPABASE.sales) {
        // Always add to offline storage first for immediate availability
        const offlineSale = await addOfflineSale(saleData);
        
        if (networkDetector.isOnline()) {
            try {
                console.log('📊 Using Supabase to add sale (online)');
                const supabaseSale = await addSupabaseSale(saleData);
                
                // Clear cached data to force refresh
                localStorage.removeItem('cachedSales');
                
                return supabaseSale;
            } catch (error) {
                console.warn('❌ Failed to add sale to Supabase, queued for sync:', error);
                
                // Queue for sync when online
                const pendingOps = JSON.parse(localStorage.getItem('pendingSaleOperations') || '[]');
                pendingOps.push({
                    type: 'create',
                    data: saleData,
                    timestamp: Date.now(),
                    id: `sale_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
                });
                localStorage.setItem('pendingSaleOperations', JSON.stringify(pendingOps));
                
                return offlineSale;
            }
        } else {
            console.log('📱 Offline: Adding sale to local storage and queue for sync');
            
            // Queue for sync when online
            const pendingOps = JSON.parse(localStorage.getItem('pendingSaleOperations') || '[]');
            pendingOps.push({
                type: 'create',
                data: saleData,
                timestamp: Date.now(),
                id: `sale_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            });
            localStorage.setItem('pendingSaleOperations', JSON.stringify(pendingOps));
            
            return offlineSale;
        }
    } else {
        console.log('💾 Using local storage to add sale');
        return addLocalSale(saleData);
    }
};

export const deleteSale = async (saleId: string): Promise<boolean> => {
    await initializeStorage();

    // Use Android offline storage if available
    if (USE_ANDROID_OFFLINE) {
        console.log('🤖 Using Android offline storage to delete sale');
        try {
            await offlineStorageManager.deleteSale(saleId);
            return true;
        } catch (error) {
            console.error('❌ Android offline storage error:', error);
            // Fallback to regular storage
        }
    }

    if (USE_SUPABASE.sales) {
        return await deleteSupabaseSale(saleId);
    } else {
        return deleteLocalSale(saleId);
    }
};

export const updateSalePayment = async (saleId: string, isPaid: boolean, paymentDate?: string): Promise<Sale | null> => {
    await initializeStorage();

    // Use Android offline storage if available
    if (USE_ANDROID_OFFLINE) {
        console.log('🤖 Using Android offline storage to update sale payment');
        try {
            const sales = await offlineStorageManager.getSales();
            const sale = sales.find(s => s.id === saleId);
            if (sale) {
                sale.isPaid = isPaid;
                sale.paymentDate = paymentDate || new Date().toISOString();
                await offlineStorageManager.saveSale(sale);
                return sale;
            }
        } catch (error) {
            console.error('❌ Android offline storage error:', error);
            // Fallback to regular storage
        }
    }

    if (USE_SUPABASE.sales) {
        return await updateSupabaseSalePayment(saleId, isPaid, paymentDate);
    } else {
        return updateLocalSalePayment(saleId, isPaid, paymentDate);
    }
};

export const addPayment = async (saleId: string, payment: Omit<Payment, 'id'>): Promise<Sale | null> => {
    await initializeStorage();

    // Use Android offline storage if available
    if (USE_ANDROID_OFFLINE) {
        console.log('🤖 Using Android offline storage to add payment');
        try {
            const sales = await offlineStorageManager.getSales();
            const sale = sales.find(s => s.id === saleId);
            if (sale) {
                const newPayment = { ...payment, id: Date.now().toString() };
                sale.payments = sale.payments || [];
                sale.payments.push(newPayment);
                sale.remainingAmount = Math.max(0, sale.remainingAmount - payment.amount);
                if (sale.remainingAmount === 0) {
                    sale.isPaid = true;
                    sale.paymentDate = new Date().toISOString();
                }
                await offlineStorageManager.saveSale(sale);
                return sale;
            }
        } catch (error) {
            console.error('❌ Android offline storage error:', error);
            // Fallback to regular storage
        }
    }

    if (USE_SUPABASE.sales) {
        return await addSupabasePayment(saleId, payment);
    } else {
        return addLocalPayment(saleId, payment);
    }
};

// Hybrid Orders Functions
export const getOrders = async (): Promise<Order[]> => {
    await initializeStorage();

    if (USE_SUPABASE.orders) {
        return await getSupabaseOrders();
    } else {
        return getLocalOrders();
    }
};

export const addOrder = async (order: Omit<Order, 'id' | 'status'>): Promise<Order | null> => {
    await initializeStorage();

    if (USE_SUPABASE.orders) {
        return await addSupabaseOrder(order);
    } else {
        return addLocalOrder(order);
    }
};

export const deleteOrder = async (id: string): Promise<void> => {
    await initializeStorage();

    if (USE_SUPABASE.orders) {
        await deleteSupabaseOrder(id);
    } else {
        deleteLocalOrder(id);
    }
};

export const completeOrder = async (orderId: string): Promise<Order | null> => {
    await initializeStorage();

    if (USE_SUPABASE.orders) {
        return await completeSupabaseOrder(orderId);
    } else {
        return completeLocalOrder(orderId);
    }
};

// Hybrid Stock Functions
export const getStockHistory = async (limit: number = 3): Promise<Stock[]> => {
    await initializeStorage();

    if (USE_SUPABASE.stock) {
        return await getSupabaseStockHistory(limit);
    } else {
        // For local storage, slice the results to match the limit
        const localHistory = await getLocalStockHistory();
        return localHistory.slice(0, limit);
    }
};

export const updateStock = async (
    quantity: number,
    type: Stock['type'],
    reason: string,
    fragranceDistribution?: Record<string, number>
): Promise<number> => {
    await initializeStorage();
    
    console.log(`🔄 Updating stock: ${quantity} cartons, type: ${type}, reason: ${reason}`);
    console.log(`📊 Fragrance distribution:`, fragranceDistribution);

    if (USE_SUPABASE.stock) {
        try {
            // Update fragrance stock first if distribution provided
            if (fragranceDistribution) {
                console.log(`🌸 Updating fragrance stock with distribution...`);
                for (const [fragranceId, qty] of Object.entries(fragranceDistribution)) {
                    const adjustedQty = type === 'adjusted' ? qty : (type === 'removed' ? -qty : qty);
                    console.log(`  Fragrance ${fragranceId}: ${qty} → ${adjustedQty} (${type})`);
                    const result = await updateSupabaseFragranceStock(fragranceId, adjustedQty);
                    if (result) {
                        console.log(`  ✅ Updated ${result.name}: ${result.quantity} cartons`);
                    } else {
                        console.error(`  ❌ Failed to update fragrance ${fragranceId}`);
                    }
                }
            }

            // Get the actual current stock after updating fragrance stock
            const { currentStock } = await getCurrentStock();
            const actualCurrentStock = currentStock || 0;
            
            console.log(`📦 Actual current stock after updates: ${actualCurrentStock}`);

            // Add to history with the actual current stock
            await addSupabaseStockEntry(quantity, type, reason, actualCurrentStock, fragranceDistribution);

            console.log(`✅ Stock update completed. New total: ${actualCurrentStock}`);
            return actualCurrentStock;
        } catch (error) {
            console.error(`❌ Error updating stock:`, error);
            
            // If Supabase fails, try offline storage as fallback
            console.log('🔄 Supabase failed, trying offline storage fallback');
            try {
                // Update offline fragrance stock if distribution provided
                if (fragranceDistribution) {
                    for (const [fragranceId, qty] of Object.entries(fragranceDistribution)) {
                        const adjustedQty = type === 'adjusted' ? qty : (type === 'removed' ? -qty : qty);
                        await updateOfflineFragranceStock(fragranceId, adjustedQty);
                    }
                }
                
                // Get current offline stock
                const currentStock = await getOfflineCurrentStock();
                console.log(`✅ Offline stock update completed. New total: ${currentStock}`);
                return currentStock;
            } catch (offlineError) {
                console.error(`❌ Offline stock update also failed:`, offlineError);
                throw error; // Throw original error
            }
        }
    } else {
        console.log('💾 Using local storage to update stock');
        return updateLocalStock(quantity, type, reason, fragranceDistribution);
    }
};

// Hybrid Fragrances Functions (static data - always works offline)
export const getFragrances = async (): Promise<Fragrance[]> => {
    // Fragrances are static data, so they always work offline
    const DEFAULT_FRAGRANCES = [
        { id: '1', name: 'Vanille', color: '#F59E0B' },
        { id: '2', name: 'Chocolat', color: '#8B4513' },
        { id: '3', name: 'Fraise', color: '#EF4444' },
        { id: '4', name: 'Menthe', color: '#10B981' },
        { id: '5', name: 'Orange', color: '#F97316' },
        { id: '6', name: 'Citron', color: '#EAB308' },
        { id: '7', name: 'Jasmin', color: '#10B981' },
        { id: '8', name: 'Amande', color: '#8B5CF6' },
    ];
    
    console.log('🌸 Returning fragrances (always available offline):', DEFAULT_FRAGRANCES.length, 'fragrances');
    return DEFAULT_FRAGRANCES;
};

// Hybrid Fragrance Stock Functions
export const getFragranceStock = async (): Promise<FragranceStock[]> => {
    await initializeStorage();

    if (USE_SUPABASE.fragranceStock) {
        try {
            if (networkDetector.isOnline()) {
                console.log('📊 Using Supabase for fragrance stock (online)');
                const stock = await getSupabaseFragranceStock();
                
                // Cache the data for offline access
                localStorage.setItem('cachedFragranceStock', JSON.stringify(stock));
                localStorage.setItem('cachedFragranceStockTimestamp', Date.now().toString());
                
                // Also sync to offline storage
                await syncCacheToOfflineStorage();
                
                return stock;
            } else {
                console.log('📱 Offline: Trying cached fragrance stock');
                try {
                    const cachedStock = localStorage.getItem('cachedFragranceStock');
                    if (cachedStock) {
                        const stock = JSON.parse(cachedStock);
                        console.log('📱 Using cached fragrance stock (offline):', stock.length, 'items');
                        return stock;
                    }
                } catch (error) {
                    console.warn('❌ Failed to load cached fragrance stock:', error);
                }
                
                // Final fallback to offline storage
                console.log('💾 Using offline storage for fragrance stock (offline fallback)');
                return getOfflineFragranceStock();
            }
        } catch (error) {
            console.warn('❌ Failed to fetch from Supabase, falling back to cache:', error);
            
            // Try cache
            try {
                const cachedStock = localStorage.getItem('cachedFragranceStock');
                if (cachedStock) {
                    const stock = JSON.parse(cachedStock);
                    console.log('📱 Using cached fragrance stock (fallback):', stock.length, 'items');
                    return stock;
                }
            } catch (cacheError) {
                console.warn('❌ Failed to load cached fragrance stock:', cacheError);
            }
            
            // Final fallback to offline storage
            console.log('💾 Using offline storage for fragrance stock (final fallback)');
            return getOfflineFragranceStock();
        }
    } else {
        console.log('💾 Using local storage for fragrance stock');
        return getLocalFragranceStock();
    }
};

export const updateFragranceStock = async (fragranceId: string, quantity: number): Promise<FragranceStock | null> => {
    await initializeStorage();

    if (USE_SUPABASE.fragranceStock) {
        return await updateSupabaseFragranceStock(fragranceId, quantity);
    } else {
        return updateLocalFragranceStock(fragranceId, quantity);
    }
};

export const setFragranceStock = async (fragranceId: string, newQuantity: number): Promise<FragranceStock | null> => {
    await initializeStorage();

    if (USE_SUPABASE.fragranceStock) {
        return await setSupabaseFragranceStock(fragranceId, newQuantity);
    } else {
        return setLocalFragranceStock(fragranceId, newQuantity);
    }
};

// Hybrid Supermarket Functions (already using Supabase)
export const getSupermarkets = async (): Promise<Supermarket[]> => {
    await initializeStorage();
    console.log('🏪 Getting supermarkets data...');

    if (USE_SUPABASE.supermarkets) {
        // Check if we're online
        if (networkDetector.isOnline()) {
            try {
                console.log('📊 Using Supabase for supermarkets data (online)');
                const supermarkets = await getLocalSupermarkets();
                console.log('📊 Supabase supermarkets loaded:', supermarkets.length, 'records');
                
                // Cache the data for offline access
                localStorage.setItem('cachedSupermarkets', JSON.stringify(supermarkets));
                localStorage.setItem('cachedSupermarketsTimestamp', Date.now().toString());
                
                return supermarkets;
            } catch (error) {
                console.warn('❌ Failed to fetch supermarkets from Supabase, falling back to cache:', error);
            }
        }
        
        // Offline or Supabase failed - try cached data first
        try {
            const cachedSupermarkets = localStorage.getItem('cachedSupermarkets');
            if (cachedSupermarkets) {
                const supermarkets = JSON.parse(cachedSupermarkets);
                console.log('📱 Using cached supermarkets data (offline):', supermarkets.length, 'records');
                return supermarkets;
            }
        } catch (error) {
            console.warn('❌ Failed to load cached supermarkets:', error);
        }
        
        // Final fallback to offline storage
        console.log('💾 Using offline storage for supermarkets data (offline fallback)');
        return getOfflineSupermarkets();
    } else {
        console.log('💾 Using local storage for supermarkets data');
        return getLocalSupermarkets();
    }
};

export const addSupermarket = async (supermarketData: Omit<Supermarket, "id" | "created_at">): Promise<Supermarket | null> => {
    return await addLocalSupermarket(supermarketData); // This already uses Supabase
};

export const updateSupermarket = async (id: string, updatedData: Partial<Omit<Supermarket, "id" | "created_at">>): Promise<Supermarket | null> => {
    return await updateLocalSupermarket(id, updatedData); // This already uses Supabase
};

export const deleteSupermarket = async (id: string): Promise<boolean> => {
    return await deleteLocalSupermarket(id); // This already uses Supabase
};

// Helper function to get current stock
export const getCurrentStock = async (): Promise<{ currentStock: number; fragranceStock: number }> => {
    await initializeStorage();
    console.log('📦 Getting current stock data...');

    if (USE_SUPABASE.stock) {
        console.log('📊 Using Supabase for stock data');
        const result = await getSupabaseCurrentStock();
        console.log('📊 Supabase stock result:', result);
        // Map the properties correctly
        return { 
            currentStock: result.current_stock || 0, 
            fragranceStock: result.fragrance_stock || 0 
        };
    } else {
        console.log('💾 Using local storage for stock data');
        // Get current stock from local storage
        const stockHistory = await getLocalStockHistory();
        const currentStock = stockHistory.length > 0 ? stockHistory[stockHistory.length - 1].currentStock : 0;
        
        // Get fragrance stock from local storage
        const fragranceStock = await getLocalFragranceStock();
        const totalFragranceStock = fragranceStock.reduce((sum: number, item: FragranceStock) => sum + item.quantity, 0);
        
        console.log('💾 Local stock result:', { currentStock, fragranceStock: totalFragranceStock });
        return { currentStock, fragranceStock: totalFragranceStock };
    }
};

// Force refresh storage configuration (call after migration)
export const refreshStorageConfig = () => {
    updateStorageConfig();
};

// Get current storage configuration
export const getStorageConfig = () => {
    updateStorageConfig();
    return { ...USE_SUPABASE };
};

// Add sync function to hybrid storage
export const syncFragranceStock = async (): Promise<void> => {
    await initializeStorage();
    
    if (USE_SUPABASE.fragranceStock) {
        return await syncFragranceStockWithHistory();
    } else {
        console.log('💾 Local storage sync not implemented');
    }
};

// Add Android-specific sync functions
export const triggerAndroidSync = async (): Promise<void> => {
    if (USE_ANDROID_OFFLINE) {
        console.log('🔄 Triggering Android sync...');
        await offlineStorageManager.triggerSync();
    }
};

export const getAndroidSyncStatus = async () => {
    if (USE_ANDROID_OFFLINE) {
        return await offlineStorageManager.getSyncStatus();
    }
    return { lastSync: null, isOnline: navigator.onLine, queueStatus: { pending: 0, failed: 0 } };
};

export const isAndroidOfflineAvailable = (): boolean => {
  try {
    return USE_ANDROID_OFFLINE;
  } catch (error) {
    console.warn('Error checking Android offline availability:', error);
    return false;
  }
};

// Get offline sync status
export const getOfflineSyncStatus = () => {
    const pendingSales = JSON.parse(localStorage.getItem('pendingSaleOperations') || '[]');
    return { 
        lastSync: localStorage.getItem('lastSyncTimestamp'), 
        isOnline: networkDetector.isOnline(), 
        queueStatus: { 
            pending: pendingSales.length, 
            failed: pendingSales.filter((op: {failed?: boolean}) => op.failed).length 
        } 
    };
};

// Export sync function for manual sync
export const forceSyncPendingOperations = async () => {
    if (networkDetector.isOnline()) {
        await syncPendingOperations();
        localStorage.setItem('lastSyncTimestamp', new Date().toISOString());
        console.log('🎉 Manual sync completed');
    } else {
        throw new Error('Cannot sync while offline');
    }
};