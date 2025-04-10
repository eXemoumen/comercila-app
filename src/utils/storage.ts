// Types
export interface Sale {
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
  note?: string;
  fragranceDistribution?: Record<string, number>;
}

export interface Supermarket {
  id: string;
  name: string;
  address: string;
  phoneNumbers: {
    name: string;
    number: string;
  }[];
  email?: string;
  totalSales: number;
  totalValue: number;
  location: {
    lat: number;
    lng: number;
    formattedAddress: string;
  };
}

export interface Stock {
  id: string;
  date: string;
  type: 'added' | 'removed' | 'adjusted';
  quantity: number;
  currentStock: number;
  reason: string;
  fragranceDistribution?: Record<string, number>;
}

export interface Order {
  id: string;
  date: string;
  supermarketId: string;
  supermarketName: string;
  quantity: number;
  status: "pending" | "delivered" | "cancelled";
  pricePerUnit: number;
}

export interface Payment {
  id: string;
  date: string;
  amount: number;
  note?: string;
}

// Storage Keys
const SALES_KEY = 'soap_sales';
const SUPERMARKETS_KEY = 'soap_supermarkets';
const STOCK_KEY = 'soap_stock';
const ORDERS_KEY = 'soap_orders';
const FRAGRANCES_KEY = 'soap_fragrances';
const FRAGRANCE_STOCK_KEY = 'soap_fragrance_stock';

// Default fragrances
const DEFAULT_FRAGRANCES = [
  { id: '1', name: 'Lavande', color: '#9F7AEA' },
  { id: '2', name: 'Rose', color: '#F687B3' },
  { id: '3', name: 'Citron', color: '#FBBF24' },
  { id: '4', name: 'Fraîcheur Marine', color: '#60A5FA' },
  { id: '5', name: 'Vanille', color: '#F59E0B' },
  { id: '6', name: 'Grenade', color: '#F97316' },
  { id: '7', name: 'Jasmin', color: '#10B981' },
  { id: '8', name: 'Amande', color: '#8B5CF6' },
];

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

export const deleteSale = (saleId: string): boolean => {
  if (typeof window === 'undefined') return false;
  const sales = getSales();
  const saleIndex = sales.findIndex(s => s.id === saleId);
  
  if (saleIndex === -1) return false;
  
  const sale = sales[saleIndex];
  
  // Remove the sale
  sales.splice(saleIndex, 1);
  localStorage.setItem(SALES_KEY, JSON.stringify(sales));
  
  // Update supermarket stats (subtract the sale)
  const supermarkets = getSupermarkets();
  const supermarketIndex = supermarkets.findIndex(s => s.id === sale.supermarketId);
  
  if (supermarketIndex !== -1) {
    supermarkets[supermarketIndex].totalSales -= sale.quantity;
    supermarkets[supermarketIndex].totalValue -= sale.totalValue;
    localStorage.setItem(SUPERMARKETS_KEY, JSON.stringify(supermarkets));
  }
  
  // Update stock by adding back the sold cartons
  if (sale.fragranceDistribution) {
    // Add the stock back using updateStock which will handle both the fragrance distribution
    // and the stock history record
    updateStock(
      sale.cartons,
      "added",
      `Annulation de vente - ${new Date(sale.date).toLocaleDateString()}`,
      sale.fragranceDistribution
    );
  } else {
    // If no fragrance distribution data, distribute evenly across fragrances
    const fragrances = getFragrances();
    const fragranceCount = fragrances.length;
    const baseAmount = Math.floor(sale.cartons / fragranceCount);
    const remainder = sale.cartons % fragranceCount;
    
    // Create even distribution
    const evenDistribution: Record<string, number> = {};
    fragrances.forEach((fragrance, index) => {
      evenDistribution[fragrance.id] = baseAmount + (index < remainder ? 1 : 0);
    });
    
    // Update stock with even distribution
    updateStock(
      sale.cartons,
      "added",
      `Annulation de vente - ${new Date(sale.date).toLocaleDateString()}`,
      evenDistribution
    );
  }
  
  return true;
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
    phoneNumbers: supermarket.phoneNumbers || [],
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

export const updateSupermarket = (id: string, updatedData: Partial<Omit<Supermarket, 'id' | 'totalSales' | 'totalValue'>>): Supermarket | null => {
  if (typeof window === 'undefined') return null;
  const supermarkets = getSupermarkets();
  const index = supermarkets.findIndex(s => s.id === id);
  
  if (index !== -1) {
    // Preserve existing data that's not being updated
    const updatedSupermarket = {
      ...supermarkets[index],
      ...updatedData,
      // Ensure location is properly updated
      location: updatedData.location || supermarkets[index].location
    };
    
    supermarkets[index] = updatedSupermarket;
    localStorage.setItem(SUPERMARKETS_KEY, JSON.stringify(supermarkets));
    return updatedSupermarket;
  }
  return null;
};

// Stock CRUD
export const getCurrentStock = (): number => {
  if (typeof window === 'undefined') return 0;
  
  // Calculate current stock as the sum of all fragrance stocks
  const fragranceStock = getFragranceStock();
  if (!fragranceStock.length) return 0;
  
  // Sum up the quantities of all fragrances
  return fragranceStock.reduce((total, item) => total + item.quantity, 0);
};

export const getStockHistory = (): Stock[] => {
  if (typeof window === 'undefined') return [];
  const history = localStorage.getItem(STOCK_KEY);
  return history ? JSON.parse(history) : [];
};

export const updateStock = (
  quantity: number, 
  type: Stock['type'], 
  reason: string, 
  fragranceDistribution?: Record<string, number>
) => {
  if (typeof window === 'undefined') return 0;
  
  // Update fragrance stock if distribution is provided
  if (fragranceDistribution) {
    Object.entries(fragranceDistribution).forEach(([fragranceId, qty]) => {
      // If we're removing stock (negative quantity), we need to subtract the fragrance amounts
      // If we're adding stock (positive quantity), we need to add the fragrance amounts
      const adjustedQty = type === 'adjusted' ? qty : (type === 'removed' ? -qty : qty);
      updateFragranceStock(fragranceId, adjustedQty);
    });
  }

  // Get the current stock (calculated from fragrance stocks)
  const newStock = getCurrentStock();

  // Add to history
  const stockHistory = getStockHistory();
  stockHistory.push({
    id: Date.now().toString(),
    date: new Date().toISOString(),
    type,
    quantity,
    currentStock: newStock,
    reason,
    fragranceDistribution
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

export const setSale = (sale: Sale): Sale => {
  if (typeof window === 'undefined') return sale;
  const sales = getSales();
  const index = sales.findIndex(s => s.id === sale.id);
  if (index !== -1) {
    sales[index] = sale;
    localStorage.setItem(SALES_KEY, JSON.stringify(sales));
  } else {
    sales.push(sale);
    localStorage.setItem(SALES_KEY, JSON.stringify(sales));
  }
  return sale;
};

// Fragrance Management
interface Fragrance {
  id: string;
  name: string;
  color: string;
}

interface FragranceStock {
  fragranceId: string;
  name: string;
  quantity: number;
  color: string;
}

export const getFragrances = (): Fragrance[] => {
  if (typeof window === 'undefined') return DEFAULT_FRAGRANCES;
  
  const fragrances = localStorage.getItem(FRAGRANCES_KEY);
  if (!fragrances) {
    localStorage.setItem(FRAGRANCES_KEY, JSON.stringify(DEFAULT_FRAGRANCES));
    return DEFAULT_FRAGRANCES;
  }
  
  return JSON.parse(fragrances);
};

export const getFragranceStock = (): FragranceStock[] => {
  if (typeof window === 'undefined') return [];
  
  const fragranceStock = localStorage.getItem(FRAGRANCE_STOCK_KEY);
  if (!fragranceStock) {
    // Initialize with empty stock for each fragrance
    const fragrances = getFragrances();
    const initialStock = fragrances.map((fragrance: Fragrance) => ({
      fragranceId: fragrance.id,
      name: fragrance.name,
      quantity: 0,
      color: fragrance.color
    }));
    
    localStorage.setItem(FRAGRANCE_STOCK_KEY, JSON.stringify(initialStock));
    return initialStock;
  }
  
  return JSON.parse(fragranceStock);
};

export const updateFragranceStock = (fragranceId: string, quantity: number) => {
  if (typeof window === 'undefined') return null;
  
  const fragranceStock = getFragranceStock();
  const index = fragranceStock.findIndex((item: FragranceStock) => item.fragranceId === fragranceId);
  
  if (index !== -1) {
    fragranceStock[index].quantity += quantity;
    localStorage.setItem(FRAGRANCE_STOCK_KEY, JSON.stringify(fragranceStock));
    return fragranceStock[index];
  }
  
  return null;
};

export const setFragranceStock = (fragranceId: string, newQuantity: number) => {
  if (typeof window === 'undefined') return null;
  
  const fragranceStock = getFragranceStock();
  const index = fragranceStock.findIndex((item: FragranceStock) => item.fragranceId === fragranceId);
  
  if (index !== -1) {
    fragranceStock[index].quantity = newQuantity;
    localStorage.setItem(FRAGRANCE_STOCK_KEY, JSON.stringify(fragranceStock));
    return fragranceStock[index];
  }
  
  return null;
}; 