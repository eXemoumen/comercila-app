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
    getSupabaseCurrentStock
} from './supabaseStorage';

import { getMigrationStatus } from './migration';
import type { Sale, Order, Stock, Payment, Supermarket, FragranceStock } from './storage';

// Configuration for which data sources to use
const USE_SUPABASE = {
    supermarkets: true, // Always use Supabase
    sales: true, // Always use Supabase
    orders: true, // Always use Supabase
    stock: true, // Always use Supabase
    fragranceStock: true // Always use Supabase
};

// Force Supabase usage - no more local storage fallback
const FORCE_SUPABASE = true;

// Update configuration based on migration status
const updateStorageConfig = () => {
    if (typeof window === 'undefined') return;

    // Force Supabase usage if enabled
    if (FORCE_SUPABASE) {
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
        
        console.log('🚀 Forcing Supabase usage for all data operations');
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

// Initialize storage config
updateStorageConfig();

// Hybrid Sales Functions
export const getSales = async (): Promise<Sale[]> => {
    updateStorageConfig();
    console.log('🛒 Getting sales data...');

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
    updateStorageConfig();
    console.log('➕ Adding sale data...');

    if (USE_SUPABASE.sales) {
        console.log('📊 Using Supabase to add sale');
        return await addSupabaseSale(saleData);
    } else {
        console.log('💾 Using local storage to add sale');
        return addLocalSale(saleData);
    }
};

export const deleteSale = async (saleId: string): Promise<boolean> => {
    updateStorageConfig();

    if (USE_SUPABASE.sales) {
        return await deleteSupabaseSale(saleId);
    } else {
        return deleteLocalSale(saleId);
    }
};

export const updateSalePayment = async (saleId: string, isPaid: boolean): Promise<Sale | null> => {
    updateStorageConfig();

    if (USE_SUPABASE.sales) {
        return await updateSupabaseSalePayment(saleId, isPaid);
    } else {
        return updateLocalSalePayment(saleId, isPaid);
    }
};

export const addPayment = async (saleId: string, payment: Omit<Payment, 'id'>): Promise<Sale | null> => {
    updateStorageConfig();

    if (USE_SUPABASE.sales) {
        return await addSupabasePayment(saleId, payment);
    } else {
        return addLocalPayment(saleId, payment);
    }
};

// Hybrid Orders Functions
export const getOrders = async (): Promise<Order[]> => {
    updateStorageConfig();

    if (USE_SUPABASE.orders) {
        return await getSupabaseOrders();
    } else {
        return getLocalOrders();
    }
};

export const addOrder = async (order: Omit<Order, 'id' | 'status'>): Promise<Order | null> => {
    updateStorageConfig();

    if (USE_SUPABASE.orders) {
        return await addSupabaseOrder(order);
    } else {
        return addLocalOrder(order);
    }
};

export const deleteOrder = async (id: string): Promise<void> => {
    updateStorageConfig();

    if (USE_SUPABASE.orders) {
        await deleteSupabaseOrder(id);
    } else {
        deleteLocalOrder(id);
    }
};

export const completeOrder = async (orderId: string): Promise<Order | null> => {
    updateStorageConfig();

    if (USE_SUPABASE.orders) {
        return await completeSupabaseOrder(orderId);
    } else {
        return completeLocalOrder(orderId);
    }
};

// Hybrid Stock Functions
export const getStockHistory = async (): Promise<Stock[]> => {
    updateStorageConfig();

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
    updateStorageConfig();

    if (USE_SUPABASE.stock) {
        // For Supabase, we need to calculate current stock first
        const { currentStock } = await getCurrentStock();
        const safeCurrentStock = currentStock || 0;
        const newStock = type === 'removed' ? safeCurrentStock - quantity :
            type === 'added' ? safeCurrentStock + quantity : quantity;

        await addSupabaseStockEntry(quantity, type, reason, newStock, fragranceDistribution);

        // Update fragrance stock if distribution provided
        if (fragranceDistribution) {
            for (const [fragranceId, qty] of Object.entries(fragranceDistribution)) {
                const adjustedQty = type === 'adjusted' ? qty : (type === 'removed' ? -qty : qty);
                await updateSupabaseFragranceStock(fragranceId, adjustedQty);
            }
        }

        return newStock;
    } else {
        return updateLocalStock(quantity, type, reason, fragranceDistribution);
    }
};

// Hybrid Fragrance Stock Functions
export const getFragranceStock = async (): Promise<FragranceStock[]> => {
    updateStorageConfig();

    if (USE_SUPABASE.fragranceStock) {
        return await getSupabaseFragranceStock();
    } else {
        return getLocalFragranceStock();
    }
};

export const updateFragranceStock = async (fragranceId: string, quantity: number): Promise<FragranceStock | null> => {
    updateStorageConfig();

    if (USE_SUPABASE.fragranceStock) {
        return await updateSupabaseFragranceStock(fragranceId, quantity);
    } else {
        return updateLocalFragranceStock(fragranceId, quantity);
    }
};

export const setFragranceStock = async (fragranceId: string, newQuantity: number): Promise<FragranceStock | null> => {
    updateStorageConfig();

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
    updateStorageConfig();
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