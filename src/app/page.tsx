"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Home,
  Package,
  ShoppingCart,
  Store,
  ChevronLeft,
  Plus,
  Trash2,
  Settings,
  Check,
  ChevronRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { translations } from "@/translations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  addSale,
  getSupermarkets,
  getOrders,
  addOrder,
  deleteOrder,
  getStockHistory,
  getCurrentStock,
  updateStock,
  addSupermarket,
  completeOrder,
  getSales,
} from "@/utils/storage";

interface Order {
  id: string;
  date: string;
  supermarketId: string;
  supermarketName: string;
  quantity: number;
  status: "pending" | "completed" | "cancelled";
  completedDate?: string;
}

interface Supermarket {
  id: number;
  name: string;
  totalSales: string;
  lastSale: string;
}

interface SupermarketsPageProps {
  onBack: () => void;
  onViewSupermarket: (id: string) => void;
}

interface SupermarketProfilePageProps {
  onBack: () => void;
  supermarketId: string;
  setActiveTab: (tab: string) => void;
}

export default function Dashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedSupermarketId, setSelectedSupermarketId] =
    useState<string>("");

  // Update sample data labels to French
  const monthlySales = {
    quantity: 1250,
    revenue: 6250,
    profit: 2500,
    stock: 750,
  };

  const salesData = [
    { name: "Lun", value: 400 },
    { name: "Mar", value: 300 },
    { name: "Mer", value: 500 },
    { name: "Jeu", value: 280 },
    { name: "Ven", value: 590 },
    { name: "Sam", value: 320 },
    { name: "Dim", value: 480 },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <div className="space-y-4 pb-20">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="p-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Ventes Totales
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <div className="text-2xl font-bold">
                    {monthlySales.quantity} unités
                  </div>
                  <div className="text-xl font-semibold text-primary">
                    €{monthlySales.revenue}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="p-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Bénéfice
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <div className="text-2xl font-bold">
                    €{monthlySales.profit}
                  </div>
                  <div className="text-sm text-muted-foreground">Ce Mois</div>
                </CardContent>
              </Card>
              <Card className="col-span-2">
                <CardHeader className="p-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Niveau de Stock
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <div className="text-2xl font-bold">
                    {monthlySales.stock} unités
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted mt-2">
                    <div
                      className="h-2 rounded-full bg-primary"
                      style={{ width: `${(monthlySales.stock / 2000) * 100}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="p-3">
                <CardTitle className="text-sm font-medium">
                  Tendance des Ventes (7 Derniers Jours)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 pt-0">
                <div className="h-[180px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={salesData}>
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              <Button
                size="lg"
                className="h-16 text-lg"
                onClick={() => setActiveTab("add-sale")}
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                Nouvelle Vente
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-16 text-lg"
                onClick={() => setActiveTab("stock")}
              >
                <Package className="mr-2 h-5 w-5" />
                Voir Stock
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-16 text-lg"
                onClick={() => setActiveTab("orders")}
              >
                <Calendar className="mr-2 h-5 w-5" />
                Planifier Commande
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-16 text-lg"
                onClick={() => setActiveTab("supermarkets")}
              >
                <Store className="mr-2 h-5 w-5" />
                Supermarchés
              </Button>
            </div>
          </div>
        );
      case "add-sale":
        return <AddSalePage onBack={() => setActiveTab("dashboard")} />;
      case "supermarkets":
        return (
          <SupermarketsPage
            onBack={() => setActiveTab("dashboard")}
            onViewSupermarket={(id) => {
              setSelectedSupermarketId(id);
              setActiveTab("supermarket-profile");
            }}
          />
        );
      case "supermarket-profile":
        return (
          <SupermarketProfilePage
            onBack={() => setActiveTab("supermarkets")}
            supermarketId={selectedSupermarketId}
            setActiveTab={setActiveTab}
          />
        );
      case "stock":
        return <StockPage onBack={() => setActiveTab("dashboard")} />;
      case "orders":
        return <OrdersPage onBack={() => setActiveTab("dashboard")} />;
      default:
        return null;
    }
  };

  return (
    <main className="container max-w-md mx-auto p-4">
      {renderContent()}
      <ClearDataButton />
      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t flex justify-around items-center h-16 px-2">
        <Button
          variant={activeTab === "dashboard" ? "default" : "ghost"}
          className="flex flex-col h-14 rounded-none"
          onClick={() => setActiveTab("dashboard")}
        >
          <Home className="h-5 w-5" />
          <span className="text-xs mt-1">Tableau de Bord</span>
        </Button>
        <Button
          variant={activeTab === "add-sale" ? "default" : "ghost"}
          className="flex flex-col h-14 rounded-none"
          onClick={() => setActiveTab("add-sale")}
        >
          <ShoppingCart className="h-5 w-5" />
          <span className="text-xs mt-1">Ventes</span>
        </Button>
        <Button
          variant={activeTab === "supermarkets" ? "default" : "ghost"}
          className="flex flex-col h-14 rounded-none"
          onClick={() => setActiveTab("supermarkets")}
        >
          <Store className="h-5 w-5" />
          <span className="text-xs mt-1">Supermarchés</span>
        </Button>
        <Button
          variant={activeTab === "stock" ? "default" : "ghost"}
          className="flex flex-col h-14 rounded-none"
          onClick={() => setActiveTab("stock")}
        >
          <Package className="h-5 w-5" />
          <span className="text-xs mt-1">Stock</span>
        </Button>
        <Button
          variant={activeTab === "orders" ? "default" : "ghost"}
          className="flex flex-col h-14 rounded-none"
          onClick={() => setActiveTab("orders")}
        >
          <Calendar className="h-5 w-5" />
          <span className="text-xs mt-1">Commandes</span>
        </Button>
      </div>
    </main>
  );
}

function AddSalePage({ onBack }) {
  const [supermarketId, setSupermarketId] = useState("");
  const [quantity, setQuantity] = useState(50);
  const [pricePerUnit, setPricePerUnit] = useState(5.0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const sale = {
      date: new Date().toISOString(),
      supermarketId,
      quantity,
      pricePerUnit,
      totalValue: quantity * pricePerUnit,
    };

    addSale(sale);
    onBack();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pb-20">
      <div className="flex items-center mb-4">
        <Button type="button" variant="ghost" size="sm" onClick={onBack}>
          <ChevronLeft className="mr-1" />
          Retour
        </Button>
        <h1 className="text-xl font-bold ml-2">Nouvelle Vente</h1>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Supermarché</label>
          <select
            className="w-full rounded-md border"
            value={supermarketId}
            onChange={(e) => setSupermarketId(e.target.value)}
            required
          >
            <option value="">Sélectionner un supermarché</option>
            {getSupermarkets().map((sm) => (
              <option key={sm.id} value={sm.id}>
                {sm.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Quantité</label>
          <div className="flex items-center">
            <Button
              type="button"
              className="rounded-r-none"
              onClick={() => setQuantity((q) => Math.max(0, q - 1))}
            >
              -
            </Button>
            <input
              type="number"
              className="flex-1 text-center rounded-none border-x-0"
              value={quantity}
              onChange={(e) =>
                setQuantity(Math.max(0, parseInt(e.target.value) || 0))
              }
              required
            />
            <Button
              type="button"
              className="rounded-l-none"
              onClick={() => setQuantity((q) => q + 1)}
            >
              +
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Prix par unité (€)</label>
          <input
            type="number"
            step="0.01"
            className="w-full rounded-md border"
            value={pricePerUnit}
            onChange={(e) => setPricePerUnit(parseFloat(e.target.value) || 0)}
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Valeur totale</label>
          <input
            type="text"
            className="w-full rounded-md border bg-muted"
            value={`€${(quantity * pricePerUnit).toFixed(2)}`}
            disabled
          />
        </div>

        <Button type="submit" className="w-full mt-6">
          Enregistrer la Vente
        </Button>
      </div>
    </form>
  );
}

function SupermarketsPage({
  onBack,
  onViewSupermarket,
}: SupermarketsPageProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSupermarket, setNewSupermarket] = useState<
    Omit<Supermarket, "id" | "totalSales" | "totalValue">
  >({
    name: "",
    address: "",
    phone: "",
    email: "",
  });
  const [supermarkets, setSupermarkets] = useState<Supermarket[]>([]);

  // Load supermarkets on component mount
  useEffect(() => {
    setSupermarkets(getSupermarkets());
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newSm = addSupermarket(newSupermarket);
    setSupermarkets(getSupermarkets());
    setShowAddForm(false);
    setNewSupermarket({ name: "", address: "", phone: "", email: "" });
  };

  return (
    <div className="space-y-4 pb-20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ChevronLeft className="h-5 w-5 mr-1" />
            Retour
          </Button>
          <h1 className="text-xl font-bold ml-2">Supermarchés</h1>
        </div>
        <Button size="sm" onClick={() => setShowAddForm(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Nouveau
        </Button>
      </div>

      {/* Add Supermarket Form */}
      {showAddForm && (
        <Card className="p-4 mb-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-sm font-medium block mb-1">
                Nom du Supermarché
              </label>
              <input
                type="text"
                className="w-full h-10 rounded-md border bg-background px-3"
                value={newSupermarket.name}
                onChange={(e) =>
                  setNewSupermarket((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium block mb-1">Adresse</label>
              <input
                type="text"
                className="w-full h-10 rounded-md border bg-background px-3"
                value={newSupermarket.address}
                onChange={(e) =>
                  setNewSupermarket((prev) => ({
                    ...prev,
                    address: e.target.value,
                  }))
                }
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium block mb-1">
                Téléphone
              </label>
              <input
                type="tel"
                className="w-full h-10 rounded-md border bg-background px-3"
                value={newSupermarket.phone}
                onChange={(e) =>
                  setNewSupermarket((prev) => ({
                    ...prev,
                    phone: e.target.value,
                  }))
                }
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium block mb-1">Email</label>
              <input
                type="email"
                className="w-full h-10 rounded-md border bg-background px-3"
                value={newSupermarket.email}
                onChange={(e) =>
                  setNewSupermarket((prev) => ({
                    ...prev,
                    email: e.target.value,
                  }))
                }
                required
              />
            </div>

            <div className="flex space-x-2 pt-2">
              <Button type="submit" className="flex-1">
                Confirmer
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setShowAddForm(false)}
              >
                Annuler
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="space-y-2">
        {supermarkets.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Aucun supermarché enregistré
          </div>
        ) : (
          supermarkets.map((supermarket) => (
            <div
              key={supermarket.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted cursor-pointer"
              onClick={() => onViewSupermarket(supermarket.id.toString())}
            >
              <div>
                <h3 className="font-medium">{supermarket.name}</h3>
                <p className="text-sm text-muted-foreground">
                  Total des ventes: {supermarket.totalValue}€
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium">{supermarket.totalSales} unités</p>
                <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function SupermarketProfilePage({
  onBack,
  supermarketId,
  setActiveTab,
}: SupermarketProfilePageProps) {
  const [supermarket, setSupermarket] = useState<Supermarket | null>(null);
  const [orderHistory, setOrderHistory] = useState<Order[]>([]);
  const [salesHistory, setSalesHistory] = useState<Sale[]>([]);

  useEffect(() => {
    // Load supermarket data
    const sm = getSupermarkets().find((s) => s.id === supermarketId);
    setSupermarket(sm || null);

    // Load all orders for this supermarket
    const allOrders = getOrders();
    const filteredOrders = allOrders.filter(
      (order) => order.supermarketId === supermarketId
    );
    setOrderHistory(filteredOrders);

    // Load all sales for this supermarket
    const allSales = getSales();
    const filteredSales = allSales.filter(
      (sale) => sale.supermarketId === supermarketId
    );
    setSalesHistory(filteredSales);
  }, [supermarketId]);

  // Combine and sort both histories by date
  const combinedHistory = [...orderHistory, ...salesHistory].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="space-y-4 pb-20">
      <div className="flex items-center mb-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ChevronLeft className="h-5 w-5 mr-1" />
          Retour
        </Button>
        <h1 className="text-xl font-bold ml-2">{supermarket?.name}</h1>
      </div>

      {/* Supermarket Details Card */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Adresse</p>
              <p className="font-medium">{supermarket?.address}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Contact</p>
              <p className="font-medium">{supermarket?.phone}</p>
              <p className="text-sm">{supermarket?.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Card */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Ventes</p>
              <p className="text-2xl font-bold">
                {supermarket?.totalSales} unités
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Valeur Totale</p>
              <p className="text-2xl font-bold">{supermarket?.totalValue}€</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Combined History */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">
          Historique des Commandes et Ventes
        </h2>
        {combinedHistory.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Aucun historique pour ce supermarché
          </div>
        ) : (
          combinedHistory.map((item) => {
            // Check if item is an order or sale
            const isOrder = "status" in item;

            return (
              <div
                key={item.id}
                className={`flex items-center justify-between p-3 border rounded-lg ${
                  isOrder && item.status === "completed" ? "bg-green-50" : ""
                }`}
              >
                <div>
                  <h3 className="font-medium">
                    {new Date(item.date).toLocaleDateString("fr-FR")}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {isOrder ? (
                      (item as Order).status === "completed" ? (
                        <>
                          Livraison - Livré le{" "}
                          {new Date(
                            (item as Order).completedDate!
                          ).toLocaleDateString("fr-FR")}
                        </>
                      ) : (
                        "Livraison - En attente"
                      )
                    ) : (
                      "Vente"
                    )}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">
                    {item.quantity} unités
                    {!isOrder && ` - ${(item as Sale).totalValue}€`}
                  </p>
                  <p
                    className={`text-sm ${
                      isOrder
                        ? (item as Order).status === "completed"
                          ? "text-green-600"
                          : "text-yellow-600"
                        : "text-blue-600"
                    }`}
                  >
                    {isOrder
                      ? (item as Order).status === "completed"
                        ? "✓ Livré"
                        : "⏳ En attente"
                      : "💰 Vente"}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-2 mt-4">
        <Button className="flex-1" onClick={() => setActiveTab("add-sale")}>
          <ShoppingCart className="mr-2 h-4 w-4" />
          Nouvelle Vente
        </Button>
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => setActiveTab("orders")}
        >
          <Calendar className="mr-2 h-4 w-4" />
          Planifier Commande
        </Button>
      </div>
    </div>
  );
}

function StockPage({ onBack }) {
  const [showAdjustForm, setShowAdjustForm] = useState(false);
  const [newStock, setNewStock] = useState({ quantity: 0 });
  const [stockHistory, setStockHistory] = useState<any[]>([]);
  const [currentStock, setCurrentStock] = useState(0);

  // Load initial data
  useEffect(() => {
    setStockHistory(getStockHistory());
    setCurrentStock(getCurrentStock());
  }, []);

  const handleAdjustStock = (e: React.FormEvent) => {
    e.preventDefault();
    const difference = newStock.quantity - currentStock;
    updateStock(difference, "adjusted", "Ajustement manuel");
    setCurrentStock(getCurrentStock());
    setStockHistory(getStockHistory());
    setShowAdjustForm(false);
    setNewStock({ quantity: 0 });
  };

  return (
    <div className="space-y-4 pb-20">
      <div className="flex items-center mb-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ChevronLeft className="h-5 w-5 mr-1" />
          Retour
        </Button>
        <h1 className="text-xl font-bold ml-2">Gestion du Stock</h1>
      </div>

      {/* Current Stock Card */}
      <Card className="mb-6">
        <CardContent className="p-6 flex flex-col items-center justify-center">
          <h2 className="text-lg font-medium text-muted-foreground mb-2">
            Stock Actuel
          </h2>
          <div className="text-5xl font-bold mb-4">{currentStock}</div>
          <div className="h-3 w-full rounded-full bg-muted">
            <div
              className="h-3 rounded-full bg-primary"
              style={{ width: `${(currentStock / 2000) * 100}%` }}
            />
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {((currentStock / 2000) * 100).toFixed(1)}% de la capacité maximale
          </p>
        </CardContent>
      </Card>

      {/* Single Adjust Stock Button */}
      <Button
        size="lg"
        className="w-full h-16"
        onClick={() => setShowAdjustForm(true)}
      >
        <Settings className="mr-2 h-5 w-5" />
        Ajuster Stock
      </Button>

      {/* Adjust Stock Form */}
      {showAdjustForm && (
        <Card className="p-4">
          <form onSubmit={handleAdjustStock} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nouveau Stock Total</label>
              <input
                type="number"
                className="w-full h-10 rounded-md border bg-background px-3"
                value={newStock.quantity}
                onChange={(e) =>
                  setNewStock({ quantity: parseInt(e.target.value) || 0 })
                }
                min="0"
                required
              />
            </div>
            <div className="flex space-x-2">
              <Button type="submit" className="flex-1">
                Confirmer
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setShowAdjustForm(false)}
              >
                Annuler
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Stock History */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-2">
          Historique des Mouvements
        </h2>
        <div className="space-y-2">
          {stockHistory
            .slice()
            .reverse()
            .map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div>
                  <h3 className="font-medium">
                    {new Date(item.date).toLocaleDateString("fr-FR")}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {item.type === "adjusted"
                      ? "Ajustement"
                      : item.type === "removed"
                      ? "Vente"
                      : "Livraison"}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={`font-medium ${
                      item.quantity > 0
                        ? "text-green-600"
                        : item.quantity < 0
                        ? "text-red-600"
                        : ""
                    }`}
                  >
                    {item.quantity > 0 ? "+" : ""}
                    {item.quantity}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Stock: {item.currentStock}
                  </p>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

function OrdersPage({ onBack }) {
  const [showForm, setShowForm] = useState(false);
  const [newOrder, setNewOrder] = useState({
    date: "",
    supermarketId: "",
    quantity: 0,
  });
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    setOrders(getOrders());
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedSupermarket = getSupermarkets().find(
      (s) => s.id === newOrder.supermarketId
    );

    if (selectedSupermarket) {
      const order = {
        ...newOrder,
        supermarketName: selectedSupermarket.name,
      };

      addOrder(order);
      setOrders(getOrders());
      setShowForm(false);
      setNewOrder({ date: "", supermarketId: "", quantity: 0 });
    }
  };

  const handleDelete = (id: string) => {
    deleteOrder(id);
    setOrders(getOrders());
  };

  const handleCompleteOrder = (order: Order) => {
    // Complete the order and update supermarket stats
    completeOrder(order.id);

    // Update stock
    updateStock(
      -order.quantity,
      "removed",
      `Livraison ${order.supermarketName}`
    );

    // Refresh orders list
    setOrders(getOrders());
  };

  return (
    <div className="space-y-4 pb-20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ChevronLeft className="h-5 w-5 mr-1" />
            Retour
          </Button>
          <h1 className="text-xl font-bold ml-2">Commandes Planifiées</h1>
        </div>
        <Button
          size="sm"
          onClick={() => setShowForm(true)}
          className="whitespace-nowrap"
        >
          <Plus className="h-4 w-4 mr-1" />
          Nouvelle Commande
        </Button>
      </div>

      {showForm && (
        <Card className="p-4 mb-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-sm font-medium block mb-1">
                Supermarché
              </label>
              <select
                className="w-full h-10 rounded-md border bg-background px-3"
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
                {getSupermarkets().map((sm) => (
                  <option key={sm.id} value={sm.id}>
                    {sm.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium block mb-1">
                Date de livraison
              </label>
              <input
                type="date"
                className="w-full h-10 rounded-md border bg-background px-3"
                value={newOrder.date}
                onChange={(e) =>
                  setNewOrder((prev) => ({ ...prev, date: e.target.value }))
                }
                min={new Date().toISOString().split("T")[0]}
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium block mb-1">Quantité</label>
              <input
                type="number"
                className="w-full h-10 rounded-md border bg-background px-3"
                value={newOrder.quantity}
                onChange={(e) =>
                  setNewOrder((prev) => ({
                    ...prev,
                    quantity: parseInt(e.target.value) || 0,
                  }))
                }
                min="1"
                required
              />
            </div>

            <div className="flex space-x-2 pt-2">
              <Button type="submit" className="flex-1">
                Confirmer
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setShowForm(false)}
              >
                Annuler
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="space-y-2">
        {orders
          .filter((order) => order.status === "pending") // Only show pending orders
          .map((order) => (
            <div
              key={order.id}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div>
                <h3 className="font-medium">
                  {new Date(order.date).toLocaleDateString("fr-FR")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {order.supermarketName}
                </p>
              </div>
              <div className="text-right flex items-center">
                <p className="font-medium mr-4">{order.quantity} unités</p>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-green-600"
                    onClick={() => handleCompleteOrder(order)}
                    title="Marquer comme livré"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => handleDelete(order.id)}
                    title="Supprimer la commande"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

function ClearDataButton() {
  const handleClearData = () => {
    if (
      window.confirm(
        "Êtes-vous sûr de vouloir supprimer toutes les données ? Cette action est irréversible."
      )
    ) {
      localStorage.clear();
      window.location.reload(); // Reload the page to reset all states
    }
  };

  return (
    <Button
      variant="destructive"
      onClick={handleClearData}
      className="fixed bottom-20 right-4 bg-red-600 hover:bg-red-700"
    >
      <Trash2 className="h-4 w-4 mr-2" />
      Réinitialiser les données
    </Button>
  );
}
