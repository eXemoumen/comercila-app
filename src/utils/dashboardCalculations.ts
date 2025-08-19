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
        if (sale.isPaid && sale.paymentDate) {
            // For paid sales, check if the payment was made in the current month
            const paymentDate = new Date(sale.paymentDate);
            if (
                paymentDate.getMonth() === currentMonth &&
                paymentDate.getFullYear() === currentYear
            ) {
                const benefitPerUnit = calculateProfitPerUnit(sale.pricePerUnit);
                return acc + sale.quantity * benefitPerUnit;
            }
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
 * Calculate monthly benefits data from all sales (based on sale date - for estimated benefits)
 * @param allSales - Array of all sales
 * @returns Record of monthly data keyed by month-year string
 */
export function calculateMonthlyBenefits(allSales: Sale[]): Record<string, MonthlyData> {
    const monthlyData: Record<string, MonthlyData> = {};

    console.log("🔍 calculateMonthlyBenefits Debug:", {
        totalSales: allSales.length,
        firstFewSales: allSales.slice(0, 3).map(sale => ({
            id: sale.id,
            date: sale.date,
            totalValue: sale.totalValue,
            pricePerUnit: sale.pricePerUnit
        }))
    });

    allSales.forEach((sale) => {
        const date = new Date(sale.date);
        // Format the month and year in French with proper capitalization
        let monthYear = date.toLocaleDateString("fr-FR", {
            month: "long",
            year: "numeric",
        });

        // Capitalize the first letter of the month
        monthYear = monthYear.charAt(0).toUpperCase() + monthYear.slice(1);

        console.log(`📅 Processing sale ${sale.id}: date=${sale.date}, monthYear=${monthYear}, isPaid=${sale.isPaid}, paymentDate=${sale.paymentDate}`);

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

        console.log(`💰 Updated ${monthYear}: quantity=${monthlyData[monthYear].quantity}, value=${monthlyData[monthYear].value}, netBenefit=${monthlyData[monthYear].netBenefit}`);
    });

    console.log("📊 Final monthlyData:", monthlyData);
    return monthlyData;
}

/**
 * Calculate monthly benefits data from paid sales only (based on payment date - for real benefits)
 * @param allSales - Array of all sales
 * @returns Record of monthly data keyed by month-year string
 */
export function calculateMonthlyPaidBenefits(allSales: Sale[]): Record<string, MonthlyData> {
    const monthlyData: Record<string, MonthlyData> = {};

    console.log("🔍 calculateMonthlyPaidBenefits Debug:", {
        totalSales: allSales.length,
        paidSales: allSales.filter(sale => sale.isPaid).length,
        paidSalesWithDates: allSales.filter(sale => sale.isPaid && sale.paymentDate).length
    });

    allSales.forEach((sale) => {
        // Only include paid sales with payment dates
        if (!sale.isPaid || !sale.paymentDate) {
            return;
        }

        const paymentDate = new Date(sale.paymentDate);
        // Format the month and year in French with proper capitalization
        let monthYear = paymentDate.toLocaleDateString("fr-FR", {
            month: "long",
            year: "numeric",
        });

        // Capitalize the first letter of the month
        monthYear = monthYear.charAt(0).toUpperCase() + monthYear.slice(1);

        console.log(`💰 Processing paid sale ${sale.id}: paymentDate=${sale.paymentDate}, monthYear=${monthYear}, saleDate=${sale.date}`);

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

        console.log(`✅ Updated ${monthYear}: quantity=${monthlyData[monthYear].quantity}, value=${monthlyData[monthYear].value}, netBenefit=${monthlyData[monthYear].netBenefit}`);
    });

    console.log("📊 Final monthlyPaidBenefits:", monthlyData);
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

    return allSales.reduce((acc, sale) => {
        if (sale.isPaid && sale.paymentDate) {
            // For paid sales, use the payment date to determine which month the benefit belongs to
            const paymentDate = new Date(sale.paymentDate);
            if (
                paymentDate.getMonth() === targetMonth &&
                paymentDate.getFullYear() === targetYear
            ) {
                const benefitPerUnit = calculateProfitPerUnit(sale.pricePerUnit);
                return acc + sale.quantity * benefitPerUnit;
            }
        }
        return acc;
    }, 0);
}

/**
 * Debug function to check paid profit calculation for current month
 * @param allSales - Array of all sales
 * @returns Debug information about paid profit calculation
 */
export function debugPaidProfitCalculation(allSales: Sale[]): any {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    console.log(`🔍 Debugging paid profit for month ${currentMonth + 1}/${currentYear}`);

    const paidSales = allSales.filter(sale => sale.isPaid && sale.paymentDate);
    
    const currentMonthPaidSales = paidSales.filter(sale => {
        const paymentDate = new Date(sale.paymentDate!);
        const isCurrentMonth = paymentDate.getMonth() === currentMonth && 
                              paymentDate.getFullYear() === currentYear;
        
        if (isCurrentMonth) {
            console.log(`✅ Sale ${sale.id}: Payment date ${sale.paymentDate} - Amount: ${sale.totalValue}`);
        }
        
        return isCurrentMonth;
    });

    const totalPaidProfit = currentMonthPaidSales.reduce((acc, sale) => {
        const benefitPerUnit = calculateProfitPerUnit(sale.pricePerUnit);
        return acc + sale.quantity * benefitPerUnit;
    }, 0);

    console.log(`💰 Total paid profit for current month: ${totalPaidProfit}`);

    return {
        currentMonth: currentMonth + 1,
        currentYear,
        totalPaidSales: paidSales.length,
        currentMonthPaidSales: currentMonthPaidSales.length,
        totalPaidProfit
    };
}