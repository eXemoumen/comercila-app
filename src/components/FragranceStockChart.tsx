"use client";

import React, { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

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
    const data = payload[0];
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
        <p className="text-sm font-medium text-gray-700">{data.name}</p>
        <p className="text-sm text-purple-600">
          <span className="font-medium">{`${data.value} cartons`}</span>
        </p>
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

    // Only show percentage if it's significant enough (>5%)
    if (percent < 0.05) return null;

    return (
      <text
        x={x}
        y={y}
        fill="#fff"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
        className="drop-shadow-sm"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  }
);

CustomLabel.displayName = "CustomLabel";

interface LegendEntry {
  value: string;
  color: string;
}

interface LegendProps {
  payload?: LegendEntry[];
}

const CustomLegend = React.memo((props: LegendProps) => {
  const { payload } = props;
  return (
    <div className="flex flex-wrap justify-center gap-2 mt-2">
      {payload?.map((entry: LegendEntry, index: number) => (
        <div key={index} className="flex items-center gap-1">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-xs text-gray-600">{entry.value}</span>
        </div>
      ))}
    </div>
  );
});

CustomLegend.displayName = "CustomLegend";

export const FragranceStockChart = React.memo(function FragranceStockChart({
  data,
  height = 300,
  className = "",
  totalStock = 0,
}: FragranceStockChartProps) {
  // Filter out entries with zero values for cleaner visualization
  const filteredData = useMemo(
    () => data.filter((item) => item.value > 0),
    [data]
  );

  const outerRadius = useMemo(() => Math.min(height * 0.35, 100), [height]);

  const totalStockInCartons = useMemo(
    () => Math.floor(totalStock / 9),
    [totalStock]
  );

  const legendWrapperStyle = useMemo(
    () => ({
      paddingTop: "10px",
    }),
    []
  );

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
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
              label={CustomLabel}
              aria-label="Distribution du stock par parfum"
            >
              {filteredData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  stroke="#fff"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              content={<CustomLegend />}
              wrapperStyle={legendWrapperStyle}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Footer with total stock info */}
      <div className="px-4 py-2 text-xs text-gray-500 bg-gray-50 rounded-b-xl">
        Stock total:{" "}
        <span className="font-medium text-purple-600">
          {totalStockInCartons} cartons
        </span>
        {filteredData.length === 0 && (
          <span className="ml-2 text-amber-600">Aucun stock disponible</span>
        )}
      </div>
    </div>
  );
});
