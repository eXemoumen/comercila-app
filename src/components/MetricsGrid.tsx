"use client";

import React from "react";
import { MetricCard } from "./MetricCard";
import { ProfitMetricCard } from "./ProfitMetricCard";
import { PaidProfitMetricCard } from "./PaidProfitMetricCard";
import { 
  TrendingUp, 
  Package, 
  Truck, 
  Sparkles,
  BarChart3
} from "lucide-react";

export interface MonthlySalesData {
  quantity: number;
  revenue: number;
  profit: number;
  stock: number;
  supplierPayment: number;
  paidProfit: number;
  fragmentStock: number;
  virementPeriod?: string;
}

export interface MetricsGridProps {
  metrics: MonthlySalesData;
  maxStock?: number;
  className?: string;
  onProfitCardClick?: () => void;
  onPaidProfitCardClick?: () => void;
}

export const MetricsGrid: React.FC<MetricsGridProps> = React.memo(
  function MetricsGrid({
    metrics,
    className = "",
    onProfitCardClick,
    onPaidProfitCardClick,
  }) {
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

    // Calculate some derived metrics for better insights
    const cartonsFromQuantity = Math.floor(metrics.quantity / 9);
    const stockInCartons = Math.floor(metrics.fragmentStock / 9);
    const profitMargin = metrics.revenue > 0 
      ? ((metrics.profit / metrics.revenue) * 100).toFixed(1) 
      : "0";

    return (
      <div className={`space-y-6 ${className}`}>
        {/* Section Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Métriques du Mois
              </h2>
              <p className="text-sm text-gray-500">
                Vue d&apos;ensemble de vos performances
              </p>
            </div>
          </div>
          
          {metrics.virementPeriod && metrics.virementPeriod !== "mois en cours" && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100">
              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 animate-pulse" />
              <span className="text-sm font-medium text-purple-700">
                {metrics.virementPeriod}
              </span>
            </div>
          )}
        </div>

        {/* Main Metrics Grid */}
        <div
          className={`grid gap-4 ${
            isMobile
              ? "grid-cols-1"
              : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
          }`}
        >
          {/* Revenue Card */}
          <div className="animate-fade-in-up stagger-1">
            <MetricCard
              title="Chiffre d'Affaires"
              value={`${metrics.revenue.toLocaleString("fr-DZ")} DZD`}
              color="blue"
              icon={TrendingUp}
              className="h-full"
            >
              <div className="space-y-3 pt-2">
                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-3 border border-blue-100/50">
                    <p className="text-xs text-blue-600 font-medium mb-1">Quantité</p>
                    <p className="text-sm font-bold text-blue-900">
                      {cartonsFromQuantity.toLocaleString("fr-DZ")} cartons
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-3 border border-indigo-100/50">
                    <p className="text-xs text-indigo-600 font-medium mb-1">Marge</p>
                    <p className="text-sm font-bold text-indigo-900">
                      {profitMargin}%
                    </p>
                  </div>
                </div>
              </div>
            </MetricCard>
          </div>

          {/* Profit Card */}
          <div className="animate-fade-in-up stagger-2">
            <ProfitMetricCard
              profit={metrics.profit}
              virementPeriod={metrics.virementPeriod}
              onClick={onProfitCardClick}
            />
          </div>

          {/* Paid Profit Card */}
          <div className="animate-fade-in-up stagger-3">
            <PaidProfitMetricCard
              paidProfit={metrics.paidProfit}
              virementPeriod={metrics.virementPeriod}
              onClick={onPaidProfitCardClick}
            />
          </div>

          {/* Supplier Payment Card */}
          <div className="animate-fade-in-up stagger-4">
            <MetricCard
              title="Paiement Fournisseur"
              value={`${metrics.supplierPayment.toLocaleString("fr-DZ")} DZD`}
              color="purple"
              icon={Truck}
              className="h-full"
            >
              <div className="space-y-3 pt-2">
                <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-3 border border-purple-100/50">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                    <p className="text-xs text-purple-600 font-medium">À payer</p>
                  </div>
                  <p className="text-xs text-purple-700">
                    Basé sur {cartonsFromQuantity} cartons vendus
                  </p>
                </div>
              </div>
            </MetricCard>
          </div>

          {/* Fragment Stock Card */}
          <div className="animate-fade-in-up stagger-5">
            <MetricCard
              title="Stock Fragrances"
              value={`${stockInCartons.toLocaleString("fr-DZ")} cartons`}
              color="emerald"
              icon={Package}
              className="h-full"
            >
              <div className="space-y-3 pt-2">
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-3 border border-emerald-100/50">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                    <p className="text-xs text-emerald-600 font-medium">
                      Fragrances disponibles
                    </p>
                  </div>
                  <p className="text-xs text-emerald-700">
                    {metrics.fragmentStock.toLocaleString("fr-DZ")} pièces en stock
                  </p>
                </div>
              </div>
            </MetricCard>
          </div>
        </div>
      </div>
    );
  }
);

MetricsGrid.displayName = "MetricsGrid";
