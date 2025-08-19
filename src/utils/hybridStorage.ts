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
import type { Sale, Order, Stock, Payment, Supermarket, FragranceStock } from './storage';
import { isAndroid } from './mobileConfig';
import { offlineStorageManager } from './androidOfflineStorage';

// Configuration for which data sources to use
const USE_SUPABASE = {
    supermarkets: true, // Always use Supabase
    sales: true, // Always use Supabase
    orders: true, // Always use Supabase
    stock: true, // Always use Supabase
    fragranceStock: true // Always use Supabase
};

// Force Supabase usage - but migrate data first
const FORCE_SUPABASE = true;

// Android offline mode configuration
const USE_ANDROID_OFFLINE = false; // Temporarily disabled to prevent runtime errors
// const USE_ANDROID_OFFLINE = isAndroid();

// Update configuration based on migration status
const updateStorageConfig = async () => {
    if (typeof window === 'undefined') return;

    // Force Supabase usage if enabled or on Android
    if (FORCE_SUPABASE || isAndroid()) {
        USE_SUPABASE.supermarkets = true;
        USE_SUPABASE.sales = true;
        USE_SUPABASE.orders = true;
        USE_SUPABASE.stock = true;
        USE_SUPABASE.fragranceStock = true;
        
        // Set migration flags to force Supabase
        localStorage.setItem('supermarket_migration_done', 'true');
        localStorage.setItem('sales_migration_done', 'true');
        localStorage.setItem('orders_migration_done', 'true');
        localStorage.setItem('stock_migration_done', 'true');
        localStorage.setItem('fragrance_stock_migration_done', 'true');
        localStorage.setItem('full_migration_complete', 'true');
        
        // Android-specific flag
        if (isAndroid()) {
            localStorage.setItem('force_supabase_android', 'true');
            console.log('🤖 Android detected - forcing Supabase usage');
        }
        
        console.log('🚀 Forcing Supabase usage for all data operations');
        
        // Run migration if needed
        await runMigrationIfNeeded();
        return;
    }

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
    isInitialized = true;
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
        console.log('📊 Using Supabase for sales data');
        const sales = await getSupabaseSales();
        console.log('📊 Supabase sales loaded:', sales.length, 'records');
        return sales;
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
        console.log('📊 Using Supabase to add sale');
        return await addSupabaseSale(saleData);
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
export const getStockHistory = async (): Promise<Stock[]> => {
    await initializeStorage();

    if (USE_SUPABASE.stock) {
        return await getSupabaseStockHistory();
    } else {
        return getLocalStockHistory();
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
            throw error;
        }
    } else {
        return updateLocalStock(quantity, type, reason, fragranceDistribution);
    }
};

// Hybrid Fragrance Stock Functions
export const getFragranceStock = async (): Promise<FragranceStock[]> => {
    await initializeStorage();

    if (USE_SUPABASE.fragranceStock) {
        return await getSupabaseFragranceStock();
    } else {
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
    return await getLocalSupermarkets(); // This already uses Supabase
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