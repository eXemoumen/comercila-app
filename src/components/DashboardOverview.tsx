"use client";

import React, { useCallback, useMemo, Suspense, useState } from "react";
import { MetricsGrid, MonthlySalesData } from "./MetricsGrid";
import {
  MetricsErrorBoundary,
  ChartErrorBoundary,
} from "./DashboardErrorBoundary";
import { DashboardOverviewSkeleton } from "./LoadingSkeleton";
import { MonthlyBreakdownModal } from "./MonthlyBreakdownModal";
import { getSales } from "@/utils/hybridStorage";
import type { Sale } from "@/types/index";

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
  monthlySales: MonthlySalesData & {
    fragmentStock: number;
    virementPeriod?: string;
  };
  salesData: Array<{ name: string; value: number }>;
  fragranceStock: Array<{ name: string; value: number; color: string }>;
}

export interface DashboardOverviewProps {
  dashboardData: {
    monthlySales: MonthlySalesData;
    salesData: Array<{ name: string; value: number }>;
    fragranceStock: Array<{ name: string; value: number; color: string }>;
  };
  monthlyBenefits: Record<string, MonthlyData>; // Estimated benefits
  monthlyPaidBenefits: Record<string, MonthlyData>; // Real benefits
  isLoading?: boolean;
  error?: string | null;
  className?: string;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = React.memo(
  function DashboardOverview({
    dashboardData,
    monthlyBenefits,
    monthlyPaidBenefits,
    isLoading = false,
    error = null,
    className = "",
  }) {
    const [showEstimatedModal, setShowEstimatedModal] = useState(false);
    const [showPaidModal, setShowPaidModal] = useState(false);
    const [sales, setSales] = useState<Sale[]>([]);

    const handleReload = useCallback(() => {
      window.location.reload();
    }, []);

    const handleProfitCardClick = useCallback(async () => {
      // Load sales data when opening the modal
      try {
        const salesData = await getSales();
        setSales(salesData);
        setShowEstimatedModal(true);
      } catch (error) {
        console.error("Error loading sales data:", error);
        setShowEstimatedModal(true);
      }
    }, []);

    const handlePaidProfitCardClick = useCallback(async () => {
      // Load sales data when opening the modal
      try {
        const salesData = await getSales();
        setSales(salesData);
        setShowPaidModal(true);
      } catch (error) {
        console.error("Error loading sales data:", error);
        setShowPaidModal(true);
      }
    }, []);

    const errorContent = useMemo(() => {
      if (!error) return null;

      return (
        <div className={`space-y-6 ${className}`}>
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <div className="text-red-600 mb-2">
              <svg
                className="w-8 h-8 mx-auto mb-2"
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
            <h3 className="text-lg font-medium text-red-800 mb-1">
              Erreur de chargement
            </h3>
            <p className="text-red-600 text-sm">{error}</p>
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
              onProfitCardClick={handleProfitCardClick}
              onPaidProfitCardClick={handlePaidProfitCardClick}
            />
          </MetricsErrorBoundary>
        </section>

        {/* Charts and Analytics Section */}
        <section aria-labelledby="analytics-heading" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
              <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-green-500 rounded-full"></div>
              <span>Analyses et Graphiques</span>
            </h2>
            <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Estimé</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>Réel</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {/* Estimated Benefits Chart */}
            <ChartErrorBoundary title="Bénéfices Estimés">
              <div className="bg-gradient-to-br from-white to-green-50 rounded-xl shadow-lg border border-green-100 overflow-hidden hover:shadow-xl transition-all duration-300">
                <div className="bg-gradient-to-r from-green-500 to-green-600 p-4 text-white">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <h3 className="font-semibold">Bénéfices Estimés</h3>
                  </div>
                  <p className="text-green-100 text-sm mt-1">
                    📅 Basé sur la date de vente (6 derniers mois)
                  </p>
                </div>
                <div className="p-4">
                  <Suspense
                    fallback={
                      <div className="flex items-center justify-center h-[200px]">
                        <div className="animate-pulse bg-gradient-to-r from-green-200 to-green-300 rounded w-full h-full"></div>
                      </div>
                    }
                  >
                    <MonthlyBenefitsChart
                      data={monthlyBenefits}
                      height={200}
                      currentMonthProfit={dashboardData.monthlySales.profit}
                      type="estimated"
                    />
                  </Suspense>
                </div>
              </div>
            </ChartErrorBoundary>

            {/* Real Benefits Chart */}
            <ChartErrorBoundary title="Bénéfices Réels">
              <div className="bg-gradient-to-br from-white to-blue-50 rounded-xl shadow-lg border border-blue-100 overflow-hidden hover:shadow-xl transition-all duration-300">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 text-white">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <h3 className="font-semibold">Bénéfices Réels</h3>
                  </div>
                  <p className="text-blue-100 text-sm mt-1">
                    💰 Basé sur la date de paiement (6 derniers mois)
                  </p>
                </div>
                <div className="p-4">
                  <Suspense
                    fallback={
                      <div className="flex items-center justify-center h-[200px]">
                        <div className="animate-pulse bg-gradient-to-r from-blue-200 to-blue-300 rounded w-full h-full"></div>
                      </div>
                    }
                  >
                    <MonthlyBenefitsChart
                      data={monthlyPaidBenefits}
                      height={200}
                      currentMonthProfit={dashboardData.monthlySales.paidProfit}
                      type="real"
                    />
                  </Suspense>
                </div>
              </div>
            </ChartErrorBoundary>

            {/* Fragrance Stock Distribution */}
            <ChartErrorBoundary title="Distribution du Stock">
              <div className="bg-gradient-to-br from-white to-purple-50 rounded-xl shadow-lg border border-purple-100 overflow-hidden hover:shadow-xl transition-all duration-300 lg:col-span-2 xl:col-span-1">
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-4 text-white">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <h3 className="font-semibold">Distribution du Stock</h3>
                  </div>
                  <p className="text-purple-100 text-sm mt-1">
                    📦 Répartition par parfum
                  </p>
                </div>
                <div className="p-4">
                  <Suspense
                    fallback={
                      <div className="flex items-center justify-center h-[250px]">
                        <div className="animate-pulse bg-gradient-to-r from-purple-200 to-purple-300 rounded-full w-32 h-32"></div>
                      </div>
                    }
                  >
                    <FragranceStockChart
                      data={dashboardData.fragranceStock}
                      height={250}
                      totalStock={dashboardData.monthlySales.stock}
                    />
                  </Suspense>
                </div>
              </div>
            </ChartErrorBoundary>
          </div>

          {/* Monthly History Table - Full Width */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                <div className="w-1 h-6 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full"></div>
                <span>Historique Mensuel Comparatif</span>
              </h3>
              <div className="hidden sm:flex items-center space-x-3 text-sm">
                <div className="flex items-center space-x-1 bg-green-50 px-2 py-1 rounded-full">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-green-700 font-medium">Estimé</span>
                </div>
                <div className="flex items-center space-x-1 bg-blue-50 px-2 py-1 rounded-full">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-blue-700 font-medium">Réel</span>
                </div>
              </div>
            </div>

            <ChartErrorBoundary title="Historique Mensuel">
              <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                <Suspense
                  fallback={
                    <div className="p-6">
                      <div className="animate-pulse space-y-4">
                        <div className="bg-gradient-to-r from-gray-200 to-gray-300 rounded h-6 w-48"></div>
                        <div className="space-y-3">
                          {[...Array(4)].map((_, i) => (
                            <div
                              key={i}
                              className="bg-gradient-to-r from-gray-200 to-gray-300 rounded h-12 w-full"
                            ></div>
                          ))}
                        </div>
                      </div>
                    </div>
                  }
                >
                  <MonthlyHistoryTable
                    monthlyBenefits={monthlyBenefits}
                    monthlyPaidBenefits={monthlyPaidBenefits}
                  />
                </Suspense>
              </div>
            </ChartErrorBoundary>
          </div>
        </section>

        {/* Monthly Breakdown Modals */}
        <MonthlyBreakdownModal
          isOpen={showEstimatedModal}
          onClose={() => setShowEstimatedModal(false)}
          monthlyBenefits={monthlyBenefits}
          title={`Bénéfice Estimé - ${
            dashboardData.monthlySales.virementPeriod || "mois en cours"
          }`}
          type="estimated"
          virementPeriod={dashboardData.monthlySales.virementPeriod}
          sales={sales}
        />

        <MonthlyBreakdownModal
          isOpen={showPaidModal}
          onClose={() => setShowPaidModal(false)}
          monthlyBenefits={monthlyPaidBenefits}
          title={`Bénéfice Réel (Payé) - ${
            dashboardData.monthlySales.virementPeriod || "mois en cours"
          }`}
          type="paid"
          virementPeriod={dashboardData.monthlySales.virementPeriod}
          sales={sales}
        />
      </div>
    );
  }
);
DashboardOverview.displayName = "DashboardOverview";
