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
    return (
      <div className={`grid grid-cols-2 gap-4 ${className}`}>
        <SalesMetricCard
          quantity={metrics.quantity}
          revenue={metrics.revenue}
        />

        <ProfitMetricCard
          profit={metrics.profit}
          virementPeriod={metrics.virementPeriod}
          onClick={onProfitCardClick}
        />

        <PaidProfitMetricCard
          paidProfit={metrics.paidProfit}
          totalProfit={metrics.profit}
          virementPeriod={metrics.virementPeriod}
          onClick={onPaidProfitCardClick}
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
    );
  }
);
MetricsGrid.displayName = "MetricsGrid";
