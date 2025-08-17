import { useState, useCallback, useEffect } from "react";
import {
    getSales,
    getCurrentStock,
    getFragranceStock,
} from "@/utils/hybridStorage";
import { notificationService } from "@/services/notificationService";
import type { Sale } from "@/types/index";

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
    sales: Sale[];
    currentStock: number;
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
        sales: [],
        currentStock: 0,
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

            // Get current stock
            const currentStock = await getCurrentStock();
            const fragmentStock = await getFragranceStock();

            // Calculate monthly statistics
            const totalQuantity = monthlySales.reduce(
                (acc, sale) => acc + sale.quantity,
                0
            );
            const totalRevenue = monthlySales.reduce(
                (acc, sale) => acc + sale.totalValue,
                0
            );

            // Calculate total profit (revenue - supplier cost)
            const totalSupplierPayment = monthlySales.reduce(
                (acc, sale) => {
                    // Calculate supplier cost based on pricePerUnit
                    // If pricePerUnit is 180, supplier cost is 155
                    // If pricePerUnit is 166, supplier cost is 149
                    const supplierCostPerUnit = sale.pricePerUnit === 180 ? 155 : sale.pricePerUnit === 166 ? 149 : 0;
                    return acc + (supplierCostPerUnit * sale.quantity);
                },
                0
            );
            const totalProfit = totalRevenue - totalSupplierPayment;

            // Calculate paid profit (only from paid sales)
            const paidSales = monthlySales.filter((sale) => sale.isPaid);
            const paidProfit = paidSales.reduce(
                (acc, sale) => {
                    const supplierCostPerUnit = sale.pricePerUnit === 180 ? 155 : sale.pricePerUnit === 166 ? 149 : 0;
                    return acc + (sale.totalValue - (supplierCostPerUnit * sale.quantity));
                },
                0
            );

            // Get fragrance stock data for the pie chart
            const fragranceData = fragmentStock.map((fragrance) => ({
                name: fragrance.name,
                value: fragrance.quantity,
                color: `hsl(${Math.random() * 360}, 70%, 50%)`,
            }));

            // Create sales trend data for the last 7 days
            const salesData: Array<{ name: string; value: number }> = [];
            for (let i = 6; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const daySales = allSales.filter((sale) => {
                    const saleDate = new Date(sale.date);
                    return (
                        saleDate.getDate() === date.getDate() &&
                        saleDate.getMonth() === date.getMonth() &&
                        saleDate.getFullYear() === date.getFullYear()
                    );
                });
                const dayRevenue = daySales.reduce(
                    (acc, sale) => acc + sale.totalValue,
                    0
                );
                salesData.push({
                    name: date.toLocaleDateString("fr-FR", { weekday: "short" }),
                    value: dayRevenue,
                });
            }

            setDashboardData(prev => ({
                ...prev,
                monthlySales: {
                    quantity: totalQuantity,
                    revenue: totalRevenue,
                    profit: totalProfit,
                    stock: currentStock.currentStock || 0,
                    supplierPayment: totalSupplierPayment,
                    paidProfit: paidProfit,
                    fragmentStock: fragmentStock.reduce((acc, f) => acc + f.quantity, 0),
                },
                salesData,
                fragranceStock: fragranceData,
                sales: allSales,
                currentStock: currentStock.currentStock || 0,
            }));
        } catch (error) {
            console.error("Error updating dashboard data:", error);
            setError("Erreur lors du chargement des données");
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

    // Generate notifications based on data
    useEffect(() => {
        if (dashboardData.sales && dashboardData.sales.length > 0) {
            // Generate payment due notifications
            notificationService.generatePaymentDueNotifications(dashboardData.sales);
            
            // Generate virement reminders
            notificationService.generateVirementReminders(dashboardData.sales);
        }
    }, [dashboardData.sales]);

    // Generate stock alerts
    useEffect(() => {
        if (dashboardData.currentStock) {
            notificationService.generateStockAlerts(dashboardData.currentStock);
        }
    }, [dashboardData.currentStock]);

    // Generate order notifications (if you have orders data)
    useEffect(() => {
        // You can add order notifications here when you have orders data
        // notificationService.generateOrderNotifications(orders);
    }, []);

    return {
        dashboardData,
        monthlyBenefits,
        isLoading,
        error,
        refreshData,
    };
}