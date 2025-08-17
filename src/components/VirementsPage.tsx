"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, ChevronLeft, Plus, X, Check } from "lucide-react";
import type { Sale, Payment } from "@/types/index";
import { addPayment, getSales, getSupermarkets } from "@/utils/hybridStorage";
import { supabase } from "@/lib/supabase";
import { isAndroid, mobileUtils } from "@/utils/mobileConfig";

interface VirementsPageProps {
  onBack: () => void;
}

export function VirementsPage({ onBack }: VirementsPageProps) {
  const [pendingSales, setPendingSales] = useState<Sale[]>([]);
  const [supermarkets, setSupermarkets] = useState<
    { id: string; name: string }[]
  >([]);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentNote, setPaymentNote] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);

  // Android-specific initialization
  useEffect(() => {
    if (isAndroid()) {
      console.log("🤖 Android detected - applying optimizations");
      mobileUtils.optimizeForVirements();

      // Check network status on Android
      mobileUtils.checkNetworkStatus().then((connected) => {
        setIsOnline(connected);
        console.log("🌐 Android network status:", connected);
      });

      // Add network listener for Android
      mobileUtils.addNetworkListener((connected) => {
        setIsOnline(connected);
        console.log("🌐 Android network status changed:", connected);
      });
    }
  }, []);

  const createSampleData = async () => {
    try {
      console.log("🔄 Creating sample data in Supabase...");

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
        console.error("❌ Error creating supermarket:", supermarketError);
        return;
      }

      console.log("✅ Sample supermarket created:", supermarket);

      // Then, create a sample unpaid sale
      const { data: sale, error: saleError } = await supabase
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
        console.error("❌ Error creating sale:", saleError);
        return;
      }

      console.log("✅ Sample sale created:", sale);

      // Reload the data
      const loadData = async () => {
        const allSales = await getSales();
        const unpaidSales = allSales.filter((sale) => !sale.isPaid);
        setPendingSales(unpaidSales);

        const allSupermarkets = await getSupermarkets();
        setSupermarkets(allSupermarkets);
      };

      await loadData();
    } catch (error) {
      console.error("Error creating sample data:", error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log("🔄 Loading virements data from Supabase...");

        // Test Supabase connection first
        console.log("🔍 Testing Supabase connection...");
        const { error: testError } = await supabase
          .from("sales")
          .select("count")
          .limit(1);

        if (testError) {
          console.error("❌ Supabase connection error:", testError);
        } else {
          console.log("✅ Supabase connection successful");
        }

        // Use hybrid storage functions (which use Supabase)
        const allSales = await getSales();
        console.log(
          "📊 Sales loaded from Supabase:",
          allSales.length,
          "records"
        );
        console.log(
          "📊 Sales data details:",
          allSales.map((sale) => ({
            id: sale.id,
            supermarketId: sale.supermarketId,
            totalValue: sale.totalValue,
            isPaid: sale.isPaid,
            remainingAmount: sale.remainingAmount,
            date: sale.date,
          }))
        );

        const unpaidSales = allSales.filter((sale) => !sale.isPaid);
        console.log(
          "💰 Unpaid sales (virements):",
          unpaidSales.length,
          "records"
        );

        // If no data exists, offer to create sample data
        if (allSales.length === 0) {
          console.log(
            "📝 No sales data found. You can create sample data for testing."
          );
        }

        setPendingSales(unpaidSales);

        const allSupermarkets = await getSupermarkets();
        console.log(
          "🏪 Supermarkets loaded from Supabase:",
          allSupermarkets.length,
          "records"
        );
        console.log(
          "🏪 Supermarkets details:",
          allSupermarkets.map((sm) => ({
            id: sm.id,
            name: sm.name,
            address: sm.address,
          }))
        );

        setSupermarkets(allSupermarkets);

        setIsLoading(false);
      } catch (error) {
        console.error("Error loading virements data from Supabase:", error);
        setPendingSales([]);
        setSupermarkets([]);
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Calculate total remaining amount safely
  const totalRemaining = pendingSales.reduce((total, sale) => {
    return total + (sale.remainingAmount || 0);
  }, 0);

  const handlePayment = async () => {
    if (!selectedSale || paymentAmount <= 0) return;

    try {
      const payment: Omit<Payment, "id"> = {
        amount: paymentAmount,
        date: new Date().toISOString(),
        note: paymentNote,
      };

      await addPayment(selectedSale.id, payment);
      console.log("✅ Payment added successfully");

      // Refresh data
      const allSales = await getSales();
      const unpaidSales = allSales.filter((sale) => !sale.isPaid);
      setPendingSales(unpaidSales);

      // Reset form
      setSelectedSale(null);
      setPaymentAmount(0);
      setPaymentNote("");
      setShowPaymentModal(false);
    } catch (error) {
      console.error("Error adding payment:", error);
    }
  };

  const getSupermarketName = (supermarketId: string) => {
    const supermarket = supermarkets.find((s) => s.id === supermarketId);
    return supermarket?.name || "Unknown Supermarket";
  };

  return (
    <div className="space-y-4 pb-20">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={onBack} className="mr-1">
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
          {isAndroid() && (
            <p className="text-xs mt-2">
              {isOnline ? "🟢 Connecté" : "🔴 Hors ligne"}
            </p>
          )}
        </div>
      )}

      {/* Network Status for Android */}
      {isAndroid() && !isLoading && (
        <div
          className={`text-center py-2 rounded-lg mb-4 ${
            isOnline ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
          }`}
        >
          <p className="text-sm font-medium">
            {isOnline
              ? "🟢 Connecté à Supabase"
              : "🔴 Hors ligne - Mode hors ligne"}
          </p>
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
            pendingSales.map((sale) => (
              <Card
                key={sale.id}
                className="border-none shadow-md rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
              >
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        {getSupermarketName(sale.supermarketId)}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {new Date(sale.date).toLocaleDateString("fr-DZ")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-800">
                        {sale.remainingAmount?.toLocaleString("fr-DZ")} DZD
                      </p>
                      <p className="text-sm text-gray-500">Restant à payer</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      <p>
                        Total: {sale.totalValue?.toLocaleString("fr-DZ")} DZD
                      </p>
                      <p>
                        Payé:{" "}
                        {(
                          sale.totalValue - (sale.remainingAmount || 0)
                        ).toLocaleString("fr-DZ")}{" "}
                        DZD
                      </p>
                    </div>
                    <Button
                      onClick={() => {
                        setSelectedSale(sale);
                        setPaymentAmount(sale.remainingAmount || 0);
                        setShowPaymentModal(true);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter Paiement
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Ajouter un Paiement
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowPaymentModal(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Supermarché
                </label>
                <p className="text-gray-800 font-medium">
                  {getSupermarketName(selectedSale.supermarketId)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Montant du Paiement (DZD)
                </label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                  min="0"
                  max={selectedSale.remainingAmount || 0}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Note (optionnel)
                </label>
                <textarea
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Note sur le paiement..."
                  rows={3}
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1"
                >
                  Annuler
                </Button>
                <Button
                  onClick={handlePayment}
                  disabled={paymentAmount <= 0}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Confirmer
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
