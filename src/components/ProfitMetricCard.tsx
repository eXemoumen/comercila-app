"use client";

import React from "react";
import { TrendingUp, ChevronRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ProfitMetricCardProps {
  profit: number;
  className?: string;
  virementPeriod?: string;
  onClick?: () => void;
}

export const ProfitMetricCard: React.FC<ProfitMetricCardProps> = ({
  profit,
  virementPeriod,
  onClick,
  className = "",
}) => {
  const periodLabel =
    virementPeriod && virementPeriod !== "mois en cours"
      ? `Bénéfice Estimé • ${virementPeriod}`
      : "Bénéfice Estimé";

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-2xl bg-white border border-emerald-100 transition-all duration-300",
        "hover:shadow-xl hover:-translate-y-1",
        onClick && "cursor-pointer",
        className
      )}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {/* Gradient accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-green-500 to-teal-500" />

      {/* Background decoration */}
      <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-[0.07] bg-gradient-to-br from-emerald-400 to-teal-500 transition-transform duration-500 group-hover:scale-150" />

      <div className="relative p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-500 mb-1">{periodLabel}</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold text-gray-900 tracking-tight animate-count">
                {profit.toLocaleString("fr-DZ")} DZD
              </h3>
            </div>
          </div>

          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-100 to-green-100 transition-transform duration-300 group-hover:scale-110">
            <TrendingUp className="h-6 w-6 text-emerald-600" />
          </div>
        </div>

        {/* Info Section */}
        <div className="space-y-3">
          {/* Profit Explanation */}
          <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-3 border border-emerald-100/50">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              <p className="text-xs text-emerald-700 font-medium">
                Basé sur la date de vente
              </p>
            </div>
            <p className="text-xs text-emerald-600">
              Bénéfice calculé sur les ventes effectuées
            </p>
          </div>

          {/* Click Indicator */}
          {onClick && (
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-100 group-hover:bg-emerald-50 group-hover:border-emerald-100 transition-colors">
              <span className="text-xs font-medium text-gray-600 group-hover:text-emerald-700">
                Voir le détail mensuel
              </span>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
