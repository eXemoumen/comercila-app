import React, { useMemo } from "react";
import { MetricCard } from "./MetricCard";
import { DollarSign } from "lucide-react";

export interface PaidProfitMetricCardProps {
  paidProfit: number;
  totalProfit: number;
  className?: string;
  virementPeriod?: string;
  onClick?: () => void;
}

export const PaidProfitMetricCard: React.FC<PaidProfitMetricCardProps> =
  React.memo(function PaidProfitMetricCard({
    paidProfit,
    totalProfit,
    className,
    virementPeriod = "mois en cours",
    onClick,
  }) {
    const percentage = useMemo(
      () =>
        totalProfit > 0 ? Math.round((paidProfit / totalProfit) * 100) : 0,
      [paidProfit, totalProfit]
    );

    const formattedPaidProfit = useMemo(
      () => paidProfit.toLocaleString("fr-DZ"),
      [paidProfit]
    );

    const periodLabel = useMemo(() => {
      if (virementPeriod === "mois en cours") {
        return "Bénéfice payé du mois";
      } else if (virementPeriod.includes("mois")) {
        return `Bénéfice payé sur ${virementPeriod}`;
      }
      return "Bénéfice réel (payé)";
    }, [virementPeriod]);

    return (
      <div
        onClick={onClick}
        className={`cursor-pointer transition-transform hover:scale-105 ${className}`}
      >
        <MetricCard
          title={periodLabel}
          value={`${formattedPaidProfit} DZD`}
          color="amber"
          icon={DollarSign}
          percentage={percentage}
          className="h-full"
        >
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full">
              Ventes payées uniquement
            </span>
            <span className="text-sm font-medium text-amber-600">
              {percentage}%
            </span>
          </div>
          {virementPeriod !== "mois en cours" && (
            <p className="text-xs text-gray-500 mt-1">
              Période: {virementPeriod}
            </p>
          )}
          {onClick && (
            <p className="text-xs text-blue-600 mt-2 font-medium">
              👆 Cliquez pour voir le détail mensuel
            </p>
          )}
        </MetricCard>
      </div>
    );
  });

PaidProfitMetricCard.displayName = "PaidProfitMetricCard";
