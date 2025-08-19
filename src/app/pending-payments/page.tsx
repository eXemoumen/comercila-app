"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, ChevronLeft, Plus, X, Check } from "lucide-react";
import type { Sale, Payment } from "@/types/index";
import { addPayment, getSales, getSupermarkets } from "@/utils/hybridStorage";
import { supabase } from "@/lib/supabase";

export default function PendingPaymentsPage() {
  const router = useRouter();
  const [pendingSales, setPendingSales] = useState<Sale[]>([]);
  const [supermarkets, setSupermarkets] = useState<
    { id: string; name: string }[]
  >([]);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentNote, setPaymentNote] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const createSampleData = async () => {
    try {
      // First, create a sample supermarket
      const { data: supermarket, error: supermarketError } = await supabase
        .from("supermarkets")
        .insert([
          {
            name: "Supermarket Test",
            address: "123 Test Street, Algiers",
            latitude: 36.7538,
            longitude: 3.0588,
          },
        ])
        .select()
        .single();

      if (supermarketError) {
        return;
      }

      // Then, create a sample unpaid sale
      const { error: saleError } = await supabase
        .from("sales")
        .insert([
          {
            id: Date.now().toString(),
            supermarket_id: supermarket.id,
            date: new Date().toISOString(),
            quantity: 10,
            cartons: 2,
            price_per_unit: 1500,
            total_value: 15000,
            is_paid: false,
            remaining_amount: 15000,
            note: "Sample unpaid sale for testing",
          },
        ])
        .select()
        .single();

      if (saleError) {
        return;
      }

      // Reload the data
      const loadData = async () => {
        const allSales = await getSales();
        const unpaidSales = allSales.filter((sale) => !sale.isPaid);
        setPendingSales(unpaidSales);

        const allSupermarkets = await getSupermarkets();
        setSupermarkets(allSupermarkets);
      };

      await loadData();
    } catch (err) {
      console.error("Error creating sample data:", err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        // Test Supabase connection first

        const { error: testError } = await supabase
          .from("sales")
          .select("count")
          .limit(1);

        if (testError) {
        } else {
        }

        // Use hybrid storage functions (which use Supabase)
        const allSales = await getSales();

        const unpaidSales = allSales.filter((sale) => !sale.isPaid);

        // If no data exists, offer to create sample data
        if (allSales.length === 0) {
        }

        setPendingSales(unpaidSales);

        const allSupermarkets = await getSupermarkets();

        setSupermarkets(allSupermarkets);

        setIsLoading(false);
      } catch (err) {
        console.error("Error loading data:", err);
        setPendingSales([]);
        setSupermarkets([]);
        setIsLoading(false);
      }
    };

    loadData();

    // Listen for data changes from other components
    const handleDataChange = () => {
      loadData();
    };

    window.addEventListener("saleDataChanged", handleDataChange);

    return () => {
      window.removeEventListener("saleDataChanged", handleDataChange);
    };
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

    try {
      const payment: Omit<Payment, "id"> = {
        amount: paymentAmount,
        date: new Date().toISOString(),
        note: paymentNote,
        type: "virement", // Mark as virement payment
      };

      await addPayment(selectedSale.id, payment);

      // Dispatch event to notify other components about the data change
      const event = new CustomEvent("saleDataChanged");
      window.dispatchEvent(event);

      // Refresh data
      const allSales = await getSales();
      const unpaidSales = allSales.filter((sale) => !sale.isPaid);
      setPendingSales(unpaidSales);

      // Reset form
      setSelectedSale(null);
      setPaymentAmount(0);
      setPaymentNote("");
      setShowPaymentModal(false);
    } catch (err) {
      console.error("Error processing payment:", err);
    }
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

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl border border-gray-200">
          <div className="animate-spin rounded-full border-b-2 border-blue-600 h-8 w-8 mx-auto mb-2"></div>
          <p>Chargement des données...</p>
        </div>
      )}

      {/* Summary Card */}
      {!isLoading && (
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
      )}

      {/* Pending Payments List */}
      {!isLoading && (
        <div className="space-y-3">
          {pendingSales.length === 0 ? (
            <Card className="border-none shadow-md rounded-xl overflow-hidden">
              <CardContent className="p-6 text-center">
                <div className="bg-green-100 rounded-full p-3 mx-auto mb-3 w-fit">
                  <Check className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Aucun paiement en attente
                </h3>
                <p className="text-gray-500 mb-4">
                  Tous les paiements ont été effectués avec succès.
                </p>
                <Button
                  onClick={createSampleData}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Créer des données de test
                </Button>
              </CardContent>
            </Card>
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
      )}

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
