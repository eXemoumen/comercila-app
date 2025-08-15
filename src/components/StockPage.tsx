"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
    ChevronLeft,
    Plus,
    Minus,
    Settings,
} from "lucide-react";
import {
    getStockHistory,
    updateStock,
    getFragranceStock,
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
    const [showAdjustForm, setShowAdjustForm] = useState<boolean>(false);
    const [newStock, setNewStock] = useState<{ cartons: number }>({ cartons: 0 });
    const [stockHistory, setStockHistory] = useState<StockHistoryItem[]>([]);
    const [currentStock, setCurrentStock] = useState<number>(0);
    const [fragranceStock, setFragranceStock] = useState<FragranceStock[]>([]);
    const [showFragranceForm, setShowFragranceForm] = useState<boolean>(false);
    const [fragranceDistribution, setFragranceDistribution] = useState<
        Record<string, number>
    >({});
    const [isAddingMode, setIsAddingMode] = useState<boolean>(true);

    // Function to load stock data
    const loadStockData = useCallback(async () => {
        const history = await getStockHistory();
        setStockHistory(history);
        // Current stock is now calculated from fragrance stock
        let fragStock = await getFragranceStock();
        console.log("Loaded fragrance stock:", fragStock);
        console.log("Fragrance stock details:", fragStock.map(f => `${f.name}: ${f.quantity}`));

        // If fragrance stock is empty, try to initialize it
        if (fragStock.length === 0) {
            console.log("Fragrance stock is empty, initializing...");
            const { initializeFragranceStock } = await import("@/utils/storage");
            fragStock = await initializeFragranceStock();
            console.log("Initialized fragrance stock:", fragStock);
        }

        setFragranceStock(fragStock);
        // Calculate current stock based on fragrance stock
        const totalStock = fragStock.reduce(
            (total, item) => total + item.quantity,
            0
        );
        setCurrentStock(totalStock);
    }, []);

    // Load initial data
    useEffect(() => {
        loadStockData();

        // Initialize fragrance distribution
        const initializeDistribution = async () => {
            const fragrances = await getFragrances();
            const initialDistribution: Record<string, number> = {};
            fragrances.forEach(
                (fragrance: { id: string; name: string; color: string }) => {
                    initialDistribution[fragrance.id] = 0;
                }
            );
            setFragranceDistribution(initialDistribution);
        };
        initializeDistribution();

        // Add event listener for saleDataChanged event
        const handleSaleDataChanged = () => {
            loadStockData();
        };

        window.addEventListener("saleDataChanged", handleSaleDataChanged);

        // Cleanup event listener on unmount
        return () => {
            window.removeEventListener("saleDataChanged", handleSaleDataChanged);
        };
    }, [loadStockData]);
    const handleAdjustStock = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();

        // Determine if this is an incremental addition or a complete adjustment
        if (isAddingMode) {
            // In adding mode, the value in newStock is the amount to add
            const amountToAdd = newStock.cartons;

            if (amountToAdd <= 0) {
                alert("Veuillez entrer une quantité positive à ajouter.");
                return;
            }

            // Check if fragrance distribution is enabled
            if (showFragranceForm) {
                // Calculate total fragrance quantities to ensure they match the total amount to add
                const totalFragranceQty = Object.values(fragranceDistribution).reduce(
                    (sum, qty) => sum + qty,
                    0
                );

                if (totalFragranceQty !== amountToAdd) {
                    alert(
                        `La distribution des parfums (${totalFragranceQty} cartons) doit correspondre au total à ajouter (${amountToAdd} cartons).`
                    );
                    return;
                }

                // Update stock with the specified fragrance distribution
                updateStock(
                    amountToAdd,
                    "added",
                    "Ajout de stock",
                    fragranceDistribution
                );
            } else {
                // If fragrance form not used, distribute added stock evenly
                const allFragrances = await getFragrances();
                const fragranceCount = allFragrances.length;
                const baseAmount = Math.floor(amountToAdd / fragranceCount);
                const remainder = amountToAdd % fragranceCount;

                // Create even distribution with the remainder added to first fragrances
                const evenDistribution: Record<string, number> = {};
                allFragrances.forEach((fragrance, index) => {
                    evenDistribution[fragrance.id] =
                        baseAmount + (index < remainder ? 1 : 0);
                });

                // Update stock with even distribution
                updateStock(
                    amountToAdd,
                    "added",
                    "Ajout de stock - Distribution automatique",
                    evenDistribution
                );
            }
        } else {
            // In adjustment mode, calculate the difference from current
            const difference = newStock.cartons - currentStock;

            // Check if fragrance distribution is enabled
            if (showFragranceForm) {
                // Calculate total fragrance quantities to ensure they match the total stock
                const totalFragranceQty = Object.values(fragranceDistribution).reduce(
                    (sum, qty) => sum + qty,
                    0
                );

                if (totalFragranceQty !== newStock.cartons) {
                    alert(
                        `La distribution des parfums (${totalFragranceQty} cartons) doit correspondre au stock total (${newStock.cartons} cartons).`
                    );
                    return;
                }

                // This represents a completely new stock allocation
                // First, save the current fragrance stock to calculate differences
                const currentFragranceStock = await getFragranceStock();
                const fragranceChanges: Record<string, number> = {};

                // Calculate the difference between new distribution and current stock for each fragrance
                currentFragranceStock.forEach((fragrance: FragranceStock) => {
                    const currentQty = fragrance.quantity;
                    const newQty = fragranceDistribution[fragrance.fragranceId] || 0;
                    fragranceChanges[fragrance.fragranceId] = newQty - currentQty;
                });

                // Update stock with the calculated changes
                updateStock(
                    difference,
                    "adjusted",
                    "Ajustement manuel",
                    fragranceChanges
                );
            } else {
                // If fragrance form not used, distribute stock evenly
                const allFragrances = await getFragrances();
                const fragranceCount = allFragrances.length;
                const baseAmount = Math.floor(newStock.cartons / fragranceCount);
                const remainder = newStock.cartons % fragranceCount;

                // Create even distribution with the remainder added to first fragrances
                const evenDistribution: Record<string, number> = {};
                allFragrances.forEach((fragrance, index) => {
                    evenDistribution[fragrance.id] =
                        baseAmount + (index < remainder ? 1 : 0);
                });

                // Calculate changes from current stock
                const currentFragranceStock = await getFragranceStock();
                const fragranceChanges: Record<string, number> = {};

                currentFragranceStock.forEach((fragrance: FragranceStock) => {
                    const currentQty = fragrance.quantity;
                    const newQty = evenDistribution[fragrance.fragranceId] || 0;
                    fragranceChanges[fragrance.fragranceId] = newQty - currentQty;
                });

                // Update stock with even distribution
                updateStock(
                    difference,
                    "adjusted",
                    "Ajustement manuel - Distribution automatique",
                    fragranceChanges
                );
            }
        }

        // Refresh the stock data after successful update
        await loadStockData();

        // Reset the form
        setShowAdjustForm(false);
        setNewStock({ cartons: 0 });
        setShowFragranceForm(false);
        await resetFragranceDistribution();
    };

    const handleFragranceChange = (fragranceId: string, value: number): void => {
        setFragranceDistribution((prev) => ({
            ...prev,
            [fragranceId]: value,
        }));
    };

    const resetFragranceDistribution = async () => {
        if (showFragranceForm) {
            const fragrances = await getFragrances();
            const resetDistribution: Record<string, number> = {};
            fragrances.forEach((fragrance) => {
                resetDistribution[fragrance.id] = 0;
            });
            setFragranceDistribution(resetDistribution);
        }
    };
    return (
        <div className="space-y-4 pb-20">
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
                            style={{ width: `${(currentStock / 300) * 100}%` }}
                        />
                    </div>
                    <div className="w-full flex justify-between items-center mt-2 text-sm text-gray-500">
                        <p>0 cartons</p>
                        <p>{((currentStock / 300) * 100).toFixed(1)}%</p>
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
                                    <span className="font-medium">{fragrance.name}</span>
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

            {/* Single Adjust Stock Button */}
            <Button
                size="lg"
                className="w-full h-14 rounded-xl font-medium bg-purple-600 hover:bg-purple-700 text-white shadow-md"
                onClick={() => setShowAdjustForm(true)}
            >
                <Settings className="mr-2 h-5 w-5" />
                Ajuster Stock
            </Button>
            {/* Adjust Stock Form */}
            {showAdjustForm && (
                <Card className="border-none shadow-md rounded-xl overflow-hidden mt-5">
                    <form onSubmit={handleAdjustStock} className="space-y-4 p-4">
                        {/* Toggle between add and adjust mode */}
                        <div className="flex justify-center mb-4 bg-purple-50 p-2 rounded-lg">
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant={isAddingMode ? "default" : "outline"}
                                    className={`rounded-md ${isAddingMode ? "bg-purple-600" : ""
                                        }`}
                                    onClick={async () => {
                                        setIsAddingMode(true);
                                        setNewStock({ cartons: 0 });
                                        await resetFragranceDistribution();
                                    }}
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Ajouter au stock
                                </Button>
                                <Button
                                    type="button"
                                    variant={!isAddingMode ? "default" : "outline"}
                                    className={`rounded-md ${!isAddingMode ? "bg-purple-600" : ""
                                        }`}
                                    onClick={async () => {
                                        setIsAddingMode(false);
                                        setNewStock({ cartons: currentStock });
                                        await resetFragranceDistribution();
                                    }}
                                >
                                    <Settings className="mr-2 h-4 w-4" />
                                    Ajuster le total
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">
                                {isAddingMode
                                    ? "Quantité à ajouter (Cartons)"
                                    : "Nouveau Stock Total (Cartons)"}
                            </label>
                            <div className="flex items-center">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="rounded-l-xl h-12 w-12 flex items-center justify-center border-gray-200"
                                    onClick={async () => {
                                        setNewStock({ cartons: Math.max(0, newStock.cartons - 1) });
                                        await resetFragranceDistribution();
                                    }}
                                >
                                    <Minus className="h-4 w-4" />
                                </Button>
                                <input
                                    type="number"
                                    className="flex-1 h-12 text-center border-x-0 border-y border-gray-200"
                                    value={newStock.cartons}
                                    onChange={async (e) => {
                                        setNewStock({ cartons: parseInt(e.target.value) || 0 });
                                        await resetFragranceDistribution();
                                    }}
                                    min="0"
                                    max="300"
                                    required
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="rounded-r-xl h-12 w-12 flex items-center justify-center border-gray-200"
                                    onClick={async () => {
                                        setNewStock({
                                            cartons: Math.min(300, newStock.cartons + 1),
                                        });
                                        await resetFragranceDistribution();
                                    }}
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="flex justify-between items-center text-sm text-gray-500 mt-2">
                                <p>
                                    {newStock.cartons * 9} pièces{" "}
                                    {isAddingMode ? "à ajouter" : "au total"}
                                </p>
                                {!isAddingMode && (
                                    <p
                                        className={
                                            newStock.cartons > currentStock
                                                ? "text-green-600"
                                                : newStock.cartons < currentStock
                                                    ? "text-red-600"
                                                    : ""
                                        }
                                    >
                                        {newStock.cartons > currentStock
                                            ? `+${newStock.cartons - currentStock}`
                                            : newStock.cartons < currentStock
                                                ? `${newStock.cartons - currentStock}`
                                                : "Aucun changement"}
                                    </p>
                                )}
                            </div>
                        </div>
                        {/* Fragrance distribution toggle */}
                        {newStock.cartons > 0 && (
                            <div className="pt-2">
                                <div className="flex items-center justify-between bg-purple-50 p-3 rounded-lg">
                                    <div>
                                        <span className="text-sm font-medium text-purple-700">
                                            Distribuer par parfum
                                        </span>
                                        <p className="text-xs text-purple-500 mt-1">
                                            Spécifier la quantité de chaque parfum
                                        </p>
                                    </div>
                                    <Switch
                                        checked={showFragranceForm}
                                        onCheckedChange={async (checked) => {
                                            setShowFragranceForm(checked);
                                            if (checked) {
                                                // Reset fragrance distribution when enabling the form
                                                const fragrances = await getFragrances();
                                                const resetDistribution: Record<string, number> = {};
                                                fragrances.forEach((fragrance) => {
                                                    resetDistribution[fragrance.id] = 0;
                                                });
                                                setFragranceDistribution(resetDistribution);
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Fragrance distribution inputs */}
                        {showFragranceForm && newStock.cartons > 0 && (
                            <div className="space-y-3 pt-2 border p-3 rounded-xl border-purple-100 bg-purple-50">
                                <h3 className="text-sm font-medium text-purple-700">
                                    Distribution du stock ({newStock.cartons} cartons au total)
                                </h3>
                                {/* Debug info */}
                                <div className="text-xs text-gray-500">
                                    Debug: fragranceStock.length = {fragranceStock.length}
                                    {fragranceStock.length === 0 && " (No fragrances loaded!)"}
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {(fragranceStock.length > 0 ? fragranceStock : [
                                        { fragranceId: '1', name: 'Lavande', quantity: 0, color: '#9F7AEA' },
                                        { fragranceId: '2', name: 'Rose', quantity: 0, color: '#F687B3' },
                                        { fragranceId: '3', name: 'Citron', quantity: 0, color: '#FBBF24' },
                                        { fragranceId: '4', name: 'Fraîcheur Marine', quantity: 0, color: '#60A5FA' },
                                        { fragranceId: '5', name: 'Vanille', quantity: 0, color: '#F59E0B' }
                                    ]).map((fragrance) => (
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
                                                        handleFragranceChange(
                                                            fragrance.fragranceId,
                                                            Math.max(
                                                                0,
                                                                (fragranceDistribution[fragrance.fragranceId] ||
                                                                    0) - 1
                                                            )
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
                                                        handleFragranceChange(
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
                                                        handleFragranceChange(
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
                                <div className="text-sm text-purple-600 pt-1">
                                    Total distribué:{" "}
                                    {Object.values(fragranceDistribution).reduce(
                                        (sum, qty) => sum + qty,
                                        0
                                    )}{" "}
                                    / {newStock.cartons} cartons
                                    {Object.values(fragranceDistribution).reduce(
                                        (sum, qty) => sum + qty,
                                        0
                                    ) !== newStock.cartons && (
                                            <div className="text-red-500 font-medium mt-1">
                                                Le total doit correspondre exactement au stock total
                                            </div>
                                        )}
                                </div>
                            </div>
                        )}
                        <div className="flex space-x-3">
                            <Button
                                type="submit"
                                className="flex-1 h-12 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-medium shadow-md"
                            >
                                Confirmer
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
                                            {"type" in item && item.type === "adjusted"
                                                ? "Ajustement"
                                                : "type" in item && item.type === "removed"
                                                    ? "Vente"
                                                    : "Livraison"}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p
                                            className={`text-base font-medium ${item.quantity > 0
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
                                {item.fragranceDistribution &&
                                    Object.keys(item.fragranceDistribution).length > 0 && (
                                        <div className="mt-3 pt-3 border-t border-gray-100">
                                            <p className="text-xs font-medium text-gray-500 mb-2">
                                                Distribution par parfum
                                            </p>
                                            <div className="grid grid-cols-2 gap-2">
                                                {Object.entries(item.fragranceDistribution).map(
                                                    ([fragranceId, quantity]) => {
                                                        if (quantity === 0) return null;
                                                        const fragInfo = fragranceStock.find(
                                                            (f) => f.fragranceId === fragranceId
                                                        );
                                                        if (!fragInfo) return null;

                                                        return (
                                                            <div
                                                                key={fragranceId}
                                                                className="flex items-center justify-between"
                                                            >
                                                                <div className="flex items-center">
                                                                    <div
                                                                        className="w-3 h-3 rounded-full mr-1"
                                                                        style={{ backgroundColor: fragInfo.color }}
                                                                    />
                                                                    <span className="text-xs">
                                                                        {fragInfo.name}
                                                                    </span>
                                                                </div>
                                                                <span className="text-xs font-medium">
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
                            </div>
                        ))}
                </div>
            </div>
        </div>
    );
}