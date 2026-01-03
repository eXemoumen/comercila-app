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
import { 
  TrendingUp, 
  Wallet, 
  PieChart, 
  Table2,
  RefreshCw,
  AlertCircle
} from "lucide-react";

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
  monthlyBenefits: Record<string, MonthlyData>;
  monthlyPaidBenefits: Record<string, MonthlyData>;
  isLoading?: boolean;
  error?: string | null;
  className?: string;
}

// Premium Chart Card Component
const ChartCard = ({ 
  title, 
  subtitle, 
  icon: Icon, 
  gradient, 
  children 
}: { 
  title: string; 
  subtitle: string; 
  icon: React.ElementType;
  gradient: string;
  children: React.ReactNode;
}) => (
  <div className="premium-card overflow-hidden animate-fade-in-up">
    {/* Header */}
    <div className={`bg-gradient-to-r ${gradient} p-4`}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-white">{title}</h3>
          <p className="text-white/80 text-xs">{subtitle}</p>
        </div>
      </div>
    </div>
    {/* Content */}
    <div className="p-4">
      {children}
    </div>
  </div>
);

// Loading Skeleton for Charts
const ChartSkeleton = ({ height = 200 }: { height?: number }) => (
  <div className="animate-pulse" style={{ height }}>
    <div className="h-full bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 rounded-xl" />
  </div>
);

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
          <div className="premium-card p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-100 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Erreur de chargement
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">{error}</p>
            <button
              onClick={handleReload}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-xl font-medium shadow-lg shadow-red-500/25 hover:shadow-red-500/40 transition-all hover:-translate-y-0.5"
            >
              <RefreshCw className="w-4 h-4" />
              Réessayer
            </button>
          </div>
        </div>
      );
    }, [error, className, handleReload]);

    if (isLoading) {
      return <DashboardOverviewSkeleton className={className} />;
    }

    if (error) {
      return errorContent;
    }

    return (
      <div className={`space-y-8 ${className}`}>
        {/* Metrics Grid Section */}
        <section aria-labelledby="metrics-heading">
          <h2 id="metrics-heading" className="sr-only">
            Métriques du tableau de bord
          </h2>
          <MetricsErrorBoundary>
            <MetricsGrid
              metrics={dashboardData.monthlySales}
              onProfitCardClick={handleProfitCardClick}
              onPaidProfitCardClick={handlePaidProfitCardClick}
            />
          </MetricsErrorBoundary>
        </section>

        {/* Charts Section */}
        <section aria-labelledby="analytics-heading" className="space-y-6">
          {/* Section Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Analyses & Graphiques
                </h2>
                <p className="text-sm text-gray-500">
                  Visualisez vos performances
                </p>
              </div>
            </div>
            
            {/* Legend */}
            <div className="hidden sm:flex items-center gap-4 px-4 py-2 rounded-xl bg-white shadow-sm border border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600" />
                <span className="text-xs font-medium text-gray-600">Estimé</span>
              </div>
              <div className="w-px h-4 bg-gray-200" />
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-400 to-blue-600" />
                <span className="text-xs font-medium text-gray-600">Réel</span>
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {/* Estimated Benefits Chart */}
            <ChartErrorBoundary title="Bénéfices Estimés">
              <ChartCard
                title="Bénéfices Estimés"
                subtitle="Basé sur la date de vente"
                icon={TrendingUp}
                gradient="from-emerald-500 to-teal-500"
              >
                <Suspense fallback={<ChartSkeleton height={220} />}>
                  <MonthlyBenefitsChart
                    data={monthlyBenefits}
                    height={220}
                    currentMonthProfit={dashboardData.monthlySales.profit}
                    type="estimated"
                  />
                </Suspense>
              </ChartCard>
            </ChartErrorBoundary>

            {/* Real Benefits Chart */}
            <ChartErrorBoundary title="Bénéfices Réels">
              <ChartCard
                title="Bénéfices Réels"
                subtitle="Basé sur la date de paiement"
                icon={Wallet}
                gradient="from-blue-500 to-indigo-500"
              >
                <Suspense fallback={<ChartSkeleton height={220} />}>
                  <MonthlyBenefitsChart
                    data={monthlyPaidBenefits}
                    height={220}
                    currentMonthProfit={dashboardData.monthlySales.paidProfit}
                    type="real"
                  />
                </Suspense>
              </ChartCard>
            </ChartErrorBoundary>

            {/* Fragrance Stock Distribution */}
            <ChartErrorBoundary title="Distribution du Stock">
              <ChartCard
                title="Distribution du Stock"
                subtitle="Répartition par parfum"
                icon={PieChart}
                gradient="from-purple-500 to-violet-500"
              >
                <Suspense fallback={<ChartSkeleton height={280} />}>
                  <FragranceStockChart
                    data={dashboardData.fragranceStock}
                    height={280}
                    totalStock={dashboardData.monthlySales.stock}
                  />
                </Suspense>
              </ChartCard>
            </ChartErrorBoundary>
          </div>

          {/* Monthly History Table */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <Table2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Historique Mensuel
                </h3>
                <p className="text-sm text-gray-500">
                  Comparaison estimé vs réel
                </p>
              </div>
            </div>

            <ChartErrorBoundary title="Historique Mensuel">
              <div className="premium-card overflow-hidden animate-fade-in-up">
                <Suspense
                  fallback={
                    <div className="p-6">
                      <div className="animate-pulse space-y-4">
                        <div className="h-6 bg-gray-200 rounded w-48" />
                        {[...Array(4)].map((_, i) => (
                          <div key={i} className="h-16 bg-gray-100 rounded-xl" />
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
