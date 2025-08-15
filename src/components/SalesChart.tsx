"use client";

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

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
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
};

export function SalesChart({ data, height = 200, className = "" }: SalesChartProps) {
    return (
        <div className={`w-full ${className}`} style={{ height }}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={data}
                    margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                    accessibilityLayer
                >
                    <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: '#6B7280' }}
                        aria-label="Jours de la semaine"
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: '#6B7280' }}
                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                        aria-label="Montant des ventes en DZD"
                    />
                    <Tooltip
                        content={<CustomTooltip />}
                        cursor={{ fill: 'rgba(79, 70, 229, 0.1)' }}
                    />
                    <Bar
                        dataKey="value"
                        fill="#4f46e5"
                        radius={[4, 4, 0, 0]}
                        name="Ventes"
                        aria-label="Ventes quotidiennes"
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}