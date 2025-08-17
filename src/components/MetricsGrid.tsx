import React from "react";
import { MetricCard } from "./MetricCard";
import { ProfitMetricCard } from "./ProfitMetricCard";
import { PaidProfitMetricCard } from "./PaidProfitMetricCard";
import { TrendingUp, DollarSign, Package, Truck } from "lucide-react";
import { isAndroid, mobileUtils } from "@/utils/mobileConfig";

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
    maxStock = 2700,
    className = "",
    onProfitCardClick,
    onPaidProfitCardClick,
  }) {
    // Check if mobile and apply Android optimizations
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

    React.useEffect(() => {
      if (isAndroid() && isMobile) {
        mobileUtils.optimizeTouchInteractions();
      }
    }, [isMobile]);

    // Calculate stock percentage
    const stockPercentage = Math.round((metrics.stock / maxStock) * 100);
    const stockColor =
      stockPercentage > 80 ? "red" : stockPercentage > 60 ? "amber" : "green";

    return (
      <div
        className={`grid gap-4 ${className} ${
          isMobile ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-2 lg:grid-cols-4"
        }`}
      >
        {/* Stock Card */}
        <div className="order-1">
          <MetricCard
            title="Stock Actuel"
            value={`${metrics.stock.toLocaleString("fr-DZ")} unités`}
            color={stockColor}
            icon={Package}
            percentage={stockPercentage}
            className="h-full"
          >
            <div className="mt-2 space-y-2">
              {/* Stock Progress Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Capacité</span>
                  <span>{stockPercentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      stockColor === "red"
                        ? "bg-red-500"
                        : stockColor === "amber"
                        ? "bg-amber-500"
                        : "bg-green-500"
                    }`}
                    style={{ width: `${stockPercentage}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Actuel: {metrics.stock.toLocaleString("fr-DZ")}</span>
                  <span>Max: {maxStock.toLocaleString("fr-DZ")}</span>
                </div>
              </div>

              {/* Stock Status */}
              <div
                className={`rounded-lg p-2 border ${
                  stockColor === "red"
                    ? "bg-red-50 border-red-200"
                    : stockColor === "amber"
                    ? "bg-amber-50 border-amber-200"
                    : "bg-green-50 border-green-200"
                }`}
              >
                <p
                  className={`text-xs font-medium ${
                    stockColor === "red"
                      ? "text-red-700"
                      : stockColor === "amber"
                      ? "text-amber-700"
                      : "text-green-700"
                  }`}
                >
                  {stockColor === "red"
                    ? "⚠️ Stock élevé"
                    : stockColor === "amber"
                    ? "⚡ Stock modéré"
                    : "✅ Stock optimal"}
                </p>
              </div>
            </div>
          </MetricCard>
        </div>

        {/* Revenue Card */}
        <div className="order-2">
          <MetricCard
            title="Chiffre d'Affaires"
            value={`${metrics.revenue.toLocaleString("fr-DZ")} DZD`}
            color="blue"
            icon={DollarSign}
            className="h-full"
          >
            <div className="mt-2 space-y-2">
              {/* Revenue Breakdown */}
              <div className="bg-blue-50 rounded-lg p-2 border border-blue-200">
                <p className="text-xs text-blue-700 font-medium">
                  📊 Ventes totales
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Quantité: {metrics.quantity.toLocaleString("fr-DZ")} unités
                </p>
              </div>

              {/* Period Information */}
              {metrics.virementPeriod &&
                metrics.virementPeriod !== "mois en cours" && (
                  <div className="bg-purple-50 rounded-lg p-2 border border-purple-200">
                    <p className="text-xs text-purple-700 font-medium">
                      📅 Période: {metrics.virementPeriod}
                    </p>
                    <p className="text-xs text-purple-600 mt-1">
                      CA calculé sur cette période
                    </p>
                  </div>
                )}
            </div>
          </MetricCard>
        </div>

        {/* Profit Card */}
        <div className="order-3">
          <ProfitMetricCard
            profit={metrics.profit}
            virementPeriod={metrics.virementPeriod}
            onClick={onProfitCardClick}
          />
        </div>

        {/* Paid Profit Card */}
        <div className="order-4">
          <PaidProfitMetricCard
            paidProfit={metrics.paidProfit}
            totalProfit={metrics.profit}
            virementPeriod={metrics.virementPeriod}
            onClick={onPaidProfitCardClick}
          />
        </div>

        {/* Supplier Payment Card */}
        <div className="order-5">
          <MetricCard
            title="Paiement Fournisseur"
            value={`${metrics.supplierPayment.toLocaleString("fr-DZ")} DZD`}
            color="purple"
            icon={Truck}
            className="h-full"
          >
            <div className="mt-2 space-y-2">
              {/* Payment Status */}
              <div className="bg-purple-50 rounded-lg p-2 border border-purple-200">
                <p className="text-xs text-purple-700 font-medium">
                  💰 Montant à payer
                </p>
                <p className="text-xs text-purple-600 mt-1">
                  Basé sur les ventes effectuées
                </p>
              </div>

              {/* Period Information */}
              {metrics.virementPeriod &&
                metrics.virementPeriod !== "mois en cours" && (
                  <div className="bg-indigo-50 rounded-lg p-2 border border-indigo-200">
                    <p className="text-xs text-indigo-700 font-medium">
                      📅 Période: {metrics.virementPeriod}
                    </p>
                    <p className="text-xs text-indigo-600 mt-1">
                      Calculé sur cette période
                    </p>
                  </div>
                )}
            </div>
          </MetricCard>
        </div>

        {/* Fragment Stock Card */}
        <div className="order-6">
          <MetricCard
            title="Stock Fragrances"
            value={`${metrics.fragmentStock.toLocaleString("fr-DZ")} unités`}
            color="emerald"
            icon={Package}
            className="h-full"
          >
            <div className="mt-2 space-y-2">
              {/* Fragment Stock Info */}
              <div className="bg-emerald-50 rounded-lg p-2 border border-emerald-200">
                <p className="text-xs text-emerald-700 font-medium">
                  🌸 Fragrances disponibles
                </p>
                <p className="text-xs text-emerald-600 mt-1">
                  Stock de parfums en détail
                </p>
              </div>

              {/* Mobile-specific touch feedback */}
              {isMobile && (
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-8 h-8 bg-emerald-100 rounded-full">
                    <Package className="h-4 w-4 text-emerald-600" />
                  </div>
                </div>
              )}
            </div>
          </MetricCard>
        </div>
      </div>
    );
  }
);
MetricsGrid.displayName = "MetricsGrid";
