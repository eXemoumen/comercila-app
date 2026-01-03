"use client";

import React from "react";
import { Wallet, ChevronRight, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const periodLabel =
    virementPeriod && virementPeriod !== "mois en cours"
      ? `Bénéfice Réel • ${virementPeriod}`
      : "Bénéfice Réel";

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-2xl bg-white border border-blue-100 transition-all duration-300",
        "hover:shadow-xl hover:-translate-y-1",
        onClick && "cursor-pointer",
        className
      )}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {/* Gradient accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 via-indigo-500 to-violet-500" />

      {/* Background decoration */}
      <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-[0.07] bg-gradient-to-br from-blue-400 to-indigo-500 transition-transform duration-500 group-hover:scale-150" />

      <div className="relative p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-500 mb-1">{periodLabel}</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold text-gray-900 tracking-tight animate-count">
                {paidProfit.toLocaleString("fr-DZ")} DZD
              </h3>
            </div>
          </div>

          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 transition-transform duration-300 group-hover:scale-110">
            <Wallet className="h-6 w-6 text-blue-600" />
          </div>
        </div>

        {/* Info Section */}
        <div className="space-y-3">
          {/* Profit Explanation */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-3 border border-blue-100/50">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
              <p className="text-xs text-blue-700 font-medium">
                Basé sur la date de paiement
              </p>
            </div>
            <p className="text-xs text-blue-600">
              Bénéfice réellement encaissé
            </p>
          </div>

          {/* Click Indicator */}
          {onClick && (
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-100 group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors">
              <span className="text-xs font-medium text-gray-600 group-hover:text-blue-700">
                Voir le détail mensuel
              </span>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
