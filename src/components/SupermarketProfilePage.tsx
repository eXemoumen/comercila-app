"use client";

import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InvoiceModal } from "@/components/InvoiceModal";
import {
  ChevronLeft,
  Settings,
  Plus,
  Trash2,
  Check,
  X,
  Phone,
} from "lucide-react";
import {
  getSupermarkets,
  getSales,
  updateSupermarket,
  updateSalePayment,
  deleteSale,
  addPayment,
} from "@/utils/hybridStorage";
import type { Sale, Supermarket, PhoneNumber } from "@/utils/storage";

interface SupermarketProfilePageProps {
  onBack: () => void;
  supermarketId: string;
  setActiveTab: (tab: string) => void;
}

export function SupermarketProfilePage({
  onBack,
  supermarketId,
}: SupermarketProfilePageProps) {
  const [supermarket, setSupermarket] = useState<Supermarket | null>(null);
  const [salesHistory, setSalesHistory] = useState<Sale[]>([]);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editedSupermarket, setEditedSupermarket] = useState<
    Partial<Supermarket>
  >({});
  const [loading, setLoading] = useState(false);
  const [newPhoneNumber, setNewPhoneNumber] = useState({
    name: "",
    number: "",
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      // Load supermarket data
      const supermarkets = await getSupermarkets();
      const sm = supermarkets.find((s) => s.id === supermarketId);
      setSupermarket(sm || null);

      // Load all sales for this supermarket
      const allSales = await getSales();
      const filteredSales = allSales.filter(
        (sale) => sale.supermarketId === supermarketId
      );
      setSalesHistory(filteredSales);
    };
    loadData();

    // Listen for data changes from other components
    const handleDataChange = () => {
      console.log(
        "🔄 SupermarketProfilePage: Data change detected, refreshing..."
      );
      console.log(
        "📊 Refreshing sales history for supermarket:",
        supermarketId
      );
      // Add a small delay to ensure database update is complete
      setTimeout(() => {
        loadData();
      }, 100);
    };

    window.addEventListener("saleDataChanged", handleDataChange);

    return () => {
      window.removeEventListener("saleDataChanged", handleDataChange);
    };
  }, [supermarketId]);

  const handleEdit = () => {
    setIsEditing(true);
    setEditedSupermarket({
      name: supermarket?.name || "",
      address: supermarket?.address || "",
      phone_numbers: supermarket?.phone_numbers || [],
      email: supermarket?.email || "",
      latitude: supermarket?.latitude || 36.7538,
      longitude: supermarket?.longitude || 3.0588,
    });
  };

  const handleAddPhoneNumber = () => {
    if (newPhoneNumber.name && newPhoneNumber.number) {
      setEditedSupermarket((prev) => ({
        ...prev,
        phone_numbers: [...(prev.phone_numbers || []), newPhoneNumber],
      }));
      setNewPhoneNumber({ name: "", number: "" });
    }
  };

  const handleRemovePhoneNumber = (index: number) => {
    setEditedSupermarket((prev) => ({
      ...prev,
      phone_numbers: prev.phone_numbers?.filter(
        (_: PhoneNumber, i: number) => i !== index
      ),
    }));
  };

  const handleUpdatePhoneNumber = (
    index: number,
    field: "name" | "number",
    value: string
  ) => {
    setEditedSupermarket((prev) => ({
      ...prev,
      phone_numbers: prev.phone_numbers?.map((phone: PhoneNumber, i: number) =>
        i === index ? { ...phone, [field]: value } : phone
      ),
    }));
  };

  const handleDeleteSale = (saleId: string) => {
    setSaleToDelete(saleId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteSale = async () => {
    if (saleToDelete) {
      setIsDeleting(true);
      try {
        console.log("🗑️ Deleting sale:", saleToDelete);

        // Delete the sale
        const success = await deleteSale(saleToDelete);

        if (success) {
          console.log("✅ Sale deleted successfully");

          // Refresh the sales history
          const allSales = await getSales();
          const filteredSales = allSales.filter(
            (sale) => sale.supermarketId === supermarketId
          );
          setSalesHistory(filteredSales);

          // Close the confirmation dialog
          setShowDeleteConfirm(false);
          setSaleToDelete(null);

          // Dispatch a custom event to notify that a sale was deleted
          const event = new CustomEvent("saleDataChanged");
          window.dispatchEvent(event);
        } else {
          console.error("❌ Failed to delete sale");
          alert("Erreur lors de la suppression de la vente");
        }
      } catch (error) {
        console.error("❌ Error deleting sale:", error);
        alert("Erreur lors de la suppression de la vente");
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleSave = async () => {
    if (!supermarket?.id) return;

    setLoading(true);
    try {
      // Geocode the address if it's been changed
      if (
        editedSupermarket.address &&
        editedSupermarket.address !== supermarket.address
      ) {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            editedSupermarket.address
          )}`
        );
        const data = await response.json();

        if (data && data.length > 0) {
          editedSupermarket.latitude = parseFloat(data[0].lat);
          editedSupermarket.longitude = parseFloat(data[0].lon);
        }
      }

      // Update the supermarket
      const updatedSupermarket = await updateSupermarket(
        supermarket.id,
        editedSupermarket
      );

      if (updatedSupermarket) {
        setSupermarket(updatedSupermarket);
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Error updating supermarket:", error);
      alert("Erreur lors de la mise à jour du supermarché");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedSupermarket({});
  };

  const handlePaymentUpdate = async (saleId: string, isPaid: boolean) => {
    if (isPaid) {
      // Find the sale to get its remaining amount
      const sale = salesHistory.find((s) => s.id === saleId);
      if (sale && sale.remainingAmount > 0) {
        // Add a payment for the remaining amount instead of just marking as paid
        const result = await addPayment(saleId, {
          date: new Date().toISOString(), // Payment received today
          amount: sale.remainingAmount,
          note: "Paiement complet manuel",
          type: "direct",
        });

        if (result) {
          // Update the sale in the sales history
          setSalesHistory((prev) =>
            prev.map((s) => (s.id === saleId ? result : s))
          );

          // Dispatch event to notify other components about the data change
          const event = new CustomEvent("saleDataChanged");
          window.dispatchEvent(event);
        }
      }
    } else {
      // For marking as unpaid, we can use updateSalePayment
      const updatedSale = await updateSalePayment(saleId, isPaid);
      if (updatedSale) {
        // Update the sale in the sales history
        setSalesHistory((prev) =>
          prev.map((sale) => (sale.id === saleId ? updatedSale : sale))
        );

        // Dispatch event to notify other components about the data change
        const event = new CustomEvent("saleDataChanged");
        window.dispatchEvent(event);
      }
    }
  };

  // Calculate totals including payment status
  const totalStats = salesHistory.reduce(
    (acc, sale) => ({
      totalQuantity: acc.totalQuantity + sale.quantity,
      totalValue: acc.totalValue + sale.totalValue,
      totalPaid: acc.totalPaid + (sale.isPaid ? sale.totalValue : 0),
      totalUnpaid: acc.totalUnpaid + (!sale.isPaid ? sale.totalValue : 0),
      totalCartons: acc.totalCartons + sale.cartons,
      totalNetBenefit:
        acc.totalNetBenefit +
        sale.quantity *
          (sale.pricePerUnit === 180 ? 25 : sale.pricePerUnit === 166 ? 17 : 0),
    }),
    {
      totalQuantity: 0,
      totalValue: 0,
      totalPaid: 0,
      totalUnpaid: 0,
      totalCartons: 0,
      totalNetBenefit: 0,
    }
  );

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ChevronLeft className="h-4 w-4" />
          Retour
        </Button>
        {!isEditing ? (
          <Button onClick={handleEdit} className="gap-2">
            <Settings className="h-4 w-4" />
            Modifier
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        )}
      </div>

      {supermarket && (
        <Card>
          <CardHeader>
            <CardTitle>
              {isEditing ? (
                <input
                  type="text"
                  value={editedSupermarket.name || ""}
                  onChange={(e) =>
                    setEditedSupermarket({
                      ...editedSupermarket,
                      name: e.target.value,
                    })
                  }
                  className="w-full p-2 border rounded"
                />
              ) : (
                supermarket.name
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Adresse</p>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedSupermarket.address || ""}
                    onChange={(e) =>
                      setEditedSupermarket({
                        ...editedSupermarket,
                        address: e.target.value,
                      })
                    }
                    className="w-full p-2 border rounded mt-1"
                  />
                ) : (
                  <p className="font-medium">{supermarket.address}</p>
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Contact</p>
                {isEditing ? (
                  <div className="space-y-4 mt-1">
                    <div className="space-y-2">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          placeholder="Nom du contact"
                          value={newPhoneNumber.name}
                          onChange={(e) =>
                            setNewPhoneNumber((prev) => ({
                              ...prev,
                              name: e.target.value,
                            }))
                          }
                          className="flex-1 p-2 border rounded w-full"
                        />
                        <input
                          type="tel"
                          placeholder="Numéro"
                          value={newPhoneNumber.number}
                          onChange={(e) =>
                            setNewPhoneNumber((prev) => ({
                              ...prev,
                              number: e.target.value,
                            }))
                          }
                          className="flex-1 p-2 border rounded w-full"
                        />
                        <Button
                          onClick={handleAddPhoneNumber}
                          disabled={
                            !newPhoneNumber.name || !newPhoneNumber.number
                          }
                          className="px-3 whitespace-nowrap"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {editedSupermarket.phone_numbers?.map(
                        (phone: PhoneNumber, index: number) => (
                          <div
                            key={index}
                            className="flex flex-col sm:flex-row gap-2 items-start sm:items-center"
                          >
                            <input
                              type="text"
                              value={phone.name}
                              onChange={(e) =>
                                handleUpdatePhoneNumber(
                                  index,
                                  "name",
                                  e.target.value
                                )
                              }
                              className="flex-1 p-2 border rounded w-full"
                            />
                            <input
                              type="tel"
                              value={phone.number}
                              onChange={(e) =>
                                handleUpdatePhoneNumber(
                                  index,
                                  "number",
                                  e.target.value
                                )
                              }
                              className="flex-1 p-2 border rounded w-full"
                            />
                            <Button
                              variant="ghost"
                              onClick={() => handleRemovePhoneNumber(index)}
                              className="px-3 text-red-500 hover:text-red-700 whitespace-nowrap"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )
                      )}
                    </div>
                    <input
                      type="email"
                      value={editedSupermarket.email || ""}
                      onChange={(e) =>
                        setEditedSupermarket({
                          ...editedSupermarket,
                          email: e.target.value,
                        })
                      }
                      className="w-full p-2 border rounded"
                      placeholder="Email (optionnel)"
                    />
                  </div>
                ) : (
                  <>
                    <div className="space-y-1">
                      {supermarket.phone_numbers?.map(
                        (phone: PhoneNumber, index: number) => (
                          <div
                            key={index}
                            className="flex flex-col sm:flex-row items-start sm:items-center gap-2"
                          >
                            <p className="font-medium min-w-[100px]">
                              {phone.name}:
                            </p>
                            <p className="text-sm">{phone.number}</p>
                            <Button
                              variant="outline"
                              size="sm"
                              className="ml-auto text-green-600 border-green-300 hover:bg-green-50"
                              onClick={() =>
                                window.open(
                                  `tel:${phone.number.replace(/\s+/g, "")}`,
                                  "_self"
                                )
                              }
                            >
                              <Phone className="h-4 w-4 mr-1" />
                              Appeler
                            </Button>
                          </div>
                        )
                      )}
                    </div>
                    <p className="text-sm mt-2">{supermarket.email}</p>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total Ventes</p>
              <p className="text-2xl font-bold">
                {totalStats.totalQuantity} pièces
              </p>
              <p className="text-sm text-muted-foreground">
                ({totalStats.totalCartons} cartons)
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Valeur Totale</p>
              <p className="text-2xl font-bold">
                {totalStats.totalValue.toLocaleString("fr-DZ")} DZD
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Bénéfice Net</p>
              <p className="text-2xl font-bold text-green-600">
                {totalStats.totalNetBenefit.toLocaleString("fr-DZ")} DZD
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">État Paiements</p>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-sm text-green-600">Payé:</span>
                  <span className="font-medium">
                    {totalStats.totalPaid.toLocaleString("fr-DZ")} DZD
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-red-600">Non payé:</span>
                  <span className="font-medium">
                    {totalStats.totalUnpaid.toLocaleString("fr-DZ")} DZD
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales History */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des Ventes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {salesHistory
              .sort(
                (a, b) =>
                  new Date(b.date).getTime() - new Date(a.date).getTime()
              )
              .map((sale) => (
                <div
                  key={sale.id}
                  className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer hover:shadow-md transition-all ${
                    !sale.isPaid ? "border-red-200" : "border-green-200"
                  }`}
                  onClick={() => {
                    setSelectedSale(sale);
                    setShowSaleModal(true);
                  }}
                >
                  <div>
                    <h3 className="font-medium">
                      {new Date(sale.date).toLocaleDateString("fr-FR")}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Prix unitaire: {sale.pricePerUnit.toLocaleString("fr-DZ")}{" "}
                      DZD
                    </p>
                    {sale.paymentDate && (
                      <p className="text-xs text-green-600">
                        Payé le{" "}
                        {new Date(sale.paymentDate).toLocaleDateString("fr-FR")}
                        {sale.payments.some((p) => p.type === "virement") ? (
                          <span className="ml-1 text-blue-600">
                            (par virement)
                          </span>
                        ) : (
                          <span className="ml-1 text-gray-600">
                            (directement)
                          </span>
                        )}
                      </p>
                    )}
                    {!sale.isPaid && sale.expectedPaymentDate && (
                      <p className="text-xs text-red-600">
                        Paiement prévu le{" "}
                        {new Date(sale.expectedPaymentDate).toLocaleDateString(
                          "fr-FR"
                        )}
                      </p>
                    )}
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <div>
                      <p className="font-medium">
                        {sale.totalValue.toLocaleString("fr-DZ")} DZD
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {sale.quantity} pièces ({sale.cartons} cartons)
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 text-blue-600 rounded-full border-blue-200 hover:bg-blue-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSale(sale);
                          setShowInvoiceModal(true);
                        }}
                        title="Voir la facture"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                          <polyline points="14 2 14 8 20 8"></polyline>
                          <line x1="16" y1="13" x2="8" y2="13"></line>
                          <line x1="16" y1="17" x2="8" y2="17"></line>
                          <polyline points="10 9 9 9 8 9"></polyline>
                        </svg>
                      </Button>
                      {!sale.isPaid && (
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePaymentUpdate(sale.id, true);
                          }}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 text-red-600 rounded-full border-red-200 hover:bg-red-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSale(sale.id);
                        }}
                        title="Supprimer la vente"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white p-5 rounded-2xl w-full max-w-md mx-auto shadow-xl">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold text-gray-800">
                Confirmer la suppression
              </h2>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full h-8 w-8 hover:bg-gray-100"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setSaleToDelete(null);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <p className="mb-6">
              Êtes-vous sûr de vouloir supprimer cette vente ? Cette action est
              irréversible.
            </p>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setSaleToDelete(null);
                }}
              >
                Annuler
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteSale}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2"
              >
                {isDeleting ? "Suppression..." : "Supprimer"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Sale Details Modal */}
      {showSaleModal && selectedSale && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
          onClick={() => {
            setShowSaleModal(false);
            setSelectedSale(null);
          }}
        >
          <div
            className="bg-white p-5 rounded-2xl w-full max-w-md mx-auto shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold text-gray-800">
                Détails de la Vente
              </h2>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full h-8 w-8 hover:bg-gray-100"
                onClick={() => {
                  setShowSaleModal(false);
                  setSelectedSale(null);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-medium">
                    {new Date(selectedSale.date).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Quantité</p>
                  <p className="font-medium">
                    {selectedSale.quantity} pièces ({selectedSale.cartons}{" "}
                    cartons)
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Prix unitaire</p>
                  <p className="font-medium">
                    {selectedSale.pricePerUnit.toLocaleString("fr-DZ")} DZD
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Montant total</p>
                  <p className="font-medium">
                    {selectedSale.totalValue.toLocaleString("fr-DZ")} DZD
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-gray-500">Statut de paiement</p>
                <p
                  className={`font-medium ${
                    selectedSale.isPaid ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {selectedSale.isPaid ? "Payé" : "Non payé"}
                </p>
                {selectedSale.paymentDate && (
                  <p className="text-sm text-gray-500">
                    Payé le{" "}
                    {new Date(selectedSale.paymentDate).toLocaleDateString(
                      "fr-FR"
                    )}
                    {selectedSale.payments.some(
                      (p) => p.type === "virement"
                    ) ? (
                      <span className="text-blue-600"> (par virement)</span>
                    ) : (
                      <span className="text-gray-600"> (directement)</span>
                    )}
                  </p>
                )}
                {selectedSale.payments.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Détails des paiements:
                    </p>
                    {selectedSale.payments.map((payment, index) => (
                      <div key={index} className="text-xs text-gray-600 mt-1">
                        {payment.amount.toLocaleString("fr-DZ")} DZD -{" "}
                        {new Date(payment.date).toLocaleDateString("fr-FR")}
                        {payment.type === "virement" && (
                          <span className="text-blue-600 ml-1">(virement)</span>
                        )}
                        {payment.note && (
                          <span className="text-gray-500 ml-1">
                            - {payment.note}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {showInvoiceModal && selectedSale && supermarket && (
        <InvoiceModal
          sale={selectedSale}
          supermarketName={supermarket.name}
          onClose={() => {
            setShowInvoiceModal(false);
            setSelectedSale(null);
          }}
        />
      )}
    </div>
  );
}
