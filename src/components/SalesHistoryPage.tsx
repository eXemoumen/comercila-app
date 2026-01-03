"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ChevronLeft,
  Search,
  Calendar,
  Store,
  Package,
  Filter,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Edit3,
  Trash2,
  Clock,
} from "lucide-react";
import { getSales, getSupermarkets, deleteSale } from "@/utils/hybridStorage";
import type { Sale } from "@/types/index";
import type { Supermarket } from "@/utils/storage";

interface SalesHistoryPageProps {
  onBack: () => void;
  onEditSale: (sale: Sale) => void;
}

type FilterType = "all" | "paid" | "unpaid";
type SortType = "date-desc" | "date-asc" | "amount-desc" | "amount-asc";

export function SalesHistoryPage({ onBack, onEditSale }: SalesHistoryPageProps) {
  const [sales, setSales] = useState<Sale[]>([]);
  const [supermarkets, setSupermarkets] = useState<Supermarket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [sortBy, setSortBy] = useState<SortType>("date-desc");
  const [expandedSaleId, setExpandedSaleId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [salesData, supermarketsData] = await Promise.all([
        getSales(),
        getSupermarkets(),
      ]);
      setSales(salesData);
      setSupermarkets(supermarketsData);
    } catch (error) {
      console.error("Error loading sales history:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getSupermarketName = useCallback((supermarketId: string) => {
    const sm = supermarkets.find((s) => s.id === supermarketId);
    return sm?.name || "Supermarché inconnu";
  }, [supermarkets]);

  // Filter and sort sales
  const filteredSales = useMemo(() => {
    let result = [...sales];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((sale) => {
        const smName = getSupermarketName(sale.supermarketId).toLowerCase();
        return smName.includes(query) || sale.note?.toLowerCase().includes(query);
      });
    }

    // Payment status filter
    if (filter === "paid") {
      result = result.filter((s) => s.isPaid);
    } else if (filter === "unpaid") {
      result = result.filter((s) => !s.isPaid);
    }

    // Sort
    switch (sortBy) {
      case "date-desc":
        result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        break;
      case "date-asc":
        result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        break;
      case "amount-desc":
        result.sort((a, b) => b.totalValue - a.totalValue);
        break;
      case "amount-asc":
        result.sort((a, b) => a.totalValue - b.totalValue);
        break;
    }

    return result;
  }, [sales, searchQuery, filter, sortBy, getSupermarketName]);

  // Stats
  const stats = useMemo(() => {
    const total = sales.length;
    const paid = sales.filter((s) => s.isPaid).length;
    const unpaid = sales.filter((s) => !s.isPaid).length;
    const totalValue = sales.reduce((sum, s) => sum + s.totalValue, 0);
    return { total, paid, unpaid, totalValue };
  }, [sales]);

  const handleDeleteSale = async (saleId: string) => {
    if (isProcessing) return;

    setIsProcessing(true);
    try {
      const success = await deleteSale(saleId);
      if (success) {
        await loadData();
        setShowDeleteConfirm(null);
      } else {
        alert("Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Error deleting sale:", error);
      alert("Erreur lors de la suppression");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 pb-24">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="rounded-xl">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Historique des Ventes</h1>
              <p className="text-sm text-gray-500">Chargement...</p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 rounded-full border-4 border-blue-200 border-t-blue-500 animate-spin" />
        </div>
      </div>
    );
  }


  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="rounded-xl hover:bg-white/80">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Historique des Ventes</h1>
              <p className="text-sm text-gray-500">{stats.total} vente(s) enregistrée(s)</p>
            </div>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={loadData} className="rounded-xl">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-3">
        <div className="premium-card p-3 text-center">
          <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
          <p className="text-xs text-gray-500">Total</p>
        </div>
        <div className="premium-card p-3 text-center">
          <p className="text-2xl font-bold text-emerald-600">{stats.paid}</p>
          <p className="text-xs text-gray-500">Payées</p>
        </div>
        <div className="premium-card p-3 text-center">
          <p className="text-2xl font-bold text-red-600">{stats.unpaid}</p>
          <p className="text-xs text-gray-500">Non payées</p>
        </div>
        <div className="premium-card p-3 text-center">
          <p className="text-lg font-bold text-blue-600">{(stats.totalValue / 1000).toFixed(0)}K</p>
          <p className="text-xs text-gray-500">DZD</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="premium-card p-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher par supermarché..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 rounded-xl border-gray-200"
          />
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1">
            <Filter className="h-4 w-4 text-gray-400" />
          </div>
          {[
            { value: "all", label: "Toutes" },
            { value: "paid", label: "Payées" },
            { value: "unpaid", label: "Non payées" },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value as FilterType)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filter === opt.value
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
          
          <div className="h-6 w-px bg-gray-200 mx-2" />
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortType)}
            className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 border-none"
          >
            <option value="date-desc">Plus récent</option>
            <option value="date-asc">Plus ancien</option>
            <option value="amount-desc">Montant ↓</option>
            <option value="amount-asc">Montant ↑</option>
          </select>
        </div>
      </div>


      {/* Sales List */}
      {filteredSales.length === 0 ? (
        <div className="premium-card p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mx-auto mb-4">
            <Clock className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-gray-600 font-medium">Aucune vente trouvée</p>
          <p className="text-sm text-gray-400 mt-1">
            {searchQuery ? "Essayez une autre recherche" : "Aucune vente enregistrée"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSales.map((sale, index) => {
            const isExpanded = expandedSaleId === sale.id;
            const progressPercent = ((sale.totalValue - sale.remainingAmount) / sale.totalValue) * 100;

            return (
              <div
                key={sale.id}
                className={`premium-card overflow-hidden animate-fade-in-up ${
                  sale.isPaid ? "border-l-4 border-l-emerald-500" : "border-l-4 border-l-amber-500"
                }`}
                style={{ animationDelay: `${index * 30}ms` }}
              >
                {/* Main Row */}
                <div
                  className="p-4 cursor-pointer"
                  onClick={() => setExpandedSaleId(isExpanded ? null : sale.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        sale.isPaid
                          ? "bg-gradient-to-br from-emerald-100 to-teal-100"
                          : "bg-gradient-to-br from-amber-100 to-orange-100"
                      }`}>
                        <Store className={`h-5 w-5 ${
                          sale.isPaid ? "text-emerald-600" : "text-amber-600"
                        }`} />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">
                          {getSupermarketName(sale.supermarketId)}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                          <Calendar className="h-3 w-3" />
                          {new Date(sale.date).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                          <span>•</span>
                          <Package className="h-3 w-3" />
                          {sale.cartons} cartons
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="font-bold text-gray-800">
                          {sale.totalValue.toLocaleString("fr-DZ")}
                          <span className="text-xs font-normal text-gray-400 ml-1">DZD</span>
                        </p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          sale.isPaid
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }`}>
                          {sale.isPaid ? "Payée" : `Reste: ${sale.remainingAmount.toLocaleString("fr-DZ")}`}
                        </span>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-gray-100 space-y-4 animate-fade-in-up">
                    {/* Progress Bar */}
                    {!sale.isPaid && (
                      <div>
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Progression paiement</span>
                          <span>{Math.round(progressPercent)}%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="p-3 rounded-xl bg-gray-50">
                        <p className="text-xs text-gray-500 mb-1">Quantité</p>
                        <p className="font-semibold text-gray-800">{sale.quantity} pièces</p>
                      </div>
                      <div className="p-3 rounded-xl bg-gray-50">
                        <p className="text-xs text-gray-500 mb-1">Prix unitaire</p>
                        <p className="font-semibold text-gray-800">{sale.pricePerUnit} DZD</p>
                      </div>
                      <div className="p-3 rounded-xl bg-gray-50">
                        <p className="text-xs text-gray-500 mb-1">Paiements</p>
                        <p className="font-semibold text-gray-800">{sale.payments.length}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-gray-50">
                        <p className="text-xs text-gray-500 mb-1">Montant payé</p>
                        <p className="font-semibold text-emerald-600">
                          {(sale.totalValue - sale.remainingAmount).toLocaleString("fr-DZ")} DZD
                        </p>
                      </div>
                    </div>

                    {/* Note */}
                    {sale.note && (
                      <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
                        <p className="text-xs text-blue-600 mb-1">Note</p>
                        <p className="text-sm text-blue-800">{sale.note}</p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 rounded-xl border-blue-200 text-blue-600 hover:bg-blue-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditSale(sale);
                        }}
                      >
                        <Edit3 className="h-4 w-4 mr-1" />
                        Modifier
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl border-red-200 text-red-600 hover:bg-red-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDeleteConfirm(sale.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}


      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowDeleteConfirm(null)}
        >
          <div
            className="premium-card w-full max-w-sm p-6 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-100 to-rose-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 text-center mb-2">
              Supprimer cette vente ?
            </h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              Cette action est irréversible. Tous les paiements associés seront également supprimés.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => handleDeleteSale(showDeleteConfirm)}
                disabled={isProcessing}
                className="flex-1 h-11 rounded-xl bg-red-600 hover:bg-red-700 text-white"
              >
                {isProcessing ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  "Supprimer"
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 h-11 rounded-xl"
              >
                Annuler
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
