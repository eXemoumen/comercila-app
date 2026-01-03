"use client";

import React, { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Package, Sparkles } from "lucide-react";

interface FragranceStockData {
  name: string;
  value: number;
  color: string;
}

interface FragranceStockChartProps {
  data: FragranceStockData[];
  height?: number;
  className?: string;
  totalStock?: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    payload: FragranceStockData;
  }>;
}

const CustomTooltip = React.memo(({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-xl border border-gray-100">
        <div className="flex items-center gap-2 mb-2">
          <div
            className="w-4 h-4 rounded-full shadow-sm"
            style={{ backgroundColor: data.color }}
          />
          <p className="text-sm font-semibold text-gray-800">{data.name}</p>
        </div>
        <div className="space-y-1">
          <p className="text-lg font-bold text-gray-900">
            {data.value} cartons
          </p>
          <p className="text-xs text-gray-500">
            {data.value * 9} pièces
          </p>
        </div>
      </div>
    );
  }
  return null;
});

CustomTooltip.displayName = "CustomTooltip";

const CustomLabel = React.memo(
  ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }: {
    cx: number;
    cy: number;
    midAngle: number;
    innerRadius: number;
    outerRadius: number;
    percent: number;
  }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.08) return null;

    return (
      <text
        x={x}
        y={y}
        fill="#fff"
        textAnchor="middle"
        dominantBaseline="central"
        className="text-xs font-bold drop-shadow-md"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  }
);

CustomLabel.displayName = "CustomLabel";

export const FragranceStockChart = React.memo(function FragranceStockChart({
  data,
  height = 280,
  className = "",
  totalStock = 0,
}: FragranceStockChartProps) {
  const filteredData = useMemo(
    () => data.filter((item) => item.value > 0),
    [data]
  );

  const totalCartons = useMemo(
    () => Math.floor(totalStock / 9),
    [totalStock]
  );

  const totalPieces = useMemo(
    () => filteredData.reduce((sum, item) => sum + item.value * 9, 0),
    [filteredData]
  );

  const outerRadius = useMemo(() => Math.min(height * 0.35, 90), [height]);
  const innerRadius = useMemo(() => outerRadius * 0.6, [outerRadius]);

  if (filteredData.length === 0) {
    return (
      <div className={`w-full ${className}`}>
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-100 to-violet-100 flex items-center justify-center mb-4">
            <Package className="w-10 h-10 text-purple-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Stock vide
          </h3>
          <p className="text-sm text-gray-500 text-center max-w-xs">
            Aucun stock de fragrances disponible. Ajoutez du stock pour voir la distribution.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={filteredData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={outerRadius}
              innerRadius={innerRadius}
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
              label={CustomLabel}
              paddingAngle={2}
            >
              {filteredData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  stroke="#fff"
                  strokeWidth={3}
                  className="transition-all duration-300 hover:opacity-80"
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Center Stats */}
      <div className="flex justify-center -mt-4 mb-4">
        <div className="bg-white rounded-2xl shadow-lg px-6 py-3 border border-gray-100">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{totalCartons}</p>
            <p className="text-xs text-gray-500">cartons total</p>
          </div>
        </div>
      </div>

      {/* Legend Grid */}
      <div className="grid grid-cols-2 gap-2 px-2">
        {filteredData.map((item, index) => (
          <div
            key={index}
            className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <div
              className="w-3 h-3 rounded-full shadow-sm flex-shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-700 truncate">
                {item.name}
              </p>
            </div>
            <span className="text-xs font-bold text-gray-900">
              {item.value}
            </span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-500" />
            <span className="text-sm text-purple-700">
              {filteredData.length} fragrances en stock
            </span>
          </div>
          <span className="text-sm font-bold text-purple-700">
            {totalPieces.toLocaleString("fr-DZ")} pièces
          </span>
        </div>
      </div>
    </div>
  );
});
