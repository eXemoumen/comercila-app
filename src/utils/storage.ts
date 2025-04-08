import { type Supermarket, type Sale, type Order, type StockHistory, type Payment } from '@/types/index';

export const STORAGE_KEYS = {
  SUPERMARKETS: 'supermarkets',
  SALES: 'sales',
  ORDERS: 'orders',
  CURRENT_STOCK: 'currentStock',
  STOCK_HISTORY: 'stockHistory'
} as const;

export const getFromStorage = <T>(key: string): T | null => {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : null;
};

export const setInStorage = <T>(key: string, data: T): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(data));
};

export const getSupermarkets = (): Supermarket[] => {
  return getFromStorage<Supermarket[]>(STORAGE_KEYS.SUPERMARKETS) || [];
};

export const addSupermarket = (supermarket: Omit<Supermarket, 'id' | 'totalSales' | 'totalValue'>): Supermarket => {
  const supermarkets = getSupermarkets();
  const newSupermarket: Supermarket = {
    ...supermarket,
    id: crypto.randomUUID(),
    totalSales: 0,
    totalValue: 0
  };
  setInStorage(STORAGE_KEYS.SUPERMARKETS, [...supermarkets, newSupermarket]);
  return newSupermarket;
};

export const updateSupermarket = (id: string, updates: Partial<Supermarket>): Supermarket | null => {
  const supermarkets = getSupermarkets();
  const index = supermarkets.findIndex(s => s.id === id);
  if (index === -1) return null;
  
  const updatedSupermarket = {
    ...supermarkets[index],
    ...updates
  };
  supermarkets[index] = updatedSupermarket;
  setInStorage(STORAGE_KEYS.SUPERMARKETS, supermarkets);
  return updatedSupermarket;
};

export const getSales = (): Sale[] => {
  return getFromStorage<Sale[]>(STORAGE_KEYS.SALES) || [];
};

export const addSale = (sale: Omit<Sale, 'id' | 'payments' | 'remainingAmount'>): Sale => {
  const sales = getSales();
  const newSale: Sale = {
    ...sale,
    id: crypto.randomUUID(),
    payments: [],
    remainingAmount: sale.totalValue
  };
  setInStorage(STORAGE_KEYS.SALES, [...sales, newSale]);
  return newSale;
};

export const getOrders = (): Order[] => {
  return getFromStorage<Order[]>(STORAGE_KEYS.ORDERS) || [];
};

export const addOrder = (order: Omit<Order, 'id'>): Order => {
  const orders = getOrders();
  const newOrder: Order = {
    ...order,
    id: crypto.randomUUID()
  };
  setInStorage(STORAGE_KEYS.ORDERS, [...orders, newOrder]);
  return newOrder;
};

export const getCurrentStock = (): number => {
  return getFromStorage<number>(STORAGE_KEYS.CURRENT_STOCK) || 0;
};

export const updateCurrentStock = (quantity: number): void => {
  setInStorage(STORAGE_KEYS.CURRENT_STOCK, quantity);
};

export const getStockHistory = (): StockHistory[] => {
  return getFromStorage<StockHistory[]>(STORAGE_KEYS.STOCK_HISTORY) || [];
};

export const addStockHistory = (history: Omit<StockHistory, 'id'>): StockHistory => {
  const historyList = getStockHistory();
  const newHistory: StockHistory = {
    ...history,
    id: crypto.randomUUID()
  };
  setInStorage(STORAGE_KEYS.STOCK_HISTORY, [...historyList, newHistory]);
  return newHistory;
};

// Supermarkets CRUD
export const updateSupermarketStats = (id: string, quantity: number, totalValue: number) => {
  if (typeof window === 'undefined') return;
  const supermarkets = getSupermarkets();
  const index = supermarkets.findIndex(s => s.id === id);
  if (index !== -1) {
    supermarkets[index].totalSales += quantity;
    supermarkets[index].totalValue += totalValue;
    setInStorage(STORAGE_KEYS.SUPERMARKETS, supermarkets);
  }
};

// Stock CRUD
export const updateStock = (quantity: number, type: 'in' | 'out', reason: string) => {
  if (typeof window === 'undefined') return 0;
  const currentStock = getCurrentStock();
  const newStock = currentStock + (type === 'in' ? quantity : -quantity);

  // Update current stock
  setInStorage(STORAGE_KEYS.CURRENT_STOCK, newStock);

  // Add to history
  const stockHistory = getStockHistory();
  const newHistory: StockHistory = {
    id: Date.now().toString(),
    date: new Date().toISOString(),
    type,
    quantity,
    reason
  };
  stockHistory.push(newHistory);
  setInStorage(STORAGE_KEYS.STOCK_HISTORY, stockHistory);

  return newStock;
};

// Orders CRUD
export const deleteOrder = (id: string) => {
  if (typeof window === 'undefined') return null;
  const orders = getOrders();
  const filteredOrders = orders.filter(o => o.id !== id);
  setInStorage(STORAGE_KEYS.ORDERS, filteredOrders);
  return true;
};

export const completeOrder = (orderId: string) => {
  if (typeof window === 'undefined') return null;
  const orders = getOrders();
  const orderIndex = orders.findIndex(o => o.id === orderId);

  if (orderIndex !== -1) {
    const order = orders[orderIndex];
    orders[orderIndex] = {
      ...order,
      status: 'delivered' as const
    };
    setInStorage(STORAGE_KEYS.ORDERS, orders);

    // Update supermarket stats when order is completed
    updateSupermarketStats(order.supermarketId, order.quantity, 0);

    return orders[orderIndex];
  }
  return null;
};

export const updateSalePayment = (saleId: string, isPaid: boolean) => {
  if (typeof window === 'undefined') return null;
  const sales = getSales();
  const saleIndex = sales.findIndex(s => s.id === saleId);

  if (saleIndex !== -1) {
    sales[saleIndex] = {
      ...sales[saleIndex],
      isPaid,
      paymentDate: isPaid ? new Date().toISOString() : undefined
    };
    setInStorage(STORAGE_KEYS.SALES, sales);
    return sales[saleIndex];
  }
  return null;
};

export const addPayment = (saleId: string, payment: Omit<Payment, 'id'>) => {
  if (typeof window === 'undefined') return null;
  const sales = getSales();
  const saleIndex = sales.findIndex(s => s.id === saleId);

  if (saleIndex !== -1) {
    const newPayment = {
      ...payment,
      id: Date.now().toString()
    };

    const sale = sales[saleIndex];
    const newRemainingAmount = sale.remainingAmount - payment.amount;

    sales[saleIndex] = {
      ...sale,
      payments: [...sale.payments, newPayment],
      remainingAmount: newRemainingAmount,
      isPaid: newRemainingAmount <= 0,
      paymentDate: newRemainingAmount <= 0 ? new Date().toISOString() : undefined
    };

    setInStorage(STORAGE_KEYS.SALES, sales);
    return sales[saleIndex];
  }
  return null;
}; 