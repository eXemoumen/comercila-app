import React, { useEffect, useState } from "react";
import { DollarSign } from "lucide-react";
import { MetricCard } from "./MetricCard";
import { isAndroid, mobileUtils } from "@/utils/mobileConfig";

export interface PaidProfitMetricCardProps {
  paidProfit: number;
  className?: string;
  virementPeriod?: string;
  onClick?: () => void;
}

export const PaidProfitMetricCard: React.FC<PaidProfitMetricCardProps> = ({
  paidProfit,
  virementPeriod,
  onClick,
  className = "",
}) => {
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile and apply Android optimizations
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);

      if (isAndroid() && mobile) {
        console.log("🤖 Android mobile detected - applying optimizations");
        mobileUtils.optimizeTouchInteractions();
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Determine period label
  const periodLabel =
    virementPeriod && virementPeriod !== "mois en cours"
      ? `Bénéfice Réel sur ${virementPeriod}`
      : "Bénéfice Réel du mois";

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
        value={`${paidProfit.toLocaleString("fr-DZ")} DZD`}
        color="blue"
        icon={DollarSign}
        className="h-full"
      >
        {onClick && (
          <div className="mt-2">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-2 border border-blue-200">
              <p className="text-xs text-blue-700 font-medium flex items-center">
                👆 Cliquez pour voir le détail mensuel
              </p>
              {isMobile && (
                <p className="text-xs text-blue-600 mt-1">
                  Appuyez pour ouvrir
                </p>
              )}
            </div>
          </div>
        )}
      </MetricCard>
    </div>
  );
};
