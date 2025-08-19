// Types
export interface PhoneNumber {
  name: string;
  number: string;
}

export interface Fragrance {
  id: string;
  name: string;
  color: string;
}

export interface FragranceStock {
  fragranceId: string;
  name: string;
  quantity: number;
  color: string;
}

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

// Updated Supermarket interface to match Supabase schema
export interface Supermarket {
  id: string; // Maps to UUID
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  email?: string | null; // Added email
  phone_numbers?: PhoneNumber[] | null; // Updated to match JSONB, renamed for consistency
  created_at: string; // Added created_at (will be ISO string)
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
  type?: 'virement' | 'direct' | 'other'; // Payment type to track virement payments
}

// Storage Keys
const SUPERMARKETS_KEY = 'soap_supermarkets';

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

// Sales CRUD - Using Supabase
export const getSales = async (): Promise<Sale[]> => {
  const { supabase } = await import("@/lib/supabase");
  const { data, error } = await supabase
    .from("sales")
    .select(`
      *,
      payments (*)
    `)
    .order('date', { ascending: false });

  if (error) {
    console.error("Error fetching sales:", error);
    return [];
  }

  return data?.map(s => ({
    id: s.id,
    date: s.date,
    supermarketId: s.supermarket_id,
    quantity: s.quantity,
    cartons: s.cartons,
    pricePerUnit: s.price_per_unit,
    totalValue: s.total_value,
    isPaid: s.is_paid,
    paymentDate: s.payment_date,
    paymentNote: s.payment_note,
    expectedPaymentDate: s.expected_payment_date,
    payments: s.payments?.map((p: { id: string; date: string; amount: number; note: string; type?: string }) => ({
      id: p.id,
      date: p.date,
      amount: p.amount,
      note: p.note,
      type: p.type || 'other'
    })) || [],
    remainingAmount: s.remaining_amount,
    fromOrder: s.from_order,
    note: s.note,
    fragranceDistribution: s.fragrance_distribution
  })) || [];
};

export const addSale = async (saleData: Omit<Sale, "id">): Promise<Sale | null> => {
  const { supabase } = await import("@/lib/supabase");
  const newSale = {
    id: Date.now().toString(),
    supermarket_id: saleData.supermarketId,
    date: saleData.date,
    quantity: saleData.quantity,
    cartons: saleData.cartons,
    price_per_unit: saleData.pricePerUnit,
    total_value: saleData.totalValue,
    is_paid: saleData.isPaid,
    payment_date: saleData.paymentDate || null,
    payment_note: saleData.paymentNote || null,
    expected_payment_date: saleData.expectedPaymentDate || null,
    remaining_amount: saleData.remainingAmount,
    from_order: saleData.fromOrder || false,
    note: saleData.note || null,
    fragrance_distribution: saleData.fragranceDistribution || null
  };

  const { data, error } = await supabase
    .from("sales")
    .insert([newSale])
    .select()
    .single();

  if (error) {
    console.error("Error adding sale:", error);
    return null;
  }

  // Add payments if any
  if (saleData.payments && saleData.payments.length > 0) {
    const payments = saleData.payments.map(payment => ({
      id: payment.id,
      sale_id: newSale.id,
      date: payment.date,
      amount: payment.amount,
      note: payment.note || null,
      type: payment.type || 'other'
    }));

    await supabase.from("payments").insert(payments);
  }

  return {
    id: data.id,
    date: data.date,
    supermarketId: data.supermarket_id,
    quantity: data.quantity,
    cartons: data.cartons,
    pricePerUnit: data.price_per_unit,
    totalValue: data.total_value,
    isPaid: data.is_paid,
    paymentDate: data.payment_date,
    paymentNote: data.payment_note,
    expectedPaymentDate: data.expected_payment_date,
    payments: saleData.payments || [],
    remainingAmount: data.remaining_amount,
    fromOrder: data.from_order,
    note: data.note,
    fragranceDistribution: data.fragrance_distribution
  };
};

export const deleteSale = async (saleId: string): Promise<boolean> => {
  const { supabase } = await import("@/lib/supabase");

  // Get the sale data before deleting for stock adjustment
  const { data: saleData } = await supabase
    .from("sales")
    .select("*")
    .eq("id", saleId)
    .single();

  if (!saleData) return false;

  // Delete payments first
  await supabase.from("payments").delete().eq("sale_id", saleId);

  // Delete sale
  const { error } = await supabase.from("sales").delete().eq("id", saleId);

  if (error) {
    console.error("Error deleting sale:", error);
    return false;
  }

  // Update stock by adding back the sold cartons
  if (saleData.fragrance_distribution) {
    await updateStock(
      saleData.cartons,
      "added",
      `Annulation de vente - ${new Date(saleData.date).toLocaleDateString()}`,
      saleData.fragrance_distribution
    );
  } else {
    // If no fragrance distribution data, distribute evenly across fragrances
    const fragrances = await getFragrances();
    const fragranceCount = fragrances.length;
    const baseAmount = Math.floor(saleData.cartons / fragranceCount);
    const remainder = saleData.cartons % fragranceCount;

    // Create even distribution
    const evenDistribution: Record<string, number> = {};
    fragrances.forEach((fragrance, index) => {
      evenDistribution[fragrance.id] = baseAmount + (index < remainder ? 1 : 0);
    });

    await updateStock(
      saleData.cartons,
      "added",
      `Annulation de vente - ${new Date(saleData.date).toLocaleDateString()}`,
      evenDistribution
    );
  }

  return true;
};

// Supermarkets CRUD
// Function to fetch all supermarkets from Supabase
export const getSupermarkets = async (): Promise<Supermarket[]> => {
  const { supabase } = await import("@/lib/supabase");
  const { data, error } = await supabase.from("supermarkets").select("*");

  if (error) {
    console.error("Error fetching supermarkets:", error);
    return []; // Return empty array on error
  }

  // Map data to ensure consistency with the Supermarket interface
  return (
    data?.map((s) => ({
      id: s.id,
      name: s.name,
      address: s.address,
      latitude: s.latitude,
      longitude: s.longitude,
      email: s.email,
      phone_numbers: s.phone_numbers as PhoneNumber[] | null,
      created_at: s.created_at,
    })) || []
  );
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const updateSupermarketStats = async (id: string, _quantity: number, _totalValue: number) => {
  if (typeof window === 'undefined') return;
  const supermarkets = await getSupermarkets();
  const index = supermarkets.findIndex(s => s.id === id);
  if (index !== -1) {
    // Note: totalSales and totalValue are no longer part of the Supermarket interface
    // These stats are now calculated dynamically
    localStorage.setItem(SUPERMARKETS_KEY, JSON.stringify(supermarkets));
  }
};

// Function to add a new supermarket to Supabase
export const addSupermarket = async (
  supermarketData: Omit<Supermarket, "id" | "created_at">
): Promise<Supermarket | null> => {
  // Prepare data for Supabase (match column names)
  const { phone_numbers, ...restData } = supermarketData;
  const dataToInsert = {
    ...restData,
    phone_numbers: phone_numbers || null, // Ensure it's null if undefined/empty
  };

  const { supabase } = await import("@/lib/supabase");
  const { data, error } = await supabase
    .from("supermarkets")
    .insert([dataToInsert])
    .select()
    .single(); // Use single() if inserting one row and expect one back

  if (error) {
    console.error("Error adding supermarket:", error);
    return null;
  }

  // Map the returned data to the Supermarket interface
  return data
    ? {
      id: data.id,
      name: data.name,
      address: data.address,
      latitude: data.latitude,
      longitude: data.longitude,
      email: data.email,
      phone_numbers: data.phone_numbers as PhoneNumber[] | null,
      created_at: data.created_at,
    }
    : null;
};

// Function to update an existing supermarket in Supabase
export const updateSupermarket = async (
  id: string,
  updatedData: Partial<Omit<Supermarket, "id" | "created_at">>
): Promise<Supermarket | null> => {
  // Prepare data ensuring phone_numbers key exists if provided
  const dataToUpdate = { ...updatedData };
  if (updatedData.phone_numbers !== undefined) {
    dataToUpdate.phone_numbers = updatedData.phone_numbers || null;
  }

  const { supabase } = await import("@/lib/supabase");
  const { data, error } = await supabase
    .from("supermarkets")
    .update(dataToUpdate)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating supermarket:", error);
    return null;
  }

  // Map the returned data
  return data
    ? {
      id: data.id,
      name: data.name,
      address: data.address,
      latitude: data.latitude,
      longitude: data.longitude,
      email: data.email,
      phone_numbers: data.phone_numbers as PhoneNumber[] | null,
      created_at: data.created_at,
    }
    : null;
};

// Function to delete a supermarket from Supabase
export const deleteSupermarket = async (id: string): Promise<boolean> => {
  const { supabase } = await import("@/lib/supabase");
  const { error } = await supabase.from("supermarkets").delete().eq("id", id);

  if (error) {
    console.error("Error deleting supermarket:", error);
    return false;
  }

  return true;
};

// Stock CRUD
export const getCurrentStock = async (): Promise<number> => {
  // Calculate current stock as the sum of all fragrance stocks
  const fragranceStock = await getFragranceStock();
  if (!fragranceStock.length) return 0;

  // Sum up the quantities of all fragrances
  return fragranceStock.reduce((total, item) => total + item.quantity, 0);
};

export const getStockHistory = async (): Promise<Stock[]> => {
  const { supabase } = await import("@/lib/supabase");
  const { data, error } = await supabase
    .from("stock_history")
    .select("*")
    .order('date', { ascending: false });

  if (error) {
    console.error("Error fetching stock history:", error);
    return [];
  }

  return data?.map(s => ({
    id: s.id,
    date: s.date,
    type: s.type as 'added' | 'removed' | 'adjusted',
    quantity: s.quantity,
    currentStock: s.current_stock,
    reason: s.reason,
    fragranceDistribution: s.fragrance_distribution
  })) || [];
};

export const updateStock = async (
  quantity: number,
  type: Stock['type'],
  reason: string,
  fragranceDistribution?: Record<string, number>
): Promise<number> => {
  // Update fragrance stock if distribution is provided
  if (fragranceDistribution) {
    for (const [fragranceId, qty] of Object.entries(fragranceDistribution)) {
      // For 'adjusted' type, qty is already the difference to apply
      // For 'added' type, qty is the amount to add
      // For 'removed' type, qty should be subtracted (made negative)
      let adjustedQty: number;
      if (type === 'adjusted') {
        adjustedQty = qty; // qty is already the difference
      } else if (type === 'removed') {
        adjustedQty = -qty; // subtract the amount
      } else { // 'added'
        adjustedQty = qty; // add the amount
      }
      await updateFragranceStock(fragranceId, adjustedQty);
    }
  }

  // Get the current stock (calculated from fragrance stocks)
  const newStock = await getCurrentStock();

  // Add to history
  const { supabase } = await import("@/lib/supabase");
  const newStockEntry = {
    id: Date.now().toString(),
    date: new Date().toISOString(),
    quantity,
    type,
    reason,
    current_stock: newStock,
    fragrance_distribution: fragranceDistribution || null
  };

  const { error } = await supabase
    .from("stock_history")
    .insert([newStockEntry]);

  if (error) {
    console.error("Error adding stock entry:", error);
  }

  return newStock;
};

// Orders CRUD - Using Supabase
export const getOrders = async (): Promise<Order[]> => {
  const { supabase } = await import("@/lib/supabase");
  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      supermarkets (name)
    `)
    .order('date', { ascending: false });

  if (error) {
    console.error("Error fetching orders:", error);
    return [];
  }

  return data?.map(o => ({
    id: o.id,
    date: o.date,
    supermarketId: o.supermarket_id,
    supermarketName: (o.supermarkets as { name: string })?.name || 'Unknown',
    quantity: o.quantity,
    status: o.status as "pending" | "delivered" | "cancelled",
    pricePerUnit: o.price_per_unit
  })) || [];
};

export const addOrder = async (order: Omit<Order, 'id' | 'status'>): Promise<Order | null> => {
  const { supabase } = await import("@/lib/supabase");
  const newOrder = {
    id: Date.now().toString(),
    supermarket_id: order.supermarketId,
    date: order.date,
    quantity: order.quantity,
    status: 'pending',
    price_per_unit: order.pricePerUnit
  };

  const { data, error } = await supabase
    .from("orders")
    .insert([newOrder])
    .select(`
      *,
      supermarkets (name)
    `)
    .single();

  if (error) {
    console.error("Error adding order:", error);
    return null;
  }

  return {
    id: data.id,
    date: data.date,
    supermarketId: data.supermarket_id,
    supermarketName: (data.supermarkets as { name: string })?.name || 'Unknown',
    quantity: data.quantity,
    status: data.status,
    pricePerUnit: data.price_per_unit
  };
};

export const deleteOrder = async (id: string): Promise<boolean> => {
  const { supabase } = await import("@/lib/supabase");
  const { error } = await supabase.from("orders").delete().eq("id", id);

  if (error) {
    console.error("Error deleting order:", error);
    return false;
  }

  return true;
};

// Add function to complete an order
export const completeOrder = async (orderId: string): Promise<Order | null> => {
  const { supabase } = await import("@/lib/supabase");
  const { data, error } = await supabase
    .from("orders")
    .update({ status: 'delivered' })
    .eq("id", orderId)
    .select(`
      *,
      supermarkets (name)
    `)
    .single();

  if (error) {
    console.error("Error completing order:", error);
    return null;
  }

  return {
    id: data.id,
    date: data.date,
    supermarketId: data.supermarket_id,
    supermarketName: (data.supermarkets as { name: string })?.name || 'Unknown',
    quantity: data.quantity,
    status: data.status,
    pricePerUnit: data.price_per_unit
  };
};

// Add function to update payment status
export const updateSalePayment = async (saleId: string, isPaid: boolean, paymentDate?: string): Promise<Sale | null> => {
  const { supabase } = await import("@/lib/supabase");
  
  // First get the current sale to calculate remaining amount
  const { data: currentSale, error: fetchError } = await supabase
    .from("sales")
    .select("total_value, remaining_amount")
    .eq("id", saleId)
    .single();

  if (fetchError) {
    console.error("Error fetching current sale:", fetchError);
    return null;
  }

  // Calculate new remaining amount
  const newRemainingAmount = isPaid ? 0 : currentSale.total_value;

  const { data, error } = await supabase
    .from("sales")
    .update({
      is_paid: isPaid,
      payment_date: isPaid ? (paymentDate || new Date().toISOString()) : null, // Use provided payment date or current date
      remaining_amount: newRemainingAmount
    })
    .eq("id", saleId)
    .select(`
      *,
      payments (*)
    `)
    .single();

  if (error) {
    console.error("Error updating sale payment:", error);
    return null;
  }

  return {
    id: data.id,
    date: data.date,
    supermarketId: data.supermarket_id,
    quantity: data.quantity,
    cartons: data.cartons,
    pricePerUnit: data.price_per_unit,
    totalValue: data.total_value,
    isPaid: data.is_paid,
    paymentDate: data.payment_date,
    paymentNote: data.payment_note,
    expectedPaymentDate: data.expected_payment_date,
    payments: data.payments?.map((p: { id: string; date: string; amount: number; note: string }) => ({
      id: p.id,
      date: p.date,
      amount: p.amount,
      note: p.note
    })) || [],
    remainingAmount: data.remaining_amount,
    fromOrder: data.from_order,
    note: data.note,
    fragranceDistribution: data.fragrance_distribution
  };
};

export const addPayment = async (saleId: string, payment: Omit<Payment, 'id'>): Promise<Sale | null> => {
  const { supabase } = await import("@/lib/supabase");
  const newPayment = {
    id: Date.now().toString(),
    sale_id: saleId,
    date: payment.date,
    amount: payment.amount,
    note: payment.note || null,
    type: payment.type || 'other'
  };

  const { error: paymentError } = await supabase
    .from("payments")
    .insert([newPayment]);

  if (paymentError) {
    console.error("Error adding payment:", paymentError);
    return null;
  }

  // Update sale remaining amount and payment status
  const { data: sale } = await supabase
    .from("sales")
    .select("remaining_amount")
    .eq("id", saleId)
    .single();

  if (sale) {
    const newRemainingAmount = sale.remaining_amount - payment.amount;
    const isPaid = newRemainingAmount <= 0;

    const { data, error } = await supabase
      .from("sales")
      .update({
        remaining_amount: newRemainingAmount,
        is_paid: isPaid,
        payment_date: isPaid ? payment.date : null
      })
      .eq("id", saleId)
      .select(`
        *,
        payments (*)
      `)
      .single();

    if (error) {
      console.error("Error updating sale after payment:", error);
      return null;
    }

    return {
      id: data.id,
      date: data.date,
      supermarketId: data.supermarket_id,
      quantity: data.quantity,
      cartons: data.cartons,
      pricePerUnit: data.price_per_unit,
      totalValue: data.total_value,
      isPaid: data.is_paid,
      paymentDate: data.payment_date,
      paymentNote: data.payment_note,
      expectedPaymentDate: data.expected_payment_date,
      payments: data.payments?.map((p: { id: string; date: string; amount: number; note: string; type?: string }) => ({
        id: p.id,
        date: p.date,
        amount: p.amount,
        note: p.note,
        type: p.type || 'other'
      })) || [],
      remainingAmount: data.remaining_amount,
      fromOrder: data.from_order,
      note: data.note,
      fragranceDistribution: data.fragrance_distribution
    };
  }

  return null;
};

export const setSale = async (sale: Sale): Promise<Sale | null> => {
  const { supabase } = await import("@/lib/supabase");

  // Check if sale exists
  const { data: existing } = await supabase
    .from("sales")
    .select("id")
    .eq("id", sale.id)
    .single();

  const saleData = {
    supermarket_id: sale.supermarketId,
    date: sale.date,
    quantity: sale.quantity,
    cartons: sale.cartons,
    price_per_unit: sale.pricePerUnit,
    total_value: sale.totalValue,
    is_paid: sale.isPaid,
    payment_date: sale.paymentDate || null,
    payment_note: sale.paymentNote || null,
    expected_payment_date: sale.expectedPaymentDate || null,
    remaining_amount: sale.remainingAmount,
    from_order: sale.fromOrder || false,
    note: sale.note || null,
    fragrance_distribution: sale.fragranceDistribution || null
  };

  if (existing) {
    // Update existing sale
    const { data, error } = await supabase
      .from("sales")
      .update(saleData)
      .eq("id", sale.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating sale:", error);
      return null;
    }

    return {
      id: data.id,
      date: data.date,
      supermarketId: data.supermarket_id,
      quantity: data.quantity,
      cartons: data.cartons,
      pricePerUnit: data.price_per_unit,
      totalValue: data.total_value,
      isPaid: data.is_paid,
      paymentDate: data.payment_date,
      paymentNote: data.payment_note,
      expectedPaymentDate: data.expected_payment_date,
      payments: sale.payments || [],
      remainingAmount: data.remaining_amount,
      fromOrder: data.from_order,
      note: data.note,
      fragranceDistribution: data.fragrance_distribution
    };
  } else {
    // Insert new sale
    return await addSale(sale);
  }
};

// Fragrance Management

export const getFragrances = async (): Promise<Fragrance[]> => {
  // For now, return default fragrances since they're static
  // In the future, you could store these in Supabase too
  return DEFAULT_FRAGRANCES;
};

export const getFragranceStock = async (): Promise<FragranceStock[]> => {
  const { supabase } = await import("@/lib/supabase");
  console.log("Fetching fragrance stock from database...");
  const { data, error } = await supabase
    .from("fragrance_stock")
    .select("*")
    .order('name');

  console.log("Raw fragrance stock data from DB:", data);
  if (error) {
    console.error("Error fetching fragrance stock:", error);
  }

  // Initialize with default fragrances if table is empty or has error
  if (error || !data || data.length === 0) {
    console.log("Initializing fragrance stock with default fragrances");
    const fragrances = await getFragrances();
    console.log("Default fragrances:", fragrances);

    const initialStock = fragrances.map((fragrance: Fragrance) => ({
      fragranceId: fragrance.id,
      name: fragrance.name,
      quantity: 0,
      color: fragrance.color
    }));

    // Insert initial stock into Supabase (only if no error occurred)
    if (!error) {
      const initialData = fragrances.map(fragrance => ({
        fragrance_id: fragrance.id,
        name: fragrance.name,
        quantity: 0,
        color: fragrance.color
      }));

      console.log("Inserting initial fragrance data:", initialData);
      const { data: insertedData, error: insertError } = await supabase
        .from("fragrance_stock")
        .insert(initialData)
        .select();

      if (insertError) {
        console.error("Error inserting initial fragrance stock:", insertError);
      } else {
        console.log("Successfully inserted fragrance stock:", insertedData);
      }
    }

    return initialStock;
  }

  return data.map(f => ({
    fragranceId: f.fragrance_id,
    name: f.name,
    quantity: f.quantity,
    color: f.color
  }));
};

export const updateFragranceStock = async (fragranceId: string, quantity: number): Promise<FragranceStock | null> => {
  const { supabase } = await import("@/lib/supabase");

  // First try to update existing
  const { data: existing } = await supabase
    .from("fragrance_stock")
    .select("*")
    .eq("fragrance_id", fragranceId)
    .single();

  if (existing) {
    const newQuantity = existing.quantity + quantity;
    console.log(`Updating fragrance ${fragranceId}: ${existing.quantity} + ${quantity} = ${newQuantity}`);
    const { data, error } = await supabase
      .from("fragrance_stock")
      .update({
        quantity: newQuantity,
        updated_at: new Date().toISOString()
      })
      .eq("fragrance_id", fragranceId)
      .select()
      .single();

    if (error) {
      console.error("Error updating fragrance stock:", error);
      return null;
    }

    return {
      fragranceId: data.fragrance_id,
      name: data.name,
      quantity: data.quantity,
      color: data.color
    };
  }

  return null;
};

export const setFragranceStock = async (fragranceId: string, newQuantity: number): Promise<FragranceStock | null> => {
  const { supabase } = await import("@/lib/supabase");
  const { data, error } = await supabase
    .from("fragrance_stock")
    .update({
      quantity: newQuantity,
      updated_at: new Date().toISOString()
    })
    .eq("fragrance_id", fragranceId)
    .select()
    .single();

  if (error) {
    console.error("Error setting fragrance stock:", error);
    return null;
  }

  return {
    fragranceId: data.fragrance_id,
    name: data.name,
    quantity: data.quantity,
    color: data.color
  };
};

// Manual function to force initialize fragrance stock
export const initializeFragranceStock = async (): Promise<FragranceStock[]> => {
  const { supabase } = await import("@/lib/supabase");

  // First, clear any existing data
  await supabase.from("fragrance_stock").delete().neq('fragrance_id', '');

  // Get default fragrances
  const fragrances = await getFragrances();
  console.log("Initializing with fragrances:", fragrances);

  // Insert fresh data
  const initialData = fragrances.map(fragrance => ({
    fragrance_id: fragrance.id,
    name: fragrance.name,
    quantity: 0,
    color: fragrance.color
  }));

  const { data, error } = await supabase
    .from("fragrance_stock")
    .insert(initialData)
    .select();

  if (error) {
    console.error("Error initializing fragrance stock:", error);
    return [];
  }

  console.log("Successfully initialized fragrance stock:", data);

  return data.map(f => ({
    fragranceId: f.fragrance_id,
    name: f.name,
    quantity: f.quantity,
    color: f.color
  }));
}; 