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
        <section aria-labelledby="analytics-heading">
          <h2 id="analytics-heading" className="sr-only">
            Analyses et graphiques
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Estimated Benefits Chart */}
            <ChartErrorBoundary title="Bénéfices Estimés">
              <div className="bg-white rounded-xl shadow-md border-none overflow-hidden">
                <div className="p-4 border-b">
                  <h3 className="text-sm font-medium text-gray-700">
                    Bénéfices Estimés (6 derniers mois)
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Basé sur la date de vente
                  </p>
                </div>
                <div className="p-4">
                  <Suspense
                    fallback={
                      <div className="flex items-center justify-center h-[200px]">
                        <div className="animate-pulse bg-gray-200 rounded w-full h-full"></div>
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
              <div className="bg-white rounded-xl shadow-md border-none overflow-hidden">
                <div className="p-4 border-b">
                  <h3 className="text-sm font-medium text-gray-700">
                    Bénéfices Réels (6 derniers mois)
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Basé sur la date de paiement
                  </p>
                </div>
                <div className="p-4">
                  <Suspense
                    fallback={
                      <div className="flex items-center justify-center h-[200px]">
                        <div className="animate-pulse bg-gray-200 rounded w-full h-full"></div>
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
              <div className="bg-white rounded-xl shadow-md border-none overflow-hidden">
                <div className="p-4 border-b">
                  <h3 className="text-sm font-medium text-gray-700">
                    Distribution du Stock par Parfum
                  </h3>
                </div>
                <div className="p-4">
                  <Suspense
                    fallback={
                      <div className="flex items-center justify-center h-[250px]">
                        <div className="animate-pulse bg-gray-200 rounded-full w-32 h-32"></div>
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
          <div className="mt-6">
            <ChartErrorBoundary title="Historique Mensuel">
              <Suspense
                fallback={
                  <div className="bg-white rounded-xl shadow-md border-none overflow-hidden">
                    <div className="p-4 border-b">
                      <div className="animate-pulse bg-gray-200 rounded h-4 w-32"></div>
                    </div>
                    <div className="p-4 space-y-3">
                      {[...Array(4)].map((_, i) => (
                        <div
                          key={i}
                          className="animate-pulse bg-gray-200 rounded h-8 w-full"
                        ></div>
                      ))}
                    </div>
                  </div>
                }
              >
                <MonthlyHistoryTable
                  monthlyBenefits={monthlyBenefits}
                  monthlyPaidBenefits={monthlyPaidBenefits}
                />
              </Suspense>
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
