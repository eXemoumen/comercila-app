import { BUSINESS_CONSTANTS } from "./dashboardCalculations";

/**
 * Interface for price option configuration
 */
export interface PriceOption {
    pricePerUnit: number;
    benefitPerUnit: number;
    costToSupplier: number;
    label: string;
}

/**
 * Interface for quantity breakdown
 */
export interface QuantityBreakdown {
    pieces: number;
    cartons: number;
}

/**
 * Interface for sale calculation result
 */
export interface SaleCalculation {
    totalValue: number;
    totalBenefit: number;
    totalCostToSupplier: number;
    profitMargin: number;
}

/**
 * Available price options for sales
 */
export const PRICE_OPTIONS: Record<string, PriceOption> = {
    option1: {
        pricePerUnit: BUSINESS_CONSTANTS.PRICE_TIER_HIGH,
        benefitPerUnit: BUSINESS_CONSTANTS.PROFIT_HIGH,
        costToSupplier: BUSINESS_CONSTANTS.SUPPLIER_COST_HIGH,
        label: "Option 1 (180 DZD)",
    },
    option2: {
        pricePerUnit: BUSINESS_CONSTANTS.PRICE_TIER_LOW,
        benefitPerUnit: BUSINESS_CONSTANTS.PROFIT_LOW,
        costToSupplier: BUSINESS_CONSTANTS.SUPPLIER_COST_LOW,
        label: "Option 2 (166 DZD)",
    },
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
 * Convert cartons to pieces
 * @param cartons - Number of cartons
 * @returns Number of pieces
 */
export function convertCartonsToPieces(cartons: number): number {
    return cartons * BUSINESS_CONSTANTS.UNITS_PER_CARTON;
}

/**
 * Convert pieces to cartons (rounded down)
 * @param pieces - Number of pieces
 * @returns Number of complete cartons
 */
export function convertPiecesToCartons(pieces: number): number {
    return Math.floor(pieces / BUSINESS_CONSTANTS.UNITS_PER_CARTON);
}

/**
 * Get quantity breakdown showing both pieces and cartons
 * @param pieces - Total number of pieces
 * @returns Object with pieces and cartons breakdown
 */
export function getQuantityBreakdown(pieces: number): QuantityBreakdown {
    return {
        pieces,
        cartons: convertPiecesToCartons(pieces),
    };
}

/**
 * Calculate stock percentage based on current stock and maximum capacity
 * @param currentStock - Current stock amount (in pieces)
 * @param maxStock - Maximum stock capacity (default: 2700 pieces)
 * @returns Stock percentage (0-100)
 */
export function calculateStockPercentage(currentStock: number, maxStock: number = 2700): number {
    if (maxStock === 0) return 0;
    return Math.min((currentStock / maxStock) * 100, 100);
}

/**
 * Calculate sale totals based on quantity and price option
 * @param quantity - Number of pieces
 * @param priceOption - Price option configuration
 * @returns Sale calculation result
 */
export function calculateSaleTotals(quantity: number, priceOption: PriceOption): SaleCalculation {
    const totalValue = quantity * priceOption.pricePerUnit;
    const totalBenefit = quantity * priceOption.benefitPerUnit;
    const totalCostToSupplier = quantity * priceOption.costToSupplier;
    const profitMargin = totalValue > 0 ? (totalBenefit / totalValue) * 100 : 0;

    return {
        totalValue,
        totalBenefit,
        totalCostToSupplier,
        profitMargin,
    };
}

/**
 * Get price option by price per unit
 * @param pricePerUnit - Price per unit
 * @returns Price option configuration or null if not found
 */
export function getPriceOptionByPrice(pricePerUnit: number): PriceOption | null {
    const option = Object.values(PRICE_OPTIONS).find(
        opt => opt.pricePerUnit === pricePerUnit
    );
    return option || null;
}

/**
 * Validate if a price per unit is supported
 * @param pricePerUnit - Price per unit to validate
 * @returns True if the price is supported
 */
export function isValidPricePerUnit(pricePerUnit: number): boolean {
    return Object.values(PRICE_OPTIONS).some(
        opt => opt.pricePerUnit === pricePerUnit
    );
}

/**
 * Calculate remaining stock after a potential sale
 * @param currentStock - Current stock in pieces
 * @param saleQuantity - Quantity to be sold in pieces
 * @returns Remaining stock in pieces
 */
export function calculateRemainingStock(currentStock: number, saleQuantity: number): number {
    return Math.max(0, currentStock - saleQuantity);
}

/**
 * Check if there's sufficient stock for a sale
 * @param currentStock - Current stock in pieces
 * @param requestedQuantity - Requested quantity in pieces
 * @returns True if there's sufficient stock
 */
export function hasSufficientStock(currentStock: number, requestedQuantity: number): boolean {
    return currentStock >= requestedQuantity;
}

/**
 * Calculate the maximum possible sale quantity based on current stock
 * @param currentStock - Current stock in pieces
 * @returns Maximum sale quantity in pieces
 */
export function getMaxSaleQuantity(currentStock: number): number {
    return Math.max(0, currentStock);
}

/**
 * Calculate profit margin percentage
 * @param profit - Profit amount
 * @param revenue - Revenue amount
 * @returns Profit margin as percentage (0-100)
 */
export function calculateProfitMargin(profit: number, revenue: number): number {
    if (revenue === 0) return 0;
    return (profit / revenue) * 100;
}

/**
 * Calculate total supplier payment for multiple sales
 * @param sales - Array of sales with quantity and pricePerUnit
 * @returns Total amount owed to supplier
 */
export function calculateTotalSupplierPayment(
    sales: Array<{ quantity: number; pricePerUnit: number }>
): number {
    return sales.reduce((total, sale) => {
        const supplierCost = calculateSupplierCostPerUnit(sale.pricePerUnit);
        return total + (sale.quantity * supplierCost);
    }, 0);
}

/**
 * Calculate total profit for multiple sales
 * @param sales - Array of sales with quantity and pricePerUnit
 * @param onlyPaid - Whether to include only paid sales (requires isPaid property)
 * @returns Total profit amount
 */
export function calculateTotalProfit(
    sales: Array<{ quantity: number; pricePerUnit: number; isPaid?: boolean }>,
    onlyPaid: boolean = false
): number {
    return sales.reduce((total, sale) => {
        if (onlyPaid && !sale.isPaid) return total;

        const profit = calculateProfitPerUnit(sale.pricePerUnit);
        return total + (sale.quantity * profit);
    }, 0);
}

/**
 * Format business metrics for display
 * @param value - Numeric value
 * @param type - Type of metric ('currency', 'quantity', 'percentage')
 * @param locale - Locale for formatting (default: "fr-DZ")
 * @returns Formatted string
 */
export function formatBusinessMetric(
    value: number,
    type: 'currency' | 'quantity' | 'percentage',
    locale: string = "fr-DZ"
): string {
    switch (type) {
        case 'currency':
            return `${value.toLocaleString(locale)} DZD`;
        case 'quantity':
            const breakdown = getQuantityBreakdown(value);
            return `${breakdown.pieces} pièces (${breakdown.cartons} cartons)`;
        case 'percentage':
            return `${value.toFixed(0)}%`;
        default:
            return value.toString();
    }
}