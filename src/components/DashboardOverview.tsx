"use client";

import React, { useCallback, useMemo, Suspense } from "react";
import { MetricsGrid, MonthlySalesData } from "./MetricsGrid";
import { SalesChart } from "./SalesChart";
import {
  MetricsErrorBoundary,
  ChartErrorBoundary,
} from "./DashboardErrorBoundary";
import { DashboardOverviewSkeleton } from "./LoadingSkeleton";

// Lazy load non-critical chart components
const MonthlyBenefitsChart = React.lazy(() =>
  import("./MonthlyBenefitsChart").then((module) => ({
    default: module.MonthlyBenefitsChart,
  }))
);
const FragranceStockChart = React.lazy(() =>
  import("./FragranceStockChart").then((module) => ({
    default: module.FragranceStockChart,
  }))
);
const MonthlyHistoryTable = React.lazy(() =>
  import("./MonthlyHistoryTable").then((module) => ({
    default: module.MonthlyHistoryTable,
  }))
);

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

export const DashboardOverview: React.FC<DashboardOverviewProps> = React.memo(
  function DashboardOverview({
    dashboardData,
    monthlyBenefits,
    isLoading = false,
    error = null,
    className = "",
  }) {
    const handleReload = useCallback(() => {
      window.location.reload();
    }, []);

    const errorContent = useMemo(() => {
      if (!error) return null;

      return (
        <div className={`space-y-6 ${className}`}>
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
            <div className="text-red-600 mb-3">
              <svg
                className="w-10 h-10 mx-auto mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-red-800 mb-2">
              Erreur de chargement
            </h3>
            <p className="text-red-600 text-sm mb-4">{error}</p>
            <button
              onClick={handleReload}
              className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-200 text-sm font-medium shadow-md hover:shadow-lg"
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
        {/* Priority 1: Key Metrics - Most Important Information First */}
        <section aria-labelledby="metrics-heading" className="order-1">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <h2
              id="metrics-heading"
              className="text-lg font-semibold text-gray-800 mb-4"
            >
              📊 Métriques Clés
            </h2>
            <MetricsErrorBoundary>
              <MetricsGrid
                metrics={dashboardData.monthlySales}
                className="mb-0"
              />
            </MetricsErrorBoundary>
          </div>
        </section>

        {/* Priority 2: Sales Performance - Critical for Business */}
        <section aria-labelledby="sales-heading" className="order-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-blue-100">
              <h2
                id="sales-heading"
                className="text-lg font-semibold text-blue-800"
              >
                📈 Performance des Ventes
              </h2>
              <p className="text-sm text-blue-600">
                Tendance des 7 derniers jours
              </p>
            </div>
            <div className="p-4">
              <ChartErrorBoundary>
                <SalesChart data={dashboardData.salesData} height={200} />
              </ChartErrorBoundary>
            </div>
          </div>
        </section>

        {/* Priority 3: Financial Overview - Business Health */}
        <section aria-labelledby="financial-heading" className="order-3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-green-50 to-green-100">
              <h2
                id="financial-heading"
                className="text-lg font-semibold text-green-800"
              >
                💰 Bénéfices Mensuels
              </h2>
              <p className="text-sm text-green-600">
                Analyse de rentabilité sur 6 mois
              </p>
            </div>
            <div className="p-4">
              <ChartErrorBoundary>
                <Suspense
                  fallback={
                    <div className="flex items-center justify-center h-48 text-gray-500">
                      <div className="animate-spin rounded-full border-b-2 border-green-500 h-8 w-8"></div>
                      <span className="ml-2">Chargement...</span>
                    </div>
                  }
                >
                  <MonthlyBenefitsChart
                    data={monthlyBenefits}
                    height={200}
                    currentMonthProfit={dashboardData.monthlySales.profit}
                  />
                </Suspense>
              </ChartErrorBoundary>
            </div>
          </div>
        </section>

        {/* Priority 4: Inventory Status - Operational Information */}
        <section aria-labelledby="inventory-heading" className="order-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-purple-100">
              <h2
                id="inventory-heading"
                className="text-lg font-semibold text-purple-800"
              >
                📦 État du Stock
              </h2>
              <p className="text-sm text-purple-600">Répartition par parfum</p>
            </div>
            <div className="p-4">
              <ChartErrorBoundary>
                <Suspense
                  fallback={
                    <div className="flex items-center justify-center h-48 text-gray-500">
                      <div className="animate-spin rounded-full border-b-2 border-purple-500 h-8 w-8"></div>
                      <span className="ml-2">Chargement...</span>
                    </div>
                  }
                >
                  <FragranceStockChart
                    data={dashboardData.fragranceStock}
                    height={250}
                    totalStock={dashboardData.monthlySales.stock}
                  />
                </Suspense>
              </ChartErrorBoundary>
            </div>
          </div>
        </section>

        {/* Priority 5: Historical Data - Reference Information */}
        <section aria-labelledby="history-heading" className="order-5">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100">
              <h2
                id="history-heading"
                className="text-lg font-semibold text-gray-800"
              >
                📅 Historique Mensuel
              </h2>
              <p className="text-sm text-gray-600">
                Récapitulatif détaillé des activités
              </p>
            </div>
            <div className="p-4">
              <ChartErrorBoundary>
                <Suspense
                  fallback={
                    <div className="space-y-3">
                      {[...Array(4)].map((_, i) => (
                        <div
                          key={i}
                          className="animate-pulse bg-gray-200 rounded h-8 w-full"
                        ></div>
                      ))}
                    </div>
                  }
                >
                  <MonthlyHistoryTable monthlyBenefits={monthlyBenefits} />
                </Suspense>
              </ChartErrorBoundary>
            </div>
          </div>
        </section>
      </div>
    );
  }
);

DashboardOverview.displayName = "DashboardOverview";
