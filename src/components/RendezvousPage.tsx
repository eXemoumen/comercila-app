"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  CalendarClock,
  Calendar,
  Store,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Filter,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Phone,
  MapPin,
} from "lucide-react";
import { getSales, getSupermarkets, markRendezvousAsCompleted } from "@/utils/hybridStorage";
import type { Sale, PaymentRendezvous } from "@/types/index";
import type { Supermarket } from "@/utils/storage";

interface RendezvousPageProps {
  onBack: () => void;
  onNavigate?: (tab: string) => void;
}

interface RendezvousWithSale {
  rendezvous: PaymentRendezvous;
  sale: Sale;
  supermarket: Supermarket | null;
}

type FilterType = "all" | "today" | "week" | "overdue" | "upcoming";

export function RendezvousPage({ onBack }: RendezvousPageProps) {
  const [sales, setSales] = useState<Sale[]>([]);
  const [supermarkets, setSupermarkets] = useState<Supermarket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [expandedSaleId, setExpandedSaleId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

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
      console.error("Error loading rendezvous data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);


  // Get all rendezvous with their associated sales
  const allRendezvous = useMemo((): RendezvousWithSale[] => {
    const result: RendezvousWithSale[] = [];
    
    sales.forEach((sale) => {
      if (!sale.isPaid && sale.paymentRendezvous && sale.paymentRendezvous.length > 0) {
        sale.paymentRendezvous.forEach((rv) => {
          if (!rv.isCompleted) {
            const supermarket = supermarkets.find((s) => s.id === sale.supermarketId) || null;
            result.push({ rendezvous: rv, sale, supermarket });
          }
        });
      }
    });
    
    // Sort by date
    return result.sort((a, b) => new Date(a.rendezvous.date).getTime() - new Date(b.rendezvous.date).getTime());
  }, [sales, supermarkets]);

  // Filter rendezvous
  const filteredRendezvous = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekEnd = new Date(today);
    weekEnd.setDate(today.getDate() + 7);

    return allRendezvous.filter((item) => {
      const rvDate = new Date(item.rendezvous.date);
      const rvDateOnly = new Date(rvDate.getFullYear(), rvDate.getMonth(), rvDate.getDate());

      switch (filter) {
        case "today":
          return rvDateOnly.getTime() === today.getTime();
        case "week":
          return rvDateOnly >= today && rvDateOnly <= weekEnd;
        case "overdue":
          return rvDateOnly < today;
        case "upcoming":
          return rvDateOnly > today;
        default:
          return true;
      }
    });
  }, [allRendezvous, filter]);

  // Stats
  const stats = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    let todayCount = 0;
    let overdueCount = 0;
    let totalExpected = 0;

    allRendezvous.forEach((item) => {
      const rvDate = new Date(item.rendezvous.date);
      const rvDateOnly = new Date(rvDate.getFullYear(), rvDate.getMonth(), rvDate.getDate());
      
      if (rvDateOnly.getTime() === today.getTime()) todayCount++;
      if (rvDateOnly < today) overdueCount++;
      if (item.rendezvous.expectedAmount) totalExpected += item.rendezvous.expectedAmount;
    });

    return { total: allRendezvous.length, todayCount, overdueCount, totalExpected };
  }, [allRendezvous]);

  const getDateStatus = (dateStr: string) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const rvDate = new Date(dateStr);
    const rvDateOnly = new Date(rvDate.getFullYear(), rvDate.getMonth(), rvDate.getDate());
    
    if (rvDateOnly < today) return "overdue";
    if (rvDateOnly.getTime() === today.getTime()) return "today";
    return "upcoming";
  };

  const handleMarkAsCompleted = async (item: RendezvousWithSale) => {
    if (processingId) return;
    
    setProcessingId(item.rendezvous.id);
    try {
      const success = await markRendezvousAsCompleted(item.sale.id, item.rendezvous.id);
      
      if (success) {
        // Reload data to remove the completed rendezvous from the list
        await loadData();
      } else {
        alert("Erreur lors de la mise à jour du rendez-vous");
      }
    } catch (error) {
      console.error("Error marking rendezvous as completed:", error);
      alert("Erreur lors de la mise à jour du rendez-vous");
    } finally {
      setProcessingId(null);
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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
              <CalendarClock className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Rendez-vous</h1>
              <p className="text-sm text-gray-500">Chargement...</p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 rounded-full border-4 border-indigo-200 border-t-indigo-500 animate-spin" />
        </div>
      </div>
    );
  }


  return (
    <div className="space-y-6 pb-24 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
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
            <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
              <CalendarClock className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-gray-800">Rendez-vous</h1>
              <p className="text-sm lg:text-base text-gray-500">{stats.total} rendez-vous de paiement</p>
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadData}
          className="rounded-xl"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 sm:grid-cols-3 gap-3 lg:gap-4">
        <div className="premium-card p-4 text-center">
          <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center mx-auto mb-2">
            <Clock className="h-5 w-5 lg:h-6 lg:w-6 text-amber-600" />
          </div>
          <p className="text-2xl lg:text-3xl font-bold text-gray-800">{stats.todayCount}</p>
          <p className="text-xs lg:text-sm text-gray-500">Aujourd&apos;hui</p>
        </div>
        <div className="premium-card p-4 text-center">
          <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-gradient-to-br from-red-100 to-rose-100 flex items-center justify-center mx-auto mb-2">
            <AlertTriangle className="h-5 w-5 lg:h-6 lg:w-6 text-red-600" />
          </div>
          <p className="text-2xl lg:text-3xl font-bold text-red-600">{stats.overdueCount}</p>
          <p className="text-xs lg:text-sm text-gray-500">En retard</p>
        </div>
        <div className="premium-card p-4 text-center">
          <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center mx-auto mb-2">
            <DollarSign className="h-5 w-5 lg:h-6 lg:w-6 text-emerald-600" />
          </div>
          <p className="text-lg lg:text-2xl font-bold text-emerald-600">{stats.totalExpected.toLocaleString("fr-DZ")}</p>
          <p className="text-xs lg:text-sm text-gray-500">DZD attendus</p>
        </div>
      </div>

      {/* Filters */}
      <div className="premium-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-4 w-4 text-indigo-600" />
          <span className="text-sm font-medium text-gray-700">Filtrer par</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { value: "all", label: "Tous", count: stats.total },
            { value: "today", label: "Aujourd'hui", count: stats.todayCount },
            { value: "overdue", label: "En retard", count: stats.overdueCount },
            { value: "week", label: "Cette semaine", count: null },
            { value: "upcoming", label: "À venir", count: null },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value as FilterType)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                filter === opt.value
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {opt.label}
              {opt.count !== null && opt.count > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                  filter === opt.value ? "bg-white/20" : "bg-gray-200"
                }`}>
                  {opt.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>


      {/* Rendezvous List */}
      {filteredRendezvous.length === 0 ? (
        <div className="premium-card p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mx-auto mb-4">
            <CalendarClock className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-gray-600 font-medium">Aucun rendez-vous</p>
          <p className="text-sm text-gray-400 mt-1">
            {filter === "all" 
              ? "Vous n'avez pas de rendez-vous de paiement planifiés"
              : "Aucun rendez-vous pour ce filtre"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRendezvous.map((item, index) => {
            const status = getDateStatus(item.rendezvous.date);
            const isExpanded = expandedSaleId === `${item.sale.id}-${item.rendezvous.id}`;
            
            return (
              <div
                key={`${item.sale.id}-${item.rendezvous.id}`}
                className={`premium-card overflow-hidden animate-fade-in-up ${
                  status === "overdue" ? "border-l-4 border-l-red-500" :
                  status === "today" ? "border-l-4 border-l-amber-500" :
                  "border-l-4 border-l-indigo-500"
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Main Content */}
                <div
                  className="p-4 cursor-pointer"
                  onClick={() => setExpandedSaleId(isExpanded ? null : `${item.sale.id}-${item.rendezvous.id}`)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        status === "overdue" ? "bg-gradient-to-br from-red-100 to-rose-100" :
                        status === "today" ? "bg-gradient-to-br from-amber-100 to-orange-100" :
                        "bg-gradient-to-br from-indigo-100 to-purple-100"
                      }`}>
                        <Calendar className={`h-6 w-6 ${
                          status === "overdue" ? "text-red-600" :
                          status === "today" ? "text-amber-600" :
                          "text-indigo-600"
                        }`} />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">
                          {new Date(item.rendezvous.date).toLocaleDateString("fr-FR", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Store className="h-3.5 w-3.5 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {item.supermarket?.name || "Supermarché inconnu"}
                          </span>
                        </div>
                        {item.rendezvous.expectedAmount && (
                          <p className="text-sm font-medium text-emerald-600 mt-1">
                            {item.rendezvous.expectedAmount.toLocaleString("fr-DZ")} DZD attendus
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                        status === "overdue" ? "bg-red-100 text-red-700" :
                        status === "today" ? "bg-amber-100 text-amber-700" :
                        "bg-indigo-100 text-indigo-700"
                      }`}>
                        {status === "overdue" ? "En retard" :
                         status === "today" ? "Aujourd'hui" :
                         "À venir"}
                      </span>
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
                  <div className="px-4 pb-4 pt-2 border-t border-gray-100 space-y-4">
                    {/* Sale Info */}
                    <div className="p-3 rounded-xl bg-gray-50">
                      <p className="text-xs font-medium text-gray-500 mb-2">Détails de la vente</p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-500">Date:</span>
                          <span className="ml-1 font-medium">
                            {new Date(item.sale.date).toLocaleDateString("fr-FR")}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Quantité:</span>
                          <span className="ml-1 font-medium">{item.sale.cartons} cartons</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Total:</span>
                          <span className="ml-1 font-medium">{item.sale.totalValue.toLocaleString("fr-DZ")} DZD</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Reste:</span>
                          <span className="ml-1 font-medium text-red-600">
                            {item.sale.remainingAmount.toLocaleString("fr-DZ")} DZD
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Supermarket Contact */}
                    {item.supermarket && (
                      <div className="p-3 rounded-xl bg-indigo-50">
                        <p className="text-xs font-medium text-indigo-600 mb-2">Contact</p>
                        <div className="space-y-2">
                          {item.supermarket.phone_numbers && item.supermarket.phone_numbers.length > 0 && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-indigo-500" />
                              <a
                                href={`tel:${item.supermarket.phone_numbers[0].number}`}
                                className="text-sm text-indigo-700 hover:underline"
                              >
                                {item.supermarket.phone_numbers[0].number}
                                {item.supermarket.phone_numbers[0].name && (
                                  <span className="text-indigo-500 ml-1">
                                    ({item.supermarket.phone_numbers[0].name})
                                  </span>
                                )}
                              </a>
                            </div>
                          )}
                          {item.supermarket.address && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-indigo-500" />
                              <span className="text-sm text-indigo-700">{item.supermarket.address}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Note */}
                    {item.rendezvous.note && (
                      <div className="p-3 rounded-xl bg-amber-50">
                        <p className="text-xs font-medium text-amber-600 mb-1">Note</p>
                        <p className="text-sm text-amber-800">{item.rendezvous.note}</p>
                      </div>
                    )}

                    {/* Action Button */}
                    <Button
                      className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg shadow-indigo-500/25"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsCompleted(item);
                      }}
                      disabled={processingId === item.rendezvous.id}
                    >
                      {processingId === item.rendezvous.id ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Traitement...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                           rendez-vous  finalisé 
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
