import type { Sale, FragranceStock } from "./storage";
import type { MonthlyData } from "./dashboardCalculations";
import { BUSINESS_CONSTANTS } from "./dashboardCalculations";

/**
 * Interface for chart data points
 */
export interface ChartDataPoint {
    name: string;
    value: number;
}

/**
 * Interface for fragrance chart data with color
 */
export interface FragranceChartData {
    name: string;
    value: number;
    color: string;
}

/**
 * Interface for monthly chart data
 */
export interface MonthlyChartData {
    name: string;
    benefit: number;
    fill: string;
}

/**
 * Transform sales data for chart visualization (last N days)
 * @param allSales - Array of all sales
 * @param days - Number of days to include (default: 7)
 * @returns Array of chart data points
 */
export function transformSalesForChart(allSales: Sale[], days: number = 7): ChartDataPoint[] {
    const lastNDays = Array.from({ length: days }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date;
    }).reverse();

    return lastNDays.map((date) => {
        const daySales = allSales.filter((sale) => {
            const saleDate = new Date(sale.date);
            return saleDate.toDateString() === date.toDateString();
        });

        const totalValue = daySales.reduce(
            (acc, sale) => acc + sale.totalValue,
            0
        );

        return {
            name: date.toLocaleDateString("fr-FR", { weekday: "short" }),
            value: totalValue,
        };
    });
}

/**
 * Transform fragrance stock data for pie chart visualization
 * @param fragranceStock - Array of fragrance stock data
 * @returns Array of fragrance chart data with colors
 */
export function transformFragranceStockForChart(fragranceStock: FragranceStock[]): FragranceChartData[] {
    return fragranceStock.map((fragrance) => ({
        name: fragrance.name,
        value: fragrance.quantity,
        color: fragrance.color,
    }));
}

/**
 * Transform monthly benefits data for chart visualization
 * @param monthlyData - Record of monthly data
 * @param maxMonths - Maximum number of months to include (default: 6)
 * @returns Array of monthly chart data
 */
export function transformMonthlyDataForChart(
    monthlyData: Record<string, MonthlyData>,
    maxMonths: number = 6
): MonthlyChartData[] {
    return Object.entries(monthlyData)
        .sort((a, b) => {
            // Parse month names in French to properly sort them
            const monthNamesMap: Record<string, number> = {
                janvier: 0,
                février: 1,
                mars: 2,
                avril: 3,
                mai: 4,
                juin: 5,
                juillet: 6,
                août: 7,
                septembre: 8,
                octobre: 9,
                novembre: 10,
                décembre: 11,
            };

            // Extract month and year from the formatted strings
            const monthA = a[0].split(" ")[0].toLowerCase();
            const yearA = a[0].split(" ")[1];
            const monthB = b[0].split(" ")[0].toLowerCase();
            const yearB = b[0].split(" ")[1];

            // Compare years first
            if (yearA !== yearB) {
                return parseInt(yearA) - parseInt(yearB);
            }

            // If years are equal, compare months
            return (
                (monthNamesMap[monthA] || 0) -
                (monthNamesMap[monthB] || 0)
            );
        })
        // Take only the last N months of data for better visualization
        .slice(-maxMonths)
        .map(([month, data]) => ({
            name: month.split(" ")[0].substring(0, 3), // Abbreviated month name
            benefit: data.netBenefit,
            fill: "#22c55e", // Green color for benefits
        }));
}

/**
 * Format currency amount in Algerian Dinar
 * @param amount - Amount to format
 * @param locale - Locale for formatting (default: "fr-DZ")
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, locale: string = "fr-DZ"): string {
    return `${amount.toLocaleString(locale)} DZD`;
}

/**
 * Format quantity with carton and piece breakdown
 * @param quantity - Total quantity in pieces
 * @returns Object with pieces and cartons
 */
export function formatQuantity(quantity: number): { pieces: number; cartons: number } {
    const cartons = Math.floor(quantity / BUSINESS_CONSTANTS.UNITS_PER_CARTON);
    const pieces = quantity;

    return { pieces, cartons };
}

/**
 * Format quantity as display string
 * @param quantity - Total quantity in pieces
 * @returns Formatted quantity string
 */
export function formatQuantityString(quantity: number): string {
    const { pieces, cartons } = formatQuantity(quantity);
    return `${pieces} pièces (${cartons} cartons)`;
}

/**
 * Format percentage with specified decimal places
 * @param value - Percentage value (0-100)
 * @param decimals - Number of decimal places (default: 0)
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number, decimals: number = 0): string {
    return `${value.toFixed(decimals)}%`;
}

/**
 * Calculate and format stock percentage
 * @param currentStock - Current stock amount
 * @param maxStock - Maximum stock capacity (default: 2700)
 * @returns Formatted percentage string
 */
export function formatStockPercentage(currentStock: number, maxStock: number = 2700): string {
    const percentage = (currentStock / maxStock) * 100;
    return formatPercentage(percentage, 0);
}

/**
 * Transform sales data for monthly history table
 * @param monthlyData - Record of monthly data
 * @returns Array of table row data sorted by date
 */
export function transformMonthlyHistoryForTable(monthlyData: Record<string, MonthlyData>) {
    return Object.entries(monthlyData)
        .sort((a, b) => {
            // Parse month names in French to properly sort them
            const monthNamesMap: Record<string, number> = {
                janvier: 0,
                février: 1,
                mars: 2,
                avril: 3,
                mai: 4,
                juin: 5,
                juillet: 6,
                août: 7,
                septembre: 8,
                octobre: 9,
                novembre: 10,
                décembre: 11,
            };

            // Extract month and year from the formatted strings
            const monthA = a[0].split(" ")[0].toLowerCase();
            const yearA = a[0].split(" ")[1];
            const monthB = b[0].split(" ")[0].toLowerCase();
            const yearB = b[0].split(" ")[1];

            // Compare years first
            if (yearA !== yearB) {
                return parseInt(yearA) - parseInt(yearB);
            }

            // If years are equal, compare months
            return (
                (monthNamesMap[monthA] || 0) -
                (monthNamesMap[monthB] || 0)
            );
        })
        .map(([month, data]) => ({
            month,
            quantity: data.quantity,
            value: data.value,
            netBenefit: data.netBenefit,
            supplierPayment: data.value - data.netBenefit,
            quantityFormatted: formatQuantityString(data.quantity),
            valueFormatted: formatCurrency(data.value),
            netBenefitFormatted: formatCurrency(data.netBenefit),
            supplierPaymentFormatted: formatCurrency(data.value - data.netBenefit),
        }));
}

/**
 * Calculate profit percentage from paid vs total profit
 * @param paidProfit - Profit from paid sales
 * @param totalProfit - Total profit from all sales
 * @returns Percentage as number (0-100)
 */
export function calculateProfitPercentage(paidProfit: number, totalProfit: number): number {
    if (totalProfit === 0) return 0;
    return Math.round((paidProfit / totalProfit) * 100);
}