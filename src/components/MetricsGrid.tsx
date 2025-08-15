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
}

export interface MetricsGridProps {
    metrics: MonthlySalesData;
    maxStock?: number;
    className?: string;
}

export const MetricsGrid: React.FC<MetricsGridProps> = ({
    metrics,
    maxStock = 2700,
    className = ""
}) => {
    return (
        <div className={`grid grid-cols-2 gap-4 ${className}`}>
            <SalesMetricCard
                quantity={metrics.quantity}
                revenue={metrics.revenue}
            />

            <ProfitMetricCard
                profit={metrics.profit}
            />

            <PaidProfitMetricCard
                paidProfit={metrics.paidProfit}
                totalProfit={metrics.profit}
            />

            <StockMetricCard
                stock={metrics.stock}
                maxStock={maxStock}
            />

            <SupplierPaymentCard
                supplierPayment={metrics.supplierPayment}
                totalRevenue={metrics.revenue}
            />
        </div>
    );
};