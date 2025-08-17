"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";

interface LoadingSkeletonProps {
    className?: string;
}

interface SkeletonProps {
    className?: string;
    width?: string;
    height?: string;
}

// Base skeleton component
export function Skeleton({ className = "", width, height }: SkeletonProps) {
    const style = {
        width: width || "100%",
        height: height || "1rem",
    };

    return (
        <div
            className={`animate-pulse bg-gray-200 rounded ${className}`}
            style={style}
        />
    );
}

// Dashboard metrics skeleton
export function MetricsGridSkeleton({ className = "" }: LoadingSkeletonProps) {
    return (
        <div className={`grid grid-cols-2 gap-4 ${className}`}>
            {[...Array(6)].map((_, i) => (
                <Card key={i} className="overflow-hidden border-none shadow-md rounded-xl">
                    <div className="bg-gray-200 p-2 animate-pulse">
                        <Skeleton height="0.75rem" />
                    </div>
                    <CardContent className="p-3 space-y-2">
                        <Skeleton height="2rem" width="80%" />
                        <Skeleton height="0.875rem" width="60%" />
                        <Skeleton height="1.25rem" width="90%" />
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

// Chart skeleton
export function ChartSkeleton({ className = "", height = "200px" }: LoadingSkeletonProps & { height?: string }) {
    return (
        <Card className={`border-none shadow-md rounded-xl overflow-hidden ${className}`}>
            <div className="p-3 border-b">
                <Skeleton height="1rem" width="60%" />
            </div>
            <CardContent className="p-4">
                <div className="space-y-2" style={{ height }}>
                    <Skeleton height="100%" />
                </div>
            </CardContent>
        </Card>
    );
}

// Table skeleton
export function TableSkeleton({ className = "", rows = 5 }: LoadingSkeletonProps & { rows?: number }) {
    return (
        <Card className={`border-none shadow-md rounded-xl overflow-hidden ${className}`}>
            <div className="p-3 border-b">
                <Skeleton height="1rem" width="40%" />
            </div>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50">
                                {[...Array(4)].map((_, i) => (
                                    <th key={i} className="px-4 py-3">
                                        <Skeleton height="0.75rem" />
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {[...Array(rows)].map((_, i) => (
                                <tr key={i} className="border-b last:border-0">
                                    {[...Array(4)].map((_, j) => (
                                        <td key={j} className="px-4 py-4">
                                            <Skeleton height="1rem" width={j === 0 ? "80%" : "60%"} />
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}

// List skeleton
export function ListSkeleton({ className = "", items = 5 }: LoadingSkeletonProps & { items?: number }) {
    return (
        <div className={`space-y-3 ${className}`}>
            {[...Array(items)].map((_, i) => (
                <Card key={i} className="p-4 border border-gray-200 rounded-xl shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex-1 space-y-2">
                            <Skeleton height="1.25rem" width="70%" />
                            <Skeleton height="0.875rem" width="50%" />
                        </div>
                        <div className="text-right space-y-2">
                            <Skeleton height="1.25rem" width="80px" />
                            <Skeleton height="0.875rem" width="60px" />
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    );
}

// Form skeleton
export function FormSkeleton({ className = "", fields = 4 }: LoadingSkeletonProps & { fields?: number }) {
    return (
        <Card className={`border-none shadow-md rounded-xl overflow-hidden ${className}`}>
            <CardContent className="p-4 space-y-4">
                {[...Array(fields)].map((_, i) => (
                    <div key={i} className="space-y-2">
                        <Skeleton height="1rem" width="30%" />
                        <Skeleton height="3rem" />
                    </div>
                ))}
                <div className="flex space-x-2 pt-2">
                    <Skeleton height="2.5rem" className="flex-1" />
                    <Skeleton height="2.5rem" className="flex-1" />
                </div>
            </CardContent>
        </Card>
    );
}

// Dashboard overview skeleton
export function DashboardOverviewSkeleton({ className = "" }: LoadingSkeletonProps) {
    return (
        <div className={`space-y-6 ${className}`}>
            {/* Metrics Grid */}
            <MetricsGridSkeleton />

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartSkeleton />
                <ChartSkeleton />
                <ChartSkeleton height="250px" />
                <TableSkeleton rows={3} />
            </div>
        </div>
    );
}

// Page skeleton
export function PageSkeleton({ className = "" }: LoadingSkeletonProps) {
    return (
        <div className={`space-y-4 pb-20 ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                    <Skeleton width="24px" height="24px" className="rounded" />
                    <Skeleton height="1.5rem" width="200px" />
                </div>
                <Skeleton height="2rem" width="80px" className="rounded-full" />
            </div>

            {/* Content */}
            <div className="space-y-4">
                <FormSkeleton />
                <ListSkeleton />
            </div>
        </div>
    );
}

// Loading spinner component
export function LoadingSpinner({
    size = "md",
    className = "",
    text = "Chargement..."
}: {
    size?: "sm" | "md" | "lg";
    className?: string;
    text?: string;
}) {
    const sizeClasses = {
        sm: "h-4 w-4",
        md: "h-8 w-8",
        lg: "h-12 w-12",
    };

    return (
        <div className={`flex flex-col items-center justify-center space-y-2 ${className}`}>
            <div className={`animate-spin rounded-full border-b-2 border-blue-600 ${sizeClasses[size]}`} />
            {text && (
                <p className="text-sm text-gray-600 animate-pulse">{text}</p>
            )}
        </div>
    );
}

// Full page loading
export function FullPageLoading({ text = "Chargement..." }: { text?: string }) {
    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-4">
            <LoadingSpinner size="lg" text={text} />
        </div>
    );
}