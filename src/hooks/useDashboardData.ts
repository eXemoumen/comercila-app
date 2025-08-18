import { useState, useCallback, useEffect } from "react";
import {
    getSales,
    getCurrentStock,
    getFragranceStock,
} from "@/utils/hybridStorage";

interface MonthlySalesData {
    quantity: number;
    revenue: number;
    profit: number;
    stock: number;
    supplierPayment: number;
    paidProfit: number;
    fragmentStock: number;
}

interface MonthlyData {
    quantity: number;
    value: number;
    netBenefit: number;
}

interface DashboardData {
    monthlySales: MonthlySalesData;
    salesData: Array<{ name: string; value: number }>;
    fragranceStock: Array<{ name: string; value: number; color: string }>;
}

interface UseDashboardDataReturn {
    dashboardData: DashboardData;
    monthlyBenefits: Record<string, MonthlyData>;
    isLoading: boolean;
    error: string | null;
    refreshData: () => Promise<void>;
}

/**
 * Custom hook for managing dashboard data
 * 
 * This hook handles all dashboard data fetching, calculations, and state management.
 * It provides:
 * - Monthly sales data with profit calculations
 * - Sales trend data for charts
 * - Fragrance stock data for visualization
 * - Loading and error states
 * - Data refresh functionality
 * 
 * The hook automatically fetches data on mount and provides a refresh function
 * for manual data updates.
 * 
 * @returns {UseDashboardDataReturn} Object containing dashboard data and state
 */
export function useDashboardData(): UseDashboardDataReturn {
    const [dashboardData, setDashboardData] = useState<DashboardData>({
        monthlySales: {
            quantity: 0,
            revenue: 0,
            profit: 0,
            stock: 0,
            supplierPayment: 0,
            paidProfit: 0,
            fragmentStock: 0,
        },
        salesData: [],
        fragranceStock: [],
    });

    const [monthlyBenefits, setMonthlyBenefits] = useState<Record<string, MonthlyData>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Update dashboard data function
    const updateDashboardData = useCallback(async () => {
        try {
            setError(null);

            // Get current month's sales
            const allSales = await getSales();
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
                // Determine benefit per unit based on sale price
                const benefitPerUnit =
                    sale.pricePerUnit === 180 ? 25 : sale.pricePerUnit === 166 ? 17 : 0;
                return acc + sale.quantity * benefitPerUnit;
            }, 0);

            // Calculate profit from paid sales only
            const paidProfit = monthlySales.reduce((acc, sale) => {
                if (sale.isPaid) {
                    // Only include paid sales
                    const benefitPerUnit =
                        sale.pricePerUnit === 180 ? 25 : sale.pricePerUnit === 166 ? 17 : 0;
                    return acc + sale.quantity * benefitPerUnit;
                }
                return acc;
            }, 0);

            // Calculate supplier payment amount
            const totalSupplierPayment = monthlySales.reduce((acc, sale) => {
                // Determine supplier cost per unit based on sale price
                const supplierCostPerUnit =
                    sale.pricePerUnit === 180 ? 155 : sale.pricePerUnit === 166 ? 149 : 0;
                return acc + sale.quantity * supplierCostPerUnit;
            }, 0);

            const { currentStock } = await getCurrentStock();

            // Get fragrance stock data for the pie chart
            const fragranceStock = await getFragranceStock();
            const fragranceData = fragranceStock.map((fragrance) => ({
                name: fragrance.name,
                value: fragrance.quantity,
                color: fragrance.color,
            }));

            // Get last 7 days sales data
            const last7Days = Array.from({ length: 7 }, (_, i) => {
                const date = new Date();
                date.setDate(date.getDate() - i);
                return date;
            }).reverse();

            const salesData = last7Days.map((date) => {
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

            setDashboardData({
                monthlySales: {
                    quantity: totalQuantity,
                    revenue: totalRevenue,
                    profit: totalProfit,
                    stock: currentStock * 9, // Convert cartons to units
                    supplierPayment: totalSupplierPayment,
                    paidProfit: paidProfit,
                    fragmentStock: currentStock * 9 // Use current stock instead of fragment stock
                },
                salesData,
                fragranceStock: fragranceData,
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load dashboard data");
            console.error("Error updating dashboard data:", err);
        }
    }, []);

    // Calculate monthly benefits data
    const calculateMonthlyBenefits = useCallback(async () => {
        try {
            const allSales = await getSales();
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

                const benefitPerUnit =
                    sale.pricePerUnit === 180 ? 25 : sale.pricePerUnit === 166 ? 17 : 0;

                monthlyData[monthYear].quantity += sale.quantity;
                monthlyData[monthYear].value += sale.totalValue;
                monthlyData[monthYear].netBenefit += sale.quantity * benefitPerUnit;
            });

            setMonthlyBenefits(monthlyData);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to calculate monthly benefits");
            console.error("Error calculating monthly benefits:", err);
        }
    }, []);

    // Refresh data function
    const refreshData = useCallback(async () => {
        setIsLoading(true);
        try {
            await Promise.all([updateDashboardData(), calculateMonthlyBenefits()]);
        } finally {
            setIsLoading(false);
        }
    }, [updateDashboardData, calculateMonthlyBenefits]);

    // Initial data load and setup
    useEffect(() => {
        refreshData();

        // Set up interval to update data every minute
        const interval = setInterval(() => {
            updateDashboardData();
        }, 60000);

        // Add event listener for saleDataChanged event
        const handleSaleDataChanged = async () => {
            await updateDashboardData();
            await calculateMonthlyBenefits();
        };

        window.addEventListener("saleDataChanged", handleSaleDataChanged);

        // Cleanup interval and event listener on unmount
        return () => {
            clearInterval(interval);
            window.removeEventListener("saleDataChanged", handleSaleDataChanged);
        };
    }, [updateDashboardData, calculateMonthlyBenefits, refreshData]);

    return {
        dashboardData,
        monthlyBenefits,
        isLoading,
        error,
        refreshData,
    };
}