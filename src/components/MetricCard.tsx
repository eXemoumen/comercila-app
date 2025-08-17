import React from "react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

export type MetricCardColor = "blue" | "green" | "amber" | "purple" | "red";

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
    iconBg: string;
    border: string;
  }
> = {
  blue: {
    gradient: "from-blue-500 to-blue-600",
    text: "text-blue-700",
    accent: "text-blue-500",
    background: "bg-blue-50",
    progressBar: "bg-blue-500",
    iconBg: "bg-blue-100",
    border: "border-blue-200",
  },
  green: {
    gradient: "from-green-500 to-green-600",
    text: "text-green-700",
    accent: "text-green-500",
    background: "bg-green-50",
    progressBar: "bg-green-500",
    iconBg: "bg-green-100",
    border: "border-green-200",
  },
  amber: {
    gradient: "from-amber-500 to-amber-600",
    text: "text-amber-700",
    accent: "text-amber-500",
    background: "bg-amber-50",
    progressBar: "bg-amber-500",
    iconBg: "bg-amber-100",
    border: "border-amber-200",
  },
  purple: {
    gradient: "from-purple-500 to-purple-600",
    text: "text-purple-700",
    accent: "text-purple-500",
    background: "bg-purple-50",
    progressBar: "bg-purple-500",
    iconBg: "bg-purple-100",
    border: "border-purple-200",
  },
  red: {
    gradient: "from-red-500 to-red-600",
    text: "text-red-700",
    accent: "text-red-500",
    background: "bg-red-50",
    progressBar: "bg-red-500",
    iconBg: "bg-red-100",
    border: "border-red-200",
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
  const config = colorConfig[color];

  return (
    <Card
      className={`overflow-hidden border-2 ${config.border} shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 ${className}`}
    >
      {/* Header with Icon and Title */}
      <div className={`${config.background} p-3 border-b ${config.border}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {Icon && (
              <div
                className={`w-8 h-8 rounded-lg ${config.iconBg} flex items-center justify-center`}
              >
                <Icon className={`h-4 w-4 ${config.text}`} />
              </div>
            )}
            <CardTitle
              className={`text-xs font-semibold ${config.text} leading-tight`}
            >
              {title}
            </CardTitle>
          </div>
          {percentage !== undefined && (
            <div
              className={`text-xs font-bold ${config.text} bg-white px-2 py-1 rounded-full`}
            >
              {percentage}%
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <CardContent className="p-3">
        {/* Primary Value - Most Important */}
        <div className="text-center mb-2">
          <div className="text-xl font-bold text-gray-800 leading-tight">
            {value}
          </div>
        </div>

        {/* Subtitle - Context Information */}
        {subtitle && (
          <div className="text-center mb-2">
            <div className="text-xs text-gray-600 leading-tight">
              {subtitle}
            </div>
          </div>
        )}

        {/* Additional Info - Secondary Value */}
        {additionalInfo && (
          <div className="text-center">
            <div
              className={`text-sm font-semibold ${config.text} leading-tight`}
            >
              {additionalInfo}
            </div>
          </div>
        )}

        {/* Progress Bar - Visual Indicator */}
        {showProgressBar && percentage !== undefined && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Progression</span>
              <span>{percentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${config.gradient} transition-all duration-500`}
                style={{
                  width: `${Math.min(percentage, 100)}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Children content */}
        {children}
      </CardContent>
    </Card>
  );
};
