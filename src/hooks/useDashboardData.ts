import { useState, useCallback, useEffect } from "react";
import {
    getSales,
    getCurrentStock,
    getFragranceStock,
} from "@/utils/hybridStorage";
import { calculateMonthlyBenefits, calculateMonthlyPaidBenefits, calculateMonthlySales } from "@/utils/dashboardCalculations";

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
    dashboardData: {
        monthlySales: MonthlySalesData;
        salesData: Array<{ name: string; value: number }>;
        fragranceStock: Array<{ name: string; value: number; color: string }>;
    };
    monthlyBenefits: Record<string, MonthlyData>; // Estimated benefits (based on sale date)
    monthlyPaidBenefits: Record<string, MonthlyData>; // Real benefits (based on payment date)
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
    const [monthlyPaidBenefits, setMonthlyPaidBenefits] = useState<Record<string, MonthlyData>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Update dashboard data function
    const updateDashboardData = useCallback(async () => {
        try {
            setError(null);

            // Get current month's sales
            const allSales = await getSales();
            
            // Use the proper calculation function from dashboardCalculations
            const { currentStock, fragranceStock: fragmentStock } = await getCurrentStock();
            const monthlySalesData = calculateMonthlySales(allSales, currentStock);

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
                    quantity: monthlySalesData.quantity,
                    revenue: monthlySalesData.revenue,
                    profit: monthlySalesData.profit,
                    stock: monthlySalesData.stock,
                    supplierPayment: monthlySalesData.supplierPayment,
                    paidProfit: monthlySalesData.paidProfit,
                    fragmentStock: fragmentStock
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
    const calculateMonthlyBenefitsData = useCallback(async () => {
        try {
            const allSales = await getSales();
            
            console.log("🔍 calculateMonthlyBenefitsData Debug:", {
                totalSales: allSales.length,
                salesWithDates: allSales.map(sale => ({
                    id: sale.id,
                    date: sale.date,
                    totalValue: sale.totalValue
                }))
            });
            
            // Calculate estimated benefits (based on sale date)
            const estimatedBenefits = calculateMonthlyBenefits(allSales);
            console.log("📊 Estimated Benefits:", estimatedBenefits);
            setMonthlyBenefits(estimatedBenefits);
            
            // Calculate real benefits (based on payment date)
            const paidBenefits = calculateMonthlyPaidBenefits(allSales);
            console.log("💰 Paid Benefits:", paidBenefits);
            setMonthlyPaidBenefits(paidBenefits);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to calculate monthly benefits");
            console.error("Error calculating monthly benefits:", err);
        }
    }, []);

    // Refresh data function
    const refreshData = useCallback(async () => {
        setIsLoading(true);
        try {
            await Promise.all([updateDashboardData(), calculateMonthlyBenefitsData()]);
        } finally {
            setIsLoading(false);
        }
    }, [updateDashboardData, calculateMonthlyBenefitsData]);

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
            await calculateMonthlyBenefitsData();
        };

        window.addEventListener("saleDataChanged", handleSaleDataChanged);

        // Cleanup interval and event listener on unmount
        return () => {
            clearInterval(interval);
            window.removeEventListener("saleDataChanged", handleSaleDataChanged);
        };
    }, [updateDashboardData, calculateMonthlyBenefitsData, refreshData]);

    return {
        dashboardData,
        monthlyBenefits,
        monthlyPaidBenefits,
        isLoading,
        error,
        refreshData,
    };
}