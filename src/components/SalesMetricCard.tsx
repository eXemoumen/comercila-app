import React, { useMemo } from "react";
import { MetricCard } from "./MetricCard";
import { ShoppingCart } from "lucide-react";

export interface SalesMetricCardProps {
    quantity: number;
    revenue: number;
    className?: string;
}

export const SalesMetricCard: React.FC<SalesMetricCardProps> = React.memo(function SalesMetricCard({
    quantity,
    revenue,
    className
}) {
    const cartons = useMemo(() => Math.floor(quantity / 9), [quantity]);

    const formattedRevenue = useMemo(() =>
        revenue.toLocaleString("fr-DZ"),
        [revenue]
    );

    return (
        <MetricCard
            title="Ventes Totales"
            value={`${quantity} pièces`}
            subtitle={`${cartons} cartons`}
            additionalInfo={`${formattedRevenue} DZD`}
            color="blue"
            icon={ShoppingCart}
            className={className}
        />
    );
});

SalesMetricCard.displayName = 'SalesMetricCard';