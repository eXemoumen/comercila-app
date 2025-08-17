import { supabase } from "@/lib/supabase";
import type {
    Sale,
    Order,
    Stock,
    FragranceStock
} from "./storage";

// Migration status tracking
const MIGRATION_KEYS = {
    SUPERMARKETS: "supermarket_migration_done",
    SALES: "sales_migration_done",
    ORDERS: "orders_migration_done",
    STOCK: "stock_migration_done",
    FRAGRANCE_STOCK: "fragrance_stock_migration_done",
    COMPLETE: "full_migration_complete"
};

// localStorage keys
const STORAGE_KEYS = {
    SUPERMARKETS: "soap_supermarkets",
    SALES: "soap_sales",
    ORDERS: "soap_orders",
    STOCK: "soap_stock",
    FRAGRANCE_STOCK: "soap_fragrance_stock"
};

export interface MigrationResult {
    success: boolean;
    migrated: number;
    errors: number;
    message: string;
}

interface OldSupermarket {
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

// Check if migration is needed
export const isMigrationNeeded = (): boolean => {
    if (typeof window === 'undefined') return false;

    const isComplete = localStorage.getItem(MIGRATION_KEYS.COMPLETE);
    if (isComplete) return false;

    // Check if any localStorage data exists
    const hasData = Object.values(STORAGE_KEYS).some(key => {
        const data = localStorage.getItem(key);
        return data && JSON.parse(data).length > 0;
    });

    return hasData;
};

// Migrate supermarkets from localStorage to Supabase
export const migrateSupermarkets = async (): Promise<MigrationResult> => {
    if (typeof window === 'undefined') {
        return { success: false, migrated: 0, errors: 1, message: "Cannot run on server" };
    }

    if (localStorage.getItem(MIGRATION_KEYS.SUPERMARKETS)) {
        return { success: true, migrated: 0, errors: 0, message: "Supermarkets already migrated" };
    }

    let migrated = 0;
    let errors = 0;

    try {
        const oldData = localStorage.getItem(STORAGE_KEYS.SUPERMARKETS);
        const oldSupermarkets: OldSupermarket[] = oldData ? JSON.parse(oldData) : [];

        if (oldSupermarkets.length === 0) {
            localStorage.setItem(MIGRATION_KEYS.SUPERMARKETS, "true");
            return { success: true, migrated: 0, errors: 0, message: "No supermarkets to migrate" };
        }

        // Get existing Supabase supermarkets to avoid duplicates
        const { data: existing } = await supabase.from("supermarkets").select("name, address");
        const existingKeys = new Set(existing?.map(s => `${s.name}|${s.address}`) || []);

        for (const old of oldSupermarkets) {
            const key = `${old.name}|${old.address}`;
            if (existingKeys.has(key)) {
                console.log(`Skipping duplicate supermarket: ${old.name}`);
                continue;
            }

            const newSupermarket = {
                name: old.name,
                address: old.address,
                latitude: old.location.lat,
                longitude: old.location.lng,
                email: old.email || null,
                phone_numbers: old.phoneNumbers?.length > 0 ? old.phoneNumbers : null
            };

            const { error } = await supabase
                .from("supermarkets")
                .insert([newSupermarket]);

            if (error) {
                console.error(`Failed to migrate supermarket ${old.name}:`, error);
                errors++;
            } else {
                migrated++;
            }
        }

        localStorage.setItem(MIGRATION_KEYS.SUPERMARKETS, "true");
        return {
            success: true,
            migrated,
            errors,
            message: `Migrated ${migrated} supermarkets${errors > 0 ? ` with ${errors} errors` : ''}`
        };

    } catch (error) {
        console.error("Supermarket migration error:", error);
        return { success: false, migrated, errors: errors + 1, message: "Migration failed" };
    }
};

// Migrate sales from localStorage to Supabase
export const migrateSales = async (): Promise<MigrationResult> => {
    if (typeof window === 'undefined') {
        return { success: false, migrated: 0, errors: 1, message: "Cannot run on server" };
    }

    if (localStorage.getItem(MIGRATION_KEYS.SALES)) {
        return { success: true, migrated: 0, errors: 0, message: "Sales already migrated" };
    }

    let migrated = 0;
    let errors = 0;

    try {
        const oldData = localStorage.getItem(STORAGE_KEYS.SALES);
        const oldSales: Sale[] = oldData ? JSON.parse(oldData) : [];

        if (oldSales.length === 0) {
            localStorage.setItem(MIGRATION_KEYS.SALES, "true");
            return { success: true, migrated: 0, errors: 0, message: "No sales to migrate" };
        }

        // Get supermarket mapping (old ID to new UUID)
        const { data: supabaseSupers } = await supabase.from("supermarkets").select("*");
        const oldSupers: OldSupermarket[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.SUPERMARKETS) || "[]");

        const supermarketMapping = new Map<string, string>();
        oldSupers.forEach(oldSuper => {
            const match = supabaseSupers?.find(s => s.name === oldSuper.name && s.address === oldSuper.address);
            if (match) {
                supermarketMapping.set(oldSuper.id, match.id);
            }
        });

        for (const sale of oldSales) {
            const supabaseSuperId = supermarketMapping.get(sale.supermarketId);
            if (!supabaseSuperId) {
                console.warn(`No Supabase supermarket found for sale ${sale.id}`);
                errors++;
                continue;
            }

            const newSale = {
                id: sale.id,
                supermarket_id: supabaseSuperId,
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

            const { error } = await supabase.from("sales").insert([newSale]);

            if (error) {
                console.error(`Failed to migrate sale ${sale.id}:`, error);
                errors++;
            } else {
                // Migrate payments for this sale
                if (sale.payments && sale.payments.length > 0) {
                    const payments = sale.payments.map(payment => ({
                        id: payment.id,
                        sale_id: sale.id,
                        date: payment.date,
                        amount: payment.amount,
                        note: payment.note || null
                    }));

                    const { error: paymentError } = await supabase.from("payments").insert(payments);
                    if (paymentError) {
                        console.error(`Failed to migrate payments for sale ${sale.id}:`, paymentError);
                    }
                }
                migrated++;
            }
        }

        localStorage.setItem(MIGRATION_KEYS.SALES, "true");
        return {
            success: true,
            migrated,
            errors,
            message: `Migrated ${migrated} sales${errors > 0 ? ` with ${errors} errors` : ''}`
        };

    } catch (error) {
        console.error("Sales migration error:", error);
        return { success: false, migrated, errors: errors + 1, message: "Sales migration failed" };
    }
};

// Migrate orders from localStorage to Supabase  
export const migrateOrders = async (): Promise<MigrationResult> => {
    if (typeof window === 'undefined') {
        return { success: false, migrated: 0, errors: 1, message: "Cannot run on server" };
    }

    if (localStorage.getItem(MIGRATION_KEYS.ORDERS)) {
        return { success: true, migrated: 0, errors: 0, message: "Orders already migrated" };
    }

    let migrated = 0;
    let errors = 0;

    try {
        const oldData = localStorage.getItem(STORAGE_KEYS.ORDERS);
        const oldOrders: Order[] = oldData ? JSON.parse(oldData) : [];

        if (oldOrders.length === 0) {
            localStorage.setItem(MIGRATION_KEYS.ORDERS, "true");
            return { success: true, migrated: 0, errors: 0, message: "No orders to migrate" };
        }

        // Get supermarket mapping
        const { data: supabaseSupers } = await supabase.from("supermarkets").select("*");
        const oldSupers: OldSupermarket[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.SUPERMARKETS) || "[]");

        const supermarketMapping = new Map<string, string>();
        oldSupers.forEach(oldSuper => {
            const match = supabaseSupers?.find(s => s.name === oldSuper.name && s.address === oldSuper.address);
            if (match) {
                supermarketMapping.set(oldSuper.id, match.id);
            }
        });

        for (const order of oldOrders) {
            const supabaseSuperId = supermarketMapping.get(order.supermarketId);
            if (!supabaseSuperId) {
                console.warn(`No Supabase supermarket found for order ${order.id}`);
                errors++;
                continue;
            }

            const newOrder = {
                id: order.id,
                supermarket_id: supabaseSuperId,
                date: order.date,
                quantity: order.quantity,
                status: order.status,
                price_per_unit: order.pricePerUnit
            };

            const { error } = await supabase.from("orders").insert([newOrder]);

            if (error) {
                console.error(`Failed to migrate order ${order.id}:`, error);
                errors++;
            } else {
                migrated++;
            }
        }

        localStorage.setItem(MIGRATION_KEYS.ORDERS, "true");
        return {
            success: true,
            migrated,
            errors,
            message: `Migrated ${migrated} orders${errors > 0 ? ` with ${errors} errors` : ''}`
        };

    } catch (error) {
        console.error("Orders migration error:", error);
        return { success: false, migrated, errors: errors + 1, message: "Orders migration failed" };
    }
};

// Migrate stock history from localStorage to Supabase
export const migrateStock = async (): Promise<MigrationResult> => {
    if (typeof window === 'undefined') {
        return { success: false, migrated: 0, errors: 1, message: "Cannot run on server" };
    }

    if (localStorage.getItem(MIGRATION_KEYS.STOCK)) {
        return { success: true, migrated: 0, errors: 0, message: "Stock already migrated" };
    }

    let migrated = 0;
    let errors = 0;

    try {
        const oldData = localStorage.getItem(STORAGE_KEYS.STOCK);
        const oldStock: Stock[] = oldData ? JSON.parse(oldData) : [];

        if (oldStock.length === 0) {
            localStorage.setItem(MIGRATION_KEYS.STOCK, "true");
            return { success: true, migrated: 0, errors: 0, message: "No stock history to migrate" };
        }

        for (const stock of oldStock) {
            const newStock = {
                id: stock.id,
                date: stock.date,
                quantity: stock.quantity,
                type: stock.type,
                reason: stock.reason,
                current_stock: stock.currentStock,
                fragrance_distribution: stock.fragranceDistribution || null
            };

            const { error } = await supabase.from("stock_history").insert([newStock]);

            if (error) {
                console.error(`Failed to migrate stock ${stock.id}:`, error);
                errors++;
            } else {
                migrated++;
            }
        }

        localStorage.setItem(MIGRATION_KEYS.STOCK, "true");
        return {
            success: true,
            migrated,
            errors,
            message: `Migrated ${migrated} stock entries${errors > 0 ? ` with ${errors} errors` : ''}`
        };

    } catch (error) {
        console.error("Stock migration error:", error);
        return { success: false, migrated, errors: errors + 1, message: "Stock migration failed" };
    }
};

// Migrate fragrance stock from localStorage to Supabase
export const migrateFragranceStock = async (): Promise<MigrationResult> => {
    if (typeof window === 'undefined') {
        return { success: false, migrated: 0, errors: 1, message: "Cannot run on server" };
    }

    if (localStorage.getItem(MIGRATION_KEYS.FRAGRANCE_STOCK)) {
        return { success: true, migrated: 0, errors: 0, message: "Fragrance stock already migrated" };
    }

    let migrated = 0;
    let errors = 0;

    try {
        const oldData = localStorage.getItem(STORAGE_KEYS.FRAGRANCE_STOCK);
        const oldFragranceStock: FragranceStock[] = oldData ? JSON.parse(oldData) : [];

        if (oldFragranceStock.length === 0) {
            localStorage.setItem(MIGRATION_KEYS.FRAGRANCE_STOCK, "true");
            return { success: true, migrated: 0, errors: 0, message: "No fragrance stock to migrate" };
        }

        for (const fragrance of oldFragranceStock) {
            const newFragrance = {
                fragrance_id: fragrance.fragranceId,
                name: fragrance.name,
                quantity: fragrance.quantity,
                color: fragrance.color
            };

            const { error } = await supabase.from("fragrance_stock").insert([newFragrance]);

            if (error) {
                console.error(`Failed to migrate fragrance ${fragrance.fragranceId}:`, error);
                errors++;
            } else {
                migrated++;
            }
        }

        localStorage.setItem(MIGRATION_KEYS.FRAGRANCE_STOCK, "true");
        return {
            success: true,
            migrated,
            errors,
            message: `Migrated ${migrated} fragrance stocks${errors > 0 ? ` with ${errors} errors` : ''}`
        };

    } catch (error) {
        console.error("Fragrance stock migration error:", error);
        return { success: false, migrated, errors: errors + 1, message: "Fragrance stock migration failed" };
    }
};

// Run complete migration
export const runFullMigration = async (): Promise<{
    success: boolean;
    results: Record<string, MigrationResult>;
    totalMigrated: number;
    totalErrors: number;
}> => {
    if (typeof window === 'undefined') {
        return {
            success: false,
            results: {},
            totalMigrated: 0,
            totalErrors: 1
        };
    }

    if (localStorage.getItem(MIGRATION_KEYS.COMPLETE)) {
        return {
            success: true,
            results: {},
            totalMigrated: 0,
            totalErrors: 0
        };
    }

    const results: Record<string, MigrationResult> = {};
    let totalMigrated = 0;
    let totalErrors = 0;

    try {
        // Run migrations in order (supermarkets first, then dependent data)
        console.log("Starting full migration...");

        results.supermarkets = await migrateSupermarkets();
        totalMigrated += results.supermarkets.migrated;
        totalErrors += results.supermarkets.errors;

        results.sales = await migrateSales();
        totalMigrated += results.sales.migrated;
        totalErrors += results.sales.errors;

        results.orders = await migrateOrders();
        totalMigrated += results.orders.migrated;
        totalErrors += results.orders.errors;

        results.stock = await migrateStock();
        totalMigrated += results.stock.migrated;
        totalErrors += results.stock.errors;

        results.fragranceStock = await migrateFragranceStock();
        totalMigrated += results.fragranceStock.migrated;
        totalErrors += results.fragranceStock.errors;

        // Mark migration as complete
        localStorage.setItem(MIGRATION_KEYS.COMPLETE, "true");

        console.log("Migration completed:", { totalMigrated, totalErrors });

        return {
            success: true,
            results,
            totalMigrated,
            totalErrors
        };

    } catch (error) {
        console.error("Full migration error:", error);
        return {
            success: false,
            results,
            totalMigrated,
            totalErrors: totalErrors + 1
        };
    }
};

// Reset migration flags (for testing)
export const resetMigrationFlags = (): void => {
    if (typeof window === 'undefined') return;

    Object.values(MIGRATION_KEYS).forEach(key => {
        localStorage.removeItem(key);
    });
};

// Get migration status
export const getMigrationStatus = () => {
    if (typeof window === 'undefined') return null;

    return {
        isComplete: !!localStorage.getItem(MIGRATION_KEYS.COMPLETE),
        supermarkets: !!localStorage.getItem(MIGRATION_KEYS.SUPERMARKETS),
        sales: !!localStorage.getItem(MIGRATION_KEYS.SALES),
        orders: !!localStorage.getItem(MIGRATION_KEYS.ORDERS),
        stock: !!localStorage.getItem(MIGRATION_KEYS.STOCK),
        fragranceStock: !!localStorage.getItem(MIGRATION_KEYS.FRAGRANCE_STOCK)
    };
};