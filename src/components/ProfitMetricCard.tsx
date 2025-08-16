import React, { useMemo } from "react";
import { MetricCard } from "./MetricCard";
import { TrendingUp } from "lucide-react";

export interface ProfitMetricCardProps {
    profit: number;
    className?: string;
}

export const ProfitMetricCard: React.FC<ProfitMetricCardProps> = React.memo(function ProfitMetricCard({
    profit,
    className
}) {
    const formattedProfit = useMemo(() =>
        profit.toLocaleString("fr-DZ"),
        [profit]
    );

    return (
        <MetricCard
            title="Bénéfice Estimé"
            value={`${formattedProfit} DZD`}
            color="green"
            icon={TrendingUp}
            className={className}
        >
            <div className="flex items-center mt-1">
                <span className="text-xs px-2 py-0.5 bg-green-100 text-green-800 rounded-full">
                    25 DZD/180 DZD
                </span>
                <span className="text-xs px-2 py-0.5 bg-green-100 text-green-800 rounded-full ml-1">
                    17 DZD/166 DZD
                </span>
            </div>
        </MetricCard>
    );
});

ProfitMetricCard.displayName = 'ProfitMetricCard';