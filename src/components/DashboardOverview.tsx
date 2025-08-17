"use client";

import React, { useCallback, useMemo, Suspense } from "react";
import { MetricsGrid, MonthlySalesData } from "./MetricsGrid";
import { SalesChart } from "./SalesChart";
import { MetricsErrorBoundary, ChartErrorBoundary } from "./DashboardErrorBoundary";
import { DashboardOverviewSkeleton } from "./LoadingSkeleton";

// Lazy load non-critical chart components
const MonthlyBenefitsChart = React.lazy(() => import("./MonthlyBenefitsChart").then(module => ({ default: module.MonthlyBenefitsChart })));
const FragranceStockChart = React.lazy(() => import("./FragranceStockChart").then(module => ({ default: module.FragranceStockChart })));
const MonthlyHistoryTable = React.lazy(() => import("./MonthlyHistoryTable").then(module => ({ default: module.MonthlyHistoryTable })));

export interface MonthlyData {
    quantity: number;
    value: number;
    netBenefit: number;
}

export interface FragranceStockData {
    name: string;
    value: number;
    color: string;
}

export interface DashboardData {
    monthlySales: MonthlySalesData & { fragmentStock: number };
    salesData: Array<{ name: string; value: number }>;
    fragranceStock: FragranceStockData[];
}

export interface DashboardOverviewProps {
    dashboardData: DashboardData;
    monthlyBenefits: Record<string, MonthlyData>;
    onNavigate?: (tab: string) => void;
    isLoading?: boolean;
    error?: string | null;
    className?: string;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = React.memo(function DashboardOverview({
    dashboardData,
    monthlyBenefits,
    isLoading = false,
    error = null,
    className = ""
}) {
    const handleReload = useCallback(() => {
        window.location.reload();
    }, []);

    const errorContent = useMemo(() => {
        if (!error) return null;

        return (
            <div className={`space-y-6 ${className}`}>
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                    <div className="text-red-600 mb-2">
                        <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-red-800 mb-1">
                        Erreur de chargement
                    </h3>
                    <p className="text-red-600 text-sm">
                        {error}
                    </p>
                    <button
                        onClick={handleReload}
                        className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                    >
                        Réessayer
                    </button>
                </div>
            </div>
        );
    }, [error, className, handleReload]);

    // Loading state
    if (isLoading) {
        return <DashboardOverviewSkeleton className={className} />;
    }

    // Error state
    if (error) {
        return errorContent;
    }

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Metrics Grid Section */}
            <section aria-labelledby="metrics-heading">
                <h2 id="metrics-heading" className="sr-only">
                    Métriques du tableau de bord
                </h2>
                <MetricsErrorBoundary>
                    <MetricsGrid
                        metrics={dashboardData.monthlySales}
                        className="mb-6"
                    />
                </MetricsErrorBoundary>
            </section>

            {/* Charts and Analytics Section */}
            <section aria-labelledby="analytics-heading">
                <h2 id="analytics-heading" className="sr-only">
                    Analyses et graphiques
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Sales Trend Chart */}
                    <ChartErrorBoundary title="Tendance des Ventes">
                        <div className="bg-white rounded-xl shadow-md border-none overflow-hidden">
                            <div className="p-4 border-b">
                                <h3 className="text-sm font-medium text-gray-700">
                                    Tendance des Ventes (7 derniers jours)
                                </h3>
                            </div>
                            <div className="p-4">
                                <SalesChart
                                    data={dashboardData.salesData}
                                    height={200}
                                />
                            </div>
                        </div>
                    </ChartErrorBoundary>

                    {/* Monthly Benefits Chart */}
                    <ChartErrorBoundary title="Bénéfices Mensuels">
                        <div className="bg-white rounded-xl shadow-md border-none overflow-hidden">
                            <div className="p-4 border-b">
                                <h3 className="text-sm font-medium text-gray-700">
                                    Bénéfices Mensuels (6 derniers mois)
                                </h3>
                            </div>
                            <div className="p-4">
                                <Suspense fallback={
                                    <div className="flex items-center justify-center h-[200px]">
                                        <div className="animate-pulse bg-gray-200 rounded w-full h-full"></div>
                                    </div>
                                }>
                                    <MonthlyBenefitsChart
                                        data={monthlyBenefits}
                                        height={200}
                                        currentMonthProfit={dashboardData.monthlySales.profit}
                                    />
                                </Suspense>
                            </div>
                        </div>
                    </ChartErrorBoundary>

                    {/* Fragrance Stock Distribution */}
                    <ChartErrorBoundary title="Distribution du Stock">
                        <div className="bg-white rounded-xl shadow-md border-none overflow-hidden">
                            <div className="p-4 border-b">
                                <h3 className="text-sm font-medium text-gray-700">
                                    Distribution du Stock par Parfum
                                </h3>
                            </div>
                            <div className="p-4">
                                <Suspense fallback={
                                    <div className="flex items-center justify-center h-[250px]">
                                        <div className="animate-pulse bg-gray-200 rounded-full w-32 h-32"></div>
                                    </div>
                                }>
                                    <FragranceStockChart
                                        data={dashboardData.fragranceStock}
                                        height={250}
                                        totalStock={dashboardData.monthlySales.stock}
                                    />
                                </Suspense>
                            </div>
                        </div>
                    </ChartErrorBoundary>

                    {/* Monthly History Table */}
                    <ChartErrorBoundary title="Historique Mensuel">
                        <div className="lg:col-span-1">
                            <Suspense fallback={
                                <div className="bg-white rounded-xl shadow-md border-none overflow-hidden">
                                    <div className="p-4 border-b">
                                        <div className="animate-pulse bg-gray-200 rounded h-4 w-32"></div>
                                    </div>
                                    <div className="p-4 space-y-3">
                                        {[...Array(4)].map((_, i) => (
                                            <div key={i} className="animate-pulse bg-gray-200 rounded h-8 w-full"></div>
                                        ))}
                                    </div>
                                </div>
                            }>
                                <MonthlyHistoryTable
                                    monthlyBenefits={monthlyBenefits}
                                />
                            </Suspense>
                        </div>
                    </ChartErrorBoundary>
                </div>
            </section>
        </div>
    );
});

DashboardOverview.displayName = 'DashboardOverview';