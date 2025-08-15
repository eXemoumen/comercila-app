"use client";

import React from "react";
import { MetricsGrid, MonthlySalesData } from "./MetricsGrid";
import { SalesChart } from "./SalesChart";
import { MonthlyBenefitsChart } from "./MonthlyBenefitsChart";
import { FragranceStockChart } from "./FragranceStockChart";
import { MonthlyHistoryTable } from "./MonthlyHistoryTable";

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
    monthlySales: MonthlySalesData;
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

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
    dashboardData,
    monthlyBenefits,
    isLoading = false,
    error = null,
    className = ""
}) => {
    // Loading state
    if (isLoading) {
        return (
            <div className={`space-y-6 ${className}`}>
                <div className="animate-pulse">
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="bg-gray-200 rounded-xl h-24"></div>
                        ))}
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-gray-200 rounded-xl h-64"></div>
                        <div className="bg-gray-200 rounded-xl h-64"></div>
                        <div className="bg-gray-200 rounded-xl h-64"></div>
                        <div className="bg-gray-200 rounded-xl h-64"></div>
                    </div>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
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
                        onClick={() => window.location.reload()}
                        className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                    >
                        Réessayer
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Metrics Grid Section */}
            <section aria-labelledby="metrics-heading">
                <h2 id="metrics-heading" className="sr-only">
                    Métriques du tableau de bord
                </h2>
                <MetricsGrid
                    metrics={dashboardData.monthlySales}
                    className="mb-6"
                />
            </section>

            {/* Charts and Analytics Section */}
            <section aria-labelledby="analytics-heading">
                <h2 id="analytics-heading" className="sr-only">
                    Analyses et graphiques
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Sales Trend Chart */}
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

                    {/* Monthly Benefits Chart */}
                    <div className="bg-white rounded-xl shadow-md border-none overflow-hidden">
                        <div className="p-4 border-b">
                            <h3 className="text-sm font-medium text-gray-700">
                                Bénéfices Mensuels (6 derniers mois)
                            </h3>
                        </div>
                        <div className="p-4">
                            <MonthlyBenefitsChart
                                data={monthlyBenefits}
                                height={200}
                                currentMonthProfit={dashboardData.monthlySales.profit}
                            />
                        </div>
                    </div>

                    {/* Fragrance Stock Distribution */}
                    <div className="bg-white rounded-xl shadow-md border-none overflow-hidden">
                        <div className="p-4 border-b">
                            <h3 className="text-sm font-medium text-gray-700">
                                Distribution du Stock par Parfum
                            </h3>
                        </div>
                        <div className="p-4">
                            <FragranceStockChart
                                data={dashboardData.fragranceStock}
                                height={250}
                                totalStock={dashboardData.monthlySales.stock}
                            />
                        </div>
                    </div>

                    {/* Monthly History Table */}
                    <div className="lg:col-span-1">
                        <MonthlyHistoryTable
                            monthlyBenefits={monthlyBenefits}
                        />
                    </div>
                </div>
            </section>
        </div>
    );
};