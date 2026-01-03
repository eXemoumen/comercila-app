"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  Calendar,
  Filter,
  TrendingUp,
  Package,
  DollarSign,
  Store,
  Droplets,
  BarChart3,
  RefreshCw,
  CheckCircle2,
  Target,
  Award,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend,
} from "recharts";
import { getSales, getSupermarkets, getFragranceStock } from "@/utils/hybridStorage";
import { calculateProfitPerUnit } from "@/utils/businessLogic";
import type { Sale } from "@/types/index";
import type { Supermarket, FragranceStock } from "@/utils/storage";

interface RecapPageProps {
  onBack: () => void;
}

interface FilterState {
  dateRange: "all" | "today" | "week" | "month" | "quarter" | "year" | "custom";
  startDate: string;
  endDate: string;
  supermarketIds: string[];
  priceOption: "all" | "180" | "166";
  paymentStatus: "all" | "paid" | "unpaid";
}

interface RecapStats {
  totalSales: number;
  totalQuantity: number;
  totalCartons: number;
  estimatedBenefit: number;
  realBenefit: number;
  totalPaid: number;
  totalUnpaid: number;
  averageSaleValue: number;
  salesCount: number;
  paidSalesCount: number;
  unpaidSalesCount: number;
  topFragrance: { name: string; quantity: number; color: string } | null;
  topSupermarket: { name: string; value: number } | null;
  salesByPrice: { high: number; low: number };
}

const FRAGRANCE_COLORS = [
  "#8b5cf6", "#ec4899", "#f97316", "#eab308", 
  "#22c55e", "#06b6d4", "#3b82f6", "#6366f1"
];

export function RecapPage({ onBack }: RecapPageProps) {
  const [sales, setSales] = useState<Sale[]>([]);
  const [supermarkets, setSupermarkets] = useState<Supermarket[]>([]);
  const [fragranceStock, setFragranceStock] = useState<FragranceStock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    overview: true,
    charts: true,
    details: true,
  });

  const [filters, setFilters] = useState<FilterState>({
    dateRange: "all",
    startDate: "",
    endDate: "",
    supermarketIds: [],
    priceOption: "all",
    paymentStatus: "all",
  });

  // Load data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [salesData, supermarketsData, fragranceData] = await Promise.all([
        getSales(),
        getSupermarkets(),
        getFragranceStock(),
      ]);
      setSales(salesData);
      setSupermarkets(supermarketsData);
      setFragranceStock(fragranceData);
    } catch (error) {
      console.error("Error loading recap data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Calculate date range
  const getDateRange = useCallback((range: FilterState["dateRange"]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (range) {
      case "today":
        return { start: today, end: now };
      case "week":
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - 7);
        return { start: weekStart, end: now };
      case "month":
        const monthStart = new Date(today);
        monthStart.setMonth(today.getMonth() - 1);
        return { start: monthStart, end: now };
      case "quarter":
        const quarterStart = new Date(today);
        quarterStart.setMonth(today.getMonth() - 3);
        return { start: quarterStart, end: now };
      case "year":
        const yearStart = new Date(today);
        yearStart.setFullYear(today.getFullYear() - 1);
        return { start: yearStart, end: now };
      case "custom":
        return {
          start: filters.startDate ? new Date(filters.startDate) : new Date(0),
          end: filters.endDate ? new Date(filters.endDate) : now,
        };
      default:
        return { start: new Date(0), end: now };
    }
  }, [filters.startDate, filters.endDate]);

  // Filter sales
  const filteredSales = useMemo(() => {
    const { start, end } = getDateRange(filters.dateRange);
    
    return sales.filter((sale) => {
      const saleDate = new Date(sale.date);
      
      // Date filter
      if (saleDate < start || saleDate > end) return false;
      
      // Supermarket filter
      if (filters.supermarketIds.length > 0 && !filters.supermarketIds.includes(sale.supermarketId)) {
        return false;
      }
      
      // Price option filter
      if (filters.priceOption === "180" && sale.pricePerUnit !== 180) return false;
      if (filters.priceOption === "166" && sale.pricePerUnit !== 166) return false;
      
      // Payment status filter
      if (filters.paymentStatus === "paid" && !sale.isPaid) return false;
      if (filters.paymentStatus === "unpaid" && sale.isPaid) return false;
      
      return true;
    });
  }, [sales, filters, getDateRange]);

  // Calculate stats
  const stats: RecapStats = useMemo(() => {
    const totalQuantity = filteredSales.reduce((sum, s) => sum + s.quantity, 0);
    const totalCartons = filteredSales.reduce((sum, s) => sum + s.cartons, 0);
    const totalSales = filteredSales.reduce((sum, s) => sum + s.totalValue, 0);
    
    const estimatedBenefit = filteredSales.reduce((sum, s) => {
      return sum + (s.quantity * calculateProfitPerUnit(s.pricePerUnit));
    }, 0);
    
    const realBenefit = filteredSales
      .filter((s) => s.isPaid)
      .reduce((sum, s) => sum + (s.quantity * calculateProfitPerUnit(s.pricePerUnit)), 0);
    
    const totalPaid = filteredSales
      .filter((s) => s.isPaid)
      .reduce((sum, s) => sum + s.totalValue, 0);
    
    const totalUnpaid = filteredSales
      .filter((s) => !s.isPaid)
      .reduce((sum, s) => sum + s.remainingAmount, 0);
    
    const paidSalesCount = filteredSales.filter((s) => s.isPaid).length;
    const unpaidSalesCount = filteredSales.filter((s) => !s.isPaid).length;
    
    // Calculate fragrance distribution from sales
    const fragranceDistribution: Record<string, number> = {};
    filteredSales.forEach((sale) => {
      if (sale.fragranceDistribution) {
        Object.entries(sale.fragranceDistribution).forEach(([id, qty]) => {
          fragranceDistribution[id] = (fragranceDistribution[id] || 0) + qty;
        });
      }
    });
    
    // Find top fragrance
    let topFragrance: RecapStats["topFragrance"] = null;
    if (Object.keys(fragranceDistribution).length > 0) {
      const topId = Object.entries(fragranceDistribution).sort((a, b) => b[1] - a[1])[0];
      const fragrance = fragranceStock.find((f) => f.fragranceId === topId[0]);
      if (fragrance) {
        topFragrance = { name: fragrance.name, quantity: topId[1], color: fragrance.color };
      }
    }
    
    // Calculate sales by supermarket
    const salesBySupermarket: Record<string, number> = {};
    filteredSales.forEach((sale) => {
      salesBySupermarket[sale.supermarketId] = (salesBySupermarket[sale.supermarketId] || 0) + sale.totalValue;
    });
    
    // Find top supermarket
    let topSupermarket: RecapStats["topSupermarket"] = null;
    if (Object.keys(salesBySupermarket).length > 0) {
      const topId = Object.entries(salesBySupermarket).sort((a, b) => b[1] - a[1])[0];
      const sm = supermarkets.find((s) => s.id === topId[0]);
      if (sm) {
        topSupermarket = { name: sm.name, value: topId[1] };
      }
    }
    
    // Sales by price
    const salesByPrice = {
      high: filteredSales.filter((s) => s.pricePerUnit === 180).reduce((sum, s) => sum + s.quantity, 0),
      low: filteredSales.filter((s) => s.pricePerUnit === 166).reduce((sum, s) => sum + s.quantity, 0),
    };
    
    return {
      totalSales,
      totalQuantity,
      totalCartons,
      estimatedBenefit,
      realBenefit,
      totalPaid,
      totalUnpaid,
      averageSaleValue: filteredSales.length > 0 ? totalSales / filteredSales.length : 0,
      salesCount: filteredSales.length,
      paidSalesCount,
      unpaidSalesCount,
      topFragrance,
      topSupermarket,
      salesByPrice,
    };
  }, [filteredSales, fragranceStock, supermarkets]);

  // Chart data - Sales by month
  const monthlySalesData = useMemo(() => {
    const monthlyData: Record<string, { month: string; estimated: number; real: number; quantity: number }> = {};
    
    filteredSales.forEach((sale) => {
      const date = new Date(sale.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const monthLabel = date.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { month: monthLabel, estimated: 0, real: 0, quantity: 0 };
      }
      
      const profit = sale.quantity * calculateProfitPerUnit(sale.pricePerUnit);
      monthlyData[monthKey].estimated += profit;
      monthlyData[monthKey].quantity += sale.quantity;
      if (sale.isPaid) {
        monthlyData[monthKey].real += profit;
      }
    });
    
    return Object.entries(monthlyData)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([, data]) => data);
  }, [filteredSales]);

  // Chart data - Sales by supermarket
  const supermarketSalesData = useMemo(() => {
    const data: Record<string, { name: string; value: number; quantity: number }> = {};
    
    filteredSales.forEach((sale) => {
      const sm = supermarkets.find((s) => s.id === sale.supermarketId);
      const name = sm?.name || "Inconnu";
      
      if (!data[sale.supermarketId]) {
        data[sale.supermarketId] = { name, value: 0, quantity: 0 };
      }
      
      data[sale.supermarketId].value += sale.totalValue;
      data[sale.supermarketId].quantity += sale.quantity;
    });
    
    return Object.values(data).sort((a, b) => b.value - a.value).slice(0, 8);
  }, [filteredSales, supermarkets]);

  // Chart data - Fragrance distribution
  const fragranceData = useMemo(() => {
    const distribution: Record<string, number> = {};
    
    filteredSales.forEach((sale) => {
      if (sale.fragranceDistribution) {
        Object.entries(sale.fragranceDistribution).forEach(([id, qty]) => {
          distribution[id] = (distribution[id] || 0) + qty;
        });
      }
    });
    
    return Object.entries(distribution)
      .map(([id, quantity]) => {
        const fragrance = fragranceStock.find((f) => f.fragranceId === id);
        return {
          name: fragrance?.name || id,
          value: quantity,
          color: fragrance?.color || "#888",
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [filteredSales, fragranceStock]);

  // Chart data - Payment status
  const paymentStatusData = useMemo(() => [
    { name: "Payé", value: stats.paidSalesCount, color: "#10b981" },
    { name: "Non payé", value: stats.unpaidSalesCount, color: "#ef4444" },
  ], [stats.paidSalesCount, stats.unpaidSalesCount]);

  // Chart data - Price distribution
  const priceDistributionData = useMemo(() => [
    { name: "180 DZD", value: stats.salesByPrice.high, color: "#8b5cf6" },
    { name: "166 DZD", value: stats.salesByPrice.low, color: "#06b6d4" },
  ], [stats.salesByPrice]);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const resetFilters = () => {
    setFilters({
      dateRange: "all",
      startDate: "",
      endDate: "",
      supermarketIds: [],
      priceOption: "all",
      paymentStatus: "all",
    });
  };

  const toggleSupermarket = (id: string) => {
    setFilters((prev) => ({
      ...prev,
      supermarketIds: prev.supermarketIds.includes(id)
        ? prev.supermarketIds.filter((sid) => sid !== id)
        : [...prev.supermarketIds, id],
    }));
  };

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-xl shadow-lg border border-gray-100">
          <p className="font-semibold text-gray-800 mb-1">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value.toLocaleString("fr-DZ")} {entry.name.includes("Bénéfice") ? "DZD" : ""}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="space-y-6 pb-24">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="rounded-xl">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Récapitulatif</h1>
              <p className="text-sm text-gray-500">Chargement...</p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 rounded-full border-4 border-indigo-200 border-t-indigo-500 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="rounded-xl hover:bg-white/80 transition-all"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Récapitulatif</h1>
              <p className="text-sm text-gray-500">{filteredSales.length} vente(s) analysée(s)</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            className="rounded-xl"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={`rounded-xl transition-all ${
              showFilters
                ? "bg-indigo-600 text-white"
                : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
            }`}
          >
            <Filter className="h-4 w-4 mr-1.5" />
            Filtres
            {(filters.dateRange !== "all" || filters.supermarketIds.length > 0 || filters.priceOption !== "all" || filters.paymentStatus !== "all") && (
              <span className="ml-1.5 w-2 h-2 rounded-full bg-amber-400" />
            )}
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="premium-card p-4 animate-fade-in-up">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-indigo-600" />
              <h3 className="font-semibold text-gray-800">Filtres</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="text-gray-500 hover:text-gray-700"
            >
              Réinitialiser
            </Button>
          </div>

          <div className="space-y-4">
            {/* Date Range */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-2">
                <Calendar className="h-4 w-4 text-indigo-500" />
                Période
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: "all", label: "Tout" },
                  { value: "today", label: "Aujourd'hui" },
                  { value: "week", label: "7 jours" },
                  { value: "month", label: "30 jours" },
                  { value: "quarter", label: "3 mois" },
                  { value: "year", label: "1 an" },
                  { value: "custom", label: "Personnalisé" },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setFilters((prev) => ({ ...prev, dateRange: option.value as FilterState["dateRange"] }))}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      filters.dateRange === option.value
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {filters.dateRange === "custom" && (
                <div className="flex gap-2 mt-2">
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters((prev) => ({ ...prev, startDate: e.target.value }))}
                    className="flex-1 p-2 rounded-lg border border-gray-200 text-sm"
                  />
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters((prev) => ({ ...prev, endDate: e.target.value }))}
                    className="flex-1 p-2 rounded-lg border border-gray-200 text-sm"
                  />
                </div>
              )}
            </div>

            {/* Supermarket Filter */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-2">
                <Store className="h-4 w-4 text-indigo-500" />
                Supermarchés
              </label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {supermarkets.map((sm) => (
                  <button
                    key={sm.id}
                    onClick={() => toggleSupermarket(sm.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      filters.supermarketIds.includes(sm.id)
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {sm.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Option & Payment Status */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-indigo-500" />
                  Prix
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: "all", label: "Tous" },
                    { value: "180", label: "180 DZD" },
                    { value: "166", label: "166 DZD" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setFilters((prev) => ({ ...prev, priceOption: option.value as FilterState["priceOption"] }))}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        filters.priceOption === option.value
                          ? "bg-indigo-600 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-indigo-500" />
                  Paiement
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: "all", label: "Tous" },
                    { value: "paid", label: "Payé" },
                    { value: "unpaid", label: "Non payé" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setFilters((prev) => ({ ...prev, paymentStatus: option.value as FilterState["paymentStatus"] }))}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        filters.paymentStatus === option.value
                          ? "bg-indigo-600 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overview Section */}
      <div className="premium-card overflow-hidden animate-fade-in-up">
        <div
          className="p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => toggleSection("overview")}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                <Target className="h-4 w-4 text-indigo-600" />
              </div>
              <h3 className="font-semibold text-gray-800">Vue d&apos;ensemble</h3>
            </div>
            {expandedSections.overview ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </div>
        </div>

        {expandedSections.overview && (
          <div className="p-4">
            {/* Main Stats Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {/* Estimated Benefit */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-purple-600" />
                  </div>
                  <span className="text-xs font-medium text-purple-600">Bénéfice Estimé</span>
                </div>
                <p className="text-2xl font-bold text-purple-700">
                  {stats.estimatedBenefit.toLocaleString("fr-DZ")}
                </p>
                <p className="text-xs text-purple-500">DZD</p>
              </div>

              {/* Real Benefit */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  </div>
                  <span className="text-xs font-medium text-emerald-600">Bénéfice Réel</span>
                </div>
                <p className="text-2xl font-bold text-emerald-700">
                  {stats.realBenefit.toLocaleString("fr-DZ")}
                </p>
                <p className="text-xs text-emerald-500">DZD</p>
              </div>

              {/* Total Sales */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <DollarSign className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="text-xs font-medium text-blue-600">Chiffre d&apos;Affaires</span>
                </div>
                <p className="text-2xl font-bold text-blue-700">
                  {stats.totalSales.toLocaleString("fr-DZ")}
                </p>
                <p className="text-xs text-blue-500">DZD</p>
              </div>

              {/* Total Quantity */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                    <Package className="h-4 w-4 text-amber-600" />
                  </div>
                  <span className="text-xs font-medium text-amber-600">Quantité Vendue</span>
                </div>
                <p className="text-2xl font-bold text-amber-700">
                  {stats.totalCartons}
                </p>
                <p className="text-xs text-amber-500">cartons ({stats.totalQuantity} pièces)</p>
              </div>
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="p-3 rounded-xl bg-gray-50 text-center">
                <p className="text-lg font-bold text-gray-800">{stats.salesCount}</p>
                <p className="text-xs text-gray-500">Ventes</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 text-center">
                <p className="text-lg font-bold text-emerald-700">{stats.paidSalesCount}</p>
                <p className="text-xs text-emerald-600">Payées</p>
              </div>
              <div className="p-3 rounded-xl bg-red-50 text-center">
                <p className="text-lg font-bold text-red-700">{stats.unpaidSalesCount}</p>
                <p className="text-xs text-red-600">Non payées</p>
              </div>
            </div>

            {/* Highlights */}
            <div className="space-y-2">
              {stats.topSupermarket && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100">
                  <div className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-indigo-600" />
                    <span className="text-sm font-medium text-indigo-700">Meilleur Client</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-indigo-800">{stats.topSupermarket.name}</p>
                    <p className="text-xs text-indigo-600">{stats.topSupermarket.value.toLocaleString("fr-DZ")} DZD</p>
                  </div>
                </div>
              )}
              {stats.topFragrance && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-pink-50 to-rose-50 border border-pink-100">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-pink-600" />
                    <span className="text-sm font-medium text-pink-700">Parfum le Plus Vendu</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: stats.topFragrance.color }}
                    />
                    <div className="text-right">
                      <p className="font-bold text-pink-800">{stats.topFragrance.name}</p>
                      <p className="text-xs text-pink-600">{stats.topFragrance.quantity} cartons</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>


      {/* Charts Section */}
      <div className="premium-card overflow-hidden animate-fade-in-up stagger-1">
        <div
          className="p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => toggleSection("charts")}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center">
                <BarChart3 className="h-4 w-4 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-800">Graphiques & Analyses</h3>
            </div>
            {expandedSections.charts ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </div>
        </div>

        {expandedSections.charts && (
          <div className="p-4 space-y-6">
            {/* Monthly Benefits Chart */}
            {monthlySalesData.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-4 w-4 text-indigo-600" />
                  <h4 className="font-medium text-gray-800">Évolution des Bénéfices</h4>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlySalesData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorEstimated" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                      <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="estimated"
                        name="Bénéfice Estimé"
                        stroke="#8b5cf6"
                        fillOpacity={1}
                        fill="url(#colorEstimated)"
                      />
                      <Area
                        type="monotone"
                        dataKey="real"
                        name="Bénéfice Réel"
                        stroke="#10b981"
                        fillOpacity={1}
                        fill="url(#colorReal)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Sales by Supermarket */}
            {supermarketSalesData.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Store className="h-4 w-4 text-blue-600" />
                  <h4 className="font-medium text-gray-800">Ventes par Supermarché</h4>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={supermarketSalesData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis type="number" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={100} stroke="#9ca3af" />
                      <Tooltip
                        formatter={(value: number) => [`${value.toLocaleString("fr-DZ")} DZD`, "Ventes"]}
                        contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb" }}
                      />
                      <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Pie Charts Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Fragrance Distribution */}
              {fragranceData.length > 0 && (
                <div className="p-4 rounded-xl bg-gray-50">
                  <div className="flex items-center gap-2 mb-3">
                    <Droplets className="h-4 w-4 text-pink-600" />
                    <h4 className="font-medium text-gray-800 text-sm">Parfums Vendus</h4>
                  </div>
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={fragranceData}
                          cx="50%"
                          cy="50%"
                          innerRadius={30}
                          outerRadius={55}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {fragranceData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color || FRAGRANCE_COLORS[index % FRAGRANCE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number, name: string) => [`${value} cartons`, name]}
                          contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2 justify-center">
                    {fragranceData.slice(0, 4).map((item, index) => (
                      <div key={index} className="flex items-center gap-1 text-xs">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-gray-600">{item.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Payment Status */}
              {stats.salesCount > 0 && (
                <div className="p-4 rounded-xl bg-gray-50">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <h4 className="font-medium text-gray-800 text-sm">Statut Paiement</h4>
                  </div>
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={paymentStatusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={30}
                          outerRadius={55}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {paymentStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number, name: string) => [`${value} ventes`, name]}
                          contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-4 mt-2">
                    {paymentStatusData.map((item, index) => (
                      <div key={index} className="flex items-center gap-1 text-xs">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-gray-600">{item.name}: {item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Price Distribution */}
              {stats.salesCount > 0 && (
                <div className="p-4 rounded-xl bg-gray-50">
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign className="h-4 w-4 text-purple-600" />
                    <h4 className="font-medium text-gray-800 text-sm">Répartition Prix</h4>
                  </div>
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={priceDistributionData}
                          cx="50%"
                          cy="50%"
                          innerRadius={30}
                          outerRadius={55}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {priceDistributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number, name: string) => [`${value} pièces`, name]}
                          contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-4 mt-2">
                    {priceDistributionData.map((item, index) => (
                      <div key={index} className="flex items-center gap-1 text-xs">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-gray-600">{item.name}: {item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Details Section */}
      <div className="premium-card overflow-hidden animate-fade-in-up stagger-2">
        <div
          className="p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => toggleSection("details")}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                <Package className="h-4 w-4 text-amber-600" />
              </div>
              <h3 className="font-semibold text-gray-800">Détails Financiers</h3>
            </div>
            {expandedSections.details ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </div>
        </div>

        {expandedSections.details && (
          <div className="p-4 space-y-4">
            {/* Financial Summary Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase">Métrique</th>
                    <th className="text-right py-3 px-2 text-xs font-semibold text-gray-500 uppercase">Valeur</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  <tr className="hover:bg-gray-50">
                    <td className="py-3 px-2 text-sm text-gray-600">Chiffre d&apos;affaires total</td>
                    <td className="py-3 px-2 text-sm font-semibold text-gray-800 text-right">
                      {stats.totalSales.toLocaleString("fr-DZ")} DZD
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="py-3 px-2 text-sm text-gray-600">Montant payé</td>
                    <td className="py-3 px-2 text-sm font-semibold text-emerald-600 text-right">
                      {stats.totalPaid.toLocaleString("fr-DZ")} DZD
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="py-3 px-2 text-sm text-gray-600">Montant en attente</td>
                    <td className="py-3 px-2 text-sm font-semibold text-red-600 text-right">
                      {stats.totalUnpaid.toLocaleString("fr-DZ")} DZD
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50 bg-purple-50">
                    <td className="py-3 px-2 text-sm font-medium text-purple-700">Bénéfice estimé</td>
                    <td className="py-3 px-2 text-sm font-bold text-purple-700 text-right">
                      {stats.estimatedBenefit.toLocaleString("fr-DZ")} DZD
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50 bg-emerald-50">
                    <td className="py-3 px-2 text-sm font-medium text-emerald-700">Bénéfice réel (payé)</td>
                    <td className="py-3 px-2 text-sm font-bold text-emerald-700 text-right">
                      {stats.realBenefit.toLocaleString("fr-DZ")} DZD
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="py-3 px-2 text-sm text-gray-600">Vente moyenne</td>
                    <td className="py-3 px-2 text-sm font-semibold text-gray-800 text-right">
                      {stats.averageSaleValue.toLocaleString("fr-DZ", { maximumFractionDigits: 0 })} DZD
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="py-3 px-2 text-sm text-gray-600">Quantité totale</td>
                    <td className="py-3 px-2 text-sm font-semibold text-gray-800 text-right">
                      {stats.totalQuantity.toLocaleString("fr-DZ")} pièces
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="py-3 px-2 text-sm text-gray-600">Cartons vendus</td>
                    <td className="py-3 px-2 text-sm font-semibold text-gray-800 text-right">
                      {stats.totalCartons.toLocaleString("fr-DZ")} cartons
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="py-3 px-2 text-sm text-gray-600">Ventes à 180 DZD</td>
                    <td className="py-3 px-2 text-sm font-semibold text-purple-600 text-right">
                      {stats.salesByPrice.high.toLocaleString("fr-DZ")} pièces
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="py-3 px-2 text-sm text-gray-600">Ventes à 166 DZD</td>
                    <td className="py-3 px-2 text-sm font-semibold text-cyan-600 text-right">
                      {stats.salesByPrice.low.toLocaleString("fr-DZ")} pièces
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Profit Margin Indicator */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-indigo-700">Taux de Recouvrement</span>
                <span className="text-lg font-bold text-indigo-800">
                  {stats.estimatedBenefit > 0
                    ? ((stats.realBenefit / stats.estimatedBenefit) * 100).toFixed(1)
                    : 0}%
                </span>
              </div>
              <div className="h-3 w-full rounded-full bg-indigo-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                  style={{
                    width: `${stats.estimatedBenefit > 0 ? (stats.realBenefit / stats.estimatedBenefit) * 100 : 0}%`,
                  }}
                />
              </div>
              <p className="text-xs text-indigo-600 mt-2">
                {stats.realBenefit.toLocaleString("fr-DZ")} DZD sur {stats.estimatedBenefit.toLocaleString("fr-DZ")} DZD récupérés
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Empty State */}
      {filteredSales.length === 0 && !isLoading && (
        <div className="premium-card p-8 text-center animate-fade-in-up">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-gray-600 font-medium">Aucune donnée à afficher</p>
          <p className="text-sm text-gray-400 mt-1">
            Modifiez vos filtres ou ajoutez des ventes
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={resetFilters}
            className="mt-4 rounded-xl"
          >
            Réinitialiser les filtres
          </Button>
        </div>
      )}
    </div>
  );
}
