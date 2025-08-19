"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Minus, Plus } from "lucide-react";
import {
  getSupermarkets,
  addSale,
  deleteOrder,
  getFragranceStock,
  updateStock,
} from "@/utils/hybridStorage";
import { getFragrances } from "@/utils/storage";
import type { Sale, Supermarket, FragranceStock } from "@/utils/storage";

interface AddSalePageProps {
  onBack: () => void;
  preFillData?: {
    supermarketId: string;
    quantity: number;
    orderId?: string;
  } | null;
}

export function AddSalePage({ onBack, preFillData }: AddSalePageProps) {
  const [supermarketId, setSupermarketId] = useState(
    preFillData?.supermarketId || ""
  );
  const [cartons, setCartons] = useState(
    preFillData ? Math.ceil(preFillData.quantity / 9) : 0
  );
  const [priceOption, setPriceOption] = useState<"option1" | "option2">(
    "option1"
  );
  const [isPaidImmediately, setIsPaidImmediately] = useState(false);
  const [paymentNote, setPaymentNote] = useState("");
  const [expectedPaymentDate, setExpectedPaymentDate] = useState("");
  const [saleDate, setSaleDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [fragranceStock, setFragranceStock] = useState<FragranceStock[]>([]);
  const [fragranceDistribution, setFragranceDistribution] = useState<
    Record<string, number>
  >({});
  const [searchQuery, setSearchQuery] = useState("");
  const [allSupermarkets, setAllSupermarkets] = useState<Supermarket[]>([]);
  const [filteredSupermarkets, setFilteredSupermarkets] = useState<
    Supermarket[]
  >([]);

  // Load fragrance data
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load all data in parallel for better performance
        const [stock, fragrances, supermarkets] = await Promise.all([
          getFragranceStock(),
          getFragrances(),
          getSupermarkets(),
        ]);

        setFragranceStock(stock);
        setAllSupermarkets(supermarkets);
        setFilteredSupermarkets(supermarkets);

        // Initialize fragrance distribution
        const initialDistribution: Record<string, number> = {};
        fragrances.forEach(
          (fragrance: { id: string; name: string; color: string }) => {
            initialDistribution[fragrance.id] = 0;
          }
        );
        setFragranceDistribution(initialDistribution);
      } catch (error) {
        console.error("Error loading initial data:", error);
      }
    };

    loadData();
  }, []);

  // Filter supermarkets when search query changes
  useEffect(() => {
    // Use a debounced search to prevent too many re-renders
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim() === "") {
        // If search is empty, show all supermarkets
        setFilteredSupermarkets(allSupermarkets);
      } else {
        // Filter from the all supermarkets
        const filtered = allSupermarkets.filter((sm) =>
          sm.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredSupermarkets(filtered);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery, allSupermarkets]);

  // Calculate quantity based on cartons (9 pieces per carton)
  const quantity = cartons * 9;

  // Price options configuration
  const priceOptions = {
    option1: {
      pricePerUnit: 180,
      benefitPerUnit: 25,
      costToSupplier: 155,
      label: "Option 1 (180 DZD)",
    },
    option2: {
      pricePerUnit: 180,
      benefitPerUnit: 17,
      costToSupplier: 163,
      label: "Option 2 (180 DZD)",
    },
  };

  const selectedPrice = priceOptions[priceOption];
  const totalValue = quantity * selectedPrice.pricePerUnit;
  const totalBenefit = quantity * selectedPrice.benefitPerUnit;
  const totalCostToSupplier = quantity * selectedPrice.costToSupplier;

  const handleFragranceChange = (fragranceId: string, value: number): void => {
    setFragranceDistribution((prev) => ({
      ...prev,
      [fragranceId]: value,
    }));
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent double submission
    if (isSubmitting) {
      console.log("⏳ Form submission already in progress...");
      return;
    }

    // Basic validation
    if (!supermarketId) {
      alert("Veuillez sélectionner un supermarché.");
      return;
    }

    if (cartons <= 0) {
      alert("Veuillez spécifier le nombre de cartons.");
      return;
    }

    // Validate fragrance distribution
    const totalFragranceQty = Object.values(fragranceDistribution).reduce(
      (sum, qty) => sum + qty,
      0
    );
    if (totalFragranceQty !== cartons) {
      alert(
        `La distribution des parfums (${totalFragranceQty} cartons) doit correspondre au total des cartons vendus (${cartons} cartons).`
      );
      return;
    }

    // Verify we have enough stock for each fragrance
    for (const [fragranceId, qty] of Object.entries(fragranceDistribution)) {
      const fragrance = fragranceStock.find(
        (f) => f.fragranceId === fragranceId
      );
      if (fragrance && qty > fragrance.quantity) {
        alert(
          `Stock insuffisant pour le parfum "${fragrance.name}". Vous avez ${fragrance.quantity} cartons en stock.`
        );
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const sale: Omit<Sale, "id"> = {
        date: new Date(saleDate).toISOString(),
        supermarketId,
        quantity,
        cartons,
        pricePerUnit: selectedPrice.pricePerUnit,
        totalValue,
        isPaid: isPaidImmediately,
        paymentDate: isPaidImmediately
          ? saleDate
            ? new Date(saleDate).toISOString()
            : new Date().toISOString()
          : undefined,
        paymentNote: !isPaidImmediately ? paymentNote : "",
        expectedPaymentDate: !isPaidImmediately ? expectedPaymentDate : "",
        payments: isPaidImmediately
          ? [
              {
                id: Date.now().toString(),
                date: saleDate
                  ? new Date(saleDate).toISOString()
                  : new Date().toISOString(),
                amount: totalValue,
                note: "Paiement complet",
                type: "direct",
              },
            ]
          : [],
        remainingAmount: isPaidImmediately ? 0 : totalValue,
        fragranceDistribution: fragranceDistribution,
      };

      // Add the sale first
      console.log("🛒 Adding sale to database...");
      const addedSale = await addSale(sale);

      if (!addedSale) {
        throw new Error("Failed to add sale to database");
      }

      console.log("✅ Sale added successfully:", addedSale.id);

      // Update stock by removing the sold cartons with fragrance distribution
      console.log("🔄 Updating stock after sale:", {
        cartons: -cartons,
        fragranceDistribution,
        saleDate,
      });

      const stockResult = await updateStock(
        -cartons,
        "removed",
        `Vente de ${cartons} cartons (${quantity} pièces) - ${new Date(
          saleDate
        ).toLocaleDateString()}`,
        fragranceDistribution
      );

      console.log("✅ Stock update result:", stockResult);

      // Delete order if it was a pre-filled order
      if (preFillData?.orderId) {
        console.log("🗑️ Deleting associated order:", preFillData.orderId);
        await deleteOrder(preFillData.orderId);
      }

      // Dispatch event to refresh all data
      console.log("📡 Dispatching saleDataChanged event");
      const event = new CustomEvent("saleDataChanged");
      window.dispatchEvent(event);

      console.log("✅ Sale completed and event dispatched");

      // Go back to previous page
      onBack();
    } catch (error) {
      console.error("❌ Error during sale process:", error);
      alert(
        `Erreur lors de l'enregistrement de la vente: ${
          error instanceof Error ? error.message : "Erreur inconnue"
        }`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pb-20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="mr-1"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-gray-800">
            {preFillData ? "Confirmer la Livraison" : "Nouvelle Vente"}
          </h1>
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Date de vente
          </label>
          <input
            type="date"
            className="w-full rounded-xl border border-gray-200 p-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all shadow-sm"
            value={saleDate}
            onChange={(e) => setSaleDate(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Supermarché
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Rechercher un supermarché..."
              className="w-full rounded-xl border border-gray-200 p-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all shadow-sm mb-2"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <select
              className="w-full rounded-xl border border-gray-200 p-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all shadow-sm"
              value={supermarketId}
              onChange={(e) => setSupermarketId(e.target.value)}
              required
            >
              <option value="">Sélectionner un supermarché</option>
              {filteredSupermarkets.map((sm) => (
                <option key={sm.id} value={sm.id}>
                  {sm.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Nombre de Cartons (9 pièces/carton)
          </label>
          <div className="flex items-center">
            <Button
              type="button"
              variant="outline"
              className="rounded-l-xl h-12 w-12 flex items-center justify-center border-gray-200"
              onClick={() => setCartons((c) => Math.max(0, c - 1))}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <input
              type="number"
              className="flex-1 h-12 text-center border-x-0 border-y border-gray-200"
              value={cartons}
              onChange={(e) => {
                const value =
                  e.target.value === "" ? 0 : parseInt(e.target.value);
                setCartons(value);
              }}
              onBlur={() => {
                if (cartons < 0) setCartons(0);
              }}
              min="0"
              required
            />
            <Button
              type="button"
              variant="outline"
              className="rounded-r-xl h-12 w-12 flex items-center justify-center border-gray-200"
              onClick={() => setCartons((c) => c + 1)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Fragrance distribution section - now mandatory */}
        {cartons > 0 && (
          <div className="space-y-3 mt-4 border p-4 rounded-xl border-blue-100 bg-blue-50">
            <div>
              <span className="text-sm font-medium text-blue-700">
                Distribution par Parfum (Obligatoire)
              </span>
              <p className="text-xs text-blue-500 mt-1">
                Spécifiez la quantité exacte de chaque parfum
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-3">
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
                        (Stock: {fragrance.quantity})
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
                      value={fragranceDistribution[fragrance.fragranceId] || 0}
                      onChange={(e) =>
                        handleFragranceChange(
                          fragrance.fragranceId,
                          parseInt(e.target.value) || 0
                        )
                      }
                      min="0"
                      max={fragrance.quantity}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="h-8 w-8 flex items-center justify-center border-gray-200 rounded-r-lg"
                      onClick={() => {
                        const currentValue =
                          fragranceDistribution[fragrance.fragranceId] || 0;
                        if (currentValue < fragrance.quantity) {
                          handleFragranceChange(
                            fragrance.fragranceId,
                            currentValue + 1
                          );
                        }
                      }}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-sm text-blue-600 pt-1">
              <div>
                Total distribué:{" "}
                {Object.values(fragranceDistribution).reduce(
                  (sum, qty) => sum + qty,
                  0
                )}{" "}
                / {cartons} cartons
              </div>
              {Object.values(fragranceDistribution).reduce(
                (sum, qty) => sum + qty,
                0
              ) !== cartons && (
                <div className="text-red-500 font-medium">
                  Les quantités doivent correspondre exactement
                </div>
              )}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Quantité Totale (Pièces)
          </label>
          <div className="flex items-center border border-gray-200 rounded-xl p-3 bg-gray-50">
            <span className="text-lg font-medium">{quantity} pièces</span>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Option de Prix
          </label>
          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant={priceOption === "option1" ? "default" : "outline"}
              className={`w-full rounded-xl py-3 px-4 h-auto ${
                priceOption === "option1"
                  ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md border-transparent"
                  : "bg-white hover:bg-gray-50 border-gray-200"
              }`}
              onClick={() => setPriceOption("option1")}
            >
              <div className="text-left">
                <div className="font-medium text-base">180 DZD</div>
                <div
                  className={`text-xs ${
                    priceOption === "option1"
                      ? "text-blue-100"
                      : "text-gray-500"
                  }`}
                >
                  Retour: 155 DZD/unité
                </div>
              </div>
            </Button>
            <Button
              type="button"
              variant={priceOption === "option2" ? "default" : "outline"}
              className={`w-full rounded-xl py-3 px-4 h-auto ${
                priceOption === "option2"
                  ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md border-transparent"
                  : "bg-white hover:bg-gray-50 border-gray-200"
              }`}
              onClick={() => setPriceOption("option2")}
            >
              <div className="text-left">
                <div className="font-medium text-base">180 DZD</div>
                <div
                  className={`text-xs ${
                    priceOption === "option2"
                      ? "text-blue-100"
                      : "text-gray-500"
                  }`}
                >
                  Retour: 163 DZD/unité
                </div>
              </div>
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Valeur totale
          </label>
          <div className="flex items-center border border-gray-200 rounded-xl p-3 bg-gray-50">
            <span className="text-lg font-medium text-blue-600">
              {totalValue.toLocaleString("fr-DZ")} DZD
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2 p-3 border border-gray-200 rounded-xl">
          <input
            type="checkbox"
            id="isPaid"
            checked={isPaidImmediately}
            onChange={(e) => setIsPaidImmediately(e.target.checked)}
            className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label
            htmlFor="isPaid"
            className="text-base font-medium text-gray-700"
          >
            Payé immédiatement
          </label>
        </div>

        {!isPaidImmediately && (
          <div className="space-y-4 border rounded-xl p-4 bg-gray-50">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Date de paiement prévue
              </label>
              <input
                type="date"
                className="w-full rounded-xl border border-gray-200 p-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all shadow-sm"
                value={expectedPaymentDate}
                onChange={(e) => setExpectedPaymentDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Note de paiement
              </label>
              <textarea
                className="w-full rounded-xl border border-gray-200 p-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all shadow-sm min-h-[100px]"
                value={paymentNote}
                onChange={(e) => setPaymentNote(e.target.value)}
                placeholder="Ex: Paiement prévu après 15 jours..."
              />
            </div>
          </div>
        )}

        <div className="rounded-xl bg-gray-50 p-4 text-sm border border-gray-200">
          <p className="font-medium mb-2 text-gray-800">Information:</p>
          <div className="space-y-1">
            <p>1 carton = 9 pièces de savon</p>
            <p>
              Quantité totale = {cartons} cartons × 9 = {quantity} pièces
            </p>
            <p>Prix unitaire = {selectedPrice.pricePerUnit} DZD</p>
            <p>
              Montant total = {quantity} × {selectedPrice.pricePerUnit} ={" "}
              {totalValue.toLocaleString("fr-DZ")} DZD
            </p>
            <p className="text-green-600">
              Bénéfice total = {totalBenefit.toLocaleString("fr-DZ")} DZD
            </p>
            <p className="text-red-600">
              À retourner au fournisseur ={" "}
              {totalCostToSupplier.toLocaleString("fr-DZ")} DZD
            </p>
          </div>
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-14 mt-6 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              {preFillData
                ? "Confirmation en cours..."
                : "Enregistrement en cours..."}
            </div>
          ) : preFillData ? (
            "Confirmer la Livraison"
          ) : (
            "Enregistrer la Vente"
          )}
        </Button>
      </div>
    </form>
  );
}
