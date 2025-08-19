"use client";

import React, { useMemo, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface MonthlyData {
  quantity: number;
  value: number;
  netBenefit: number;
}

interface MonthlyBenefitsChartProps {
  data: Record<string, MonthlyData>;
  height?: number;
  className?: string;
  currentMonthProfit?: number;
  type?: "estimated" | "real"; // Add type prop to differentiate between estimated and real benefits
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    color: string;
  }>;
  label?: string;
}

const CustomTooltip = React.memo(
  ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="text-sm font-medium text-gray-700">{label}</p>
          <p className="text-sm text-green-600">
            <span className="font-medium">
              Bénéfice:{" "}
              {`${Number(payload[0].value).toLocaleString("fr-DZ")} DZD`}
            </span>
          </p>
        </div>
      );
    }
    return null;
  }
);

CustomTooltip.displayName = "CustomTooltip";

// French month names mapping for proper sorting
const monthNamesMap: Record<string, number> = {
  janvier: 0,
  février: 1,
  mars: 2,
  avril: 3,
  mai: 4,
  juin: 5,
  juillet: 6,
  août: 7,
  septembre: 8,
  octobre: 9,
  novembre: 10,
  décembre: 11,
};

function sortMonthlyData(data: Record<string, MonthlyData>) {
  return Object.entries(data).sort((a, b) => {
    // Extract month and year from the formatted strings
    const monthA = a[0].split(" ")[0].toLowerCase();
    const yearA = a[0].split(" ")[1];
    const monthB = b[0].split(" ")[0].toLowerCase();
    const yearB = b[0].split(" ")[1];

    // Compare years first
    if (yearA !== yearB) {
      return parseInt(yearA) - parseInt(yearB);
    }

    // If years are equal, compare months
    return (monthNamesMap[monthA] || 0) - (monthNamesMap[monthB] || 0);
  });
}

export const MonthlyBenefitsChart = React.memo(
  ({
    data,
    height = 200,
    className = "",
    currentMonthProfit = 0,
    type = "estimated", // Default to estimated
  }: MonthlyBenefitsChartProps) => {
    // Transform and sort data for the chart
    const chartData = useMemo(() => {
      const barColor = type === "real" ? "#3b82f6" : "#22c55e"; // Blue for real, green for estimated

      return (
        sortMonthlyData(data)
          // Take only the last 6 months of data for better visualization
          .slice(-6)
          .map(([month, monthData]) => ({
            name: month.split(" ")[0].substring(0, 3), // Abbreviated month name
            fullName: month,
            benefit: monthData.netBenefit,
            fill: barColor,
          }))
      );
    }, [data, type]);

    const chartMargin = useMemo(
      () => ({
        top: 5,
        right: 5,
        left: 5,
        bottom: 5,
      }),
      []
    );

    const tickFormatter = useCallback(
      (value: number) => `${(value / 1000).toFixed(0)}k`,
      []
    );

    const xAxisTick = useMemo(
      () => ({
        fontSize: 12,
        fill: "#6B7280",
      }),
      []
    );

    const yAxisTick = useMemo(
      () => ({
        fontSize: 12,
        fill: "#6B7280",
      }),
      []
    );

    const tooltipCursor = useMemo(
      () => ({
        fill:
          type === "real"
            ? "rgba(59, 130, 246, 0.1)"
            : "rgba(34, 197, 94, 0.1)",
      }),
      [type]
    );

    const barRadius = useMemo(
      () => [4, 4, 0, 0] as [number, number, number, number],
      []
    );

    const formattedCurrentMonthProfit = useMemo(
      () => currentMonthProfit.toLocaleString("fr-DZ"),
      [currentMonthProfit]
    );

    return (
      <div className={`w-full ${className}`}>
        <div style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={chartMargin} accessibilityLayer>
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={xAxisTick}
                aria-label="Mois"
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={yAxisTick}
                tickFormatter={tickFormatter}
                aria-label="Bénéfice en DZD"
              />
              <Tooltip content={<CustomTooltip />} cursor={tooltipCursor} />
              <Bar
                dataKey="benefit"
                radius={barRadius}
                name="Bénéfice"
                aria-label="Bénéfice mensuel"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Footer with current month info */}
        <div className="px-4 py-2 text-xs text-gray-500 bg-gray-50 rounded-b-xl">
          {type === "real"
            ? "Bénéfice réel ce mois-ci:"
            : "Bénéfice estimé ce mois-ci:"}{" "}
          <span
            className={`font-medium ${
              type === "real" ? "text-blue-600" : "text-green-600"
            }`}
          >
            {formattedCurrentMonthProfit} DZD
          </span>
          <div className="flex items-center mt-1 gap-2">
            <div className="flex items-center">
              <div
                className={`w-3 h-3 rounded-full mr-1 ${
                  type === "real" ? "bg-blue-500" : "bg-green-500"
                }`}
              ></div>
              <span>
                {type === "real"
                  ? "Bénéfice réel mensuel"
                  : "Bénéfice estimé mensuel"}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }
);
