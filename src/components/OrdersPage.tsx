"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  Plus,
  Calendar,
  Check,
  Trash2,
  Minus,
  Package,
  Clock,
  ShoppingCart,
  X,
  CalendarDays,
  Store,
} from "lucide-react";
import {
  getSupermarkets,
  getOrders,
  addOrder,
  deleteOrder,
} from "@/utils/hybridStorage";
import type { Supermarket, Order } from "@/utils/storage";

interface OrdersPageProps {
  onBack: () => void;
  onCompleteOrder: (order: Order) => void;
}

interface NewOrder {
  date: string;
  supermarketId: string;
  quantity: number;
  cartons: number;
  priceOption: "option1" | "option2";
}

export function OrdersPage({ onBack, onCompleteOrder }: OrdersPageProps) {
  const [showForm, setShowForm] = useState<boolean>(false);
  const [supermarkets, setSupermarkets] = useState<Supermarket[]>([]);
  const [newOrder, setNewOrder] = useState<NewOrder>({
    date: "",
    supermarketId: "",
    quantity: 0,
    cartons: 0,
    priceOption: "option1",
  });
  const [orders, setOrders] = useState<Order[]>([]);

  const loadOrdersData = useCallback(async () => {
    const ordersList = await getOrders();
    setOrders(ordersList);
  }, []);

  useEffect(() => {
    loadOrdersData();

    const loadSupermarkets = async () => {
      const supermarketsList = await getSupermarkets();
      setSupermarkets(supermarketsList);
    };
    loadSupermarkets();

    const handleSaleDataChanged = () => {
      loadOrdersData();
    };

    window.addEventListener("saleDataChanged", handleSaleDataChanged);

    return () => {
      window.removeEventListener("saleDataChanged", handleSaleDataChanged);
    };
  }, [loadOrdersData]);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    const supermarkets = await getSupermarkets();
    const selectedSupermarket = supermarkets.find(
      (s) => s.id === newOrder.supermarketId
    );

    if (selectedSupermarket) {
      const unitsQuantity = newOrder.cartons * 9;
      const pricePerUnit = newOrder.priceOption === "option1" ? 180 : 166;
      const order: Omit<Order, "id"> = {
        date: newOrder.date,
        supermarketId: newOrder.supermarketId,
        supermarketName: selectedSupermarket.name,
        quantity: unitsQuantity,
        pricePerUnit,
        status: "pending",
      };

      addOrder(order);
      setNewOrder({
        date: "",
        supermarketId: "",
        quantity: 0,
        cartons: 0,
        priceOption: "option1",
      });
      setShowForm(false);
      window.location.reload();
    }
  };

  const handleDelete = (id: string): void => {
    deleteOrder(id);
    window.location.reload();
  };

  const pendingOrders = orders.filter((order) => order.status === "pending");

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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <ShoppingCart className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Commandes Planifiées</h1>
              <p className="text-sm text-gray-500">{pendingOrders.length} commande(s) en attente</p>
            </div>
          </div>
        </div>
        <Button
          size="sm"
          className="rounded-xl px-4 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl"
          onClick={() => setShowForm(true)}
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Nouvelle
        </Button>
      </div>

      {/* New Order Form - Premium Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="premium-card w-full max-w-md animate-scale-in">
            {/* Header */}
            <div className="border-b border-gray-100 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                    <Plus className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">Nouvelle Commande</h3>
                    <p className="text-xs text-gray-500">Planifier une livraison</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowForm(false)}
                  className="rounded-full hover:bg-gray-100"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-5">
              {/* Supermarket Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Store className="h-4 w-4 text-blue-500" />
                  Supermarché
                </label>
                <select
                  className="w-full rounded-xl border-2 border-gray-200 p-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-gray-800"
                  value={newOrder.supermarketId}
                  onChange={(e) =>
                    setNewOrder((prev) => ({
                      ...prev,
                      supermarketId: e.target.value,
                    }))
                  }
                  required
                >
                  <option value="">Sélectionner un supermarché</option>
                  {supermarkets.map((sm) => (
                    <option key={sm.id} value={sm.id}>
                      {sm.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-blue-500" />
                  Date de livraison
                </label>
                <input
                  type="date"
                  className="w-full rounded-xl border-2 border-gray-200 p-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-gray-800"
                  value={newOrder.date}
                  onChange={(e) =>
                    setNewOrder((prev) => ({ ...prev, date: e.target.value }))
                  }
                  min={new Date().toISOString().split("T")[0]}
                  required
                />
              </div>

              {/* Quantity Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Package className="h-4 w-4 text-blue-500" />
                  Nombre de Cartons
                </label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 w-12 rounded-xl border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all"
                    onClick={() =>
                      setNewOrder((prev) => ({
                        ...prev,
                        cartons: Math.max(0, prev.cartons - 1),
                      }))
                    }
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <input
                    type="number"
                    className="flex-1 h-12 text-center text-xl font-bold rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    value={newOrder.cartons}
                    onChange={(e) =>
                      setNewOrder((prev) => ({
                        ...prev,
                        cartons: Math.max(0, parseInt(e.target.value) || 0),
                      }))
                    }
                    min="0"
                    required
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 w-12 rounded-xl border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all"
                    onClick={() =>
                      setNewOrder((prev) => ({
                        ...prev,
                        cartons: prev.cartons + 1,
                      }))
                    }
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-gray-500 text-center">
                  Équivalent à <span className="font-medium text-blue-600">{newOrder.cartons * 9}</span> pièces
                </p>
              </div>

              {/* Form Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  type="submit"
                  className="flex-1 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold shadow-lg"
                >
                  Confirmer
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-12 rounded-xl border-2 border-gray-200 text-gray-700 font-medium hover:bg-gray-50"
                  onClick={() => setShowForm(false)}
                >
                  Annuler
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Orders List */}
      <div className="space-y-3">
        {pendingOrders.length === 0 ? (
          <div className="premium-card p-8 text-center animate-fade-in-up">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-8 w-8 text-blue-400" />
            </div>
            <p className="text-gray-600 font-medium">Aucune commande planifiée</p>
            <p className="text-sm text-gray-400 mt-1">
              Cliquez sur &quot;Nouvelle&quot; pour créer une commande
            </p>
          </div>
        ) : (
          pendingOrders.map((order, index) => {
            const cartonsCount = Math.ceil(order.quantity / 9);
            const orderDate = new Date(order.date);
            const today = new Date();
            const isToday = orderDate.toDateString() === today.toDateString();
            const isPast = orderDate < today && !isToday;

            return (
              <div
                key={order.id}
                className={`premium-card overflow-hidden animate-fade-in-up ${
                  isPast ? "border-l-4 border-l-amber-400" : isToday ? "border-l-4 border-l-emerald-400" : ""
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        isToday
                          ? "bg-gradient-to-br from-emerald-100 to-teal-100"
                          : isPast
                          ? "bg-gradient-to-br from-amber-100 to-orange-100"
                          : "bg-gradient-to-br from-blue-100 to-indigo-100"
                      }`}>
                        <Calendar className={`h-6 w-6 ${
                          isToday ? "text-emerald-600" : isPast ? "text-amber-600" : "text-blue-600"
                        }`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-gray-800">
                            {orderDate.toLocaleDateString("fr-FR", {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                            })}
                          </h3>
                          {isToday && (
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                              Aujourd&apos;hui
                            </span>
                          )}
                          {isPast && (
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                              En retard
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1">
                          <Store className="h-3.5 w-3.5" />
                          {order.supermarketName}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-800">
                        {cartonsCount} <span className="text-sm font-normal text-gray-500">cartons</span>
                      </p>
                      <p className="text-xs text-gray-400 flex items-center justify-end gap-1">
                        <Package className="h-3 w-3" />
                        {order.quantity} pièces
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-gray-100">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300 transition-all"
                      onClick={() => onCompleteOrder(order)}
                    >
                      <Check className="h-4 w-4 mr-1.5" />
                      Compléter
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 transition-all"
                      onClick={() => handleDelete(order.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1.5" />
                      Supprimer
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Summary Card */}
      {pendingOrders.length > 0 && (
        <Card className="premium-card p-4 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
              <Clock className="h-4 w-4 text-indigo-600" />
            </div>
            <h3 className="font-semibold text-gray-800">Résumé</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50">
              <p className="text-xs text-blue-600 font-medium">Total Cartons</p>
              <p className="text-2xl font-bold text-blue-700">
                {pendingOrders.reduce((sum, o) => sum + Math.ceil(o.quantity / 9), 0)}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50">
              <p className="text-xs text-purple-600 font-medium">Total Pièces</p>
              <p className="text-2xl font-bold text-purple-700">
                {pendingOrders.reduce((sum, o) => sum + o.quantity, 0)}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
