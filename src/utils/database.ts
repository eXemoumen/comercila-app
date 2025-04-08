import { createClient } from '@supabase/supabase-js';
import { Supermarket, Sale, Order, StockHistory } from '@/types/index'
import * as storage from './storage'
import { isOnline } from './offline'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function to handle operations with offline fallback
const handleOperation = async <T>(
  operation: () => Promise<T>,
  storageKey: string,
  storageOperation: (data: T) => void
): Promise<T> => {
  try {
    if (isOnline()) {
      const result = await operation();
      storageOperation(result);
      return result;
    } else {
      const storedData = storage.getFromStorage<T>(storageKey);
      return storedData || [] as T;
    }
  } catch (error) {
    console.error('Operation failed:', error);
    const storedData = storage.getFromStorage<T>(storageKey);
    return storedData || [] as T;
  }
};

// Supermarkets
export async function getSupermarkets(): Promise<Supermarket[]> {
  try {
    if (!isOnline()) {
      return storage.getSupermarkets();
    }

    const { data, error } = await supabase
      .from('supermarkets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Update localStorage with the latest data
    storage.setInStorage('supermarkets', data);

    return data;
  } catch (error) {
    console.error('Error fetching supermarkets:', error);
    return storage.getSupermarkets();
  }
}

export async function addSupermarket(supermarket: Omit<Supermarket, 'id' | 'totalSales' | 'totalValue'>): Promise<Supermarket> {
  let newSupermarket: Supermarket = {
    id: '',
    name: supermarket.name,
    address: supermarket.address,
    phone: supermarket.phone,
    location: supermarket.location,
    totalSales: 0,
    totalValue: 0
  };
  try {
    // First add to localStorage
    newSupermarket = storage.addSupermarket(supermarket);

    if (!isOnline()) {
      return newSupermarket;
    }

    const { data, error } = await supabase
      .from('supermarkets')
      .insert([{
        name: supermarket.name,
        address: supermarket.address,
        phone: supermarket.phone,
        location: supermarket.location,
        total_sales: 0,
        total_value: 0
      }])
      .select()
      .single();

    if (error) throw error;

    // Update localStorage with the server data
    storage.setInStorage('supermarkets', [data, ...storage.getSupermarkets()]);

    return data;
  } catch (error) {
    console.error('Error adding supermarket:', error);
    return newSupermarket;
  }
}

export const updateSupermarket = async (id: string, updates: Partial<Supermarket>): Promise<Supermarket> => {
  return handleOperation(
    async () => {
      const { data, error } = await supabase
        .from('supermarkets')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    storage.STORAGE_KEYS.SUPERMARKETS,
    (updatedSupermarket) => {
      const existing = storage.getFromStorage<Supermarket[]>(storage.STORAGE_KEYS.SUPERMARKETS) || [];
      storage.setInStorage(
        storage.STORAGE_KEYS.SUPERMARKETS,
        existing.map(sm => sm.id === id ? updatedSupermarket : sm)
      );
    }
  );
};

// Sales
export async function getSales(): Promise<Sale[]> {
  try {
    if (!isOnline()) {
      return storage.getSales();
    }

    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Update localStorage with the latest data
    storage.setInStorage('sales', data);

    return data;
  } catch (error) {
    console.error('Error fetching sales:', error);
    return storage.getSales();
  }
}

export async function addSale(sale: Omit<Sale, 'id' | 'payments' | 'remainingAmount'>): Promise<Sale> {
  let newSale: Sale = {
    id: '',
    date: sale.date,
    supermarketId: sale.supermarketId,
    quantity: sale.quantity,
    pricePerUnit: sale.pricePerUnit,
    totalValue: sale.totalValue,
    isPaid: sale.isPaid,
    paymentDate: sale.paymentDate,
    payments: [],
    remainingAmount: sale.totalValue,
    orderId: sale.orderId,
    cartons: sale.cartons,
    note: sale.note || undefined
  };
  try {
    // First add to localStorage
    newSale = storage.addSale(sale);

    if (!isOnline()) {
      return newSale;
    }

    const saleData = {
      date: sale.date,
      supermarket_id: sale.supermarketId,
      quantity: sale.quantity,
      price_per_unit: sale.pricePerUnit,
      total_price: sale.totalValue,
      is_paid: sale.isPaid,
      payment_date: sale.paymentDate,
      payments: [],
      remaining_amount: sale.totalValue,
      order_id: sale.orderId,
      cartons: sale.cartons
    };

    // Only include note if it exists
    if (sale.note) {
      Object.assign(saleData, { note: sale.note });
    }

    const { data, error } = await supabase
      .from('sales')
      .insert([saleData])
      .select()
      .single();

    if (error) throw error;

    // Update localStorage with the server data
    storage.setInStorage('sales', [data, ...storage.getSales()]);

    return data;
  } catch (error) {
    console.error('Error adding sale:', error);
    return newSale;
  }
}

export async function updateSalePayment(saleId: string, isPaid: boolean): Promise<void> {
  try {
    // First update localStorage
    storage.updateSalePayment(saleId, isPaid);

    if (!isOnline()) {
      return;
    }

    const { error } = await supabase
      .from('sales')
      .update({
        is_paid: isPaid,
        payment_date: isPaid ? new Date().toISOString() : null
      })
      .eq('id', saleId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating sale payment:', error);
  }
}

// Orders
export async function getOrders(): Promise<Order[]> {
  try {
    if (!isOnline()) {
      return storage.getOrders();
    }

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Update localStorage with the latest data
    storage.setInStorage('orders', data);

    return data;
  } catch (error) {
    console.error('Error fetching orders:', error);
    return storage.getOrders();
  }
}

export async function addOrder(order: Omit<Order, 'id'>): Promise<Order> {
  let newOrder: Order = {
    id: '',
    date: order.date,
    supermarketId: order.supermarketId,
    quantity: order.quantity,
    pricePerUnit: order.pricePerUnit,
    totalPrice: order.totalPrice,
    status: order.status,
    cartons: order.cartons,
    note: order.note
  };
  try {
    // First add to localStorage
    newOrder = storage.addOrder(order);

    if (!isOnline()) {
      return newOrder;
    }

    const { data, error } = await supabase
      .from('orders')
      .insert([{
        date: order.date,
        supermarket_id: order.supermarketId,
        quantity: order.quantity,
        price_per_unit: order.pricePerUnit,
        total_price: order.totalPrice,
        status: order.status,
        cartons: order.cartons,
        note: order.note
      }])
      .select()
      .single();

    if (error) throw error;

    // Update localStorage with the server data
    storage.setInStorage('orders', [data, ...storage.getOrders()]);

    return data;
  } catch (error) {
    console.error('Error adding order:', error);
    return newOrder;
  }
}

export async function deleteOrder(id: string): Promise<void> {
  try {
    // First delete from localStorage
    storage.deleteOrder(id);

    if (!isOnline()) {
      return;
    }

    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting order:', error);
  }
}

// Stock
export async function getCurrentStock(): Promise<number> {
  try {
    if (!isOnline()) {
      return storage.getCurrentStock();
    }

    const { data, error } = await supabase
      .from('current_stock')
      .select('quantity')
      .eq('id', '00000000-0000-0000-0000-000000000000')
      .single();

    if (error) throw error;

    // Update localStorage with the latest data
    storage.setInStorage('currentStock', data.quantity);

    return data.quantity;
  } catch (error) {
    console.error('Error fetching current stock:', error);
    return storage.getCurrentStock();
  }
}

export async function updateStock(quantity: number, type: 'in' | 'out', reason: string): Promise<void> {
  try {
    // First update localStorage
    storage.updateStock(quantity, type, reason);

    if (!isOnline()) {
      return;
    }

    // Get current stock first
    const { data: currentStock, error: fetchError } = await supabase
      .from('current_stock')
      .select('quantity')
      .eq('id', '00000000-0000-0000-0000-000000000000')
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "not found"
      throw fetchError;
    }

    // Calculate new quantity
    const currentQuantity = currentStock?.quantity || 0;
    const newQuantity = type === 'in' ? currentQuantity + quantity : currentQuantity - quantity;

    // Try to update first, if it fails with "not found", then insert
    const { error: updateError } = await supabase
      .from('current_stock')
      .update({ quantity: newQuantity })
      .eq('id', '00000000-0000-0000-0000-000000000000');

    if (updateError && updateError.code === 'PGRST116') { // PGRST116 is "not found"
      // If not found, try to insert
      const { error: insertError } = await supabase
        .from('current_stock')
        .insert([{ 
          id: '00000000-0000-0000-0000-000000000000',
          quantity: newQuantity 
        }]);

      if (insertError) throw insertError;
    } else if (updateError) {
      throw updateError;
    }

    // Add to stock history
    const historyData = {
      date: new Date().toISOString(),
      quantity,
      type
    };

    // Only include reason if it exists
    if (reason) {
      Object.assign(historyData, { reason });
    }

    const { error: historyError } = await supabase
      .from('stock_history')
      .insert([historyData]);

    if (historyError) throw historyError;
  } catch (error) {
    console.error('Error updating stock:', error);
    throw error; // Re-throw to handle in the UI
  }
}

export async function getStockHistory(): Promise<StockHistory[]> {
  try {
    if (!isOnline()) {
      return storage.getStockHistory();
    }

    const { data, error } = await supabase
      .from('stock_history')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Update localStorage with the latest data
    storage.setInStorage('stockHistory', data);

    return data;
  } catch (error) {
    console.error('Error fetching stock history:', error);
    return storage.getStockHistory();
  }
}

export async function addPayment(saleId: string, payment: { date: string; amount: number; note?: string }): Promise<void> {
  try {
    // First update localStorage
    storage.addPayment(saleId, payment);

    if (!isOnline()) {
      return;
    }

    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .select('payments, remaining_amount')
      .eq('id', saleId)
      .single();

    if (saleError) throw saleError;

    const updatedPayments = [...(sale.payments || []), payment];
    const updatedRemainingAmount = Math.max(0, (sale.remaining_amount || 0) - payment.amount);

    const { error: updateError } = await supabase
      .from('sales')
      .update({
        payments: updatedPayments,
        remaining_amount: updatedRemainingAmount,
        is_paid: updatedRemainingAmount === 0,
        payment_date: updatedRemainingAmount === 0 ? new Date().toISOString() : null
      })
      .eq('id', saleId);

    if (updateError) throw updateError;
  } catch (error) {
    console.error('Error adding payment:', error);
  }
}

// Test database connection
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    console.log('Testing database connection...');
    
    // Test sales table
    const { error: salesError } = await supabase
      .from('sales')
      .select('*')
      .limit(1);
    
    if (salesError) {
      console.error('Error accessing sales table:', salesError);
      console.error('Sales table error details:', {
        message: salesError.message,
        details: salesError.details,
        hint: salesError.hint,
        code: salesError.code
      });
      return false;
    }
    console.log('Sales table accessible');

    // Test orders table
    const { error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .limit(1);
    
    if (ordersError) {
      console.error('Error accessing orders table:', ordersError);
      console.error('Orders table error details:', {
        message: ordersError.message,
        details: ordersError.details,
        hint: ordersError.hint,
        code: ordersError.code
      });
      return false;
    }
    console.log('Orders table accessible');

    // Test stock_history table
    const { error: stockError } = await supabase
      .from('stock_history')
      .select('*')
      .limit(1);
    
    if (stockError) {
      console.error('Error accessing stock_history table:', stockError);
      console.error('Stock history table error details:', {
        message: stockError.message,
        details: stockError.details,
        hint: stockError.hint,
        code: stockError.code
      });
      return false;
    }
    console.log('Stock history table accessible');

    return true;
  } catch (error) {
    console.error('Error testing database connection:', error);
    return false;
  }
} 