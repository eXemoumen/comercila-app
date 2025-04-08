"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, ChevronLeft, Plus, X } from "lucide-react";
import { getSales, addPayment, getSupermarkets } from "@/utils/database";
import type { Sale, Supermarket } from "@/types/index";

export default function PendingPaymentsPage() {
  const router = useRouter();
  const [pendingSales, setPendingSales] = useState<Sale[]>([]);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentNote, setPaymentNote] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [supermarkets, setSupermarkets] = useState<Supermarket[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const [salesData, supermarketsData] = await Promise.all([
        getSales(),
        getSupermarkets(),
      ]);

      const unpaidSales = salesData.filter((sale) => !sale.isPaid);
      setPendingSales(unpaidSales);
      setSupermarkets(supermarketsData);
    };

    loadData();
  }, []);

  // Calculate total remaining amount safely
  const totalRemaining = pendingSales.reduce(
    (acc, sale) => acc + (sale.remainingAmount || 0),
    0
  );

  const handleAddPayment = (sale: Sale) => {
    setSelectedSale(sale);
    setPaymentAmount(sale.remainingAmount || 0);
    setShowPaymentModal(true);
  };

  const handleSubmitPayment = async () => {
    if (!selectedSale || paymentAmount <= 0) return;

    const payment = {
      date: new Date().toISOString(),
      amount: paymentAmount,
      note: paymentNote,
    };

    await addPayment(selectedSale.id, payment);

    // Refresh the data
    const [salesData] = await Promise.all([getSales()]);
    const unpaidSales = salesData.filter((sale) => !sale.isPaid);
    setPendingSales(unpaidSales);

    // Close modal and reset state
    setShowPaymentModal(false);
    setSelectedSale(null);
    setPaymentAmount(0);
    setPaymentNote("");
  };

  const handleBack = () => {
    // Store the active tab in localStorage before navigating back
    localStorage.setItem("activeTab", "dashboard");
    router.push("/");
  };

  return (
    <div className="space-y-4 pb-20">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="mr-1"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-gray-800">
            Paiements en Attente
          </h1>
        </div>
      </div>

      {/* Summary Card */}
      <Card className="border-none shadow-md rounded-xl overflow-hidden mb-4">
        <CardContent className="p-5">
          <div className="flex items-center">
            <div className="bg-red-100 rounded-full p-3 mr-4">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total à recevoir</p>
              <div className="text-2xl font-bold text-gray-800">
                {totalRemaining.toLocaleString("fr-DZ")} DZD
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pending Payments List */}
      <div className="space-y-3">
        {pendingSales.length === 0 ? (
          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl border border-gray-200">
            <AlertCircle className="h-12 w-12 mx-auto mb-2 text-gray-400" />
            <p>Aucun paiement en attente</p>
          </div>
        ) : (
          pendingSales.map((sale) => {
            const remainingAmount = sale.remainingAmount || 0;
            const totalValue = sale.totalValue || 0;
            const supermarket = supermarkets.find(
              (sm) => sm.id === sale.supermarketId
            );

            return (
              <div
                key={sale.id}
                className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden"
              >
                <div className="p-4 border-b border-gray-100">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-800">
                        {supermarket ? supermarket.name : "Supermarché"}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Livré le{" "}
                        {new Date(sale.date).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full border-blue-200 hover:bg-blue-50 text-blue-600"
                      onClick={() => handleAddPayment(sale)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Versement
                    </Button>
                  </div>
                </div>

                <div className="p-4 bg-gray-50">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-500">Montant total:</span>
                    <span className="font-medium text-gray-800">
                      {totalValue.toLocaleString("fr-DZ")} DZD
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Reste à payer:</span>
                    <span className="font-medium text-red-600">
                      {remainingAmount.toLocaleString("fr-DZ")} DZD
                    </span>
                  </div>
                </div>

                {/* Payment History */}
                {sale.payments && sale.payments.length > 0 && (
                  <div className="border-t border-gray-100 p-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Historique des versements:
                    </p>
                    <div className="space-y-2">
                      {sale.payments.map((payment) => (
                        <div
                          key={payment.id}
                          className="text-sm bg-gray-50 p-3 rounded-xl"
                        >
                          <div className="flex justify-between">
                            <span className="text-gray-600">
                              {new Date(payment.date).toLocaleDateString(
                                "fr-FR"
                              )}
                            </span>
                            <span className="font-medium text-green-600">
                              {payment.amount.toLocaleString("fr-DZ")} DZD
                            </span>
                          </div>
                          {payment.note && (
                            <p className="text-gray-500 mt-1 pt-1 border-t border-gray-100">
                              {payment.note}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedSale && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
          onClick={() => {
            setShowPaymentModal(false);
            setSelectedSale(null);
            setPaymentAmount(0);
            setPaymentNote("");
          }}
        >
          <div
            className="bg-white p-5 rounded-2xl w-full max-w-md mx-auto shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold text-gray-800">
                Ajouter un versement
              </h2>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full h-8 w-8 hover:bg-gray-100"
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedSale(null);
                  setPaymentAmount(0);
                  setPaymentNote("");
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Montant</label>
                <input
                  type="number"
                  className="w-full rounded-md border mt-1 p-2"
                  value={paymentAmount}
                  onChange={(e) =>
                    setPaymentAmount(Math.max(0, Number(e.target.value)))
                  }
                  max={selectedSale.remainingAmount}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Note</label>
                <textarea
                  className="w-full rounded-md border mt-1 p-2"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  placeholder="Détails du versement..."
                />
              </div>

              <div className="flex space-x-2">
                <Button
                  className="flex-1"
                  onClick={handleSubmitPayment}
                  disabled={
                    paymentAmount <= 0 ||
                    paymentAmount > (selectedSale.remainingAmount || 0)
                  }
                >
                  Confirmer
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowPaymentModal(false)}
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
}
