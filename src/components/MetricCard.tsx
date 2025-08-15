import React from "react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

export type MetricCardColor = 'blue' | 'green' | 'amber' | 'purple' | 'red';

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

const colorConfig: Record<MetricCardColor, {
    gradient: string;
    text: string;
    accent: string;
    background: string;
    progressBar: string;
}> = {
    blue: {
        gradient: "bg-gradient-to-br from-blue-500 to-blue-600",
        text: "text-blue-600",
        accent: "text-blue-500",
        background: "bg-blue-100",
        progressBar: "bg-blue-500"
    },
    green: {
        gradient: "bg-gradient-to-br from-green-500 to-green-600",
        text: "text-green-600",
        accent: "text-green-500",
        background: "bg-green-100",
        progressBar: "bg-green-500"
    },
    amber: {
        gradient: "bg-gradient-to-br from-amber-500 to-amber-600",
        text: "text-amber-600",
        accent: "text-amber-500",
        background: "bg-amber-100",
        progressBar: "bg-amber-500"
    },
    purple: {
        gradient: "bg-gradient-to-br from-purple-500 to-purple-600",
        text: "text-purple-600",
        accent: "text-purple-500",
        background: "bg-purple-100",
        progressBar: "bg-purple-500"
    },
    red: {
        gradient: "bg-gradient-to-br from-red-500 to-red-600",
        text: "text-red-600",
        accent: "text-red-500",
        background: "bg-red-100",
        progressBar: "bg-red-500"
    }
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
    children
}) => {
    const config = colorConfig[color];

    return (
        <Card className={`overflow-hidden border-none shadow-md rounded-xl hover:shadow-lg transition-all duration-300 ${className}`}>
            <div className={`${config.gradient} p-2`}>
                <CardTitle className="text-xs font-medium text-white/90 flex items-center gap-2">
                    {Icon && <Icon className="h-4 w-4" />}
                    {title}
                </CardTitle>
            </div>
            <CardContent className="p-3">
                <div className="text-2xl font-bold text-gray-800 animate-in slide-in-from-bottom-1 duration-300">
                    {value}
                </div>

                {subtitle && (
                    <div className="text-sm text-gray-500 animate-in slide-in-from-bottom-2 duration-300">
                        {subtitle}
                    </div>
                )}

                {additionalInfo && (
                    <div className={`text-xl font-semibold ${config.text} mt-1 animate-in slide-in-from-bottom-3 duration-300`}>
                        {additionalInfo}
                    </div>
                )}

                {percentage !== undefined && (
                    <div className="flex items-center justify-between mt-1">
                        <span className={`text-sm font-medium ${config.text}`}>
                            {percentage}%
                        </span>
                    </div>
                )}

                {showProgressBar && percentage !== undefined && (
                    <div className={`h-3 w-full rounded-full ${config.background} mt-3 overflow-hidden`}>
                        <div
                            className={`h-full rounded-full ${config.progressBar} transition-all duration-500`}
                            style={{
                                width: `${Math.min(percentage, 100)}%`,
                            }}
                        />
                    </div>
                )}

                {children}
            </CardContent>
        </Card>
    );
};