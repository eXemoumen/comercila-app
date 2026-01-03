"use client";

import React, { useMemo, useCallback } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
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
  type?: "estimated" | "real";
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    color: string;
    payload: {
      fullName: string;
      benefit: number;
      quantity: number;
    };
  }>;
  label?: string;
  type: "estimated" | "real";
}

const CustomTooltip = React.memo(
  ({ active, payload, type }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isReal = type === "real";
      
      return (
        <div className="bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-xl border border-gray-100">
          <p className="text-sm font-semibold text-gray-800 mb-2">
            {data.fullName}
          </p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isReal ? 'bg-blue-500' : 'bg-emerald-500'}`} />
              <span className="text-xs text-gray-500">Bénéfice:</span>
              <span className={`text-sm font-bold ${isReal ? 'text-blue-600' : 'text-emerald-600'}`}>
                {data.benefit.toLocaleString("fr-DZ")} DZD
              </span>
            </div>
            {data.quantity > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gray-300" />
                <span className="text-xs text-gray-500">Quantité:</span>
                <span className="text-sm font-medium text-gray-700">
                  {Math.floor(data.quantity / 9)} cartons
                </span>
              </div>
            )}
          </div>
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
    const monthA = a[0].split(" ")[0].toLowerCase();
    const yearA = a[0].split(" ")[1];
    const monthB = b[0].split(" ")[0].toLowerCase();
    const yearB = b[0].split(" ")[1];

    if (yearA !== yearB) {
      return parseInt(yearA) - parseInt(yearB);
    }

    return (monthNamesMap[monthA] || 0) - (monthNamesMap[monthB] || 0);
  });
}

export const MonthlyBenefitsChart = React.memo(
  ({
    data,
    height = 220,
    className = "",
    currentMonthProfit = 0,
    type = "estimated",
  }: MonthlyBenefitsChartProps) => {
    const isReal = type === "real";
    
    // Colors based on type
    const colors = useMemo(() => ({
      stroke: isReal ? "#3b82f6" : "#10b981",
      fill: isReal ? "url(#blueGradient)" : "url(#greenGradient)",
      stopColor1: isReal ? "#3b82f6" : "#10b981",
      stopColor2: isReal ? "#93c5fd" : "#6ee7b7",
    }), [isReal]);

    // Transform and sort data for the chart
    const chartData = useMemo(() => {
      return sortMonthlyData(data)
        .slice(-6)
        .map(([month, monthData]) => ({
          name: month.split(" ")[0].substring(0, 3),
          fullName: month,
          benefit: monthData.netBenefit,
          quantity: monthData.quantity,
        }));
    }, [data]);

    const chartMargin = useMemo(
      () => ({ top: 20, right: 20, left: 0, bottom: 0 }),
      []
    );

    const tickFormatter = useCallback(
      (value: number) => `${(value / 1000).toFixed(0)}k`,
      []
    );

    const formattedCurrentMonthProfit = useMemo(
      () => currentMonthProfit.toLocaleString("fr-DZ"),
      [currentMonthProfit]
    );

    // Calculate max value for better Y axis
    const maxBenefit = useMemo(() => {
      const max = Math.max(...chartData.map(d => d.benefit), 0);
      return Math.ceil(max / 10000) * 10000 || 10000;
    }, [chartData]);

    return (
      <div className={`w-full ${className}`}>
        <div style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={chartMargin}>
              <defs>
                <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#e5e7eb" 
                vertical={false}
              />
              
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#6b7280", fontWeight: 500 }}
                dy={10}
              />
              
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                tickFormatter={tickFormatter}
                domain={[0, maxBenefit]}
                width={45}
              />
              
              <Tooltip 
                content={<CustomTooltip type={type} />}
                cursor={{ stroke: colors.stroke, strokeWidth: 1, strokeDasharray: "5 5" }}
              />
              
              <Area
                type="monotone"
                dataKey="benefit"
                stroke={colors.stroke}
                strokeWidth={3}
                fill={colors.fill}
                dot={{ 
                  fill: colors.stroke, 
                  strokeWidth: 2, 
                  stroke: "#fff",
                  r: 4
                }}
                activeDot={{ 
                  r: 6, 
                  fill: colors.stroke,
                  stroke: "#fff",
                  strokeWidth: 2
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Footer with current month info */}
        <div className={`mt-4 p-3 rounded-xl ${isReal ? 'bg-blue-50' : 'bg-emerald-50'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isReal ? 'bg-blue-500' : 'bg-emerald-500'}`} />
              <span className="text-sm text-gray-600">
                {isReal ? "Bénéfice réel ce mois" : "Bénéfice estimé ce mois"}
              </span>
            </div>
            <span className={`text-lg font-bold ${isReal ? 'text-blue-600' : 'text-emerald-600'}`}>
              {formattedCurrentMonthProfit} DZD
            </span>
          </div>
        </div>
      </div>
    );
  }
);

MonthlyBenefitsChart.displayName = "MonthlyBenefitsChart";
