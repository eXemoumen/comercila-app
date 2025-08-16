import { supabase } from "@/lib/supabase";
import type {
    Sale,
    Order,
    Stock,
    Payment,
    FragranceStock
} from "./storage";

// Supabase-based storage functions

// Sales CRUD
export const getSupabaseSales = async (): Promise<Sale[]> => {
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
        payments: s.payments?.map((p: { id: string; date: string; amount: number; note: string }) => ({
            id: p.id,
            date: p.date,
            amount: p.amount,
            note: p.note
        })) || [],
        remainingAmount: s.remaining_amount,
        fromOrder: s.from_order,
        note: s.note,
        fragranceDistribution: s.fragrance_distribution
    })) || [];
};

export const addSupabaseSale = async (saleData: Omit<Sale, "id">): Promise<Sale | null> => {
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
            note: payment.note || null
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

export const deleteSupabaseSale = async (saleId: string): Promise<boolean> => {
    // Delete payments first
    await supabase.from("payments").delete().eq("sale_id", saleId);

    // Delete sale
    const { error } = await supabase.from("sales").delete().eq("id", saleId);

    if (error) {
        console.error("Error deleting sale:", error);
        return false;
    }

    return true;
};

export const updateSupabaseSalePayment = async (saleId: string, isPaid: boolean): Promise<Sale | null> => {
    const { data, error } = await supabase
        .from("sales")
        .update({
            is_paid: isPaid,
            payment_date: isPaid ? new Date().toISOString() : null
        })
        .eq("id", saleId)
        .select()
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
        payments: [], // Will need to fetch separately if needed
        remainingAmount: data.remaining_amount,
        fromOrder: data.from_order,
        note: data.note,
        fragranceDistribution: data.fragrance_distribution
    };
};

// Orders CRUD
export const getSupabaseOrders = async (): Promise<Order[]> => {
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

export const addSupabaseOrder = async (order: Omit<Order, 'id' | 'status'>): Promise<Order | null> => {
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

export const deleteSupabaseOrder = async (id: string): Promise<boolean> => {
    const { error } = await supabase.from("orders").delete().eq("id", id);

    if (error) {
        console.error("Error deleting order:", error);
        return false;
    }

    return true;
};

export const completeSupabaseOrder = async (orderId: string): Promise<Order | null> => {
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

// Stock CRUD
export const getSupabaseStockHistory = async (): Promise<Stock[]> => {
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

export const addSupabaseStockEntry = async (
    quantity: number,
    type: Stock['type'],
    reason: string,
    currentStock: number,
    fragranceDistribution?: Record<string, number>
): Promise<Stock | null> => {
    const newStock = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        quantity,
        type,
        reason,
        current_stock: currentStock,
        fragrance_distribution: fragranceDistribution || null
    };

    const { data, error } = await supabase
        .from("stock_history")
        .insert([newStock])
        .select()
        .single();

    if (error) {
        console.error("Error adding stock entry:", error);
        return null;
    }

    return {
        id: data.id,
        date: data.date,
        type: data.type,
        quantity: data.quantity,
        currentStock: data.current_stock,
        reason: data.reason,
        fragranceDistribution: data.fragrance_distribution
    };
};

// Fragrance Stock CRUD
export const getSupabaseFragranceStock = async (): Promise<FragranceStock[]> => {
    const { data, error } = await supabase
        .from("fragrance_stock")
        .select("*")
        .order('name');

    if (error) {
        console.error("Error fetching fragrance stock:", error);
        return [];
    }

    return data?.map(f => ({
        fragranceId: f.fragrance_id,
        name: f.name,
        quantity: f.quantity,
        color: f.color
    })) || [];
};

export const getSupabaseCurrentStock = async (): Promise<{ current_stock: number, fragrance_stock: number }> => {
    const { data, error } = await supabase
        .from('stock_history')
        .select('current_stock')
        .order('date', { ascending: false })
        .limit(1)
        .single();

    if (error) {
        console.error('Error fetching current stock:', error);
        return { current_stock: 0, fragrance_stock: 0 };
    }

    if (!data) {
        return { current_stock: 0, fragrance_stock: 0 };
    }

    // Get actual fragrance stock from fragrance_stock table
    const { data: fragranceData, error: fragranceError } = await supabase
        .from('fragrance_stock')
        .select('quantity');

    if (fragranceError) {
        console.error('Error fetching fragrance stock:', fragranceError);
        return { current_stock: data.current_stock, fragrance_stock: 0 };
    }

    const fragranceStock = fragranceData?.reduce((acc, item) => acc + item.quantity, 0) || 0;

    return { current_stock: data.current_stock, fragrance_stock: fragranceStock };
};


export const updateSupabaseFragranceStock = async (fragranceId: string, quantity: number): Promise<FragranceStock | null> => {
    // First try to update existing
    const { data: existing } = await supabase
        .from("fragrance_stock")
        .select("*")
        .eq("fragrance_id", fragranceId)
        .single();

    if (existing) {
        const newQuantity = existing.quantity + quantity;
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
    } else {
        // If record doesn't exist, create it
        // Get fragrance details from DEFAULT_FRAGRANCES
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
        
        const fragrance = DEFAULT_FRAGRANCES.find(f => f.id === fragranceId);
        if (!fragrance) {
            console.error("Fragrance not found:", fragranceId);
            return null;
        }

        const { data, error } = await supabase
            .from("fragrance_stock")
            .insert([{
                fragrance_id: fragranceId,
                name: fragrance.name,
                quantity: quantity,
                color: fragrance.color
            }])
            .select()
            .single();

        if (error) {
            console.error("Error creating fragrance stock:", error);
            return null;
        }

        return {
            fragranceId: data.fragrance_id,
            name: data.name,
            quantity: data.quantity,
            color: data.color
        };
    }
};

export const setSupabaseFragranceStock = async (fragranceId: string, newQuantity: number): Promise<FragranceStock | null> => {
    // First check if record exists
    const { data: existing } = await supabase
        .from("fragrance_stock")
        .select("*")
        .eq("fragrance_id", fragranceId)
        .single();

    if (existing) {
        // Update existing record
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
    } else {
        // Create new record
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
        
        const fragrance = DEFAULT_FRAGRANCES.find(f => f.id === fragranceId);
        if (!fragrance) {
            console.error("Fragrance not found:", fragranceId);
            return null;
        }

        const { data, error } = await supabase
            .from("fragrance_stock")
            .insert([{
                fragrance_id: fragranceId,
                name: fragrance.name,
                quantity: newQuantity,
                color: fragrance.color
            }])
            .select()
            .single();

        if (error) {
            console.error("Error creating fragrance stock:", error);
            return null;
        }

        return {
            fragranceId: data.fragrance_id,
            name: data.name,
            quantity: data.quantity,
            color: data.color
        };
    }
};

// Payments CRUD
export const addSupabasePayment = async (saleId: string, payment: Omit<Payment, 'id'>): Promise<Sale | null> => {
    const newPayment = {
        id: Date.now().toString(),
        sale_id: saleId,
        date: payment.date,
        amount: payment.amount,
        note: payment.note || null
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
                payment_date: isPaid ? new Date().toISOString() : null
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
    }

    return null;
};