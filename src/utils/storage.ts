// Types
interface Sale {
  id: string;
  date: string;
  supermarketId: string;
  quantity: number;
  cartons: number;
  pricePerUnit: number;
  totalValue: number;
  isPaid: boolean;
  paymentDate?: string;
  paymentNote?: string;
  expectedPaymentDate?: string;
  payments: Payment[];
  remainingAmount: number;
  fromOrder?: boolean;
}

interface Supermarket {
  id: string;
  name: string;
  address: string;
  phone: string;
  email?: string;
  totalSales: number;
  totalValue: number;
  location: {
    lat: number;
    lng: number;
    formattedAddress: string;
  };
}

interface Stock {
  id: string;
  date: string;
  type: 'added' | 'removed' | 'adjusted';
  quantity: number;
  currentStock: number;
  reason: string;
}

interface Order {
  id: string;
  date: string;
  supermarketId: string;
  supermarketName: string;
  quantity: number;
  status: "pending" | "delivered" | "cancelled";
  pricePerUnit: number;
}

interface Payment {
  id: string;
  date: string;
  amount: number;
  note?: string;
}

// Storage Keys
const SALES_KEY = 'soap_sales';
const SUPERMARKETS_KEY = 'soap_supermarkets';
const STOCK_KEY = 'soap_stock';
const CURRENT_STOCK_KEY = 'soap_current_stock';
const ORDERS_KEY = 'soap_orders';

// Sales CRUD
export const getSales = (): Sale[] => {
  if (typeof window === 'undefined') return [];
  const sales = localStorage.getItem(SALES_KEY);
  return sales ? JSON.parse(sales) : [];
};

export const addSale = (saleData: Omit<Sale, 'id'>) => {
  if (typeof window === 'undefined') return null;
  const sales = getSales();
  const newSale = {
    ...saleData,
    id: Date.now().toString(),
  };
  sales.push(newSale);
  localStorage.setItem(SALES_KEY, JSON.stringify(sales));

  // Update supermarket stats
  updateSupermarketStats(saleData.supermarketId, saleData.quantity, saleData.totalValue);

  return newSale;
};

// Supermarkets CRUD
export const getSupermarkets = (): Supermarket[] => {
  if (typeof window === 'undefined') return [];
  const supermarkets = localStorage.getItem(SUPERMARKETS_KEY);
  return supermarkets ? JSON.parse(supermarkets) : [];
};

export const updateSupermarketStats = (id: string, quantity: number, totalValue: number) => {
  if (typeof window === 'undefined') return;
  const supermarkets = getSupermarkets();
  const index = supermarkets.findIndex(s => s.id === id);
  if (index !== -1) {
    supermarkets[index].totalSales += quantity;
    supermarkets[index].totalValue += totalValue;
    localStorage.setItem(SUPERMARKETS_KEY, JSON.stringify(supermarkets));
  }
};

export const addSupermarket = (supermarket: Omit<Supermarket, 'id' | 'totalSales' | 'totalValue'>) => {
  if (typeof window === 'undefined') return null;
  const supermarkets = getSupermarkets();
  const newSupermarket = {
    ...supermarket,
    id: Date.now().toString(),
    totalSales: 0,
    totalValue: 0,
    location: supermarket.location || {
      lat: 36.7538,
      lng: 3.0588,
      formattedAddress: supermarket.address
    }
  };
  supermarkets.push(newSupermarket);
  localStorage.setItem(SUPERMARKETS_KEY, JSON.stringify(supermarkets));
  return newSupermarket;
};

// Stock CRUD
export const getCurrentStock = (): number => {
  if (typeof window === 'undefined') return 0;
  const stock = localStorage.getItem(CURRENT_STOCK_KEY);
  return stock ? parseInt(stock) : 0;
};

export const getStockHistory = (): Stock[] => {
  if (typeof window === 'undefined') return [];
  const history = localStorage.getItem(STOCK_KEY);
  return history ? JSON.parse(history) : [];
};

export const updateStock = (quantity: number, type: Stock['type'], reason: string) => {
  if (typeof window === 'undefined') return 0;
  const currentStock = getCurrentStock();
  const newStock = currentStock + quantity;

  // Update current stock
  localStorage.setItem(CURRENT_STOCK_KEY, newStock.toString());

  // Add to history
  const stockHistory = getStockHistory();
  stockHistory.push({
    id: Date.now().toString(),
    date: new Date().toISOString(),
    type,
    quantity,
    currentStock: newStock,
    reason
  });
  localStorage.setItem(STOCK_KEY, JSON.stringify(stockHistory));

  return newStock;
};

// Orders CRUD
export const getOrders = (): Order[] => {
  if (typeof window === 'undefined') return [];
  const orders = localStorage.getItem(ORDERS_KEY);
  return orders ? JSON.parse(orders) : [];
};

export const addOrder = (order: Omit<Order, 'id' | 'status'>) => {
  if (typeof window === 'undefined') return null;
  const orders = getOrders();
  const newOrder = {
    ...order,
    id: Date.now().toString(),
    status: 'pending' as const
  };
  orders.push(newOrder);
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  return newOrder;
};

export const deleteOrder = (id: string) => {
  if (typeof window === 'undefined') return;
  const orders = getOrders();
  const filteredOrders = orders.filter(order => order.id !== id);
  localStorage.setItem(ORDERS_KEY, JSON.stringify(filteredOrders));
};

// Add function to complete an order
export const completeOrder = (orderId: string) => {
  if (typeof window === 'undefined') return null;
  const orders = getOrders();
  const orderIndex = orders.findIndex(o => o.id === orderId);

  if (orderIndex !== -1) {
    const order = orders[orderIndex];
    orders[orderIndex] = {
      ...order,
      status: 'delivered'
    };
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));

    // Update supermarket stats when order is completed
    updateSupermarketStats(order.supermarketId, order.quantity, order.quantity * order.pricePerUnit);

    return orders[orderIndex];
  }
  return null;
};

// Add function to update payment status
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
    localStorage.setItem(SALES_KEY, JSON.stringify(sales));
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

    localStorage.setItem(SALES_KEY, JSON.stringify(sales));
    return sales[saleIndex];
  }
  return null;
}; 