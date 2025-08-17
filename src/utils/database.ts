import { createClient, PostgrestError } from '@supabase/supabase-js';

import type { Database } from '@/types/supabase';
import * as storage from './storage';
import { v4 as uuidv4 } from 'uuid';
import { isAuthenticated } from '@/lib/supabase';


type Supermarket = Database['public']['Tables']['supermarkets']['Row']
type Sale = Database['public']['Tables']['sales']['Row']
type Order = Database['public']['Tables']['orders']['Row']
type Payment = Database['public']['Tables']['payments']['Row']
type StockHistory = Database['public']['Tables']['stock_history']['Row']
type CurrentStock = Database['public']['Tables']['current_stock']['Row']

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Helper function to check if we're online
const isOnline = (): boolean => {
  // Always use local storage for now until Supabase is properly configured
  return false;
  // Original implementation:
  // return typeof window !== 'undefined' && window.navigator.onLine;
};

// Helper function to log errors with type safety
const logError = (error: Error | unknown, context: string) => {
  console.error(`Error in ${context}:`, error);
};

// Helper function to handle Supabase errors
const handleSupabaseError = (error: unknown) => {
  console.error('Supabase error:', error);
  return null;
};

// Sync local data with Supabase
export const syncWithSupabase = async () => {
  if (!isOnline()) return;

  try {
    // Sync supermarkets
    const { data: supermarkets, error: supermarketsError } = await supabaseClient
      .from('supermarkets')
      .select('*');

    if (supermarketsError) throw supermarketsError;
    if (supermarkets) {
      const localSupermarkets = await storage.getSupermarkets();
      const mergedSupermarkets = [...supermarkets, ...localSupermarkets.filter(
        local => !supermarkets.find(remote => remote.id === local.id)
      )];
      localStorage.setItem('soap_supermarkets', JSON.stringify(mergedSupermarkets));
    }

    // Sync sales
    const { data: sales, error: salesError } = await supabaseClient
      .from('sales')
      .select('*');

    if (salesError) throw salesError;
    if (sales) {
      const localSales = await storage.getSales();
      const mergedSales = [...sales, ...localSales.filter(
        local => !sales.find(remote => remote.id === local.id)
      )];
      localStorage.setItem('soap_sales', JSON.stringify(mergedSales));
    }

    // Sync orders
    const { data: orders, error: ordersError } = await supabaseClient
      .from('orders')
      .select('*');

    if (ordersError) throw ordersError;
    if (orders) {
      const localOrders = await storage.getOrders();
      const mergedOrders = [...orders, ...localOrders.filter(
        local => !orders.find(remote => remote.id === local.id)
      )];
      localStorage.setItem('soap_orders', JSON.stringify(mergedOrders));
    }

  } catch (error) {
    logError(error, 'syncWithSupabase');
  }
};

// Supermarket operations
export async function getSupermarkets(): Promise<Supermarket[]> {
  try {
    const { data, error } = await supabaseClient
      .from('supermarkets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(supermarket => ({
      ...supermarket,
      location: {
        lat: supermarket.latitude,
        lng: supermarket.longitude,
        formattedAddress: supermarket.address
      }
    }));
  } catch (error) {
    console.error('Error fetching supermarkets:', error);
    return [];
  }
}

// Define a type that matches what storage.updateSupermarket expects
interface StorageSupermarketData extends Partial<Omit<Supermarket, 'id' | 'totalSales' | 'totalValue'>> {
  latitude?: number;
  longitude?: number;
}

// Define a type that includes the location property
interface SupermarketWithLocation extends Partial<Omit<Database['public']['Tables']['supermarkets']['Row'], 'id' | 'created_at'>> {
  location?: {
    lat: number;
    lng: number;
    formattedAddress?: string;
  };
}

export async function addSupermarket(supermarket: Omit<Database['public']['Tables']['supermarkets']['Insert'], 'id' | 'created_at'>): Promise<Database['public']['Tables']['supermarkets']['Row'] | null> {
  try {
    console.log('Attempting to add supermarket:', supermarket);

    if (!isOnline()) {
      console.log('Offline mode - storing locally only');
      const newSupermarket = {
        id: uuidv4(),
        ...supermarket,
        created_at: new Date().toISOString(),
        phoneNumbers: [],
        location: {
          lat: supermarket.latitude || 0,
          lng: supermarket.longitude || 0,
          formattedAddress: supermarket.address
        }
      };
      storage.addSupermarket(newSupermarket);
      return newSupermarket;
    }

    // Check authentication
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      console.error('User is not authenticated');
      throw new Error('User is not authenticated');
    }

    const { data, error } = await supabaseClient
      .from('supermarkets')
      .insert(supermarket)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    console.log('Successfully added supermarket to Supabase:', data);

    // Also store locally
    storage.addSupermarket({
      ...data,
      latitude: data.location?.lat,
      longitude: data.location?.lng
    });

    return data;
  } catch (error) {
    console.error('Error adding supermarket:', error);
    throw error;
  }
}

export async function updateSupermarket(id: string, updatedData: SupermarketWithLocation): Promise<Database['public']['Tables']['supermarkets']['Row'] | null> {
  try {
    if (!isOnline()) {
      console.log('Offline mode - storing locally only');
      const storageData: StorageSupermarketData = {
        ...updatedData,
        latitude: updatedData.location?.lat,
        longitude: updatedData.location?.lng
      };
      return storage.updateSupermarket(id, storageData) as unknown as Database['public']['Tables']['supermarkets']['Row'] | null;
    }

    // Check authentication
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      console.error('User is not authenticated');
      throw new Error('User is not authenticated');
    }

    const { data, error } = await supabaseClient
      .from('supermarkets')
      .update(updatedData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    // Also update local storage
    const storageData: StorageSupermarketData = {
      ...updatedData,
      latitude: updatedData.location?.lat,
      longitude: updatedData.location?.lng
    };
    storage.updateSupermarket(id, storageData);

    return data;
  } catch (error) {
    console.error('Error updating supermarket:', error);
    throw error;
  }
}

// Sale operations
export const getSales = async (): Promise<Sale[]> => {
  try {
    if (!isOnline()) {
      const localData = localStorage.getItem('sales');
      return localData ? JSON.parse(localData) : [];
    }

    const { data: salesData, error: salesError } = await supabaseClient
      .from('sales')
      .select('*')
      .order('date', { ascending: false });

    if (salesError) throw salesError;

    const { data: paymentsData, error: paymentsError } = await supabaseClient
      .from('payments')
      .select('*');

    if (paymentsError) throw paymentsError;

    // Update local storage
    localStorage.setItem('sales', JSON.stringify(salesData));
    localStorage.setItem('payments', JSON.stringify(paymentsData));

    return salesData.map(sale => ({
      id: sale.id,
      supermarket_id: sale.supermarket_id,
      total_amount: sale.total_value,
      created_at: sale.created_at,
      quantity: sale.quantity,
      cartons: sale.cartons,
      pricePerUnit: sale.price_per_unit,
      totalValue: sale.total_value,
      date: sale.date,
      paymentDate: sale.payment_date,
      paymentNote: sale.payment_note,
      note: sale.note,
      remainingAmount: sale.remaining_amount,
      isPaid: sale.is_paid,
      fromOrder: sale.from_order,
      payments: paymentsData
        .filter(p => p.sale_id === sale.id)
        .map(p => ({
          id: p.id,
          sale_id: p.sale_id,
          amount: p.amount,
          date: p.date,
          note: p.note
        }))
    }));
  } catch (error) {
    console.error('Error fetching sales:', error);
    return [];
  }
};

export const addSale = async (sale: Omit<Sale, 'id' | 'created_at'>) => {
  try {
    // Update local storage first
    const localSales = JSON.parse(localStorage.getItem('sales') || '[]')
    const newSale = {
      id: Date.now().toString(),
      ...sale,
      created_at: new Date().toISOString()
    }
    localStorage.setItem('sales', JSON.stringify([...localSales, newSale]))

    // If online, sync with Supabase
    if (isOnline()) {
      const { data, error } = await supabaseClient
        .from('sales')
        .insert([sale])
        .select()
        .single()

      if (error) throw error
      return data
    }

    return newSale
  } catch (error) {
    console.error('Error adding sale:', error)
    throw error
  }
}

// Order operations
export const getOrders = async (): Promise<Order[]> => {
  try {
    if (!isOnline()) {
      const localData = localStorage.getItem('orders');
      return localData ? JSON.parse(localData) : [];
    }

    const { data, error } = await supabaseClient
      .from('orders')
      .select('*')
      .order('date', { ascending: false });

    if (error) throw error;

    // Update local storage
    localStorage.setItem('orders', JSON.stringify(data));

    return data.map(order => ({
      id: order.id,
      supermarket_id: order.supermarket_id,
      status: order.status,
      created_at: order.created_at
    }));
  } catch (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
};

export const addOrder = async (order: Omit<Order, 'id'>): Promise<Order | null> => {
  try {
    const orderData = {
      supermarket_id: order.supermarket_id,
      status: order.status
    };

    const { data, error } = await supabaseClient
      .from('orders')
      .insert(orderData)
      .select()
      .single();

    if (error) throw error;

    // Update local storage
    const localData = JSON.parse(localStorage.getItem('orders') || '[]');
    localData.push(data);
    localStorage.setItem('orders', JSON.stringify(localData));

    // Return data as is - it will be handled by the Order type definition
    return data as unknown as Order;
  } catch (error) {
    return handleSupabaseError(error);
  }
};

export const deleteOrder = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabaseClient
      .from('orders')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Update local storage
    const localData = JSON.parse(localStorage.getItem('orders') || '[]');
    const updatedData = localData.filter((order: Order) => order.id !== id);
    localStorage.setItem('orders', JSON.stringify(updatedData));

    return true;
  } catch (error) {
    return handleSupabaseError(error) !== null;
  }
};

// Stock operations
export const getCurrentStock = async (): Promise<number> => {
  try {
    if (!isOnline()) {
      // Sum up all fragrance stock quantities
      const fragranceStocks = JSON.parse(localStorage.getItem('soap_fragrance_stock') || '[]');
      return fragranceStocks.reduce((total: number, item: { fragranceId: string; name: string; quantity: number; color: string }) =>
        total + (item.quantity || 0), 0);
    }

    // If online, get the sum of fragrance stocks from Supabase
    const { data, error } = await supabaseClient
      .from('fragrance_stock')
      .select('quantity');

    if (error) throw error;

    // Sum up all quantities
    return data.reduce((total, item) => total + (item.quantity || 0), 0);
  } catch (error) {
    console.error('Error getting current stock:', error);
    return 0;
  }
};

export const updateStock = async (productId: string, quantity: number, reason?: string) => {
  try {
    // Update fragrance stock in local storage first
    const localStock = JSON.parse(localStorage.getItem('current_stock') || '[]')
    const existingStock = localStock.find((s: CurrentStock) => s.product_id === productId)

    if (existingStock) {
      existingStock.quantity += quantity
      existingStock.updated_at = new Date().toISOString()
    } else {
      localStock.push({
        product_id: productId,
        quantity,
        updated_at: new Date().toISOString()
      })
    }
    localStorage.setItem('current_stock', JSON.stringify(localStock))

    // Add to stock history
    const localHistory = JSON.parse(localStorage.getItem('stock_history') || '[]')
    localHistory.push({
      id: Date.now().toString(),
      product_id: productId,
      quantity,
      type: quantity > 0 ? 'in' : 'out',
      reason: reason || null,
      created_at: new Date().toISOString()
    })
    localStorage.setItem('stock_history', JSON.stringify(localHistory))

    // If online, sync with Supabase
    if (isOnline()) {
      // First, get the current stock
      const { data: currentStock, error: fetchError } = await supabaseClient
        .from('current_stock')
        .select('*')
        .eq('product_id', productId)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError

      if (currentStock) {
        // Update existing stock by adding the new quantity
        const { data: stockData, error: stockError } = await supabaseClient
          .from('current_stock')
          .update({
            quantity: currentStock.quantity + quantity,
            updated_at: new Date().toISOString()
          })
          .eq('product_id', productId)
          .select()
          .single()

        if (stockError) throw stockError

        const { error: historyError } = await supabaseClient
          .from('stock_history')
          .insert([{
            product_id: productId,
            quantity,
            type: quantity > 0 ? 'in' : 'out',
            reason: reason || null
          }])

        if (historyError) throw historyError

        return stockData
      } else {
        // Insert new stock record
        const { data: stockData, error: stockError } = await supabaseClient
          .from('current_stock')
          .insert({
            product_id: productId,
            quantity,
            updated_at: new Date().toISOString()
          })
          .select()
          .single()

        if (stockError) throw stockError

        const { error: historyError } = await supabaseClient
          .from('stock_history')
          .insert([{
            product_id: productId,
            quantity,
            type: quantity > 0 ? 'in' : 'out',
            reason: reason || null
          }])

        if (historyError) throw historyError

        return stockData
      }
    }

    return existingStock || localStock[localStock.length - 1]
  } catch (error) {
    console.error('Error updating stock:', error)
    throw error
  }
}

export const getStockHistory = async (): Promise<StockHistory[]> => {
  try {
    if (!isOnline()) {
      const localData = localStorage.getItem('stockHistory');
      return localData ? JSON.parse(localData) : [];
    }

    const { data, error } = await supabaseClient
      .from('stock_history')
      .select('*')
      .order('date', { ascending: false });

    if (error) throw error;

    // Update local storage
    localStorage.setItem('stockHistory', JSON.stringify(data));

    return data.map(item => ({
      id: item.id,
      product_id: item.product_id,
      quantity: item.quantity,
      type: item.type,
      reason: item.reason,
      created_at: item.created_at
    }));
  } catch (error) {
    console.error('Error fetching stock history:', error);
    return [];
  }
};

// Payment operations
export const updateSalePayment = async (
  saleId: string,
  isPaid: boolean,
  paymentDate?: string,
  paymentNote?: string
): Promise<void> => {
  const sales = await storage.getSales();
  const saleIndex = sales.findIndex(s => s.id === saleId);

  if (saleIndex !== -1) {
    const updatedSale = {
      ...sales[saleIndex],
      isPaid,
      paymentDate: isPaid ? paymentDate || new Date().toISOString() : undefined,
      paymentNote: isPaid ? paymentNote : undefined
    };

    sales[saleIndex] = updatedSale;
    localStorage.setItem('soap_sales', JSON.stringify(sales));

    if (isOnline()) {
      try {
        const dbUpdate = {
          is_paid: isPaid,
          payment_date: isPaid ? paymentDate || new Date().toISOString() : null,
          payment_note: isPaid ? paymentNote : null
        };

        const { error } = await supabaseClient
          .from('sales')
          .update(dbUpdate)
          .eq('id', saleId);

        if (error) throw error;
      } catch (error) {
        if (error instanceof PostgrestError) {
          logError(error, 'updateSalePayment');
        }
      }
    }
  }
};

export const addPayment = async (saleId: string, payment: Omit<Payment, 'id' | 'sale_id'>): Promise<Payment | null> => {
  try {
    const { data, error } = await supabaseClient
      .from('payments')
      .insert({
        sale_id: saleId,
        amount: payment.amount,
        method: payment.method
      })
      .select()
      .single();

    if (error) throw error;

    // Update sale's remaining amount and payment status
    const { data: saleData, error: saleError } = await supabaseClient
      .from('sales')
      .select('*')
      .eq('id', saleId)
      .single();

    if (saleError) throw saleError;

    const newRemainingAmount = saleData.remaining_amount - payment.amount;
    const isPaid = newRemainingAmount <= 0;

    const { error: updateError } = await supabaseClient
      .from('sales')
      .update({
        remaining_amount: newRemainingAmount,
        is_paid: isPaid,
        payment_date: isPaid ? new Date().toISOString() : null
      })
      .eq('id', saleId);

    if (updateError) throw updateError;

    // Update local storage
    const localPayments = JSON.parse(localStorage.getItem('payments') || '[]');
    localPayments.push(data);
    localStorage.setItem('payments', JSON.stringify(localPayments));

    return {
      id: data.id,
      sale_id: data.sale_id,
      amount: data.amount,
      method: data.method,
      created_at: data.created_at
    };
  } catch (error) {
    return handleSupabaseError(error);
  }
};

export async function getSupermarketSales(supermarketId: string): Promise<Sale[]> {
  try {
    const { data, error } = await supabaseClient
      .from('sales')
      .select('*')
      .eq('supermarket_id', supermarketId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(sale => ({
      ...sale,
      note: sale.note || undefined
    }));
  } catch (error) {
    console.error('Error fetching sales:', error);
    return [];
  }
}

export async function createSale(sale: Omit<Sale, 'id' | 'created_at'>): Promise<Sale> {
  try {
    const saleData = {
      supermarket_id: sale.supermarket_id,
      total_amount: sale.total_amount,
      note: sale.note || null
    };

    const { data, error } = await supabaseClient
      .from('sales')
      .insert(saleData)
      .select()
      .single();

    if (error) throw error;

    return {
      ...data,
      note: data.note || undefined
    };
  } catch (error) {
    console.error('Error adding sale:', error);
    throw error;
  }
}

export async function createOrder(order: Omit<Order, 'id' | 'createdAt'>): Promise<Order> {
  try {
    const orderData = {
      supermarket_id: order.supermarket_id,
      status: order.status
    };

    const { data, error } = await supabaseClient
      .from('orders')
      .insert(orderData)
      .select()
      .single();

    if (error) throw error;

    return {
      ...data,
      note: data.note || undefined
    };
  } catch (error) {
    console.error('Error adding order:', error);
    throw error;
  }
}

export async function updateInventory(supermarketId: string, productId: string, quantity: number, type: 'in' | 'out', reason?: string): Promise<void> {
  try {
    const historyData = {
      supermarket_id: supermarketId,
      product_id: productId,
      quantity,
      type,
      ...(reason && { reason })
    };

    const { error: historyError } = await supabaseClient
      .from('stock_history')
      .insert(historyData);

    if (historyError) throw historyError;

    const { data: currentStock, error: fetchError } = await supabaseClient
      .from('current_stock')
      .select('*')
      .eq('supermarket_id', supermarketId)
      .eq('product_id', productId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

    if (currentStock) {
      const newQuantity = type === 'in'
        ? currentStock.quantity + quantity
        : currentStock.quantity - quantity;

      const { error: updateError } = await supabaseClient
        .from('current_stock')
        .update({ quantity: newQuantity, last_updated: new Date().toISOString() })
        .eq('id', currentStock.id);

      if (updateError) throw updateError;
    } else {
      const { error: insertError } = await supabaseClient
        .from('current_stock')
        .insert({
          supermarket_id: supermarketId,
          product_id: productId,
          quantity: type === 'in' ? quantity : -quantity
        });

      if (insertError) throw insertError;
    }
  } catch (error) {
    console.error('Error updating stock:', error);
    throw error;
  }
}

export async function fetchSupermarketOrders(supermarketId: string): Promise<Order[]> {
  try {
    const { data, error } = await supabaseClient
      .from('orders')
      .select('*')
      .eq('supermarket_id', supermarketId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(order => ({
      ...order,
      note: order.note || undefined
    }));
  } catch (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
} 