import React, { useMemo } from "react";
import { MetricCard } from "./MetricCard";
import { TrendingUp } from "lucide-react";

export interface ProfitMetricCardProps {
  profit: number;
  className?: string;
  virementPeriod?: string;
  onClick?: () => void;
}

export const ProfitMetricCard: React.FC<ProfitMetricCardProps> = React.memo(
  function ProfitMetricCard({
    profit,
    className,
    virementPeriod = "mois en cours",
    onClick,
  }) {
    const formattedProfit = useMemo(
      () => profit.toLocaleString("fr-DZ"),
      [profit]
    );

    const periodLabel = useMemo(() => {
      if (virementPeriod === "mois en cours") {
        return "Bénéfice du mois";
      } else if (virementPeriod.includes("mois")) {
        return `Bénéfice sur ${virementPeriod}`;
      }
      return "Bénéfice estimé";
    }, [virementPeriod]);

    return (
      <div
        onClick={onClick}
        className={`cursor-pointer transition-transform hover:scale-105 ${className}`}
      >
        <MetricCard
          title={`Bénéfice Estimé (${periodLabel})`}
          value={`${formattedProfit} DZD`}
          color="green"
          icon={TrendingUp}
          className="h-full"
        >
          <div className="flex items-center mt-1">
            <span className="text-xs px-2 py-0.5 bg-green-100 text-green-800 rounded-full">
              25 DZD/180 DZD
            </span>
            <span className="text-xs px-2 py-0.5 bg-green-100 text-green-800 rounded-full ml-1">
              17 DZD/166 DZD
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
  }
);

ProfitMetricCard.displayName = "ProfitMetricCard";
