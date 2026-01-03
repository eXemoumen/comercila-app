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
  AlertCircle,
  CalendarClock,
  Trash2
} from "lucide-react";
import {
  getSupermarkets,
  addSale,
  updateSale,
  deleteOrder,
  getFragranceStock,
  updateStock,
} from "@/utils/hybridStorage";
import { getFragrances } from "@/utils/storage";
import type { Sale, Supermarket, FragranceStock, PaymentRendezvous } from "@/utils/storage";

interface AddSalePageProps {
  onBack: () => void;
  preFillData?: {
    supermarketId: string;
    quantity: number;
    orderId?: string;
  } | null;
  editSale?: {
    id: string;
    supermarketId: string;
    date: string;
    cartons: number;
    quantity: number;
    pricePerUnit: number;
    totalValue: number;
    isPaid: boolean;
    remainingAmount: number;
    note?: string;
    fragranceDistribution?: Record<string, number>;
    paymentRendezvous?: PaymentRendezvous[];
    payments: Array<{ id: string; date: string; amount: number; note?: string; type?: string }>;
  } | null;
}

export function AddSalePage({ onBack, preFillData, editSale }: AddSalePageProps) {
  const isEditMode = !!editSale;
  const [supermarketId, setSupermarketId] = useState(editSale?.supermarketId || preFillData?.supermarketId || "");
  const [cartons, setCartons] = useState(editSale?.cartons || (preFillData ? Math.ceil(preFillData.quantity / 9) : 0));
  const [priceOption, setPriceOption] = useState<"option1" | "option2">(
    editSale?.pricePerUnit === 180 && editSale?.totalValue === editSale?.quantity * 180 
      ? (editSale?.totalValue / editSale?.quantity === 180 ? "option1" : "option2")
      : "option1"
  );
  const [isPaidImmediately, setIsPaidImmediately] = useState(editSale?.isPaid || false);
  const [paymentNote, setPaymentNote] = useState(editSale?.note || "");
  const [paymentRendezvous, setPaymentRendezvous] = useState<Omit<PaymentRendezvous, 'id' | 'isCompleted'>[]>(
    editSale?.paymentRendezvous?.map(rv => ({ date: rv.date, expectedAmount: rv.expectedAmount, note: rv.note })) || []
  );
  const [newRendezvousDate, setNewRendezvousDate] = useState("");
  const [newRendezvousAmount, setNewRendezvousAmount] = useState("");
  const [newRendezvousNote, setNewRendezvousNote] = useState("");
  const [saleDate, setSaleDate] = useState(
    editSale?.date ? new Date(editSale.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]
  );
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

        // Initialize fragrance distribution
        if (editSale?.fragranceDistribution) {
          // Use existing distribution from edit sale
          setFragranceDistribution(editSale.fragranceDistribution);
        } else {
          const initialDistribution: Record<string, number> = {};
          fragrances.forEach((fragrance: { id: string }) => {
            initialDistribution[fragrance.id] = 0;
          });
          setFragranceDistribution(initialDistribution);
        }
      } catch (error) {
        console.error("Error loading initial data:", error);
      }
    };

    loadData();
  }, [editSale]);

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

  const addRendezvous = () => {
    if (!newRendezvousDate) {
      alert("Veuillez sélectionner une date pour le rendez-vous.");
      return;
    }
    
    setPaymentRendezvous((prev) => [
      ...prev,
      {
        date: newRendezvousDate,
        expectedAmount: newRendezvousAmount ? parseFloat(newRendezvousAmount) : undefined,
        note: newRendezvousNote || undefined,
      },
    ]);
    
    // Reset form
    setNewRendezvousDate("");
    setNewRendezvousAmount("");
    setNewRendezvousNote("");
  };

  const removeRendezvous = (index: number) => {
    setPaymentRendezvous((prev) => prev.filter((_, i) => i !== index));
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

    // Only check stock for new sales or if quantity increased in edit mode
    if (!isEditMode) {
      for (const [fragranceId, qty] of Object.entries(fragranceDistribution)) {
        const fragrance = fragranceStock.find((f) => f.fragranceId === fragranceId);
        if (fragrance && qty > fragrance.quantity) {
          alert(`Stock insuffisant pour "${fragrance.name}". Disponible: ${fragrance.quantity} cartons.`);
          return;
        }
      }
    }

    setIsSubmitting(true);

    try {
      const rendezvousWithIds: PaymentRendezvous[] = paymentRendezvous.map((rv, index) => ({
        id: `rv_${Date.now()}_${index}`,
        date: rv.date,
        expectedAmount: rv.expectedAmount,
        note: rv.note,
        isCompleted: false,
      }));

      if (isEditMode && editSale) {
        // UPDATE MODE
        // Calculate new remaining amount based on payments already made
        const paidAmount = editSale.totalValue - editSale.remainingAmount;
        const newRemainingAmount = Math.max(0, totalValue - paidAmount);
        const newIsPaid = newRemainingAmount === 0;

        const updateData = {
          date: new Date(saleDate).toISOString(),
          supermarketId,
          quantity,
          cartons,
          pricePerUnit: selectedPrice.pricePerUnit,
          totalValue,
          isPaid: isPaidImmediately || newIsPaid,
          remainingAmount: isPaidImmediately ? 0 : newRemainingAmount,
          note: paymentNote || undefined,
          fragranceDistribution,
          paymentRendezvous: !isPaidImmediately ? rendezvousWithIds : [],
          expectedPaymentDate: !isPaidImmediately && rendezvousWithIds.length > 0 ? rendezvousWithIds[0].date : undefined,
        };

        const result = await updateSale(editSale.id, updateData);

        if (!result) {
          throw new Error("Failed to update sale");
        }

        // Handle stock adjustment if cartons changed
        const cartonsDiff = cartons - editSale.cartons;
        if (cartonsDiff !== 0) {
          // Calculate fragrance distribution difference
          const oldDistribution = editSale.fragranceDistribution || {};
          const diffDistribution: Record<string, number> = {};
          
          for (const fragranceId of Object.keys(fragranceDistribution)) {
            const newQty = fragranceDistribution[fragranceId] || 0;
            const oldQty = oldDistribution[fragranceId] || 0;
            diffDistribution[fragranceId] = newQty - oldQty;
          }

          if (cartonsDiff > 0) {
            // More cartons = remove from stock
            await updateStock(
              -cartonsDiff,
              "removed",
              `Modification vente: +${cartonsDiff} cartons`,
              diffDistribution
            );
          } else {
            // Less cartons = add back to stock
            const positiveDistribution: Record<string, number> = {};
            for (const [key, val] of Object.entries(diffDistribution)) {
              positiveDistribution[key] = Math.abs(val);
            }
            await updateStock(
              Math.abs(cartonsDiff),
              "added",
              `Modification vente: ${cartonsDiff} cartons`,
              positiveDistribution
            );
          }
        }

        window.dispatchEvent(new CustomEvent("saleDataChanged"));
        onBack();
      } else {
        // CREATE MODE
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
          expectedPaymentDate: !isPaidImmediately && rendezvousWithIds.length > 0 ? rendezvousWithIds[0].date : "",
          payments: isPaidImmediately
            ? [{ id: Date.now().toString(), date: new Date(saleDate).toISOString(), amount: totalValue, note: "Paiement complet", type: "direct" }]
            : [],
          remainingAmount: isPaidImmediately ? 0 : totalValue,
          fragranceDistribution: fragranceDistribution,
          paymentRendezvous: !isPaidImmediately ? rendezvousWithIds : [],
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
      }
    } catch (error) {
      console.error("Error during sale process:", error);
      alert(`Erreur: ${error instanceof Error ? error.message : "Erreur inconnue"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-24 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button type="button" variant="ghost" size="icon" onClick={onBack} className="rounded-xl">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">
            {isEditMode ? "Modifier la Vente" : preFillData ? "Confirmer la Livraison" : "Nouvelle Vente"}
          </h1>
          <p className="text-sm lg:text-base text-gray-500">
            {isEditMode ? "Modifiez les détails de la vente" : "Enregistrez une nouvelle transaction"}
          </p>
        </div>
      </div>

      {/* Two Column Layout for larger screens */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
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
        </div>

        {/* Right Column */}
        <div className="space-y-6">
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

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3">
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

          {/* Payment Status */}
          <div className="premium-card p-5 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Mode de Paiement</h3>
                <p className="text-xs text-gray-500">Choisissez le type de paiement</p>
              </div>
            </div>

            {/* Payment Type Selection */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setIsPaidImmediately(true)}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  isPaidImmediately
                    ? "border-emerald-500 bg-emerald-50"
                    : "border-gray-100 hover:border-gray-200"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className={`w-5 h-5 ${isPaidImmediately ? "text-emerald-600" : "text-gray-400"}`} />
                  <span className="font-semibold text-gray-900">Payé Immédiat</span>
                </div>
                <p className="text-xs text-gray-500">Paiement reçu maintenant</p>
              </button>
              
              <button
                type="button"
                onClick={() => setIsPaidImmediately(false)}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  !isPaidImmediately
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-gray-100 hover:border-gray-200"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <CalendarClock className={`w-5 h-5 ${!isPaidImmediately ? "text-indigo-600" : "text-gray-400"}`} />
                  <span className="font-semibold text-gray-900">Rendez-vous</span>
                </div>
                <p className="text-xs text-gray-500">Planifier des dates</p>
              </button>
            </div>

            {/* Rendezvous Section */}
            {!isPaidImmediately && (
              <div className="space-y-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <CalendarClock className="w-4 h-4 text-indigo-600" />
                  <h4 className="font-medium text-gray-800">Rendez-vous de Paiement</h4>
                </div>

                {/* Existing Rendezvous List */}
                {paymentRendezvous.length > 0 && (
                  <div className="space-y-2">
                    {paymentRendezvous.map((rv, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 rounded-xl bg-indigo-50 border border-indigo-100"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                            <Calendar className="w-4 h-4 text-indigo-600" />
                          </div>
                          <div>
                            <p className="font-medium text-indigo-800">
                              {new Date(rv.date).toLocaleDateString("fr-FR", {
                                weekday: "short",
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-indigo-600">
                              {rv.expectedAmount && (
                                <span>{rv.expectedAmount.toLocaleString("fr-DZ")} DZD</span>
                              )}
                              {rv.note && <span>• {rv.note}</span>}
                            </div>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => removeRendezvous(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add New Rendezvous Form */}
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-3">
                  <p className="text-sm font-medium text-gray-700">Ajouter un rendez-vous</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Date *</label>
                      <input
                        type="date"
                        className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                        value={newRendezvousDate}
                        onChange={(e) => setNewRendezvousDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Montant prévu</label>
                      <input
                        type="number"
                        placeholder="Ex: 5000"
                        className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                        value={newRendezvousAmount}
                        onChange={(e) => setNewRendezvousAmount(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Note (optionnel)</label>
                    <input
                      type="text"
                      placeholder="Ex: Paiement partiel..."
                      className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                      value={newRendezvousNote}
                      onChange={(e) => setNewRendezvousNote(e.target.value)}
                    />
                  </div>
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full rounded-lg border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                    onClick={addRendezvous}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Ajouter ce rendez-vous
                  </Button>
                </div>

                {/* General Note */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Note générale</label>
                  <textarea
                    className="w-full rounded-xl border-2 border-gray-100 p-4 bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all min-h-[80px]"
                    value={paymentNote}
                    onChange={(e) => setPaymentNote(e.target.value)}
                    placeholder="Ex: Client fidèle, paiement en plusieurs fois..."
                  />
                </div>

                {paymentRendezvous.length === 0 && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span className="text-sm text-amber-700">Ajoutez au moins un rendez-vous de paiement</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary - Full Width */}
      <div className="premium-card p-5 bg-gradient-to-br from-gray-50 to-slate-50">
        <h3 className="font-semibold text-gray-900 mb-4">Récapitulatif</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div className="p-3 rounded-xl bg-white border border-gray-100">
            <span className="text-gray-500 text-xs block mb-1">Quantité</span>
            <span className="font-semibold text-gray-900">{cartons} cartons ({quantity} pcs)</span>
          </div>
          <div className="p-3 rounded-xl bg-white border border-gray-100">
            <span className="text-gray-500 text-xs block mb-1">Prix unitaire</span>
            <span className="font-semibold text-gray-900">{selectedPrice.pricePerUnit} DZD</span>
          </div>
          <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
            <span className="text-blue-600 text-xs block mb-1">Total</span>
            <span className="font-bold text-blue-700">{totalValue.toLocaleString("fr-DZ")} DZD</span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
            <span className="text-emerald-600 text-xs block mb-1">Bénéfice</span>
            <span className="font-bold text-emerald-700">{totalBenefit.toLocaleString("fr-DZ")} DZD</span>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center text-amber-600">
          <span className="text-sm">À retourner au fournisseur</span>
          <span className="font-semibold">{totalCostToSupplier.toLocaleString("fr-DZ")} DZD</span>
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
            {isEditMode ? "Modification..." : preFillData ? "Confirmation..." : "Enregistrement..."}
          </>
        ) : isEditMode ? (
          "Enregistrer les Modifications"
        ) : preFillData ? (
          "Confirmer la Livraison"
        ) : (
          "Enregistrer la Vente"
        )}
      </Button>
    </form>
  );
}
