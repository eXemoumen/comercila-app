import React from "react";
import { SalesMetricCard } from "./SalesMetricCard";
import { ProfitMetricCard } from "./ProfitMetricCard";
import { PaidProfitMetricCard } from "./PaidProfitMetricCard";
import { StockMetricCard } from "./StockMetricCard";
import { SupplierPaymentCard } from "./SupplierPaymentCard";

export interface MonthlySalesData {
  quantity: number;
  revenue: number;
  profit: number;
  stock: number;
  supplierPayment: number;
  paidProfit: number;
  fragmentStock: number;
}

export interface MetricsGridProps {
  metrics: MonthlySalesData;
  maxStock?: number;
  className?: string;
}

export const MetricsGrid: React.FC<MetricsGridProps> = React.memo(
  function MetricsGrid({ metrics, maxStock = 2700, className = "" }) {
    return (
      <div className={`space-y-4 ${className}`}>
        {/* Primary Metrics - Most Important (Top Row) */}
        <div className="grid grid-cols-2 gap-3">
          <SalesMetricCard
            quantity={metrics.quantity}
            revenue={metrics.revenue}
          />
          <ProfitMetricCard profit={metrics.profit} />
        </div>

        {/* Secondary Metrics - Important but Secondary (Bottom Row) */}
        <div className="grid grid-cols-3 gap-3">
          <PaidProfitMetricCard
            paidProfit={metrics.paidProfit}
            totalProfit={metrics.profit}
          />
          <StockMetricCard
            stock={metrics.stock}
            fragmentStock={metrics.fragmentStock}
            maxStock={maxStock}
          />
          <SupplierPaymentCard
            supplierPayment={metrics.supplierPayment}
            totalRevenue={metrics.revenue}
          />
        </div>
      </div>
    );
  }
);

MetricsGrid.displayName = "MetricsGrid";
