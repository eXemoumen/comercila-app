"use client";

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
                <p className="text-sm text-green-600">
                    <span className="font-medium">
                        Bénéfice: {`${Number(payload[0].value).toLocaleString("fr-DZ")} DZD`}
                    </span>
                </p>
            </div>
        );
    }
    return null;
};

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

export function MonthlyBenefitsChart({
    data,
    height = 200,
    className = "",
    currentMonthProfit = 0
}: MonthlyBenefitsChartProps) {
    // Transform and sort data for the chart
    const chartData = sortMonthlyData(data)
        // Take only the last 6 months of data for better visualization
        .slice(-6)
        .map(([month, monthData]) => ({
            name: month.split(" ")[0].substring(0, 3), // Abbreviated month name
            fullName: month,
            benefit: monthData.netBenefit,
            fill: "#22c55e",
        }));

    return (
        <div className={`w-full ${className}`}>
            <div style={{ height }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={chartData}
                        margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                        accessibilityLayer
                    >
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: '#6B7280' }}
                            aria-label="Mois"
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: '#6B7280' }}
                            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                            aria-label="Bénéfice en DZD"
                        />
                        <Tooltip
                            content={<CustomTooltip />}
                            cursor={{ fill: 'rgba(34, 197, 94, 0.1)' }}
                        />
                        <Bar
                            dataKey="benefit"
                            radius={[4, 4, 0, 0]}
                            name="Bénéfice"
                            aria-label="Bénéfice mensuel"
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Footer with current month info */}
            <div className="px-4 py-2 text-xs text-gray-500 bg-gray-50 rounded-b-xl">
                Bénéfice ce mois-ci:{" "}
                <span className="font-medium text-green-600">
                    {currentMonthProfit.toLocaleString("fr-DZ")} DZD
                </span>
                <div className="flex items-center mt-1 gap-2">
                    <div className="flex items-center">
                        <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
                        <span>Bénéfice net mensuel</span>
                    </div>
                </div>
            </div>
        </div>
    );
}