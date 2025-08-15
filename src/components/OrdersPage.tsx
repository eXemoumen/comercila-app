"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Plus, Calendar, Check, Trash2, Minus } from "lucide-react";
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
        cartons: 0, // Default to 0 cartons
        priceOption: "option1",
    });
    const [orders, setOrders] = useState<Order[]>([]);

    // Function to load orders data
    const loadOrdersData = useCallback(async () => {
        const ordersList = await getOrders();
        setOrders(ordersList);
    }, []);

    useEffect(() => {
        loadOrdersData();

        // Load supermarkets
        const loadSupermarkets = async () => {
            const supermarketsList = await getSupermarkets();
            setSupermarkets(supermarketsList);
        };
        loadSupermarkets();

        // Add event listener for saleDataChanged event
        const handleSaleDataChanged = () => {
            loadOrdersData();
        };

        window.addEventListener("saleDataChanged", handleSaleDataChanged);

        // Cleanup event listener on unmount
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
            const unitsQuantity = newOrder.cartons * 9; // Convert cartons to units
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
            // Reset form and hide it
            setNewOrder({
                date: "",
                supermarketId: "",
                quantity: 0,
                cartons: 0,
                priceOption: "option1",
            });
            setShowForm(false);
            // Reload the page to refresh all data
            window.location.reload();
        }
    };

    const handleDelete = (id: string): void => {
        deleteOrder(id);
        // Reload the page to refresh all data
        window.location.reload();
    };

    return (
        <div className="space-y-4 pb-20">
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center">
                    <Button variant="ghost" size="icon" onClick={onBack} className="mr-1">
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-xl font-bold text-gray-800">
                        Commandes Planifiées
                    </h1>
                </div>
                <Button
                    size="sm"
                    className="rounded-full px-3 shadow-sm"
                    onClick={() => setShowForm(true)}
                >
                    <Plus className="h-4 w-4 mr-1" />
                    Nouvelle
                </Button>
            </div>

            {showForm && (
                <Card className="border-none shadow-md rounded-xl overflow-hidden mb-5">
                    <form onSubmit={handleSubmit} className="space-y-4 p-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">
                                Supermarché
                            </label>
                            <select
                                className="w-full rounded-xl border border-gray-200 p-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all shadow-sm"
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

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">
                                Date de livraison
                            </label>
                            <input
                                type="date"
                                className="w-full rounded-xl border border-gray-200 p-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all shadow-sm"
                                value={newOrder.date}
                                onChange={(e) =>
                                    setNewOrder((prev) => ({ ...prev, date: e.target.value }))
                                }
                                min={new Date().toISOString().split("T")[0]}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">
                                Nombre de Cartons (9 pièces/carton)
                            </label>
                            <div className="flex items-center">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="rounded-l-xl h-12 w-12 flex items-center justify-center border-gray-200"
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
                                    className="flex-1 h-12 text-center border-x-0 border-y border-gray-200"
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
                                    className="rounded-r-xl h-12 w-12 flex items-center justify-center border-gray-200"
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
                            <div className="text-sm text-gray-500 mt-1">
                                Équivalent à {newOrder.cartons * 9} pièces
                            </div>
                        </div>

                        <div className="flex space-x-3 pt-2">
                            <Button
                                type="submit"
                                className="flex-1 rounded-xl h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-md"
                            >
                                Confirmer
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                className="flex-1 rounded-xl h-12 border-gray-200 hover:bg-gray-50"
                                onClick={() => setShowForm(false)}
                            >
                                Annuler
                            </Button>
                        </div>
                    </form>
                </Card>
            )}

            <div className="space-y-3">
                {orders.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl border border-gray-200">
                        <Calendar className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                        <p>Aucune commande planifiée</p>
                    </div>
                ) : (
                    orders
                        .filter((order) => order.status === "pending") // Only show pending orders
                        .map((order) => {
                            const cartonsCount = Math.ceil(order.quantity / 9); // Calculate cartons from units

                            return (
                                <div
                                    key={order.id}
                                    className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl shadow-sm"
                                >
                                    <div>
                                        <h3 className="font-medium text-gray-800">
                                            {new Date(order.date).toLocaleDateString("fr-FR")}
                                        </h3>
                                        <p className="text-sm text-gray-500 mt-1">
                                            {order.supermarketName}
                                        </p>
                                    </div>
                                    <div className="text-right flex items-center">
                                        <div>
                                            <p className="font-medium text-gray-800">
                                                {cartonsCount} cartons
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {order.quantity} pièces
                                            </p>
                                        </div>
                                        <div className="flex space-x-1 ml-4">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8 text-green-600 rounded-full border-green-200 hover:bg-green-50"
                                                onClick={() => onCompleteOrder(order)}
                                            >
                                                <Check className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8 text-red-600 rounded-full border-red-200 hover:bg-red-50"
                                                onClick={() => handleDelete(order.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                )}
            </div>
        </div>
    );
}