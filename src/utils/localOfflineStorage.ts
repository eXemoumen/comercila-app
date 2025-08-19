/**
 * True local storage implementation that works completely offline
 */

import type { Sale, Supermarket, Order, Payment, FragranceStock } from './storage';

// Local storage keys
const STORAGE_KEYS = {
    SALES: 'offline_sales',
    SUPERMARKETS: 'offline_supermarkets', 
    ORDERS: 'offline_orders',
    FRAGRANCE_STOCK: 'offline_fragrance_stock',
    CURRENT_STOCK: 'offline_current_stock'
};

// Helper functions for localStorage operations
const getFromStorage = <T>(key: string): T[] => {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error(`Error reading from localStorage key ${key}:`, error);
        return [];
    }
};

const saveToStorage = <T>(key: string, data: T[]): void => {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
        console.error(`Error saving to localStorage key ${key}:`, error);
    }
};

// Sales functions
export const getOfflineSales = async (): Promise<Sale[]> => {
    console.log('📱 Loading sales from offline storage');
    const sales = getFromStorage<Sale>(STORAGE_KEYS.SALES);
    console.log('📱 Offline sales loaded:', sales.length, 'records');
    return sales;
};

export const addOfflineSale = async (saleData: Omit<Sale, "id">): Promise<Sale | null> => {
    try {
        const sales = getFromStorage<Sale>(STORAGE_KEYS.SALES);
        const newSale: Sale = {
            ...saleData,
            id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            payments: saleData.payments || []
        };
        
        sales.unshift(newSale); // Add to beginning for newest first
        saveToStorage(STORAGE_KEYS.SALES, sales);
        
        console.log('📱 Sale added to offline storage:', newSale.id);
        return newSale;
    } catch (error) {
        console.error('Error adding sale to offline storage:', error);
        return null;
    }
};

export const deleteOfflineSale = async (id: string): Promise<boolean> => {
    try {
        const sales = getFromStorage<Sale>(STORAGE_KEYS.SALES);
        const filteredSales = sales.filter(sale => sale.id !== id);
        saveToStorage(STORAGE_KEYS.SALES, filteredSales);
        
        console.log('📱 Sale deleted from offline storage:', id);
        return true;
    } catch (error) {
        console.error('Error deleting sale from offline storage:', error);
        return false;
    }
};

export const addOfflinePayment = async (saleId: string, payment: Omit<Payment, 'id'>): Promise<Payment | null> => {
    try {
        const sales = getFromStorage<Sale>(STORAGE_KEYS.SALES);
        const saleIndex = sales.findIndex(sale => sale.id === saleId);
        
        if (saleIndex === -1) {
            console.error('Sale not found for payment:', saleId);
            return null;
        }
        
        const newPayment: Payment = {
            ...payment,
            id: `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
        
        if (!sales[saleIndex].payments) {
            sales[saleIndex].payments = [];
        }
        
        sales[saleIndex].payments.push(newPayment);
        
        // Update remaining amount
        const totalPaid = sales[saleIndex].payments.reduce((sum, p) => sum + p.amount, 0);
        sales[saleIndex].remainingAmount = sales[saleIndex].totalValue - totalPaid;
        sales[saleIndex].isPaid = sales[saleIndex].remainingAmount <= 0;
        // Update timestamp if available (removed since it's not in the interface)
        
        if (sales[saleIndex].isPaid && !sales[saleIndex].paymentDate) {
            sales[saleIndex].paymentDate = new Date().toISOString();
        }
        
        saveToStorage(STORAGE_KEYS.SALES, sales);
        
        console.log('📱 Payment added to offline storage:', newPayment.id);
        return newPayment;
    } catch (error) {
        console.error('Error adding payment to offline storage:', error);
        return null;
    }
};

// Supermarkets functions
export const getOfflineSupermarkets = async (): Promise<Supermarket[]> => {
    console.log('📱 Loading supermarkets from offline storage');
    const supermarkets = getFromStorage<Supermarket>(STORAGE_KEYS.SUPERMARKETS);
    console.log('📱 Offline supermarkets loaded:', supermarkets.length, 'records');
    return supermarkets;
};

export const addOfflineSupermarket = async (supermarketData: Omit<Supermarket, "id" | "totalSales" | "totalValue">): Promise<Supermarket | null> => {
    try {
        const supermarkets = getFromStorage<Supermarket>(STORAGE_KEYS.SUPERMARKETS);
        const newSupermarket = {
            ...supermarketData,
            id: `offline_market_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            totalSales: 0,
            totalValue: 0
        } as Supermarket;
        
        supermarkets.push(newSupermarket);
        saveToStorage(STORAGE_KEYS.SUPERMARKETS, supermarkets);
        
        console.log('📱 Supermarket added to offline storage:', newSupermarket.id);
        return newSupermarket;
    } catch (error) {
        console.error('Error adding supermarket to offline storage:', error);
        return null;
    }
};

// Orders functions
export const getOfflineOrders = async (): Promise<Order[]> => {
    console.log('📱 Loading orders from offline storage');
    const orders = getFromStorage<Order>(STORAGE_KEYS.ORDERS);
    console.log('📱 Offline orders loaded:', orders.length, 'records');
    return orders;
};

export const addOfflineOrder = async (orderData: Omit<Order, "id">): Promise<Order | null> => {
    try {
        const orders = getFromStorage<Order>(STORAGE_KEYS.ORDERS);
        const newOrder: Order = {
            ...orderData,
            id: `offline_order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
        
        orders.unshift(newOrder); // Add to beginning for newest first
        saveToStorage(STORAGE_KEYS.ORDERS, orders);
        
        console.log('📱 Order added to offline storage:', newOrder.id);
        return newOrder;
    } catch (error) {
        console.error('Error adding order to offline storage:', error);
        return null;
    }
};

export const deleteOfflineOrder = async (id: string): Promise<boolean> => {
    try {
        const orders = getFromStorage<Order>(STORAGE_KEYS.ORDERS);
        const filteredOrders = orders.filter(order => order.id !== id);
        saveToStorage(STORAGE_KEYS.ORDERS, filteredOrders);
        
        console.log('📱 Order deleted from offline storage:', id);
        return true;
    } catch (error) {
        console.error('Error deleting order from offline storage:', error);
        return false;
    }
};

// Fragrance stock functions
export const getOfflineFragranceStock = async (): Promise<FragranceStock[]> => {
    console.log('📱 Loading fragrance stock from offline storage');
    const stock = getFromStorage<FragranceStock>(STORAGE_KEYS.FRAGRANCE_STOCK);
    
    // If no stock exists, initialize with default fragrances
    if (stock.length === 0) {
        const defaultFragrances: FragranceStock[] = [
            { fragranceId: '1', name: 'Vanille', quantity: 0, color: '#F59E0B' },
            { fragranceId: '2', name: 'Chocolat', quantity: 0, color: '#8B4513' },
            { fragranceId: '3', name: 'Fraise', quantity: 0, color: '#EF4444' },
            { fragranceId: '4', name: 'Menthe', quantity: 0, color: '#10B981' },
            { fragranceId: '5', name: 'Orange', quantity: 0, color: '#F97316' },
            { fragranceId: '6', name: 'Citron', quantity: 0, color: '#EAB308' },
            { fragranceId: '7', name: 'Jasmin', quantity: 0, color: '#10B981' },
            { fragranceId: '8', name: 'Amande', quantity: 0, color: '#8B5CF6' },
        ];
        saveToStorage(STORAGE_KEYS.FRAGRANCE_STOCK, defaultFragrances);
        console.log('📱 Initialized default fragrance stock');
        return defaultFragrances;
    }
    
    console.log('📱 Offline fragrance stock loaded:', stock.length, 'items');
    return stock;
};

export const updateOfflineFragranceStock = async (fragranceId: string, quantity: number): Promise<boolean> => {
    try {
        const stock = await getOfflineFragranceStock();
        const fragranceIndex = stock.findIndex(item => item.fragranceId === fragranceId);
        
        if (fragranceIndex === -1) {
            console.error('Fragrance not found:', fragranceId);
            return false;
        }
        
        stock[fragranceIndex].quantity = Math.max(0, quantity); // Ensure non-negative
        saveToStorage(STORAGE_KEYS.FRAGRANCE_STOCK, stock);
        
        // Update current stock total
        const totalStock = stock.reduce((sum, item) => sum + item.quantity, 0);
        localStorage.setItem(STORAGE_KEYS.CURRENT_STOCK, totalStock.toString());
        
        console.log('📱 Fragrance stock updated:', fragranceId, 'quantity:', quantity);
        return true;
    } catch (error) {
        console.error('Error updating fragrance stock:', error);
        return false;
    }
};

export const getOfflineCurrentStock = async (): Promise<number> => {
    try {
        const fragranceStock = await getOfflineFragranceStock();
        const totalStock = fragranceStock.reduce((sum, item) => sum + item.quantity, 0);
        
        console.log('📱 Current offline stock:', totalStock);
        return totalStock;
    } catch (error) {
        console.error('Error getting current stock:', error);
        return 0;
    }
};

// Utility functions
export const clearOfflineData = () => {
    Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
    });
    console.log('📱 All offline data cleared');
};

export const getOfflineDataStats = () => {
    const stats = {
        sales: getFromStorage<Sale>(STORAGE_KEYS.SALES).length,
        supermarkets: getFromStorage<Supermarket>(STORAGE_KEYS.SUPERMARKETS).length,
        orders: getFromStorage<Order>(STORAGE_KEYS.ORDERS).length,
        fragranceStock: getFromStorage<FragranceStock>(STORAGE_KEYS.FRAGRANCE_STOCK).length
    };
    
    console.log('📱 Offline data stats:', stats);
    return stats;
};

// Sync cached data from Supabase to offline storage
export const syncCacheToOfflineStorage = async () => {
    try {
        // Sync sales
        const cachedSales = localStorage.getItem('cachedSales');
        if (cachedSales) {
            const sales = JSON.parse(cachedSales);
            saveToStorage(STORAGE_KEYS.SALES, sales);
            console.log('📱 Synced', sales.length, 'sales to offline storage');
        }
        
        // Sync supermarkets
        const cachedSupermarkets = localStorage.getItem('cachedSupermarkets');
        if (cachedSupermarkets) {
            const supermarkets = JSON.parse(cachedSupermarkets);
            saveToStorage(STORAGE_KEYS.SUPERMARKETS, supermarkets);
            console.log('📱 Synced', supermarkets.length, 'supermarkets to offline storage');
        }
        
        // Sync fragrance stock
        const cachedFragranceStock = localStorage.getItem('cachedFragranceStock');
        if (cachedFragranceStock) {
            const fragranceStock = JSON.parse(cachedFragranceStock);
            saveToStorage(STORAGE_KEYS.FRAGRANCE_STOCK, fragranceStock);
            console.log('📱 Synced', fragranceStock.length, 'fragrance stock to offline storage');
        }
        
        console.log('📱 Cache sync to offline storage completed');
    } catch (error) {
        console.error('Error syncing cache to offline storage:', error);
    }
};
