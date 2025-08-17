import React, { useMemo } from "react";
import { TrendingUp } from "lucide-react";
import { MetricCard } from "./MetricCard";
import { isAndroid, mobileUtils } from "@/utils/mobileConfig";

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
    const formattedProfit = useMemo(() => {
      return profit.toLocaleString("fr-DZ");
    }, [profit]);

    const periodLabel = useMemo(() => {
      if (virementPeriod === "mois en cours") {
        return "Bénéfice Estimé du mois";
      } else if (virementPeriod.includes("mois")) {
        return `Bénéfice Estimé sur ${virementPeriod}`;
      }
      return "Bénéfice Estimé";
    }, [virementPeriod]);

    // Check if mobile and apply Android optimizations
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

    if (isAndroid() && isMobile) {
      // Apply Android-specific optimizations
      React.useEffect(() => {
        mobileUtils.optimizeTouchInteractions();
      }, []);
    }

    return (
      <div
        onClick={onClick}
        className={`transition-all duration-200 ${
          onClick
            ? "cursor-pointer hover:scale-105 active:scale-95 touch-manipulation"
            : ""
        } ${className}`}
        style={{
          minHeight: isMobile ? "44px" : "auto",
          minWidth: isMobile ? "44px" : "auto",
        }}
      >
        <MetricCard
          title={periodLabel}
          value={`${formattedProfit} DZD`}
          color="green"
          icon={TrendingUp}
          className="h-full"
        >
          <div className="mt-2 space-y-2">
            {/* Period Information */}
            {virementPeriod !== "mois en cours" && (
              <div className="bg-blue-50 rounded-lg p-2 border border-blue-200">
                <p className="text-xs text-blue-700 font-medium">
                  📅 Période: {virementPeriod}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Bénéfices calculés sur cette période
                </p>
              </div>
            )}

            {/* Click Indicator */}
            {onClick && (
              <div className="bg-green-50 rounded-lg p-2 border border-green-200">
                <p className="text-xs text-green-700 font-medium flex items-center">
                  👆 Cliquez pour voir le détail mensuel
                </p>
                {isMobile && (
                  <p className="text-xs text-green-600 mt-1">
                    Appuyez pour ouvrir
                  </p>
                )}
              </div>
            )}

            {/* Mobile-specific touch feedback */}
            {isMobile && onClick && (
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
              </div>
            )}
          </div>
        </MetricCard>
      </div>
    );
  }
);
