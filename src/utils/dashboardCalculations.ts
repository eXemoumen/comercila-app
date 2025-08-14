import type { Sale } from "./storage";

/**
 * Interface for monthly sales data
 */
export interface MonthlySalesData {
    quantity: number;
    revenue: number;
    profit: number;
    stock: number;
    supplierPayment: number;
    paidProfit: number;
}

/**
 * Interface for monthly benefits data
 */
export interface MonthlyData {
    quantity: number;
    value: number;
    netBenefit: number;
}

/**
 * Business constants for profit calculations
 */
export const BUSINESS_CONSTANTS = {
    PRICE_TIER_HIGH: 180,
    PRICE_TIER_LOW: 166,
    PROFIT_HIGH: 25,
    PROFIT_LOW: 17,
    SUPPLIER_COST_HIGH: 155,
    SUPPLIER_COST_LOW: 149,
    UNITS_PER_CARTON: 9,
} as const;

/**
 * Calculate profit per unit based on sale price
 * @param pricePerUnit - The price per unit of the sale
 * @returns The profit per unit
 */
export function calculateProfitPerUnit(pricePerUnit: number): number {
    return pricePerUnit === BUSINESS_CONSTANTS.PRICE_TIER_HIGH
        ? BUSINESS_CONSTANTS.PROFIT_HIGH
        : pricePerUnit === BUSINESS_CONSTANTS.PRICE_TIER_LOW
            ? BUSINESS_CONSTANTS.PROFIT_LOW
            : 0;
}

/**
 * Calculate supplier cost per unit based on sale price
 * @param pricePerUnit - The price per unit of the sale
 * @returns The supplier cost per unit
 */
export function calculateSupplierCostPerUnit(pricePerUnit: number): number {
    return pricePerUnit === BUSINESS_CONSTANTS.PRICE_TIER_HIGH
        ? BUSINESS_CONSTANTS.SUPPLIER_COST_HIGH
        : pricePerUnit === BUSINESS_CONSTANTS.PRICE_TIER_LOW
            ? BUSINESS_CONSTANTS.SUPPLIER_COST_LOW
            : 0;
}

/**
 * Calculate monthly sales data for the current month
 * @param allSales - Array of all sales
 * @param currentStock - Current stock in cartons
 * @returns Monthly sales data
 */
export function calculateMonthlySales(allSales: Sale[], currentStock: number): MonthlySalesData {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const monthlySales = allSales.filter((sale) => {
        const saleDate = new Date(sale.date);
        return (
            saleDate.getMonth() === currentMonth &&
            saleDate.getFullYear() === currentYear
        );
    });

    // Calculate monthly statistics
    const totalQuantity = monthlySales.reduce(
        (acc, sale) => acc + sale.quantity,
        0
    );

    const totalRevenue = monthlySales.reduce(
        (acc, sale) => acc + sale.totalValue,
        0
    );

    // Calculate profit based on the actual pricePerUnit from sales
    const totalProfit = monthlySales.reduce((acc, sale) => {
        const benefitPerUnit = calculateProfitPerUnit(sale.pricePerUnit);
        return acc + sale.quantity * benefitPerUnit;
    }, 0);

    // Calculate profit from paid sales only
    const paidProfit = monthlySales.reduce((acc, sale) => {
        if (sale.isPaid) {
            const benefitPerUnit = calculateProfitPerUnit(sale.pricePerUnit);
            return acc + sale.quantity * benefitPerUnit;
        }
        return acc;
    }, 0);

    // Calculate supplier payment amount
    const totalSupplierPayment = monthlySales.reduce((acc, sale) => {
        const supplierCostPerUnit = calculateSupplierCostPerUnit(sale.pricePerUnit);
        return acc + sale.quantity * supplierCostPerUnit;
    }, 0);

    return {
        quantity: totalQuantity,
        revenue: totalRevenue,
        profit: totalProfit,
        stock: currentStock * BUSINESS_CONSTANTS.UNITS_PER_CARTON, // Convert cartons to units
        supplierPayment: totalSupplierPayment,
        paidProfit: paidProfit,
    };
}

/**
 * Calculate monthly benefits data from all sales
 * @param allSales - Array of all sales
 * @returns Record of monthly data keyed by month-year string
 */
export function calculateMonthlyBenefits(allSales: Sale[]): Record<string, MonthlyData> {
    const monthlyData: Record<string, MonthlyData> = {};

    allSales.forEach((sale) => {
        const date = new Date(sale.date);
        // Format the month and year in French with proper capitalization
        let monthYear = date.toLocaleDateString("fr-FR", {
            month: "long",
            year: "numeric",
        });

        // Capitalize the first letter of the month
        monthYear = monthYear.charAt(0).toUpperCase() + monthYear.slice(1);

        if (!monthlyData[monthYear]) {
            monthlyData[monthYear] = {
                quantity: 0,
                value: 0,
                netBenefit: 0,
            };
        }

        const benefitPerUnit = calculateProfitPerUnit(sale.pricePerUnit);

        monthlyData[monthYear].quantity += sale.quantity;
        monthlyData[monthYear].value += sale.totalValue;
        monthlyData[monthYear].netBenefit += sale.quantity * benefitPerUnit;
    });

    return monthlyData;
}

/**
 * Calculate supplier payment amount for a specific month
 * @param allSales - Array of all sales
 * @param month - Month (0-11)
 * @param year - Year
 * @returns Supplier payment amount
 */
export function calculateSupplierPayment(allSales: Sale[], month?: number, year?: number): number {
    const currentDate = new Date();
    const targetMonth = month ?? currentDate.getMonth();
    const targetYear = year ?? currentDate.getFullYear();

    const monthlySales = allSales.filter((sale) => {
        const saleDate = new Date(sale.date);
        return (
            saleDate.getMonth() === targetMonth &&
            saleDate.getFullYear() === targetYear
        );
    });

    return monthlySales.reduce((acc, sale) => {
        const supplierCostPerUnit = calculateSupplierCostPerUnit(sale.pricePerUnit);
        return acc + sale.quantity * supplierCostPerUnit;
    }, 0);
}

/**
 * Calculate paid profit for a specific month
 * @param allSales - Array of all sales
 * @param month - Month (0-11)
 * @param year - Year
 * @returns Paid profit amount
 */
export function calculatePaidProfit(allSales: Sale[], month?: number, year?: number): number {
    const currentDate = new Date();
    const targetMonth = month ?? currentDate.getMonth();
    const targetYear = year ?? currentDate.getFullYear();

    const monthlySales = allSales.filter((sale) => {
        const saleDate = new Date(sale.date);
        return (
            saleDate.getMonth() === targetMonth &&
            saleDate.getFullYear() === targetYear
        );
    });

    return monthlySales.reduce((acc, sale) => {
        if (sale.isPaid) {
            const benefitPerUnit = calculateProfitPerUnit(sale.pricePerUnit);
            return acc + sale.quantity * benefitPerUnit;
        }
        return acc;
    }, 0);
}