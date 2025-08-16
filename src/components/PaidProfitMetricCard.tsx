import React, { useMemo } from "react";
import { MetricCard } from "./MetricCard";
import { DollarSign } from "lucide-react";

export interface PaidProfitMetricCardProps {
    paidProfit: number;
    totalProfit: number;
    className?: string;
}

export const PaidProfitMetricCard: React.FC<PaidProfitMetricCardProps> = React.memo(function PaidProfitMetricCard({
    paidProfit,
    totalProfit,
    className
}) {
    const percentage = useMemo(() =>
        totalProfit > 0 ? Math.round((paidProfit / totalProfit) * 100) : 0,
        [paidProfit, totalProfit]
    );

    const formattedPaidProfit = useMemo(() =>
        paidProfit.toLocaleString("fr-DZ"),
        [paidProfit]
    );

    return (
        <MetricCard
            title="Bénéfice Réel (Payé)"
            value={`${formattedPaidProfit} DZD`}
            color="amber"
            icon={DollarSign}
            percentage={percentage}
            className={className}
        >
            <div className="flex items-center justify-between mt-1">
                <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full">
                    Ventes payées uniquement
                </span>
                <span className="text-sm font-medium text-amber-600">
                    {percentage}%
                </span>
            </div>
        </MetricCard>
    );
});

PaidProfitMetricCard.displayName = 'PaidProfitMetricCard';