"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  ChevronLeft, 
  Minus, 
  Plus, 
  ShoppingCart, 
  Store, 
  Calendar,
  CreditCard,
  Package,
  Loader2,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
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
  const [supermarketId, setSupermarketId] = useState(preFillData?.supermarketId || "");
  const [cartons, setCartons] = useState(preFillData ? Math.ceil(preFillData.quantity / 9) : 0);
  const [priceOption, setPriceOption] = useState<"option1" | "option2">("option1");
  const [isPaidImmediately, setIsPaidImmediately] = useState(false);
  const [paymentNote, setPaymentNote] = useState("");
  const [expectedPaymentDate, setExpectedPaymentDate] = useState("");
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split("T")[0]);
  const [fragranceStock, setFragranceStock] = useState<FragranceStock[]>([]);
  const [fragranceDistribution, setFragranceDistribution] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [allSupermarkets, setAllSupermarkets] = useState<Supermarket[]>([]);
  const [filteredSupermarkets, setFilteredSupermarkets] = useState<Supermarket[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [stock, fragrances, supermarkets] = await Promise.all([
          getFragranceStock(),
          getFragrances(),
          getSupermarkets(),
        ]);

        setFragranceStock(stock);
        setAllSupermarkets(supermarkets);
        setFilteredSupermarkets(supermarkets);

        const initialDistribution: Record<string, number> = {};
        fragrances.forEach((fragrance: { id: string }) => {
          initialDistribution[fragrance.id] = 0;
        });
        setFragranceDistribution(initialDistribution);
      } catch (error) {
        console.error("Error loading initial data:", error);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim() === "") {
        setFilteredSupermarkets(allSupermarkets);
      } else {
        const filtered = allSupermarkets.filter((sm) =>
          sm.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredSupermarkets(filtered);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, allSupermarkets]);

  const quantity = cartons * 9;

  const priceOptions = {
    option1: { pricePerUnit: 180, benefitPerUnit: 25, costToSupplier: 155 },
    option2: { pricePerUnit: 180, benefitPerUnit: 17, costToSupplier: 163 },
  };

  const selectedPrice = priceOptions[priceOption];
  const totalValue = quantity * selectedPrice.pricePerUnit;
  const totalBenefit = quantity * selectedPrice.benefitPerUnit;
  const totalCostToSupplier = quantity * selectedPrice.costToSupplier;
  const totalDistributed = Object.values(fragranceDistribution).reduce((sum, qty) => sum + qty, 0);

  const handleFragranceChange = (fragranceId: string, value: number): void => {
    setFragranceDistribution((prev) => ({ ...prev, [fragranceId]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    if (!supermarketId) {
      alert("Veuillez sélectionner un supermarché.");
      return;
    }

    if (cartons <= 0) {
      alert("Veuillez spécifier le nombre de cartons.");
      return;
    }

    if (totalDistributed !== cartons) {
      alert(`La distribution des parfums (${totalDistributed} cartons) doit correspondre au total (${cartons} cartons).`);
      return;
    }

    for (const [fragranceId, qty] of Object.entries(fragranceDistribution)) {
      const fragrance = fragranceStock.find((f) => f.fragranceId === fragranceId);
      if (fragrance && qty > fragrance.quantity) {
        alert(`Stock insuffisant pour "${fragrance.name}". Disponible: ${fragrance.quantity} cartons.`);
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
        paymentDate: isPaidImmediately ? new Date(saleDate).toISOString() : undefined,
        paymentNote: !isPaidImmediately ? paymentNote : "",
        expectedPaymentDate: !isPaidImmediately ? expectedPaymentDate : "",
        payments: isPaidImmediately
          ? [{ id: Date.now().toString(), date: new Date(saleDate).toISOString(), amount: totalValue, note: "Paiement complet", type: "direct" }]
          : [],
        remainingAmount: isPaidImmediately ? 0 : totalValue,
        fragranceDistribution: fragranceDistribution,
      };

      const addedSale = await addSale(sale);

      if (!addedSale) throw new Error("Failed to add sale");

      await updateStock(
        -cartons,
        "removed",
        `Vente de ${cartons} cartons - ${new Date(saleDate).toLocaleDateString()}`,
        fragranceDistribution
      );

      if (preFillData?.orderId) {
        await deleteOrder(preFillData.orderId);
      }

      window.dispatchEvent(new CustomEvent("saleDataChanged"));
      onBack();
    } catch (error) {
      console.error("Error during sale process:", error);
      alert(`Erreur: ${error instanceof Error ? error.message : "Erreur inconnue"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button type="button" variant="ghost" size="icon" onClick={onBack} className="rounded-xl">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {preFillData ? "Confirmer la Livraison" : "Nouvelle Vente"}
          </h1>
          <p className="text-sm text-gray-500">Enregistrez une nouvelle transaction</p>
        </div>
      </div>

      {/* Date Selection */}
      <div className="premium-card p-5 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Date de vente</h3>
            <p className="text-xs text-gray-500">Sélectionnez la date de la transaction</p>
          </div>
        </div>
        <input
          type="date"
          className="w-full h-12 rounded-xl border-2 border-gray-100 px-4 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
          value={saleDate}
          onChange={(e) => setSaleDate(e.target.value)}
          required
        />
      </div>

      {/* Supermarket Selection */}
      <div className="premium-card p-5 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
            <Store className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Supermarché</h3>
            <p className="text-xs text-gray-500">Sélectionnez le client</p>
          </div>
        </div>
        <input
          type="text"
          placeholder="Rechercher..."
          className="w-full h-12 rounded-xl border-2 border-gray-100 px-4 bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all mb-2"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select
          className="w-full h-12 rounded-xl border-2 border-gray-100 px-4 bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
          value={supermarketId}
          onChange={(e) => setSupermarketId(e.target.value)}
          required
        >
          <option value="">Sélectionner un supermarché</option>
          {filteredSupermarkets.map((sm) => (
            <option key={sm.id} value={sm.id}>{sm.name}</option>
          ))}
        </select>
      </div>

      {/* Quantity Selection */}
      <div className="premium-card p-5 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
            <Package className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Quantité</h3>
            <p className="text-xs text-gray-500">9 pièces par carton</p>
          </div>
        </div>
        
        <div className="flex items-center justify-center gap-4">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-14 w-14 rounded-xl border-2"
            onClick={() => setCartons((c) => Math.max(0, c - 1))}
          >
            <Minus className="h-5 w-5" />
          </Button>
          <div className="text-center min-w-[120px]">
            <input
              type="number"
              className="w-full text-center text-3xl font-bold text-gray-900 bg-transparent border-none focus:outline-none"
              value={cartons}
              onChange={(e) => setCartons(parseInt(e.target.value) || 0)}
              min="0"
            />
            <p className="text-sm text-gray-500">cartons</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-14 w-14 rounded-xl border-2"
            onClick={() => setCartons((c) => c + 1)}
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="text-center p-3 rounded-xl bg-emerald-50 border border-emerald-100">
          <span className="text-emerald-700 font-medium">{quantity} pièces</span>
        </div>
      </div>

      {/* Fragrance Distribution */}
      {cartons > 0 && (
        <div className="premium-card p-5 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Distribution</h3>
                <p className="text-xs text-gray-500">Répartition par parfum</p>
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
              totalDistributed === cartons 
                ? "bg-emerald-100 text-emerald-700" 
                : "bg-amber-100 text-amber-700"
            }`}>
              {totalDistributed}/{cartons}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {fragranceStock.map((fragrance) => (
              <div key={fragrance.fragranceId} className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: fragrance.color }} />
                  <span className="text-sm font-medium text-gray-700 truncate">{fragrance.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-lg"
                    onClick={() => handleFragranceChange(fragrance.fragranceId, Math.max(0, (fragranceDistribution[fragrance.fragranceId] || 0) - 1))}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <input
                    type="number"
                    className="flex-1 h-8 text-center text-sm font-medium bg-white rounded-lg border"
                    value={fragranceDistribution[fragrance.fragranceId] || 0}
                    onChange={(e) => handleFragranceChange(fragrance.fragranceId, parseInt(e.target.value) || 0)}
                    min="0"
                    max={fragrance.quantity}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-lg"
                    onClick={() => {
                      const current = fragranceDistribution[fragrance.fragranceId] || 0;
                      if (current < fragrance.quantity) handleFragranceChange(fragrance.fragranceId, current + 1);
                    }}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-xs text-gray-400 mt-1 text-center">Stock: {fragrance.quantity}</p>
              </div>
            ))}
          </div>

          {totalDistributed !== cartons && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span className="text-sm text-amber-700">Les quantités doivent correspondre exactement</span>
            </div>
          )}
        </div>
      )}

      {/* Price Options */}
      <div className="premium-card p-5 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Option de Prix</h3>
            <p className="text-xs text-gray-500">Sélectionnez le tarif</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {(["option1", "option2"] as const).map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setPriceOption(opt)}
              className={`p-4 rounded-xl border-2 transition-all text-left ${
                priceOption === opt
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-100 hover:border-gray-200"
              }`}
            >
              <p className="text-lg font-bold text-gray-900">180 DZD</p>
              <p className="text-xs text-gray-500">
                Retour: {priceOptions[opt].costToSupplier} DZD/u
              </p>
              <p className="text-xs text-emerald-600 font-medium mt-1">
                Bénéfice: {priceOptions[opt].benefitPerUnit} DZD/u
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Payment Status */}
      <div className="premium-card p-5 space-y-4">
        <label className="flex items-center gap-4 cursor-pointer">
          <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
            isPaidImmediately ? "bg-emerald-500 border-emerald-500" : "border-gray-300"
          }`}>
            {isPaidImmediately && <CheckCircle2 className="w-4 h-4 text-white" />}
          </div>
          <input
            type="checkbox"
            checked={isPaidImmediately}
            onChange={(e) => setIsPaidImmediately(e.target.checked)}
            className="sr-only"
          />
          <span className="font-medium text-gray-900">Payé immédiatement</span>
        </label>

        {!isPaidImmediately && (
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Date de paiement prévue</label>
              <input
                type="date"
                className="w-full h-12 rounded-xl border-2 border-gray-100 px-4 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                value={expectedPaymentDate}
                onChange={(e) => setExpectedPaymentDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Note</label>
              <textarea
                className="w-full rounded-xl border-2 border-gray-100 p-4 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all min-h-[80px]"
                value={paymentNote}
                onChange={(e) => setPaymentNote(e.target.value)}
                placeholder="Ex: Paiement prévu après 15 jours..."
              />
            </div>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="premium-card p-5 bg-gradient-to-br from-gray-50 to-slate-50">
        <h3 className="font-semibold text-gray-900 mb-4">Récapitulatif</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Quantité</span>
            <span className="font-medium">{cartons} cartons ({quantity} pcs)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Prix unitaire</span>
            <span className="font-medium">{selectedPrice.pricePerUnit} DZD</span>
          </div>
          <div className="h-px bg-gray-200 my-2" />
          <div className="flex justify-between text-base">
            <span className="font-medium text-gray-900">Total</span>
            <span className="font-bold text-blue-600">{totalValue.toLocaleString("fr-DZ")} DZD</span>
          </div>
          <div className="flex justify-between text-emerald-600">
            <span>Bénéfice</span>
            <span className="font-semibold">{totalBenefit.toLocaleString("fr-DZ")} DZD</span>
          </div>
          <div className="flex justify-between text-amber-600">
            <span>À retourner</span>
            <span className="font-semibold">{totalCostToSupplier.toLocaleString("fr-DZ")} DZD</span>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isSubmitting || totalDistributed !== cartons}
        className="w-full h-14 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg shadow-blue-500/25 text-base font-semibold disabled:opacity-50"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            {preFillData ? "Confirmation..." : "Enregistrement..."}
          </>
        ) : preFillData ? (
          "Confirmer la Livraison"
        ) : (
          "Enregistrer la Vente"
        )}
      </Button>
    </form>
  );
}
