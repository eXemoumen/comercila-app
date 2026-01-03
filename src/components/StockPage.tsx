"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  Plus,
  Minus,
  Settings,
  X,
  History,
  Package,
  Droplets,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import {
  getStockHistory,
  updateStock,
  getFragranceStock,
  getCurrentStock,
} from "@/utils/hybridStorage";
import { getFragrances } from "@/utils/storage";
import type { FragranceStock } from "@/utils/storage";

interface StockPageProps {
  onBack: () => void;
}

interface StockHistoryItem {
  id: string;
  date: string;
  quantity: number;
  type?: "added" | "removed" | "adjusted";
  reason?: string;
  currentStock?: number;
  fragranceDistribution?: Record<string, number>;
}

export function StockPage({ onBack }: StockPageProps) {
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [showAdjustForm, setShowAdjustForm] = useState<boolean>(false);
  const [stockHistory, setStockHistory] = useState<StockHistoryItem[]>([]);
  const [currentStock, setCurrentStock] = useState<number>(0);
  const [fragranceStock, setFragranceStock] = useState<FragranceStock[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState<boolean>(true);

  // Add stock form state
  const [addQuantity, setAddQuantity] = useState<number>(0);
  const [showFragranceDistribution, setShowFragranceDistribution] =
    useState<boolean>(false);
  const [fragranceDistribution, setFragranceDistribution] = useState<
    Record<string, number>
  >({});

  // Adjust stock form state
  const [adjustQuantity, setAdjustQuantity] = useState<number>(0);
  const [adjustFragranceDistribution, setAdjustFragranceDistribution] =
    useState<Record<string, number>>({});

  // Function to load stock data
  const loadStockData = useCallback(async () => {
    try {
      setIsHistoryLoading(true);
      const [history, currentStockData, fragStock] = await Promise.all([
        getStockHistory(10),
        getCurrentStock(),
        getFragranceStock(),
      ]);

      setStockHistory(history);
      setCurrentStock(currentStockData.currentStock);
      setFragranceStock(fragStock);

      const fragrances = await getFragrances();
      const initialDistribution: Record<string, number> = {};
      fragrances.forEach((fragrance) => {
        initialDistribution[fragrance.id] = 0;
      });
      setFragranceDistribution(initialDistribution);
      setAdjustFragranceDistribution(initialDistribution);
    } catch (error) {
      console.error("Error loading stock data:", error);
    } finally {
      setIsHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStockData();
  }, [loadStockData]);

  // Memoized calculations
  const addDistributionTotal = useMemo(() => {
    return Object.values(fragranceDistribution).reduce(
      (sum, qty) => sum + qty,
      0
    );
  }, [fragranceDistribution]);

  const adjustDistributionTotal = useMemo(() => {
    return Object.values(adjustFragranceDistribution).reduce(
      (sum, qty) => sum + qty,
      0
    );
  }, [adjustFragranceDistribution]);

  const stockPercentage = useMemo(() => {
    return Math.min((currentStock / 300) * 100, 100);
  }, [currentStock]);

  const stockStatus = useMemo(() => {
    if (currentStock < 30) return { label: "Critique", color: "red", icon: AlertCircle };
    if (currentStock < 100) return { label: "Faible", color: "amber", icon: AlertCircle };
    return { label: "Bon", color: "emerald", icon: CheckCircle2 };
  }, [currentStock]);

  // Handle fragrance change for add form
  const handleAddFragranceChange = useCallback(
    (fragranceId: string, value: number): void => {
      setFragranceDistribution((prev) => ({
        ...prev,
        [fragranceId]: Math.max(0, value),
      }));
    },
    []
  );

  // Handle fragrance change for adjust form
  const handleAdjustFragranceChange = useCallback(
    (fragranceId: string, value: number): void => {
      setAdjustFragranceDistribution((prev) => ({
        ...prev,
        [fragranceId]: Math.max(0, value),
      }));
    },
    []
  );

  // Add stock function
  const handleAddStock = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (addQuantity <= 0) {
      alert("Veuillez entrer une quantité positive.");
      return;
    }

    setIsLoading(true);
    try {
      let distribution = fragranceDistribution;

      if (showFragranceDistribution) {
        if (addDistributionTotal !== addQuantity) {
          alert(
            `La distribution des parfums (${addDistributionTotal} cartons) doit correspondre exactement au total à ajouter (${addQuantity} cartons).`
          );
          return;
        }
      } else {
        const fragrances = await getFragrances();
        const fragranceCount = fragrances.length;
        const baseAmount = Math.floor(addQuantity / fragranceCount);
        const remainder = addQuantity % fragranceCount;

        distribution = {};
        fragrances.forEach((fragrance, index) => {
          distribution[fragrance.id] = baseAmount + (index < remainder ? 1 : 0);
        });
      }

      await updateStock(
        addQuantity,
        "added",
        "Ajout manuel de stock",
        distribution
      );

      await loadStockData();
      setShowAddForm(false);
      setAddQuantity(0);
      setShowFragranceDistribution(false);

      window.dispatchEvent(new CustomEvent("saleDataChanged"));
    } catch (error) {
      console.error("Error adding stock:", error);
      alert("Erreur lors de l'ajout du stock.");
    } finally {
      setIsLoading(false);
    }
  };

  // Adjust stock function
  const handleAdjustStock = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (adjustQuantity < 0) {
      alert("Le stock ne peut pas être négatif.");
      return;
    }

    setIsLoading(true);
    try {
      const difference = adjustQuantity - currentStock;

      const fragranceChanges: Record<string, number> = {};
      fragranceStock.forEach((fragrance) => {
        const currentQty = fragrance.quantity;
        const newQty = adjustFragranceDistribution[fragrance.fragranceId] || 0;
        fragranceChanges[fragrance.fragranceId] = newQty - currentQty;
      });

      await updateStock(
        difference,
        "adjusted",
        "Ajustement manuel du stock",
        fragranceChanges
      );

      await loadStockData();
      setShowAdjustForm(false);
      setAdjustQuantity(0);

      window.dispatchEvent(new CustomEvent("saleDataChanged"));
    } catch (error) {
      console.error("Error adjusting stock:", error);
      alert("Erreur lors de l'ajustement du stock.");
    } finally {
      setIsLoading(false);
    }
  };

  // Reset add form
  const resetAddForm = () => {
    setAddQuantity(0);
    setShowFragranceDistribution(false);
    const fragrances = fragranceStock.map((f) => ({
      id: f.fragranceId,
      name: f.name,
    }));
    const resetDistribution: Record<string, number> = {};
    fragrances.forEach((fragrance) => {
      resetDistribution[fragrance.id] = 0;
    });
    setFragranceDistribution(resetDistribution);
  };

  // Reset adjust form
  const resetAdjustForm = () => {
    setAdjustQuantity(currentStock);
    const resetDistribution: Record<string, number> = {};
    fragranceStock.forEach((fragrance) => {
      resetDistribution[fragrance.fragranceId] = fragrance.quantity;
    });
    setAdjustFragranceDistribution(resetDistribution);
  };

  const StatusIcon = stockStatus.icon;

  return (
    <div className="space-y-6 pb-24 max-w-5xl mx-auto">
      {/* Premium Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
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
            <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <Package className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-gray-800">Gestion du Stock</h1>
              <p className="text-sm lg:text-base text-gray-500">Inventaire et mouvements</p>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout for larger screens */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Current Stock Card */}
        <div className="premium-card overflow-hidden animate-fade-in-up">
          <div className="relative p-6">
            {/* Gradient accent bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500" />
            
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full -translate-y-1/2 translate-x-1/2 opacity-50" />
            
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center">
                    <Package className="h-4 w-4 text-purple-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-500">Stock Actuel</span>
                </div>
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                  stockStatus.color === 'emerald' ? 'bg-emerald-100 text-emerald-700' :
                  stockStatus.color === 'amber' ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  <StatusIcon className="h-3.5 w-3.5" />
                  {stockStatus.label}
                </div>
              </div>

              <div className="text-center py-4">
                <div className="text-5xl lg:text-6xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  {currentStock}
                </div>
                <p className="text-gray-500 mt-1">cartons</p>
              </div>

              {/* Progress bar */}
              <div className="mt-4">
                <div className="h-3 w-full rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-500"
                    style={{ width: `${stockPercentage}%` }}
                  />
                </div>
                <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                  <span>0</span>
                  <span className="font-medium text-purple-600">{stockPercentage.toFixed(1)}%</span>
                  <span>300 cartons</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-center gap-2 text-sm text-gray-600">
                <Sparkles className="h-4 w-4 text-purple-500" />
                <span className="font-medium">{currentStock * 9}</span>
                <span>pièces au total</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Action Buttons */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Button
              size="lg"
              className="h-14 lg:h-16 rounded-xl font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/25 transition-all hover:shadow-xl hover:shadow-emerald-500/30 hover:-translate-y-0.5"
              onClick={() => {
                setShowAddForm(true);
                resetAddForm();
              }}
            >
              <Plus className="mr-2 h-5 w-5" />
              Ajouter Stock
            </Button>
            <Button
              size="lg"
              className="h-14 lg:h-16 rounded-xl font-semibold bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white shadow-lg shadow-purple-500/25 transition-all hover:shadow-xl hover:shadow-purple-500/30 hover:-translate-y-0.5"
              onClick={() => {
                setShowAdjustForm(true);
                resetAdjustForm();
              }}
            >
              <Settings className="mr-2 h-5 w-5" />
              Ajuster Stock
            </Button>
          </div>
        </div>
      </div>

      {/* Fragrance Stock Grid - Premium Design */}
      <div className="animate-fade-in-up stagger-1">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center">
            <Droplets className="h-4 w-4 text-pink-600" />
          </div>
          <h2 className="text-lg lg:text-xl font-semibold text-gray-800">Stock par Parfum</h2>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 lg:gap-4">
          {fragranceStock.map((fragrance, index) => (
            <div
              key={fragrance.fragranceId}
              className={`premium-card p-4 animate-fade-in-up`}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
                  style={{ backgroundColor: `${fragrance.color}20` }}
                >
                  <div
                    className="w-5 h-5 rounded-full"
                    style={{ backgroundColor: fragrance.color }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 text-sm truncate">
                    {fragrance.name}
                  </p>
                  <p className="text-xs text-gray-500">{fragrance.quantity * 9} pièces</p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-gray-800">
                    {fragrance.quantity}
                  </span>
                  <p className="text-xs text-gray-400">cartons</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Stock Form - Premium Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="premium-card w-full max-w-md lg:max-w-lg max-h-[90vh] overflow-y-auto animate-scale-in">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 p-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                    <Plus className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">Ajouter du Stock</h3>
                    <p className="text-xs text-gray-500">Nouvelle livraison</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowAddForm(false)}
                  className="rounded-full hover:bg-gray-100"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <form onSubmit={handleAddStock} className="p-4 space-y-5">
              {/* Quantity Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Quantité à ajouter (Cartons)
                </label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 w-12 rounded-xl border-2 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all"
                    onClick={() => setAddQuantity(Math.max(0, addQuantity - 1))}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <input
                    type="number"
                    className="flex-1 h-12 text-center text-xl font-bold rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
                    value={addQuantity}
                    onChange={(e) =>
                      setAddQuantity(Math.max(0, parseInt(e.target.value) || 0))
                    }
                    min="0"
                    max="300"
                    required
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 w-12 rounded-xl border-2 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all"
                    onClick={() => setAddQuantity(Math.min(300, addQuantity + 1))}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-gray-500 text-center">
                  <span className="font-medium text-emerald-600">{addQuantity * 9}</span> pièces à ajouter
                </p>
              </div>

              {/* Fragrance Distribution Toggle */}
              {addQuantity > 0 && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-emerald-700">
                        Distribuer par parfum
                      </span>
                      <p className="text-xs text-emerald-600 mt-0.5">
                        Spécifier la quantité de chaque parfum
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      className={`rounded-lg transition-all ${
                        showFragranceDistribution
                          ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                          : "bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                      }`}
                      onClick={() => setShowFragranceDistribution(!showFragranceDistribution)}
                    >
                      {showFragranceDistribution ? "Activé" : "Désactivé"}
                    </Button>
                  </div>
                </div>
              )}

              {/* Fragrance Distribution Inputs */}
              {showFragranceDistribution && addQuantity > 0 && (
                <div className="space-y-3 p-4 rounded-xl border-2 border-emerald-100 bg-emerald-50/50">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-emerald-700">Distribution</h4>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      addDistributionTotal === addQuantity
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-red-100 text-red-700"
                    }`}>
                      {addDistributionTotal} / {addQuantity}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {fragranceStock.map((fragrance) => (
                      <div key={fragrance.fragranceId} className="space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: fragrance.color }}
                          />
                          <label className="text-xs font-medium text-gray-600 truncate">
                            {fragrance.name}
                          </label>
                        </div>
                        <div className="flex items-center">
                          <Button
                            type="button"
                            variant="outline"
                            className="h-8 w-8 rounded-l-lg border-gray-200"
                            onClick={() =>
                              handleAddFragranceChange(
                                fragrance.fragranceId,
                                (fragranceDistribution[fragrance.fragranceId] || 0) - 1
                              )
                            }
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <input
                            type="number"
                            className="h-8 w-full text-center text-sm border-y border-gray-200 focus:border-emerald-500"
                            value={fragranceDistribution[fragrance.fragranceId] || 0}
                            onChange={(e) =>
                              handleAddFragranceChange(
                                fragrance.fragranceId,
                                parseInt(e.target.value) || 0
                              )
                            }
                            min="0"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            className="h-8 w-8 rounded-r-lg border-gray-200"
                            onClick={() =>
                              handleAddFragranceChange(
                                fragrance.fragranceId,
                                (fragranceDistribution[fragrance.fragranceId] || 0) + 1
                              )
                            }
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {addDistributionTotal !== addQuantity && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      La distribution doit égaler {addQuantity} cartons
                    </p>
                  )}
                </div>
              )}

              {/* Form Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  type="submit"
                  disabled={
                    isLoading ||
                    addQuantity <= 0 ||
                    (showFragranceDistribution && addDistributionTotal !== addQuantity)
                  }
                  className="flex-1 h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Ajout en cours..." : "Ajouter le Stock"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-12 rounded-xl border-2 border-gray-200 text-gray-700 font-medium hover:bg-gray-50"
                  onClick={() => setShowAddForm(false)}
                >
                  Annuler
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Stock Form - Premium Modal */}
      {showAdjustForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="premium-card w-full max-w-md lg:max-w-lg max-h-[90vh] overflow-y-auto animate-scale-in">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 p-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
                    <Settings className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">Ajuster le Stock</h3>
                    <p className="text-xs text-gray-500">Correction d&apos;inventaire</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowAdjustForm(false)}
                  className="rounded-full hover:bg-gray-100"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <form onSubmit={handleAdjustStock} className="p-4 space-y-5">
              {/* Total Stock Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Nouveau Stock Total (Cartons)
                </label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 w-12 rounded-xl border-2 border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all"
                    onClick={() => setAdjustQuantity(Math.max(0, adjustQuantity - 1))}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <input
                    type="number"
                    className="flex-1 h-12 text-center text-xl font-bold rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                    value={adjustQuantity}
                    onChange={(e) =>
                      setAdjustQuantity(Math.max(0, parseInt(e.target.value) || 0))
                    }
                    min="0"
                    max="300"
                    required
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 w-12 rounded-xl border-2 border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all"
                    onClick={() => setAdjustQuantity(Math.min(300, adjustQuantity + 1))}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex justify-between text-sm">
                  <p className="text-gray-500">
                    <span className="font-medium text-purple-600">{adjustQuantity * 9}</span> pièces
                  </p>
                  <p className={`font-medium flex items-center gap-1 ${
                    adjustQuantity > currentStock
                      ? "text-emerald-600"
                      : adjustQuantity < currentStock
                      ? "text-red-600"
                      : "text-gray-500"
                  }`}>
                    {adjustQuantity > currentStock ? (
                      <>
                        <TrendingUp className="h-4 w-4" />
                        +{adjustQuantity - currentStock}
                      </>
                    ) : adjustQuantity < currentStock ? (
                      <>
                        <TrendingDown className="h-4 w-4" />
                        {adjustQuantity - currentStock}
                      </>
                    ) : (
                      "Aucun changement"
                    )}
                  </p>
                </div>
              </div>

              {/* Fragrance Distribution */}
              <div className="space-y-3 p-4 rounded-xl border-2 border-purple-100 bg-purple-50/50">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-purple-700">Distribution par Parfum</h4>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    adjustDistributionTotal === adjustQuantity
                      ? "bg-purple-100 text-purple-700"
                      : "bg-red-100 text-red-700"
                  }`}>
                    {adjustDistributionTotal} / {adjustQuantity}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {fragranceStock.map((fragrance) => (
                    <div key={fragrance.fragranceId} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: fragrance.color }}
                          />
                          <label className="text-xs font-medium text-gray-600 truncate">
                            {fragrance.name}
                          </label>
                        </div>
                        <span className="text-xs text-gray-400">
                          ({fragrance.quantity})
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Button
                          type="button"
                          variant="outline"
                          className="h-8 w-8 rounded-l-lg border-gray-200"
                          onClick={() =>
                            handleAdjustFragranceChange(
                              fragrance.fragranceId,
                              (adjustFragranceDistribution[fragrance.fragranceId] || 0) - 1
                            )
                          }
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <input
                          type="number"
                          className="h-8 w-full text-center text-sm border-y border-gray-200 focus:border-purple-500"
                          value={adjustFragranceDistribution[fragrance.fragranceId] || 0}
                          onChange={(e) =>
                            handleAdjustFragranceChange(
                              fragrance.fragranceId,
                              parseInt(e.target.value) || 0
                            )
                          }
                          min="0"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          className="h-8 w-8 rounded-r-lg border-gray-200"
                          onClick={() =>
                            handleAdjustFragranceChange(
                              fragrance.fragranceId,
                              (adjustFragranceDistribution[fragrance.fragranceId] || 0) + 1
                            )
                          }
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                {adjustDistributionTotal !== adjustQuantity && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    La distribution doit égaler {adjustQuantity} cartons
                  </p>
                )}
              </div>

              {/* Form Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  type="submit"
                  disabled={isLoading || adjustDistributionTotal !== adjustQuantity}
                  className="flex-1 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Ajustement en cours..." : "Ajuster le Stock"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-12 rounded-xl border-2 border-gray-200 text-gray-700 font-medium hover:bg-gray-50"
                  onClick={() => setShowAdjustForm(false)}
                >
                  Annuler
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock History - Premium Design */}
      <div className="animate-fade-in-up stagger-3">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
              <History className="h-4 w-4 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800">Historique des Mouvements</h2>
          </div>
          <span className="text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
            3 dernières actions
          </span>
        </div>

        {isHistoryLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="premium-card p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-24 skeleton" />
                    <div className="h-3 bg-gray-200 rounded w-16 skeleton" />
                  </div>
                  <div className="space-y-2 text-right">
                    <div className="h-4 bg-gray-200 rounded w-20 skeleton" />
                    <div className="h-3 bg-gray-200 rounded w-24 skeleton" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : stockHistory.length === 0 ? (
          <div className="premium-card p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mx-auto mb-4">
              <History className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">Aucun historique disponible</p>
            <p className="text-sm text-gray-400 mt-1">
              Les mouvements de stock apparaîtront ici
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {stockHistory.map((item, index) => (
              <div
                key={item.id}
                className="premium-card p-4 animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      item.type === "added"
                        ? "bg-emerald-100"
                        : item.type === "removed"
                        ? "bg-red-100"
                        : "bg-purple-100"
                    }`}>
                      {item.type === "added" ? (
                        <TrendingUp className="h-5 w-5 text-emerald-600" />
                      ) : item.type === "removed" ? (
                        <TrendingDown className="h-5 w-5 text-red-600" />
                      ) : (
                        <Settings className="h-5 w-5 text-purple-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        {new Date(item.date).toLocaleDateString("fr-FR")}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {item.type === "adjusted"
                          ? "Ajustement"
                          : item.type === "removed"
                          ? "Vente"
                          : "Livraison"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${
                      item.quantity > 0
                        ? "text-emerald-600"
                        : item.quantity < 0
                        ? "text-red-600"
                        : "text-gray-600"
                    }`}>
                      {item.quantity > 0 ? "+" : ""}
                      {item.quantity} cartons
                    </p>
                    <p className="text-xs text-gray-500">
                      Stock final: {item.currentStock} cartons
                    </p>
                  </div>
                </div>

                {/* Fragrance distribution if available */}
                {item.fragranceDistribution && Object.keys(item.fragranceDistribution).length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <h4 className="text-xs font-medium text-gray-500 mb-2">
                      Distribution par parfum
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(item.fragranceDistribution).map(
                        ([fragranceId, quantity]) => {
                          const fragrance = fragranceStock.find(
                            (f) => f.fragranceId === fragranceId
                          );
                          if (!quantity) return null;
                          return (
                            <div
                              key={fragranceId}
                              className="flex items-center justify-between text-xs bg-gray-50 rounded-lg px-2 py-1.5"
                            >
                              <div className="flex items-center gap-1.5">
                                <div
                                  className="w-2.5 h-2.5 rounded-full"
                                  style={{ backgroundColor: fragrance?.color || "#ccc" }}
                                />
                                <span className="text-gray-600 truncate">
                                  {fragrance?.name || fragranceId}
                                </span>
                              </div>
                              <span className={`font-medium ${
                                quantity > 0 ? "text-emerald-600" : "text-red-600"
                              }`}>
                                {quantity > 0 ? "+" : ""}
                                {quantity}
                              </span>
                            </div>
                          );
                        }
                      )}
                    </div>
                  </div>
                )}

                {item.reason && (
                  <p className="text-xs text-gray-400 mt-3 italic">{item.reason}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
