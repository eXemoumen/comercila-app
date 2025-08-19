import React from "react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

export type MetricCardColor =
  | "blue"
  | "green"
  | "amber"
  | "purple"
  | "red"
  | "emerald"
  | "indigo";

export interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  additionalInfo?: string;
  color: MetricCardColor;
  icon?: LucideIcon;
  percentage?: number;
  showProgressBar?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const colorConfig: Record<
  MetricCardColor,
  {
    gradient: string;
    text: string;
    accent: string;
    background: string;
    progressBar: string;
    cardBg: string;
    iconBg: string;
  }
> = {
  blue: {
    gradient: "bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700",
    text: "text-blue-600",
    accent: "text-blue-500",
    background: "bg-blue-100",
    progressBar: "bg-blue-500",
    cardBg: "bg-gradient-to-br from-white to-blue-50",
    iconBg: "bg-blue-100",
  },
  green: {
    gradient: "bg-gradient-to-br from-green-500 via-green-600 to-green-700",
    text: "text-green-600",
    accent: "text-green-500",
    background: "bg-green-100",
    progressBar: "bg-green-500",
    cardBg: "bg-gradient-to-br from-white to-green-50",
    iconBg: "bg-green-100",
  },
  amber: {
    gradient: "bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700",
    text: "text-amber-600",
    accent: "text-amber-500",
    background: "bg-amber-100",
    progressBar: "bg-amber-500",
    cardBg: "bg-gradient-to-br from-white to-amber-50",
    iconBg: "bg-amber-100",
  },
  purple: {
    gradient: "bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700",
    text: "text-purple-600",
    accent: "text-purple-500",
    background: "bg-purple-100",
    progressBar: "bg-purple-500",
    cardBg: "bg-gradient-to-br from-white to-purple-50",
    iconBg: "bg-purple-100",
  },
  red: {
    gradient: "bg-gradient-to-br from-red-500 via-red-600 to-red-700",
    text: "text-red-600",
    accent: "text-red-500",
    background: "bg-red-100",
    progressBar: "bg-red-500",
    cardBg: "bg-gradient-to-br from-white to-red-50",
    iconBg: "bg-red-100",
  },
  emerald: {
    gradient:
      "bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700",
    text: "text-emerald-600",
    accent: "text-emerald-500",
    background: "bg-emerald-100",
    progressBar: "bg-emerald-500",
    cardBg: "bg-gradient-to-br from-white to-emerald-50",
    iconBg: "bg-emerald-100",
  },
  indigo: {
    gradient: "bg-gradient-to-br from-indigo-500 via-indigo-600 to-indigo-700",
    text: "text-indigo-600",
    accent: "text-indigo-500",
    background: "bg-indigo-100",
    progressBar: "bg-indigo-500",
    cardBg: "bg-gradient-to-br from-white to-indigo-50",
    iconBg: "bg-indigo-100",
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
  className = "",
  children,
}) => {
  // Safety check: if color doesn't exist, default to blue
  const config = colorConfig[color] || colorConfig.blue;

  return (
    <Card
      className={`overflow-hidden border border-gray-100 shadow-lg rounded-xl hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 ${config.cardBg} ${className}`}
    >
      <div className="relative">
        {/* Header with gradient */}
        <div className={`${config.gradient} p-4 relative overflow-hidden`}>
          {/* Background pattern */}
          <div className="absolute inset-0 bg-white/10 opacity-20">
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
          </div>

          <div className="relative flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
              {title}
            </CardTitle>
            {Icon && (
              <div
                className={`${config.iconBg} p-2 rounded-lg bg-white/20 backdrop-blur-sm`}
              >
                <Icon className="h-5 w-5 text-white" />
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <CardContent className="p-4">
          <div className="space-y-2">
            <div className="text-3xl font-bold text-gray-900 animate-in slide-in-from-bottom-1 duration-300">
              {value}
            </div>

            {subtitle && (
              <div className="text-sm text-gray-600 animate-in slide-in-from-bottom-2 duration-300">
                {subtitle}
              </div>
            )}

            {additionalInfo && (
              <div
                className={`text-lg font-semibold ${config.text} animate-in slide-in-from-bottom-3 duration-300`}
              >
                {additionalInfo}
              </div>
            )}

            {percentage !== undefined && (
              <div className="flex items-center justify-between">
                <span className={`text-sm font-medium ${config.text}`}>
                  {percentage}%
                </span>
              </div>
            )}

            {showProgressBar && percentage !== undefined && (
              <div
                className={`h-2 w-full rounded-full ${config.background} overflow-hidden`}
              >
                <div
                  className={`h-full rounded-full ${config.progressBar} transition-all duration-700 ease-out`}
                  style={{
                    width: `${Math.min(percentage, 100)}%`,
                  }}
                />
              </div>
            )}

            {children}
          </div>
        </CardContent>
      </div>
    </Card>
  );
};
