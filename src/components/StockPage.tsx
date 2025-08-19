"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Plus, Minus, Settings, X } from "lucide-react";
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
      const [history, currentStockData, fragStock] = await Promise.all([
        getStockHistory(),
        getCurrentStock(),
        getFragranceStock(),
      ]);

      console.log("Loaded stock data:", {
        history,
        currentStockData,
        fragStock,
      });

      setStockHistory(history);
      setCurrentStock(currentStockData.currentStock);
      setFragranceStock(fragStock);

      // Initialize fragrance distributions
      const fragrances = await getFragrances();
      const initialDistribution: Record<string, number> = {};
      fragrances.forEach((fragrance) => {
        initialDistribution[fragrance.id] = 0;
      });
      setFragranceDistribution(initialDistribution);
      setAdjustFragranceDistribution(initialDistribution);
    } catch (error) {
      console.error("Error loading stock data:", error);
    }
  }, []);

  // Load initial data
  useEffect(() => {
    loadStockData();
  }, [loadStockData]);

  // Handle fragrance change for add form
  const handleAddFragranceChange = (
    fragranceId: string,
    value: number
  ): void => {
    setFragranceDistribution((prev) => ({
      ...prev,
      [fragranceId]: Math.max(0, value),
    }));
  };

  // Handle fragrance change for adjust form
  const handleAdjustFragranceChange = (
    fragranceId: string,
    value: number
  ): void => {
    setAdjustFragranceDistribution((prev) => ({
      ...prev,
      [fragranceId]: Math.max(0, value),
    }));
  };

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

      // If fragrance distribution is enabled, validate it
      if (showFragranceDistribution) {
        const totalDistributed = Object.values(fragranceDistribution).reduce(
          (sum, qty) => sum + qty,
          0
        );
        if (totalDistributed !== addQuantity) {
          alert(
            `La distribution des parfums (${totalDistributed} cartons) doit correspondre exactement au total à ajouter (${addQuantity} cartons).`
          );
          return;
        }
      } else {
        // Auto-distribute evenly
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

      // Refresh data and close form
      await loadStockData();
      setShowAddForm(false);
      setAddQuantity(0);
      setShowFragranceDistribution(false);

      // Dispatch event to notify other components
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

      // Calculate fragrance changes
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

      // Refresh data and close form
      await loadStockData();
      setShowAdjustForm(false);
      setAdjustQuantity(0);

      // Dispatch event to notify other components
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

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={onBack} className="mr-1">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-gray-800">Gestion du Stock</h1>
        </div>
      </div>

      {/* Current Stock Card */}
      <Card className="border-none shadow-md rounded-xl overflow-hidden mb-6">
        <CardContent className="p-6 flex flex-col items-center justify-center">
          <h2 className="text-lg font-medium text-gray-500 mb-2">
            Stock Actuel
          </h2>
          <div className="text-5xl font-bold mb-4 text-purple-700">
            {currentStock} cartons
          </div>
          <div className="h-3 w-full rounded-full bg-purple-100 overflow-hidden">
            <div
              className="h-3 rounded-full bg-purple-600 transition-all duration-300"
              style={{ width: `${Math.min((currentStock / 300) * 100, 100)}%` }}
            />
          </div>
          <div className="w-full flex justify-between items-center mt-2 text-sm text-gray-500">
            <p>0 cartons</p>
            <p>{Math.min((currentStock / 300) * 100, 100).toFixed(1)}%</p>
            <p>300 cartons</p>
          </div>
          <p className="text-sm text-gray-600 mt-4">
            {currentStock * 9} pièces au total
          </p>
        </CardContent>
      </Card>

      {/* Fragrance Stock Grid */}
      <div className="mb-6">
        <h2 className="text-lg font-medium text-gray-700 mb-3">
          Stock par Parfum
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {fragranceStock.map((fragrance) => (
            <Card
              key={fragrance.fragranceId}
              className="border-none shadow-sm overflow-hidden"
            >
              <div className="p-3 flex items-center justify-between">
                <div className="flex items-center">
                  <div
                    className="w-4 h-4 rounded-full mr-2"
                    style={{ backgroundColor: fragrance.color }}
                  />
                  <span className="font-medium text-sm">{fragrance.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold">
                    {fragrance.quantity}
                  </span>
                  <span className="text-sm text-gray-500 ml-1">cartons</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Button
          size="lg"
          className="h-14 rounded-xl font-medium bg-green-600 hover:bg-green-700 text-white shadow-md"
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
          className="h-14 rounded-xl font-medium bg-purple-600 hover:bg-purple-700 text-white shadow-md"
          onClick={() => {
            setShowAdjustForm(true);
            resetAdjustForm();
          }}
        >
          <Settings className="mr-2 h-5 w-5" />
          Ajuster Stock
        </Button>
      </div>

      {/* Add Stock Form */}
      {showAddForm && (
        <Card className="border-none shadow-md rounded-xl overflow-hidden">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Ajouter du Stock
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowAddForm(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <form onSubmit={handleAddStock} className="space-y-4">
              {/* Quantity Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Quantité à ajouter (Cartons)
                </label>
                <div className="flex items-center">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-l-xl h-12 w-12 flex items-center justify-center border-gray-200"
                    onClick={() => setAddQuantity(Math.max(0, addQuantity - 1))}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <input
                    type="number"
                    className="flex-1 h-12 text-center border-x-0 border-y border-gray-200"
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
                    className="rounded-r-xl h-12 w-12 flex items-center justify-center border-gray-200"
                    onClick={() =>
                      setAddQuantity(Math.min(300, addQuantity + 1))
                    }
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-gray-500">
                  {addQuantity * 9} pièces à ajouter
                </p>
              </div>

              {/* Fragrance Distribution Toggle */}
              {addQuantity > 0 && (
                <div className="flex items-center justify-between bg-green-50 p-3 rounded-lg">
                  <div>
                    <span className="text-sm font-medium text-green-700">
                      Distribuer par parfum
                    </span>
                    <p className="text-xs text-green-500 mt-1">
                      Spécifier la quantité de chaque parfum
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant={showFragranceDistribution ? "default" : "outline"}
                    className={`rounded-md ${
                      showFragranceDistribution ? "bg-green-600" : ""
                    }`}
                    onClick={() =>
                      setShowFragranceDistribution(!showFragranceDistribution)
                    }
                  >
                    {showFragranceDistribution ? "Activé" : "Activé"}
                  </Button>
                </div>
              )}

              {/* Fragrance Distribution Inputs */}
              {showFragranceDistribution && addQuantity > 0 && (
                <div className="space-y-3 border p-3 rounded-xl border-green-100 bg-green-50">
                  <h4 className="text-sm font-medium text-green-700">
                    Distribution ({addQuantity} cartons au total)
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {fragranceStock.map((fragrance) => (
                      <div key={fragrance.fragranceId} className="space-y-1">
                        <div className="flex items-center">
                          <div
                            className="w-3 h-3 rounded-full mr-1"
                            style={{ backgroundColor: fragrance.color }}
                          />
                          <label className="text-sm text-gray-600">
                            {fragrance.name}
                          </label>
                        </div>
                        <div className="flex items-center">
                          <Button
                            type="button"
                            variant="outline"
                            className="h-8 w-8 flex items-center justify-center border-gray-200 rounded-l-lg"
                            onClick={() =>
                              handleAddFragranceChange(
                                fragrance.fragranceId,
                                (fragranceDistribution[fragrance.fragranceId] ||
                                  0) - 1
                              )
                            }
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <input
                            type="number"
                            className="h-8 w-full text-center text-sm border-x-0 border-y border-gray-200"
                            value={
                              fragranceDistribution[fragrance.fragranceId] || 0
                            }
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
                            className="h-8 w-8 flex items-center justify-center border-gray-200 rounded-r-lg"
                            onClick={() =>
                              handleAddFragranceChange(
                                fragrance.fragranceId,
                                (fragranceDistribution[fragrance.fragranceId] ||
                                  0) + 1
                              )
                            }
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="text-sm text-green-600">
                    Total:{" "}
                    {Object.values(fragranceDistribution).reduce(
                      (sum, qty) => sum + qty,
                      0
                    )}{" "}
                    / {addQuantity} cartons
                  </div>
                </div>
              )}

              {/* Form Actions */}
              <div className="flex space-x-3">
                <Button
                  type="submit"
                  disabled={isLoading || addQuantity <= 0}
                  className="flex-1 h-12 rounded-xl bg-green-600 hover:bg-green-700 text-white font-medium shadow-md disabled:opacity-50"
                >
                  {isLoading ? "Ajout en cours..." : "Ajouter le Stock"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-12 rounded-xl border-gray-200 text-gray-700"
                  onClick={() => setShowAddForm(false)}
                >
                  Annuler
                </Button>
              </div>
            </form>
          </div>
        </Card>
      )}

      {/* Adjust Stock Form */}
      {showAdjustForm && (
        <Card className="border-none shadow-md rounded-xl overflow-hidden">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Ajuster le Stock
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowAdjustForm(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <form onSubmit={handleAdjustStock} className="space-y-4">
              {/* Total Stock Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Nouveau Stock Total (Cartons)
                </label>
                <div className="flex items-center">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-l-xl h-12 w-12 flex items-center justify-center border-gray-200"
                    onClick={() =>
                      setAdjustQuantity(Math.max(0, adjustQuantity - 1))
                    }
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <input
                    type="number"
                    className="flex-1 h-12 text-center border-x-0 border-y border-gray-200"
                    value={adjustQuantity}
                    onChange={(e) =>
                      setAdjustQuantity(
                        Math.max(0, parseInt(e.target.value) || 0)
                      )
                    }
                    min="0"
                    max="300"
                    required
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-r-xl h-12 w-12 flex items-center justify-center border-gray-200"
                    onClick={() =>
                      setAdjustQuantity(Math.min(300, adjustQuantity + 1))
                    }
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex justify-between text-sm">
                  <p className="text-gray-500">
                    {adjustQuantity * 9} pièces au total
                  </p>
                  <p
                    className={
                      adjustQuantity > currentStock
                        ? "text-green-600"
                        : adjustQuantity < currentStock
                        ? "text-red-600"
                        : "text-gray-500"
                    }
                  >
                    {adjustQuantity > currentStock
                      ? `+${adjustQuantity - currentStock}`
                      : adjustQuantity < currentStock
                      ? `${adjustQuantity - currentStock}`
                      : "Aucun changement"}
                  </p>
                </div>
              </div>

              {/* Fragrance Distribution */}
              <div className="space-y-3 border p-3 rounded-xl border-purple-100 bg-purple-50">
                <h4 className="text-sm font-medium text-purple-700">
                  Distribution par Parfum ({adjustQuantity} cartons au total)
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {fragranceStock.map((fragrance) => (
                    <div key={fragrance.fragranceId} className="space-y-1">
                      <div className="flex items-center">
                        <div
                          className="w-3 h-3 rounded-full mr-1"
                          style={{ backgroundColor: fragrance.color }}
                        />
                        <label className="text-sm text-gray-600">
                          {fragrance.name}
                          <span className="text-xs text-gray-400 ml-1">
                            (Actuel: {fragrance.quantity})
                          </span>
                        </label>
                      </div>
                      <div className="flex items-center">
                        <Button
                          type="button"
                          variant="outline"
                          className="h-8 w-8 flex items-center justify-center border-gray-200 rounded-l-lg"
                          onClick={() =>
                            handleAdjustFragranceChange(
                              fragrance.fragranceId,
                              (adjustFragranceDistribution[
                                fragrance.fragranceId
                              ] || 0) - 1
                            )
                          }
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <input
                          type="number"
                          className="h-8 w-full text-center text-sm border-x-0 border-y border-gray-200"
                          value={
                            adjustFragranceDistribution[
                              fragrance.fragranceId
                            ] || 0
                          }
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
                          className="h-8 w-8 flex items-center justify-center border-gray-200 rounded-r-lg"
                          onClick={() =>
                            handleAdjustFragranceChange(
                              fragrance.fragranceId,
                              (adjustFragranceDistribution[
                                fragrance.fragranceId
                              ] || 0) + 1
                            )
                          }
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-sm text-purple-600">
                  Total:{" "}
                  {Object.values(adjustFragranceDistribution).reduce(
                    (sum, qty) => sum + qty,
                    0
                  )}{" "}
                  / {adjustQuantity} cartons
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex space-x-3">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 h-12 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-medium shadow-md disabled:opacity-50"
                >
                  {isLoading ? "Ajustement en cours..." : "Ajuster le Stock"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-12 rounded-xl border-gray-200 text-gray-700"
                  onClick={() => setShowAdjustForm(false)}
                >
                  Annuler
                </Button>
              </div>
            </form>
          </div>
        </Card>
      )}

      {/* Stock History */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          Historique des Mouvements
        </h2>
        <div className="space-y-3">
          {stockHistory
            .slice()
            .reverse()
            .map((item) => (
              <div
                key={item.id}
                className="flex flex-col p-4 bg-white border border-gray-200 rounded-xl shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-800">
                      {new Date(item.date).toLocaleDateString("fr-FR")}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {item.type === "adjusted"
                        ? "Ajustement"
                        : item.type === "removed"
                        ? "Vente"
                        : "Livraison"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-base font-medium ${
                        item.quantity > 0
                          ? "text-green-600"
                          : item.quantity < 0
                          ? "text-red-600"
                          : ""
                      }`}
                    >
                      {item.quantity > 0 ? "+" : ""}
                      {item.quantity} cartons
                    </p>
                    <p className="text-xs text-gray-500">
                      Stock final: {item.currentStock} cartons
                    </p>
                  </div>
                </div>

                {/* Fragrance distribution if available */}
                {item.fragranceDistribution && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Distribution par parfum
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(item.fragranceDistribution).map(
                        ([fragranceId, quantity]) => {
                          const fragrance = fragranceStock.find(
                            (f) => f.fragranceId === fragranceId
                          );
                          return (
                            <div
                              key={fragranceId}
                              className="flex items-center justify-between text-sm"
                            >
                              <div className="flex items-center">
                                <div
                                  className="w-3 h-3 rounded-full mr-1"
                                  style={{
                                    backgroundColor: fragrance?.color || "#ccc",
                                  }}
                                />
                                <span className="text-gray-600">
                                  {fragrance?.name || fragranceId}
                                </span>
                              </div>
                              <span className="font-medium">
                                {quantity > 0 ? "+" : ""}
                                {quantity} cartons
                              </span>
                            </div>
                          );
                        }
                      )}
                    </div>
                  </div>
                )}

                {item.reason && (
                  <p className="text-xs text-gray-500 mt-2">{item.reason}</p>
                )}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
