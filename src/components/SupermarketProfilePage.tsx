"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { InvoiceModal } from "@/components/InvoiceModal";
import {
  ChevronLeft,
  Settings,
  Plus,
  Trash2,
  Check,
  X,
  Phone,
  Store,
  MapPin,
  Mail,
  Package,
  DollarSign,
  TrendingUp,
  Calendar,
  FileText,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Clock,
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
  const [editedSupermarket, setEditedSupermarket] = useState<Partial<Supermarket>>({});
  const [loading, setLoading] = useState(false);
  const [newPhoneNumber, setNewPhoneNumber] = useState({ name: "", number: "" });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const supermarkets = await getSupermarkets();
      const sm = supermarkets.find((s) => s.id === supermarketId);
      setSupermarket(sm || null);

      const allSales = await getSales();
      const filteredSales = allSales.filter(
        (sale) => sale.supermarketId === supermarketId
      );
      setSalesHistory(filteredSales);
    };
    loadData();

    const handleDataChange = () => {
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
        const success = await deleteSale(saleToDelete);

        if (success) {
          const allSales = await getSales();
          const filteredSales = allSales.filter(
            (sale) => sale.supermarketId === supermarketId
          );
          setSalesHistory(filteredSales);
          setShowDeleteConfirm(false);
          setSaleToDelete(null);

          const event = new CustomEvent("saleDataChanged");
          window.dispatchEvent(event);
        } else {
          alert("Erreur lors de la suppression de la vente");
        }
      } catch (error) {
        console.error("Error deleting sale:", error);
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
      const sale = salesHistory.find((s) => s.id === saleId);
      if (sale && sale.remainingAmount > 0) {
        const result = await addPayment(saleId, {
          date: new Date().toISOString(),
          amount: sale.remainingAmount,
          note: "Paiement complet manuel",
          type: "direct",
        });

        if (result) {
          setSalesHistory((prev) =>
            prev.map((s) => (s.id === saleId ? result : s))
          );

          const event = new CustomEvent("saleDataChanged");
          window.dispatchEvent(event);
        }
      }
    } else {
      const updatedSale = await updateSalePayment(saleId, isPaid);
      if (updatedSale) {
        setSalesHistory((prev) =>
          prev.map((sale) => (sale.id === saleId ? updatedSale : sale))
        );

        const event = new CustomEvent("saleDataChanged");
        window.dispatchEvent(event);
      }
    }
  };

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
    <div className="space-y-6 pb-24">
      {/* Premium Header */}
      <div className="flex items-center justify-between">
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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Store className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">
                {supermarket?.name || "Chargement..."}
              </h1>
              <p className="text-sm text-gray-500">Profil du supermarché</p>
            </div>
          </div>
        </div>
        {!isEditing ? (
          <Button
            onClick={handleEdit}
            size="sm"
            className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-lg"
          >
            <Settings className="h-4 w-4 mr-1.5" />
            Modifier
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              className="rounded-xl"
            >
              Annuler
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={loading}
              className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
            >
              {loading ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        )}
      </div>

      {/* Supermarket Info Card */}
      {supermarket && (
        <div className="premium-card overflow-hidden animate-fade-in-up">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
          <div className="p-5">
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Nom</label>
                  <input
                    type="text"
                    value={editedSupermarket.name || ""}
                    onChange={(e) =>
                      setEditedSupermarket({ ...editedSupermarket, name: e.target.value })
                    }
                    className="w-full p-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-indigo-500" />
                    Adresse
                  </label>
                  <input
                    type="text"
                    value={editedSupermarket.address || ""}
                    onChange={(e) =>
                      setEditedSupermarket({ ...editedSupermarket, address: e.target.value })
                    }
                    className="w-full p-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block flex items-center gap-2">
                    <Phone className="h-4 w-4 text-indigo-500" />
                    Contacts
                  </label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Nom du contact"
                        value={newPhoneNumber.name}
                        onChange={(e) =>
                          setNewPhoneNumber((prev) => ({ ...prev, name: e.target.value }))
                        }
                        className="flex-1 p-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 transition-all"
                      />
                      <input
                        type="tel"
                        placeholder="Numéro"
                        value={newPhoneNumber.number}
                        onChange={(e) =>
                          setNewPhoneNumber((prev) => ({ ...prev, number: e.target.value }))
                        }
                        className="flex-1 p-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 transition-all"
                      />
                      <Button
                        onClick={handleAddPhoneNumber}
                        disabled={!newPhoneNumber.name || !newPhoneNumber.number}
                        className="rounded-xl bg-indigo-500 hover:bg-indigo-600"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {editedSupermarket.phone_numbers?.map((phone: PhoneNumber, index: number) => (
                      <div key={index} className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={phone.name}
                          onChange={(e) => handleUpdatePhoneNumber(index, "name", e.target.value)}
                          className="flex-1 p-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 transition-all"
                        />
                        <input
                          type="tel"
                          value={phone.number}
                          onChange={(e) => handleUpdatePhoneNumber(index, "number", e.target.value)}
                          className="flex-1 p-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 transition-all"
                        />
                        <Button
                          variant="ghost"
                          onClick={() => handleRemovePhoneNumber(index)}
                          className="rounded-xl text-red-500 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block flex items-center gap-2">
                    <Mail className="h-4 w-4 text-indigo-500" />
                    Email (optionnel)
                  </label>
                  <input
                    type="email"
                    value={editedSupermarket.email || ""}
                    onChange={(e) =>
                      setEditedSupermarket({ ...editedSupermarket, email: e.target.value })
                    }
                    className="w-full p-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                    placeholder="email@example.com"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Adresse</p>
                    <p className="text-gray-800">{supermarket.address}</p>
                  </div>
                </div>
                {supermarket.phone_numbers && supermarket.phone_numbers.length > 0 && (
                  <div className="space-y-2">
                    {supermarket.phone_numbers.map((phone: PhoneNumber, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                            <Phone className="h-4 w-4 text-emerald-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800">{phone.name}</p>
                            <p className="text-xs text-gray-500">{phone.number}</p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-xl text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                          onClick={() => window.open(`tel:${phone.number.replace(/\s+/g, "")}`, "_self")}
                        >
                          <Phone className="h-4 w-4 mr-1" />
                          Appeler
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                {supermarket.email && (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                      <Mail className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Email</p>
                      <p className="text-gray-800">{supermarket.email}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 gap-3 animate-fade-in-up stagger-1">
        <div className="premium-card p-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
          <div className="flex items-center gap-2 mb-2">
            <Package className="h-4 w-4 text-blue-500" />
            <span className="text-xs text-gray-500 font-medium">Total Ventes</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{totalStats.totalQuantity}</p>
          <p className="text-xs text-gray-400">pièces ({totalStats.totalCartons} cartons)</p>
        </div>

        <div className="premium-card p-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500" />
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4 text-purple-500" />
            <span className="text-xs text-gray-500 font-medium">Valeur Totale</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">
            {totalStats.totalValue.toLocaleString("fr-DZ")}
          </p>
          <p className="text-xs text-gray-400">DZD</p>
        </div>

        <div className="premium-card p-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            <span className="text-xs text-gray-500 font-medium">Bénéfice Net</span>
          </div>
          <p className="text-2xl font-bold text-emerald-600">
            {totalStats.totalNetBenefit.toLocaleString("fr-DZ")}
          </p>
          <p className="text-xs text-gray-400">DZD</p>
        </div>

        <div className="premium-card p-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
          <div className="flex items-center gap-2 mb-2">
            <CreditCard className="h-4 w-4 text-amber-500" />
            <span className="text-xs text-gray-500 font-medium">État Paiements</span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Payé
              </span>
              <span className="font-medium">{totalStats.totalPaid.toLocaleString("fr-DZ")} DZD</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-red-600 flex items-center gap-1">
                <Clock className="h-3 w-3" /> Non payé
              </span>
              <span className="font-medium">{totalStats.totalUnpaid.toLocaleString("fr-DZ")} DZD</span>
            </div>
          </div>
        </div>
      </div>


      {/* Sales History */}
      <div className="premium-card overflow-hidden animate-fade-in-up stagger-2">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
              <Calendar className="h-4 w-4 text-indigo-600" />
            </div>
            <h3 className="font-semibold text-gray-800">Historique des Ventes</h3>
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-indigo-100 text-indigo-700">
              {salesHistory.length}
            </span>
          </div>
        </div>
        <div className="p-4">
          <div className="space-y-3">
            {salesHistory.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mx-auto mb-4">
                  <Package className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">Aucune vente enregistrée</p>
                <p className="text-sm text-gray-400 mt-1">Les ventes apparaîtront ici</p>
              </div>
            ) : (
              salesHistory
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((sale, index) => (
                  <div
                    key={sale.id}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md animate-fade-in-up ${
                      !sale.isPaid
                        ? "border-red-200 bg-red-50/30 hover:border-red-300"
                        : "border-emerald-200 bg-emerald-50/30 hover:border-emerald-300"
                    }`}
                    style={{ animationDelay: `${index * 0.05}s` }}
                    onClick={() => {
                      setSelectedSale(sale);
                      setShowSaleModal(true);
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          sale.isPaid
                            ? "bg-emerald-100"
                            : "bg-red-100"
                        }`}>
                          {sale.isPaid ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-red-600" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-800">
                            {new Date(sale.date).toLocaleDateString("fr-FR", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </h4>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Prix: {sale.pricePerUnit.toLocaleString("fr-DZ")} DZD/unité
                          </p>
                          {sale.paymentDate && (
                            <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Payé le {new Date(sale.paymentDate).toLocaleDateString("fr-FR")}
                              {sale.payments.some((p) => p.type === "virement") && (
                                <span className="text-blue-600 ml-1">(virement)</span>
                              )}
                            </p>
                          )}
                          {!sale.isPaid && sale.expectedPaymentDate && (
                            <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Prévu le {new Date(sale.expectedPaymentDate).toLocaleDateString("fr-FR")}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-800">
                          {sale.totalValue.toLocaleString("fr-DZ")}
                          <span className="text-xs font-normal text-gray-400 ml-1">DZD</span>
                        </p>
                        <p className="text-xs text-gray-500">
                          {sale.quantity} pièces ({sale.cartons} cartons)
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-gray-100">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl text-blue-600 border-blue-200 hover:bg-blue-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSale(sale);
                          setShowInvoiceModal(true);
                        }}
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        Facture
                      </Button>
                      {!sale.isPaid && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-xl text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePaymentUpdate(sale.id, true);
                          }}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Payé
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl text-red-600 border-red-200 hover:bg-red-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSale(sale.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="premium-card w-full max-w-md animate-scale-in">
            <div className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Confirmer la suppression</h3>
                  <p className="text-sm text-gray-500">Cette action est irréversible</p>
                </div>
              </div>

              <p className="text-gray-600 mb-6">
                Êtes-vous sûr de vouloir supprimer cette vente ?
              </p>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 h-11 rounded-xl"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setSaleToDelete(null);
                  }}
                >
                  Annuler
                </Button>
                <Button
                  className="flex-1 h-11 rounded-xl bg-red-600 hover:bg-red-700 text-white"
                  onClick={confirmDeleteSale}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Suppression..." : "Supprimer"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sale Details Modal */}
      {showSaleModal && selectedSale && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
          onClick={() => {
            setShowSaleModal(false);
            setSelectedSale(null);
          }}
        >
          <div
            className="premium-card w-full max-w-md animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-gray-100 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                    <Package className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">Détails de la Vente</h3>
                    <p className="text-xs text-gray-500">
                      {new Date(selectedSale.date).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full hover:bg-gray-100"
                  onClick={() => {
                    setShowSaleModal(false);
                    setSelectedSale(null);
                  }}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-xl bg-gray-50">
                  <p className="text-xs text-gray-500 mb-1">Date</p>
                  <p className="font-semibold text-gray-800">
                    {new Date(selectedSale.date).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-gray-50">
                  <p className="text-xs text-gray-500 mb-1">Quantité</p>
                  <p className="font-semibold text-gray-800">
                    {selectedSale.quantity} pièces
                  </p>
                  <p className="text-xs text-gray-400">({selectedSale.cartons} cartons)</p>
                </div>
                <div className="p-3 rounded-xl bg-gray-50">
                  <p className="text-xs text-gray-500 mb-1">Prix unitaire</p>
                  <p className="font-semibold text-gray-800">
                    {selectedSale.pricePerUnit.toLocaleString("fr-DZ")} DZD
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-gray-50">
                  <p className="text-xs text-gray-500 mb-1">Montant total</p>
                  <p className="font-semibold text-gray-800">
                    {selectedSale.totalValue.toLocaleString("fr-DZ")} DZD
                  </p>
                </div>
              </div>

              <div className={`p-4 rounded-xl ${
                selectedSale.isPaid ? "bg-emerald-50 border border-emerald-100" : "bg-red-50 border border-red-100"
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {selectedSale.isPaid ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  )}
                  <span className={`font-semibold ${selectedSale.isPaid ? "text-emerald-700" : "text-red-700"}`}>
                    {selectedSale.isPaid ? "Payé" : "Non payé"}
                  </span>
                </div>
                {selectedSale.paymentDate && (
                  <p className="text-sm text-emerald-600">
                    Payé le {new Date(selectedSale.paymentDate).toLocaleDateString("fr-FR")}
                    {selectedSale.payments.some((p) => p.type === "virement") && (
                      <span className="text-blue-600 ml-1">(par virement)</span>
                    )}
                  </p>
                )}
                {selectedSale.payments.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-emerald-200">
                    <p className="text-xs text-gray-600 font-medium mb-2">Détails des paiements:</p>
                    {selectedSale.payments.map((payment, index) => (
                      <div key={index} className="text-xs text-gray-600 py-1 flex justify-between">
                        <span>
                          {new Date(payment.date).toLocaleDateString("fr-FR")}
                          {payment.type === "virement" && (
                            <span className="text-blue-600 ml-1">(virement)</span>
                          )}
                        </span>
                        <span className="font-medium">
                          {payment.amount.toLocaleString("fr-DZ")} DZD
                        </span>
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
