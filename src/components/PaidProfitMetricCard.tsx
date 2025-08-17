import React, { useMemo } from "react";
import { DollarSign } from "lucide-react";
import { MetricCard } from "./MetricCard";
import { isAndroid, mobileUtils } from "@/utils/mobileConfig";

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
    const percentage = useMemo(() => {
      if (totalProfit === 0) return 0;
      return Math.round((paidProfit / totalProfit) * 100);
    }, [paidProfit, totalProfit]);

    const formattedPaidProfit = useMemo(() => {
      return paidProfit.toLocaleString("fr-DZ");
    }, [paidProfit]);

    const periodLabel = useMemo(() => {
      if (virementPeriod === "mois en cours") {
        return "Bénéfice payé du mois";
      } else if (virementPeriod.includes("mois")) {
        return `Bénéfice payé sur ${virementPeriod}`;
      }
      return "Bénéfice réel (payé)";
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
          value={`${formattedPaidProfit} DZD`}
          color="amber"
          icon={DollarSign}
          percentage={percentage}
          className="h-full"
        >
          <div className="mt-2 space-y-2">
            {/* Progress Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-gray-600">
                <span>Progression</span>
                <span>{percentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-amber-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Payé: {paidProfit.toLocaleString("fr-DZ")} DZD</span>
                <span>Total: {totalProfit.toLocaleString("fr-DZ")} DZD</span>
              </div>
            </div>

            {/* Period Information */}
            {virementPeriod !== "mois en cours" && (
              <div className="bg-amber-50 rounded-lg p-2 border border-amber-200">
                <p className="text-xs text-amber-700 font-medium">
                  📅 Période: {virementPeriod}
                </p>
                <p className="text-xs text-amber-600 mt-1">
                  Bénéfices payés sur cette période
                </p>
              </div>
            )}

            {/* Click Indicator */}
            {onClick && (
              <div className="bg-amber-50 rounded-lg p-2 border border-amber-200">
                <p className="text-xs text-amber-700 font-medium flex items-center">
                  👆 Cliquez pour voir le détail mensuel
                </p>
                {isMobile && (
                  <p className="text-xs text-amber-600 mt-1">
                    Appuyez pour ouvrir
                  </p>
                )}
              </div>
            )}

            {/* Mobile-specific touch feedback */}
            {isMobile && onClick && (
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-8 h-8 bg-amber-100 rounded-full">
                  <DollarSign className="h-4 w-4 text-amber-600" />
                </div>
              </div>
            )}
          </div>
        </MetricCard>
      </div>
    );
  });
