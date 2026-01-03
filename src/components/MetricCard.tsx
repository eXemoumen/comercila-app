"use client";

import React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type MetricCardColor =
  | "blue"
  | "green"
  | "amber"
  | "purple"
  | "red"
  | "emerald"
  | "indigo"
  | "cyan"
  | "rose";

export interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  additionalInfo?: string;
  color: MetricCardColor;
  icon?: LucideIcon;
  percentage?: number;
  showProgressBar?: boolean;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  className?: string;
  children?: React.ReactNode;
  onClick?: () => void;
}

const colorConfig: Record<
  MetricCardColor,
  {
    gradient: string;
    gradientLight: string;
    text: string;
    textLight: string;
    iconBg: string;
    iconColor: string;
    progressBar: string;
    border: string;
    glow: string;
  }
> = {
  blue: {
    gradient: "from-blue-500 via-blue-600 to-indigo-600",
    gradientLight: "from-blue-50 to-indigo-50",
    text: "text-blue-700",
    textLight: "text-blue-600",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    progressBar: "from-blue-500 to-indigo-500",
    border: "border-blue-100",
    glow: "shadow-blue-500/20",
  },
  green: {
    gradient: "from-emerald-500 via-green-500 to-teal-500",
    gradientLight: "from-emerald-50 to-teal-50",
    text: "text-emerald-700",
    textLight: "text-emerald-600",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    progressBar: "from-emerald-500 to-teal-500",
    border: "border-emerald-100",
    glow: "shadow-emerald-500/20",
  },
  amber: {
    gradient: "from-amber-500 via-orange-500 to-yellow-500",
    gradientLight: "from-amber-50 to-yellow-50",
    text: "text-amber-700",
    textLight: "text-amber-600",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    progressBar: "from-amber-500 to-yellow-500",
    border: "border-amber-100",
    glow: "shadow-amber-500/20",
  },
  purple: {
    gradient: "from-purple-500 via-violet-500 to-indigo-500",
    gradientLight: "from-purple-50 to-indigo-50",
    text: "text-purple-700",
    textLight: "text-purple-600",
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
    progressBar: "from-purple-500 to-indigo-500",
    border: "border-purple-100",
    glow: "shadow-purple-500/20",
  },
  red: {
    gradient: "from-red-500 via-rose-500 to-pink-500",
    gradientLight: "from-red-50 to-pink-50",
    text: "text-red-700",
    textLight: "text-red-600",
    iconBg: "bg-red-100",
    iconColor: "text-red-600",
    progressBar: "from-red-500 to-pink-500",
    border: "border-red-100",
    glow: "shadow-red-500/20",
  },
  emerald: {
    gradient: "from-emerald-500 via-teal-500 to-cyan-500",
    gradientLight: "from-emerald-50 to-cyan-50",
    text: "text-emerald-700",
    textLight: "text-emerald-600",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    progressBar: "from-emerald-500 to-cyan-500",
    border: "border-emerald-100",
    glow: "shadow-emerald-500/20",
  },
  indigo: {
    gradient: "from-indigo-500 via-blue-500 to-violet-500",
    gradientLight: "from-indigo-50 to-violet-50",
    text: "text-indigo-700",
    textLight: "text-indigo-600",
    iconBg: "bg-indigo-100",
    iconColor: "text-indigo-600",
    progressBar: "from-indigo-500 to-violet-500",
    border: "border-indigo-100",
    glow: "shadow-indigo-500/20",
  },
  cyan: {
    gradient: "from-cyan-500 via-teal-500 to-blue-500",
    gradientLight: "from-cyan-50 to-blue-50",
    text: "text-cyan-700",
    textLight: "text-cyan-600",
    iconBg: "bg-cyan-100",
    iconColor: "text-cyan-600",
    progressBar: "from-cyan-500 to-blue-500",
    border: "border-cyan-100",
    glow: "shadow-cyan-500/20",
  },
  rose: {
    gradient: "from-rose-500 via-pink-500 to-fuchsia-500",
    gradientLight: "from-rose-50 to-fuchsia-50",
    text: "text-rose-700",
    textLight: "text-rose-600",
    iconBg: "bg-rose-100",
    iconColor: "text-rose-600",
    progressBar: "from-rose-500 to-fuchsia-500",
    border: "border-rose-100",
    glow: "shadow-rose-500/20",
  },
};

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  additionalInfo,
  color,
  icon: Icon,
  percentage,
  showProgressBar = false,
  trend,
  trendValue,
  className = "",
  children,
  onClick,
}) => {
  const config = colorConfig[color] || colorConfig.blue;

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl bg-white border transition-all duration-300",
        "hover:shadow-xl hover:-translate-y-1",
        config.border,
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {/* Gradient accent bar */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 h-1 bg-gradient-to-r",
          config.gradient
        )}
      />

      {/* Background decoration */}
      <div
        className={cn(
          "absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-[0.07] bg-gradient-to-br transition-transform duration-500 group-hover:scale-150",
          config.gradient
        )}
      />

      <div className="relative p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold text-gray-900 tracking-tight animate-count">
                {value}
              </h3>
              {trend && trendValue && (
                <span
                  className={cn(
                    "inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full",
                    trend === "up" && "bg-emerald-100 text-emerald-700",
                    trend === "down" && "bg-red-100 text-red-700",
                    trend === "neutral" && "bg-gray-100 text-gray-700"
                  )}
                >
                  {trend === "up" && "↑"}
                  {trend === "down" && "↓"}
                  {trendValue}
                </span>
              )}
            </div>
          </div>

          {Icon && (
            <div
              className={cn(
                "flex items-center justify-center w-12 h-12 rounded-xl transition-transform duration-300 group-hover:scale-110",
                config.iconBg
              )}
            >
              <Icon className={cn("h-6 w-6", config.iconColor)} />
            </div>
          )}
        </div>

        {/* Subtitle */}
        {subtitle && (
          <p className="text-sm text-gray-600 mb-3">{subtitle}</p>
        )}

        {/* Additional Info */}
        {additionalInfo && (
          <p className={cn("text-lg font-semibold", config.textLight)}>
            {additionalInfo}
          </p>
        )}

        {/* Progress Bar */}
        {showProgressBar && percentage !== undefined && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500">Progression</span>
              <span className={cn("text-xs font-bold", config.text)}>
                {percentage}%
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full bg-gradient-to-r transition-all duration-700 ease-out",
                  config.progressBar
                )}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Children */}
        {children && <div className="mt-4">{children}</div>}
      </div>
    </div>
  );
};
