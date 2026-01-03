import React, { useState, useEffect, useCallback } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  ChevronLeft,
  Plus,
  DollarSign,
  Calendar,
  TrendingUp,
  Info,
  ChevronDown,
  ChevronUp,
  X,
  Wallet,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  CreditCard,
  Store,
  Package,
  CalendarClock,
} from "lucide-react";
import { getSales, getSupermarkets, addPayment, addRendezvousToSale } from "@/utils/hybridStorage";
import {
  calculateVirementPeriod,
  calculateSupplierReturn,
} from "@/utils/virementCalculations";
import { isAndroid, mobileUtils } from "@/utils/mobileConfig";
import type { Sale } from "@/types/index";
import type { Supermarket } from "@/utils/storage";

interface VirementsPageProps {
  onBack: () => void;
}

interface VirementStatus {
  totalUnpaid: number;
  totalPaid: number;
  oldestUnpaidDate: string | null;
  virementPeriod: string;
  canReturnToSupplier: boolean;
  supplierReturnAmount: number;
}

export const VirementsPage: React.FC<VirementsPageProps> = ({ onBack }) => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [supermarkets, setSupermarkets] = useState<Supermarket[]>([]);
  const [virementStatus, setVirementStatus] = useState<VirementStatus>({
    totalUnpaid: 0,
    totalPaid: 0,
    oldestUnpaidDate: null,
    virementPeriod: "",
    canReturnToSupplier: false,
    supplierReturnAmount: 0,
  });
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [addNextRendezvous, setAddNextRendezvous] = useState(false);
  const [nextRendezvousDate, setNextRendezvousDate] = useState("");
  const [nextRendezvousAmount, setNextRendezvousAmount] = useState("");
  const [nextRendezvousNote, setNextRendezvousNote] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    summary: true,
    pendingPayments: true,
  });
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);

      if (isAndroid() && mobile) {
        mobileUtils.optimizeForVirements();
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const calculateVirementStatus = useCallback((sales: Sale[]) => {
    const virementInfo = calculateVirementPeriod(sales);
    const supplierInfo = calculateSupplierReturn(sales);

    return {
      totalUnpaid: supplierInfo.totalUnpaid,
      totalPaid: supplierInfo.totalPaid,
      oldestUnpaidDate: virementInfo.oldestDate,
      virementPeriod: virementInfo.period,
      canReturnToSupplier: supplierInfo.canReturnToSupplier,
      supplierReturnAmount: supplierInfo.supplierReturnAmount,
    };
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [salesData, supermarketsData] = await Promise.all([
          getSales(),
          getSupermarkets(),
        ]);

        setSales(salesData);
        setSupermarkets(supermarketsData);

        const status = calculateVirementStatus(salesData);
        setVirementStatus(status);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

    const handleDataChange = () => {
      loadData();
    };

    window.addEventListener("saleDataChanged", handleDataChange);

    return () => {
      window.removeEventListener("saleDataChanged", handleDataChange);
    };
  }, [calculateVirementStatus]);

  const getSupermarketName = (supermarketId: string) => {
    const supermarket = supermarkets.find((s) => s.id === supermarketId);
    return supermarket?.name || `Supermarket ${supermarketId.slice(-4)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-DZ", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const handleAddPayment = async () => {
    if (!selectedSale || !paymentAmount) return;

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) return;

    if (amount > selectedSale.remainingAmount) {
      console.error("Payment amount cannot exceed remaining amount");
      return;
    }

    try {
      const result = await addPayment(selectedSale.id, {
        date: new Date().toISOString(),
        amount: amount,
        note: paymentNote,
        type: "virement",
      });

      if (!result) {
        throw new Error("Failed to add payment");
      }

      // Add next rendezvous if specified
      if (addNextRendezvous && nextRendezvousDate) {
        await addRendezvousToSale(selectedSale.id, {
          date: nextRendezvousDate,
          expectedAmount: nextRendezvousAmount ? parseFloat(nextRendezvousAmount) : undefined,
          note: nextRendezvousNote || undefined,
        });
      }

      const updatedSales = await getSales();
      setSales(updatedSales);

      const status = calculateVirementStatus(updatedSales);
      setVirementStatus(status);

      setSelectedSale(null);
      setPaymentAmount("");
      setPaymentNote("");
      setAddNextRendezvous(false);
      setNextRendezvousDate("");
      setNextRendezvousAmount("");
      setNextRendezvousNote("");

      const event = new CustomEvent("saleDataChanged");
      window.dispatchEvent(event);
    } catch (error) {
      console.error("Error adding payment:", error);
    }
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  if (isLoading) {
    return (
      <div className="space-y-6 pb-24">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="rounded-xl"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
              <Wallet className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Paiements en Attente</h1>
              <p className="text-sm text-gray-500">Virements</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 rounded-full border-4 border-emerald-200 border-t-emerald-500 animate-spin" />
        </div>
      </div>
    );
  }

  const pendingPayments = sales.filter((sale) => sale.remainingAmount > 0);

  return (
    <div className="space-y-6 pb-24">
      {/* Premium Header */}
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
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
            <Wallet className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Paiements en Attente</h1>
            <p className="text-sm text-gray-500">{pendingPayments.length} vente(s) en attente</p>
          </div>
        </div>
      </div>

      {/* Summary Cards - Premium Design */}
      <div className={`grid gap-4 ${isMobile ? "grid-cols-1" : "grid-cols-3"}`}>
        {/* Total to Receive */}
        <div className="premium-card overflow-hidden animate-fade-in-up">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
          <div className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-gray-500">Total à recevoir</span>
            </div>
            <p className="text-3xl font-bold text-gray-800">
              {virementStatus.totalUnpaid.toLocaleString("fr-DZ")}
              <span className="text-lg font-normal text-gray-400 ml-1">DZD</span>
            </p>
            <p className="text-sm text-blue-600 mt-2 flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {pendingPayments.length} vente(s) en attente
            </p>
          </div>
        </div>

        {/* Total Paid */}
        <div className="premium-card overflow-hidden animate-fade-in-up stagger-1">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
          <div className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>
              <span className="text-sm font-medium text-gray-500">Total déjà payé</span>
            </div>
            <p className="text-3xl font-bold text-gray-800">
              {virementStatus.totalPaid.toLocaleString("fr-DZ")}
              <span className="text-lg font-normal text-gray-400 ml-1">DZD</span>
            </p>
            <p className="text-sm text-emerald-600 mt-2 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Progression des virements
            </p>
          </div>
        </div>

        {/* Virement Period */}
        <div className="premium-card overflow-hidden animate-fade-in-up stagger-2">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
          <div className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-amber-600" />
              </div>
              <span className="text-sm font-medium text-gray-500">Période des virements</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">
              {virementStatus.virementPeriod || "N/A"}
            </p>
            {virementStatus.oldestUnpaidDate && (
              <p className="text-sm text-amber-600 mt-2 flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" />
                Depuis: {formatDate(virementStatus.oldestUnpaidDate)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Supplier Return Status */}
      {virementStatus.canReturnToSupplier && (
        <div className="premium-card overflow-hidden border-l-4 border-l-emerald-500 animate-fade-in-up">
          <div className="p-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-emerald-800 mb-1">
                  Prêt pour retour au fournisseur!
                </h3>
                <p className="text-sm text-emerald-600 mb-3">
                  Tous les virements sont terminés.
                </p>
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                  <p className="text-sm text-emerald-800">
                    <span className="font-medium">Montant à retourner:</span>{" "}
                    <span className="text-lg font-bold">
                      {virementStatus.supplierReturnAmount.toLocaleString("fr-DZ")} DZD
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Virement Period Info */}
      <div className="premium-card overflow-hidden animate-fade-in-up">
        <div className="p-5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center flex-shrink-0">
              <Info className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800 mb-2">
                Informations sur la Période des Virements
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                📅 <span className="font-medium">Période calculée:</span> {virementStatus.virementPeriod}
              </p>
              {virementStatus.oldestUnpaidDate && (
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
                  <p className="text-sm text-blue-800">
                    <span className="font-medium">Date la plus ancienne non payée:</span>{" "}
                    {formatDate(virementStatus.oldestUnpaidDate)}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Cette date détermine la période utilisée pour calculer les bénéfices.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Pending Payments Section */}
      <div className="premium-card overflow-hidden animate-fade-in-up">
        <div
          className="p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => toggleSection("pendingPayments")}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                <CreditCard className="h-4 w-4 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-800">Paiements en Attente</h3>
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-purple-100 text-purple-700">
                {pendingPayments.length}
              </span>
            </div>
            {expandedSections.pendingPayments ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </div>
        </div>

        {expandedSections.pendingPayments && (
          <div className="p-4">
            {pendingPayments.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                </div>
                <p className="text-gray-600 font-medium">Aucun paiement en attente</p>
                <p className="text-sm text-gray-400 mt-1">Toutes les ventes sont payées!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingPayments.map((sale, index) => {
                  const progressPercent = ((sale.totalValue - sale.remainingAmount) / sale.totalValue) * 100;
                  
                  return (
                    <div
                      key={sale.id}
                      className="p-4 rounded-xl bg-gray-50 border border-gray-100 hover:border-purple-200 hover:bg-purple-50/30 transition-all animate-fade-in-up"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center">
                            <Store className="h-5 w-5 text-gray-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-800">
                              {getSupermarketName(sale.supermarketId)}
                            </h4>
                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                              <Calendar className="h-3 w-3" />
                              Vente du {formatDate(sale.date)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-red-600">
                            {sale.remainingAmount.toLocaleString("fr-DZ")}
                            <span className="text-xs font-normal text-gray-400 ml-1">DZD</span>
                          </p>
                          <p className="text-xs text-gray-500">Restant</p>
                        </div>
                      </div>

                      {/* Sale Details */}
                      <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <Package className="h-3.5 w-3.5" />
                          <span>{sale.quantity} pièces</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <DollarSign className="h-3.5 w-3.5" />
                          <span>{sale.pricePerUnit} DZD/unité</span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Progression</span>
                          <span className="font-medium">{Math.round(progressPercent)}%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-gray-400 mt-1">
                          <span>Payé: {(sale.totalValue - sale.remainingAmount).toLocaleString("fr-DZ")} DZD</span>
                          <span>Total: {sale.totalValue.toLocaleString("fr-DZ")} DZD</span>
                        </div>
                      </div>

                      {/* Action Button */}
                      <Button
                        onClick={() => {
                          setSelectedSale(sale);
                          setPaymentAmount(sale.remainingAmount.toString());
                          setShowPaymentModal(true);
                        }}
                        className="w-full h-10 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium shadow-lg shadow-purple-500/25 transition-all"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter un Paiement
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>


      {/* Payment Modal */}
      {showPaymentModal && selectedSale && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
          onClick={() => {
            setShowPaymentModal(false);
            setSelectedSale(null);
            setPaymentAmount("");
            setPaymentNote("");
            setAddNextRendezvous(false);
            setNextRendezvousDate("");
            setNextRendezvousAmount("");
            setNextRendezvousNote("");
          }}
        >
          <div
            className="premium-card w-full max-w-md max-h-[90vh] overflow-y-auto animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="border-b border-gray-100 p-4 sticky top-0 bg-white z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                    <Plus className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">Ajouter un Paiement</h3>
                    <p className="text-xs text-gray-500">Enregistrer un virement</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full hover:bg-gray-100"
                  onClick={() => {
                    setShowPaymentModal(false);
                    setSelectedSale(null);
                    setPaymentAmount("");
                    setPaymentNote("");
                    setAddNextRendezvous(false);
                    setNextRendezvousDate("");
                    setNextRendezvousAmount("");
                    setNextRendezvousNote("");
                  }}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="p-4 space-y-5">
              {/* Selected Sale Info */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
                <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                  <Store className="h-4 w-4" />
                  Vente sélectionnée
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-600">Supermarché:</span>
                    <span className="font-medium text-blue-800">
                      {getSupermarketName(selectedSale.supermarketId)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-600">Date:</span>
                    <span className="font-medium text-blue-800">
                      {formatDate(selectedSale.date)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-600">Restant:</span>
                    <span className="font-bold text-blue-800">
                      {selectedSale.remainingAmount.toLocaleString("fr-DZ")} DZD
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-600">Paiements:</span>
                    <span className="font-medium text-blue-800">
                      {selectedSale.payments.length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Form */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-emerald-500" />
                    Montant du Paiement (DZD)
                  </label>
                  <Input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder={`Max: ${selectedSale.remainingAmount.toLocaleString("fr-DZ")} DZD`}
                    className="w-full h-12 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 text-lg font-medium"
                    min="0"
                    max={selectedSale.remainingAmount}
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-2">
                    <Info className="h-4 w-4 text-gray-400" />
                    Note (optionnel)
                  </label>
                  <Input
                    value={paymentNote}
                    onChange={(e) => setPaymentNote(e.target.value)}
                    placeholder="Note sur le paiement"
                    className="w-full h-12 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                  />
                </div>

                {/* Next Rendezvous Section */}
                <div className="pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setAddNextRendezvous(!addNextRendezvous)}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                      addNextRendezvous
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        addNextRendezvous
                          ? "bg-indigo-100"
                          : "bg-gray-100"
                      }`}>
                        <CalendarClock className={`h-5 w-5 ${
                          addNextRendezvous ? "text-indigo-600" : "text-gray-500"
                        }`} />
                      </div>
                      <div>
                        <p className={`font-semibold ${
                          addNextRendezvous ? "text-indigo-800" : "text-gray-800"
                        }`}>
                          Ajouter un prochain rendez-vous
                        </p>
                        <p className="text-xs text-gray-500">
                          Planifier le prochain paiement
                        </p>
                      </div>
                      <div className={`ml-auto w-6 h-6 rounded-lg border-2 flex items-center justify-center ${
                        addNextRendezvous
                          ? "bg-indigo-500 border-indigo-500"
                          : "border-gray-300"
                      }`}>
                        {addNextRendezvous && (
                          <CheckCircle2 className="h-4 w-4 text-white" />
                        )}
                      </div>
                    </div>
                  </button>

                  {addNextRendezvous && (
                    <div className="mt-4 p-4 rounded-xl bg-indigo-50 border border-indigo-100 space-y-3 animate-fade-in-up">
                      <div>
                        <label className="text-xs font-medium text-indigo-700 mb-1 block">
                          Date du rendez-vous *
                        </label>
                        <Input
                          type="date"
                          value={nextRendezvousDate}
                          onChange={(e) => setNextRendezvousDate(e.target.value)}
                          className="w-full h-10 rounded-lg border border-indigo-200 focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-indigo-700 mb-1 block">
                          Montant prévu (optionnel)
                        </label>
                        <Input
                          type="number"
                          value={nextRendezvousAmount}
                          onChange={(e) => setNextRendezvousAmount(e.target.value)}
                          placeholder="Ex: 5000"
                          className="w-full h-10 rounded-lg border border-indigo-200 focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-indigo-700 mb-1 block">
                          Note (optionnel)
                        </label>
                        <Input
                          value={nextRendezvousNote}
                          onChange={(e) => setNextRendezvousNote(e.target.value)}
                          placeholder="Ex: Paiement partiel..."
                          className="w-full h-10 rounded-lg border border-indigo-200 focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={async () => {
                    try {
                      await handleAddPayment();
                      setShowPaymentModal(false);
                      setAddNextRendezvous(false);
                      setNextRendezvousDate("");
                      setNextRendezvousAmount("");
                      setNextRendezvousNote("");
                    } catch (error) {
                      console.error("Error in modal payment:", error);
                    }
                  }}
                  disabled={!paymentAmount || parseFloat(paymentAmount) <= 0 || (addNextRendezvous && !nextRendezvousDate)}
                  className={`flex-1 h-12 rounded-xl font-semibold shadow-lg transition-all ${
                    paymentAmount && parseFloat(paymentAmount) > 0 && (!addNextRendezvous || nextRendezvousDate)
                      ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-emerald-500/25"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {paymentAmount && parseFloat(paymentAmount) > 0
                    ? addNextRendezvous ? "Ajouter + RDV" : "Ajouter le Paiement"
                    : "Entrez un montant"}
                </Button>

                <Button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setSelectedSale(null);
                    setPaymentAmount("");
                    setPaymentNote("");
                    setAddNextRendezvous(false);
                    setNextRendezvousDate("");
                    setNextRendezvousAmount("");
                    setNextRendezvousNote("");
                  }}
                  variant="outline"
                  className="flex-1 h-12 rounded-xl border-2 border-gray-200 text-gray-700 font-medium hover:bg-gray-50"
                >
                  Annuler
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
