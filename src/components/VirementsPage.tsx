import React, { useState, useEffect, useCallback } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  ChevronLeft,
  Plus,
  DollarSign,
  Calendar,
  TrendingUp,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { getSales, getSupermarkets, addPayment } from "@/utils/hybridStorage";
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
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    summary: true,
    pendingPayments: true,
    addPayment: false,
  });

  // Check if mobile and apply Android optimizations
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);

      if (isAndroid() && mobile) {
        console.log("🤖 Android mobile detected - applying optimizations");
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

    try {
      await addPayment(selectedSale.id, {
        date: new Date().toISOString(),
        amount: amount,
        note: paymentNote,
      });

      // Reload sales data
      const updatedSales = await getSales();
      setSales(updatedSales);

      // Update virement status
      const status = calculateVirementStatus(updatedSales);
      setVirementStatus(status);

      // Reset form
      setSelectedSale(null);
      setPaymentAmount("");
      setPaymentNote("");

      console.log("✅ Payment added successfully");
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
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center space-x-4 mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="rounded-full"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold text-gray-800">
              Paiements en Attente (Virements)
            </h1>
          </div>

          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full border-b-2 border-blue-600 h-12 w-12"></div>
          </div>
        </div>
      </div>
    );
  }

  // Filter pending payments (sales with remaining amounts)
  const pendingPayments = sales.filter((sale) => sale.remainingAmount > 0);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="rounded-full"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-800">
            Paiements en Attente (Virements)
          </h1>
        </div>

        {/* Summary Cards - Mobile Optimized */}
        <div
          className={`grid gap-4 mb-6 ${
            isMobile ? "grid-cols-1" : "grid-cols-3"
          }`}
        >
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-blue-800">
                <DollarSign className="h-5 w-5" />
                <span className="text-lg">Total à recevoir</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-900">
                {virementStatus.totalUnpaid.toLocaleString("fr-DZ")} DZD
              </p>
              <p className="text-sm text-blue-700 mt-1">
                {pendingPayments.length} vente(s) en attente
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-green-800">
                <TrendingUp className="h-5 w-5" />
                <span className="text-lg">Progression des virements</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-900">
                {virementStatus.totalPaid.toLocaleString("fr-DZ")} DZD
              </p>
              <p className="text-sm text-green-700 mt-1">Total déjà payé</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-amber-800">
                <Calendar className="h-5 w-5" />
                <span className="text-lg">Période des virements</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-amber-900">
                {virementStatus.virementPeriod}
              </p>
              <p className="text-sm text-amber-700 mt-1">
                {virementStatus.oldestUnpaidDate && (
                  <>Depuis: {formatDate(virementStatus.oldestUnpaidDate)}</>
                )}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Supplier Return Status - Collapsible */}
        {virementStatus.canReturnToSupplier && (
          <Card className="mb-6 bg-gradient-to-r from-green-50 to-green-100 border-green-300">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-green-800">
                <Info className="h-5 w-5" />
                <span className="text-lg">Statut de Retour au Fournisseur</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-green-700">
                  ✅ <strong>Prêt pour retour au fournisseur!</strong> Tous les
                  virements sont terminés.
                </p>
                <div className="bg-white rounded-lg p-3 border border-green-200">
                  <p className="text-sm text-green-800">
                    <strong>Montant à retourner:</strong>{" "}
                    {virementStatus.supplierReturnAmount.toLocaleString(
                      "fr-DZ"
                    )}{" "}
                    DZD
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Ce montant peut être retourné au fournisseur car toutes les
                    ventes sont payées.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Virement Period Info - Collapsible */}
        <Card className="mb-6 bg-gradient-to-r from-blue-50 to-blue-100 border-blue-300">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-blue-800">
              <Info className="h-5 w-5" />
              <span className="text-lg">
                Informations sur la Période des Virements
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-blue-700">
                📅 <strong>Période calculée:</strong>{" "}
                {virementStatus.virementPeriod}
              </p>
              {virementStatus.oldestUnpaidDate && (
                <div className="bg-white rounded-lg p-3 border border-blue-200">
                  <p className="text-sm text-blue-800">
                    <strong>Date la plus ancienne non payée:</strong>{" "}
                    {formatDate(virementStatus.oldestUnpaidDate)}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Cette date détermine la période utilisée pour calculer les
                    bénéfices du tableau de bord.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pending Payments Section - Collapsible */}
        <Card className="mb-6">
          <CardHeader
            className="cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => toggleSection("pendingPayments")}
          >
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Paiements en Attente</CardTitle>
              {expandedSections.pendingPayments ? (
                <ChevronUp className="h-5 w-5 text-gray-600" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-600" />
              )}
            </div>
          </CardHeader>

          {expandedSections.pendingPayments && (
            <CardContent>
              {pendingPayments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-lg">Aucun paiement en attente</p>
                  <p className="text-sm">Toutes les ventes sont payées!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {isMobile ? (
                    // Mobile-friendly card layout
                    pendingPayments.map((sale) => (
                      <div
                        key={sale.id}
                        className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                      >
                        <div className="space-y-3">
                          {/* Header */}
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold text-gray-800">
                                {getSupermarketName(sale.supermarketId)}
                              </h4>
                              <p className="text-sm text-gray-600">
                                Vente du {formatDate(sale.date)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-red-600">
                                {sale.remainingAmount.toLocaleString("fr-DZ")}{" "}
                                DZD
                              </p>
                              <p className="text-xs text-gray-600">Restant</p>
                            </div>
                          </div>

                          {/* Sale Details */}
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <p className="text-gray-600">
                                Quantité: {sale.quantity}
                              </p>
                              <p className="text-gray-600">
                                Prix/Unité: {sale.pricePerUnit} DZD
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-600">
                                Total: {sale.totalValue.toLocaleString("fr-DZ")}{" "}
                                DZD
                              </p>
                              <p className="text-gray-600">
                                Paiements: {sale.payments.length}
                              </p>
                            </div>
                          </div>

                          {/* Payment Progress */}
                          <div className="bg-white rounded p-3 border border-gray-200">
                            <div className="flex justify-between text-xs text-gray-600 mb-1">
                              <span>Progression</span>
                              <span>
                                {Math.round(
                                  ((sale.totalValue - sale.remainingAmount) /
                                    sale.totalValue) *
                                    100
                                )}
                                %
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{
                                  width: `${
                                    ((sale.totalValue - sale.remainingAmount) /
                                      sale.totalValue) *
                                    100
                                  }%`,
                                }}
                              ></div>
                            </div>
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                              <span>
                                Payé:{" "}
                                {(
                                  sale.totalValue - sale.remainingAmount
                                ).toLocaleString("fr-DZ")}{" "}
                                DZD
                              </span>
                              <span>
                                Restant:{" "}
                                {sale.remainingAmount.toLocaleString("fr-DZ")}{" "}
                                DZD
                              </span>
                            </div>
                          </div>

                          {/* Action Button */}
                          <Button
                            onClick={() => setSelectedSale(sale)}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Ajouter un Paiement
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    // Desktop table layout
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Supermarché
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Quantité
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Total (DZD)
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Restant (DZD)
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Paiements
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {pendingPayments.map((sale) => (
                            <tr key={sale.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {getSupermarketName(sale.supermarketId)}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {formatDate(sale.date)}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {sale.quantity}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {sale.totalValue.toLocaleString("fr-DZ")}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-red-600">
                                  {sale.remainingAmount.toLocaleString("fr-DZ")}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {sale.payments.length}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <Button
                                  onClick={() => setSelectedSale(sale)}
                                  size="sm"
                                  className="bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                  <Plus className="h-4 w-4 mr-1" />
                                  Paiement
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          )}
        </Card>

        {/* Add Payment Section - Collapsible */}
        <Card>
          <CardHeader
            className="cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => toggleSection("addPayment")}
          >
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Ajouter un Paiement</CardTitle>
              {expandedSections.addPayment ? (
                <ChevronUp className="h-5 w-5 text-gray-600" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-600" />
              )}
            </div>
          </CardHeader>

          {expandedSections.addPayment && (
            <CardContent>
              {!selectedSale ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-lg">Sélectionnez une vente ci-dessus</p>
                  <p className="text-sm">pour ajouter un paiement</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <h4 className="font-semibold text-blue-800 mb-2">
                      Vente sélectionnée
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-blue-700">
                          <strong>Supermarché:</strong>{" "}
                          {getSupermarketName(selectedSale.supermarketId)}
                        </p>
                        <p className="text-blue-700">
                          <strong>Date:</strong> {formatDate(selectedSale.date)}
                        </p>
                      </div>
                      <div>
                        <p className="text-blue-700">
                          <strong>Restant:</strong>{" "}
                          {selectedSale.remainingAmount.toLocaleString("fr-DZ")}{" "}
                          DZD
                        </p>
                        <p className="text-blue-700">
                          <strong>Paiements:</strong>{" "}
                          {selectedSale.payments.length}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4">
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-1">
                        Montant du Paiement (DZD)
                      </div>
                      <Input
                        id="paymentAmount"
                        type="number"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        placeholder="Entrez le montant"
                        className="mt-1"
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-1">
                        Note (optionnel)
                      </div>
                      <Input
                        id="paymentNote"
                        value={paymentNote}
                        onChange={(e) => setPaymentNote(e.target.value)}
                        placeholder="Note sur le paiement"
                        className="mt-1"
                      />
                    </div>

                    <div className="flex space-x-3">
                      <Button
                        onClick={handleAddPayment}
                        disabled={
                          !paymentAmount || parseFloat(paymentAmount) <= 0
                        }
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter le Paiement
                      </Button>

                      <Button
                        onClick={() => setSelectedSale(null)}
                        variant="outline"
                        className="flex-1"
                      >
                        Annuler
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
};
