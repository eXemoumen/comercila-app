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

interface SalesChartProps {
    data: Array<{ name: string; value: number }>;
    height?: number;
    className?: string;
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

const CustomTooltip = React.memo(({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                <p className="text-sm font-medium text-gray-700">{label}</p>
                <p className="text-sm text-blue-600">
                    <span className="font-medium">
                        {`${Number(payload[0].value).toLocaleString("fr-DZ")} DZD`}
                    </span>
                </p>
            </div>
        );
    }
    return null;
});

CustomTooltip.displayName = 'CustomTooltip';

export const SalesChart = React.memo(function SalesChart({
    data,
    height = 200,
    className = ""
}: SalesChartProps) {
    const chartMargin = useMemo(() => ({
        top: 5,
        right: 5,
        left: 5,
        bottom: 5
    }), []);

    const tickFormatter = useCallback((value: number) =>
        `${(value / 1000).toFixed(0)}k`,
        []
    );

    const xAxisTick = useMemo(() => ({
        fontSize: 12,
        fill: '#6B7280'
    }), []);

    const yAxisTick = useMemo(() => ({
        fontSize: 12,
        fill: '#6B7280'
    }), []);

    const tooltipCursor = useMemo(() => ({
        fill: 'rgba(79, 70, 229, 0.1)'
    }), []);

    const barRadius = useMemo(() => [4, 4, 0, 0] as [number, number, number, number], []);

    return (
        <div className={`w-full ${className}`} style={{ height }}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={data}
                    margin={chartMargin}
                    accessibilityLayer
                >
                    <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={xAxisTick}
                        aria-label="Jours de la semaine"
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={yAxisTick}
                        tickFormatter={tickFormatter}
                        aria-label="Montant des ventes en DZD"
                    />
                    <Tooltip
                        content={<CustomTooltip />}
                        cursor={tooltipCursor}
                    />
                    <Bar
                        dataKey="value"
                        fill="#4f46e5"
                        radius={barRadius}
                        name="Ventes"
                        aria-label="Ventes quotidiennes"
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
});