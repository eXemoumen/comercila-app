"use client";

import React from "react";

interface LoadingSkeletonProps {
  className?: string;
}

interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
}

// Base skeleton component with shimmer effect
export function Skeleton({ className = "", width, height }: SkeletonProps) {
  const style = {
    width: width || "100%",
    height: height || "1rem",
  };

  return (
    <div
      className={`relative overflow-hidden bg-gray-200 rounded-lg ${className}`}
      style={style}
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
    </div>
  );
}

// Dashboard metrics skeleton
export function MetricsGridSkeleton({ className = "" }: LoadingSkeletonProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Skeleton */}
      <div className="flex items-center gap-3">
        <Skeleton width="40px" height="40px" className="rounded-xl" />
        <div className="space-y-2">
          <Skeleton height="1.25rem" width="180px" />
          <Skeleton height="0.875rem" width="140px" />
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="premium-card p-5 space-y-4"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <Skeleton height="0.875rem" width="70%" />
                <Skeleton height="1.75rem" width="90%" />
              </div>
              <Skeleton width="48px" height="48px" className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Skeleton height="3rem" className="rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Chart skeleton
export function ChartSkeleton({
  className = "",
  height = "220px",
}: LoadingSkeletonProps & { height?: string }) {
  return (
    <div className={`premium-card overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-100 to-gray-50 p-4">
        <div className="flex items-center gap-3">
          <Skeleton width="40px" height="40px" className="rounded-xl" />
          <div className="space-y-2">
            <Skeleton height="1rem" width="120px" />
            <Skeleton height="0.75rem" width="160px" />
          </div>
        </div>
      </div>
      {/* Chart Area */}
      <div className="p-4">
        <div style={{ height }} className="relative">
          <Skeleton height="100%" className="rounded-xl" />
          {/* Fake chart bars */}
          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-around gap-2">
            {[40, 65, 45, 80, 55, 70].map((h, i) => (
              <div
                key={i}
                className="w-8 bg-gray-300/50 rounded-t-lg"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>
        {/* Footer */}
        <div className="mt-4 p-3 rounded-xl bg-gray-50">
          <div className="flex items-center justify-between">
            <Skeleton height="0.875rem" width="140px" />
            <Skeleton height="1rem" width="100px" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Table skeleton
export function TableSkeleton({
  className = "",
  rows = 5,
}: LoadingSkeletonProps & { rows?: number }) {
  return (
    <div className={`premium-card overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-50 to-slate-50 px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <Skeleton width="40px" height="40px" className="rounded-xl" />
          <div className="space-y-2">
            <Skeleton height="1rem" width="160px" />
            <Skeleton height="0.75rem" width="120px" />
          </div>
        </div>
      </div>
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50/50">
              {[...Array(5)].map((_, i) => (
                <th key={i} className="px-6 py-4">
                  <Skeleton height="0.75rem" width={i === 0 ? "80px" : "60px"} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {[...Array(rows)].map((_, i) => (
              <tr key={i}>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Skeleton width="40px" height="40px" className="rounded-xl" />
                    <div className="space-y-1">
                      <Skeleton height="1rem" width="100px" />
                      <Skeleton height="0.75rem" width="60px" />
                    </div>
                  </div>
                </td>
                {[...Array(4)].map((_, j) => (
                  <td key={j} className="px-6 py-4">
                    <Skeleton height="1.5rem" width="80px" className="rounded-lg" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Footer */}
      <div className="bg-gradient-to-r from-gray-50 to-slate-50 px-6 py-4 border-t border-gray-100">
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="text-center p-3 rounded-xl bg-white">
              <Skeleton height="0.75rem" width="60%" className="mx-auto mb-2" />
              <Skeleton height="1.25rem" width="80%" className="mx-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// List skeleton
export function ListSkeleton({
  className = "",
  items = 5,
}: LoadingSkeletonProps & { items?: number }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {[...Array(items)].map((_, i) => (
        <div
          key={i}
          className="premium-card p-4"
          style={{ animationDelay: `${i * 50}ms` }}
        >
          <div className="flex items-center gap-4">
            <Skeleton width="48px" height="48px" className="rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton height="1rem" width="60%" />
              <Skeleton height="0.75rem" width="40%" />
            </div>
            <Skeleton width="20px" height="20px" className="rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Form skeleton
export function FormSkeleton({
  className = "",
  fields = 4,
}: LoadingSkeletonProps & { fields?: number }) {
  return (
    <div className={`premium-card p-5 space-y-5 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <Skeleton width="40px" height="40px" className="rounded-xl" />
        <div className="space-y-2">
          <Skeleton height="1rem" width="140px" />
          <Skeleton height="0.75rem" width="100px" />
        </div>
      </div>
      {/* Fields */}
      {[...Array(fields)].map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton height="0.875rem" width="25%" />
          <Skeleton height="3rem" className="rounded-xl" />
        </div>
      ))}
      {/* Buttons */}
      <div className="flex gap-3 pt-2">
        <Skeleton height="3rem" className="flex-1 rounded-xl" />
        <Skeleton height="3rem" className="flex-1 rounded-xl" />
      </div>
    </div>
  );
}

// Dashboard overview skeleton
export function DashboardOverviewSkeleton({ className = "" }: LoadingSkeletonProps) {
  return (
    <div className={`space-y-8 ${className}`}>
      {/* Metrics Grid */}
      <MetricsGridSkeleton />

      {/* Charts Section Header */}
      <div className="flex items-center gap-3">
        <Skeleton width="40px" height="40px" className="rounded-xl" />
        <div className="space-y-2">
          <Skeleton height="1.25rem" width="200px" />
          <Skeleton height="0.875rem" width="160px" />
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <ChartSkeleton />
        <ChartSkeleton />
        <ChartSkeleton height="280px" />
      </div>

      {/* Table */}
      <TableSkeleton rows={4} />
    </div>
  );
}

// Page skeleton
export function PageSkeleton({ className = "" }: LoadingSkeletonProps) {
  return (
    <div className={`space-y-6 pb-20 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton width="40px" height="40px" className="rounded-xl" />
          <div className="space-y-2">
            <Skeleton height="1.25rem" width="160px" />
            <Skeleton height="0.875rem" width="100px" />
          </div>
        </div>
        <Skeleton height="2.5rem" width="100px" className="rounded-xl" />
      </div>

      {/* Search */}
      <Skeleton height="3rem" className="rounded-xl" />

      {/* Content */}
      <ListSkeleton items={5} />
    </div>
  );
}

// Loading spinner component
export function LoadingSpinner({
  size = "md",
  className = "",
  text = "Chargement...",
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
  text?: string;
}) {
  const sizeClasses = {
    sm: "h-5 w-5",
    md: "h-10 w-10",
    lg: "h-14 w-14",
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
      <div className="relative">
        <div
          className={`${sizeClasses[size]} rounded-full border-4 border-gray-200`}
        />
        <div
          className={`absolute top-0 left-0 ${sizeClasses[size]} rounded-full border-4 border-transparent border-t-indigo-500 animate-spin`}
        />
      </div>
      {text && (
        <p className="text-sm font-medium text-gray-600">{text}</p>
      )}
    </div>
  );
}

// Full page loading
export function FullPageLoading({ text = "Chargement..." }: { text?: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="relative mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xl shadow-indigo-500/30 animate-pulse">
            <div className="w-8 h-8 rounded-full border-3 border-white/30 border-t-white animate-spin" />
          </div>
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">TopFresh</h2>
        <p className="text-sm text-gray-500">{text}</p>
      </div>
    </div>
  );
}
