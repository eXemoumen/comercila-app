import React, { useMemo } from "react";
import { MetricCard } from "./MetricCard";
import { Package } from "lucide-react";

export interface StockMetricCardProps {
    stock: number;
    maxStock?: number;
    className?: string;
}

export const StockMetricCard: React.FC<StockMetricCardProps> = React.memo(function StockMetricCard({
    stock,
    maxStock = 2700,
    className
}) {
    const cartons = useMemo(() => Math.floor(stock / 9), [stock]);
    const percentage = useMemo(() => Math.round((stock / maxStock) * 100), [stock, maxStock]);

    return (
        <MetricCard
            title="Niveau de Stock"
            value={`${cartons} cartons`}
            subtitle={`${stock} pièces`}
            color="purple"
            icon={Package}
            percentage={percentage}
            showProgressBar={true}
            className={`col-span-2 ${className}`}
        >
            <div className="flex justify-between items-center">
                <div>
                    <div className="text-2xl font-bold text-gray-800">
                        {cartons} cartons
                    </div>
                    <div className="text-sm text-gray-500">
                        {stock} pièces
                    </div>
                </div>
                <div className="text-3xl font-bold text-purple-500">
                    {percentage}%
                </div>
            </div>
        </MetricCard>
    );
});

StockMetricCard.displayName = 'StockMetricCard';