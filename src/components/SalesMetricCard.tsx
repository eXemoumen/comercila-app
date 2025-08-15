import React from "react";
import { MetricCard } from "./MetricCard";
import { ShoppingCart } from "lucide-react";

export interface SalesMetricCardProps {
    quantity: number;
    revenue: number;
    className?: string;
}

export const SalesMetricCard: React.FC<SalesMetricCardProps> = ({
    quantity,
    revenue,
    className
}) => {
    const cartons = Math.floor(quantity / 9);

    return (
        <MetricCard
            title="Ventes Totales"
            value={`${quantity} pièces`}
            subtitle={`${cartons} cartons`}
            additionalInfo={`${revenue.toLocaleString("fr-DZ")} DZD`}
            color="blue"
            icon={ShoppingCart}
            className={className}
        />
    );
};