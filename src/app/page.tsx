"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { InvoiceModal } from "@/components/InvoiceModal";

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
  Minus,
  AlertCircle,
  X,
  Menu,
  MapPin,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

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
  getSales,
  updateSalePayment,
  addPayment,
  updateSupermarket,
} from "@/utils/storage";
import { Sale, Supermarket, Order } from "@/types/index";

interface SupermarketsPageProps {
  onBack: () => void;
  onViewSupermarket: (id: string) => void;
}

interface SupermarketProfilePageProps {
  onBack: () => void;
  supermarketId: string;
  setActiveTab: (tab: string) => void;
}

interface OrdersPageProps {
  onBack: () => void;
  onCompleteOrder: (order: Order) => void;
}

interface AddSalePageProps {
  onBack: () => void;
  preFillData?: {
    supermarketId: string;
    quantity: number;
    orderId?: string;
  } | null;
}

interface StockPageProps {
  onBack: () => void;
}

interface StockHistoryItem {
  id: string;
  date: string;
  quantity: number;
  type?: "added" | "removed" | "adjusted";
  reason?: string;
}

// Add this interface near the top with other interfaces
interface MonthlyData {
  quantity: number;
  value: number;
  netBenefit: number;
}

export default function Dashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showMenu, setShowMenu] = useState(false);
  const [selectedSupermarketId, setSelectedSupermarketId] =
    useState<string>("");
  const [preFillSaleData, setPreFillSaleData] = useState<{
    supermarketId: string;
    quantity: number;
    orderId: string;
  } | null>(null);
  const [dashboardData, setDashboardData] = useState({
    monthlySales: {
      quantity: 0,
      revenue: 0,
      profit: 0,
      stock: 0,
      supplierPayment: 0,
    },
    salesData: [] as { name: string; value: number }[],
  });

  // Add this calculation in the Dashboard component, after the dashboardData state
  const [monthlyBenefits, setMonthlyBenefits] = useState<
    Record<string, MonthlyData>
  >({});

  // Load and update dashboard data
  useEffect(() => {
    const updateDashboardData = () => {
      // Get current month's sales
      const allSales = getSales();
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();

      const monthlySales = allSales.filter((sale) => {
        const saleDate = new Date(sale.date);
        return (
          saleDate.getMonth() === currentMonth &&
          saleDate.getFullYear() === currentYear
        );
      });

      // Calculate monthly statistics
      const totalQuantity = monthlySales.reduce(
        (acc, sale) => acc + sale.quantity,
        0
      );
      const totalRevenue = monthlySales.reduce(
        (acc, sale) => acc + sale.totalValue,
        0
      );

      // Calculate profit based on the actual pricePerUnit from sales
      const totalProfit = monthlySales.reduce((acc, sale) => {
        // Determine benefit per unit based on sale price
        const benefitPerUnit =
          sale.pricePerUnit === 180 ? 25 : sale.pricePerUnit === 166 ? 17 : 0;
        return acc + sale.quantity * benefitPerUnit;
      }, 0);

      // Calculate supplier payment amount - new addition
      const totalSupplierPayment = monthlySales.reduce((acc, sale) => {
        // Determine supplier cost per unit based on sale price
        const supplierCostPerUnit =
          sale.pricePerUnit === 180 ? 155 : sale.pricePerUnit === 166 ? 149 : 0;
        return acc + sale.quantity * supplierCostPerUnit;
      }, 0);

      const currentStock = getCurrentStock();

      // Get last 7 days sales data
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date;
      }).reverse();

      const salesData = last7Days.map((date) => {
        const daySales = allSales.filter((sale) => {
          const saleDate = new Date(sale.date);
          return saleDate.toDateString() === date.toDateString();
        });

        const totalValue = daySales.reduce(
          (acc, sale) => acc + sale.totalValue,
          0
        );

        return {
          name: date.toLocaleDateString("fr-FR", { weekday: "short" }),
          value: totalValue,
        };
      });

      setDashboardData({
        monthlySales: {
          quantity: totalQuantity,
          revenue: totalRevenue,
          profit: totalProfit,
          stock: currentStock * 9, // Convert cartons to units
          supplierPayment: totalSupplierPayment, // Add supplier payment to dashboard data
        },
        salesData,
      });
    };

    // Initial load
    updateDashboardData();

    // Set up interval to update data every minute
    const interval = setInterval(updateDashboardData, 60000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, []);

  // Add this useEffect after the existing dashboard data useEffect
  useEffect(() => {
    const calculateMonthlyBenefits = () => {
      const allSales = getSales();
      const monthlyData: Record<string, MonthlyData> = {};

      allSales.forEach((sale) => {
        const date = new Date(sale.date);
        // Format the month and year in French with proper capitalization
        let monthYear = date.toLocaleDateString("fr-FR", {
          month: "long",
          year: "numeric",
        });

        // Capitalize the first letter of the month
        monthYear = monthYear.charAt(0).toUpperCase() + monthYear.slice(1);

        if (!monthlyData[monthYear]) {
          monthlyData[monthYear] = {
            quantity: 0,
            value: 0,
            netBenefit: 0,
          };
        }

        const benefitPerUnit =
          sale.pricePerUnit === 180 ? 25 : sale.pricePerUnit === 166 ? 17 : 0;

        monthlyData[monthYear].quantity += sale.quantity;
        monthlyData[monthYear].value += sale.totalValue;
        monthlyData[monthYear].netBenefit += sale.quantity * benefitPerUnit;
      });

      setMonthlyBenefits(monthlyData);
    };

    calculateMonthlyBenefits();
  }, []);

  // Add this effect to check localStorage for active tab
  useEffect(() => {
    const savedTab = localStorage.getItem("activeTab");
    if (savedTab) {
      setActiveTab(savedTab);
      localStorage.removeItem("activeTab"); // Clear it after using
    }
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <div className="space-y-6 pb-20">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-gray-800">
                Tableau de Bord
              </h1>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full h-9 w-9 border-gray-200"
                onClick={() => setActiveTab("pending-payments")}
              >
                <AlertCircle className="h-5 w-5 text-red-500" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Card className="overflow-hidden border-none shadow-md rounded-xl hover:shadow-lg transition-all duration-300">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2">
                  <CardTitle className="text-xs font-medium text-white/90">
                    Ventes Totales
                  </CardTitle>
                </div>
                <CardContent className="p-3">
                  <div className="text-2xl font-bold text-gray-800 animate-in slide-in-from-bottom-1 duration-300">
                    {dashboardData.monthlySales.quantity} pièces
                  </div>
                  <div className="text-sm text-gray-500 animate-in slide-in-from-bottom-2 duration-300">
                    {Math.floor(dashboardData.monthlySales.quantity / 9)}{" "}
                    cartons
                  </div>
                  <div className="text-xl font-semibold text-blue-600 mt-1 animate-in slide-in-from-bottom-3 duration-300">
                    {dashboardData.monthlySales.revenue.toLocaleString("fr-DZ")}{" "}
                    DZD
                  </div>
                </CardContent>
              </Card>

              <Card className="overflow-hidden border-none shadow-md rounded-xl">
                <div className="bg-gradient-to-br from-green-500 to-green-600 p-2">
                  <CardTitle className="text-xs font-medium text-white/90">
                    Bénéfice
                  </CardTitle>
                </div>
                <CardContent className="p-3">
                  <div className="text-2xl font-bold text-gray-800">
                    {dashboardData.monthlySales.profit.toLocaleString("fr-DZ")}{" "}
                    DZD
                  </div>
                  <div className="flex items-center mt-1">
                    <span className="text-xs px-2 py-0.5 bg-green-100 text-green-800 rounded-full">
                      25 DZD/180 DZD
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-green-100 text-green-800 rounded-full ml-1">
                      17 DZD/166 DZD
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="col-span-2 overflow-hidden border-none shadow-md rounded-xl">
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-2">
                  <CardTitle className="text-xs font-medium text-white/90">
                    Niveau de Stock
                  </CardTitle>
                </div>
                <CardContent className="p-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-2xl font-bold text-gray-800">
                        {Math.floor(dashboardData.monthlySales.stock / 9)}{" "}
                        cartons
                      </div>
                      <div className="text-sm text-gray-500">
                        {dashboardData.monthlySales.stock} pièces
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-purple-500">
                      {(
                        (dashboardData.monthlySales.stock / 2700) *
                        100
                      ).toFixed(0)}
                      %
                    </div>
                  </div>
                  <div className="h-3 w-full rounded-full bg-purple-100 mt-3 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-purple-500 transition-all duration-500"
                      style={{
                        width: `${
                          (dashboardData.monthlySales.stock / 2700) * 100
                        }%`,
                      }}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="col-span-2 overflow-hidden border-none shadow-md rounded-xl">
                <div className="bg-gradient-to-br from-red-500 to-red-600 p-2">
                  <CardTitle className="text-xs font-medium text-white/90">
                    À Retourner au Fournisseur (Ce Mois)
                  </CardTitle>
                </div>
                <CardContent className="p-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-2xl font-bold text-gray-800 animate-in slide-in-from-bottom-1 duration-300">
                        {dashboardData.monthlySales.supplierPayment.toLocaleString(
                          "fr-DZ"
                        )}{" "}
                        DZD
                      </div>
                      <div className="flex items-center mt-1">
                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-800 rounded-full">
                          Option 1: 155 DZD/unité
                        </span>
                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-800 rounded-full ml-1">
                          Option 2: 149 DZD/unité
                        </span>
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-red-500">
                      {Math.round(
                        (dashboardData.monthlySales.supplierPayment /
                          dashboardData.monthlySales.revenue) *
                          100
                      )}
                      %
                    </div>
                  </div>
                  <div className="mt-3 text-sm text-gray-500">
                    Ce montant représente ce qui doit être retourné au
                    fournisseur pour les ventes réalisées ce mois-ci.
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-none shadow-md rounded-xl overflow-hidden">
              <div className="p-3 border-b">
                <CardTitle className="text-sm font-medium text-gray-700">
                  Tendance des Ventes (7 Derniers Jours)
                </CardTitle>
              </div>
              <CardContent className="p-0">
                <div className="h-[200px] w-full p-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dashboardData.salesData}>
                      <XAxis dataKey="name" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "8px",
                          border: "none",
                          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                        }}
                      />
                      <Bar
                        dataKey="value"
                        fill="#4f46e5"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md rounded-xl overflow-hidden">
              <div className="p-3 border-b">
                <CardTitle className="text-sm font-medium text-gray-700">
                  Bénéfice Net Mensuel
                </CardTitle>
              </div>
              <CardContent className="p-0">
                <div className="h-[200px] w-full p-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        {
                          name: "Option 180 DZD",
                          value: dashboardData.monthlySales.profit * 0.7, // Estimated portion from 180 DZD sales
                          fill: "#22c55e",
                        },
                        {
                          name: "Option 166 DZD",
                          value: dashboardData.monthlySales.profit * 0.3, // Estimated portion from 166 DZD sales
                          fill: "#16a34a",
                        },
                        {
                          name: "Total",
                          value: dashboardData.monthlySales.profit,
                          fill: "#0ea5e9",
                        },
                      ]}
                    >
                      <XAxis dataKey="name" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "8px",
                          border: "none",
                          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                        }}
                        formatter={(value) => [
                          `${value.toLocaleString("fr-DZ")} DZD`,
                          "Bénéfice",
                        ]}
                      />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="px-4 py-2 text-xs text-gray-500 bg-gray-50 rounded-b-xl">
                  Bénéfice total du mois:{" "}
                  <span className="font-medium text-green-600">
                    {dashboardData.monthlySales.profit.toLocaleString("fr-DZ")}{" "}
                    DZD
                  </span>
                  <div className="flex items-center mt-1 gap-2">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
                      <span>25 DZD/unité (180 DZD)</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-600 rounded-full mr-1"></div>
                      <span>17 DZD/unité (166 DZD)</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Monthly History Table */}
            <Card className="border-none shadow-md rounded-xl overflow-hidden mt-6">
              <div className="p-3 border-b">
                <CardTitle className="text-sm font-medium text-gray-700">
                  Historique Mensuel
                </CardTitle>
              </div>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Mois
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ventes
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Bénéfice
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Retour Fournisseur
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {Object.entries(monthlyBenefits)
                        .sort((a, b) => {
                          // Parse month names in French to properly sort them
                          const monthNamesMap: Record<string, number> = {
                            janvier: 0,
                            février: 1,
                            mars: 2,
                            avril: 3,
                            mai: 4,
                            juin: 5,
                            juillet: 6,
                            août: 7,
                            septembre: 8,
                            octobre: 9,
                            novembre: 10,
                            décembre: 11,
                          };

                          // Extract month and year from the formatted strings
                          const monthA = a[0].split(" ")[0].toLowerCase();
                          const yearA = a[0].split(" ")[1];
                          const monthB = b[0].split(" ")[0].toLowerCase();
                          const yearB = b[0].split(" ")[1];

                          // Compare years first
                          const yearDiff = parseInt(yearB) - parseInt(yearA);
                          if (yearDiff !== 0) return yearDiff;

                          // If years are equal, compare months
                          return (
                            (monthNamesMap[monthB] || 0) -
                            (monthNamesMap[monthA] || 0)
                          );
                        })
                        .map(([month, data]) => {
                          const typedData = data as {
                            quantity: number;
                            value: number;
                            netBenefit: number;
                          };

                          // Calculation for supplier payment
                          const supplierPayment =
                            typedData.value - typedData.netBenefit;

                          return (
                            <tr
                              key={month}
                              className="border-b last:border-0 hover:bg-gray-50"
                            >
                              <td className="px-4 py-4 text-sm">
                                <span className="font-medium">{month}</span>
                              </td>
                              <td className="px-4 py-4 text-right text-sm">
                                <span>{typedData.quantity} pièces</span>
                                <br />
                                <span className="text-xs text-gray-500">
                                  ({Math.floor(typedData.quantity / 9)} cartons)
                                </span>
                              </td>
                              <td className="px-4 py-4 text-right text-sm">
                                <span className="font-medium text-green-600">
                                  {typedData.netBenefit.toLocaleString("fr-DZ")}{" "}
                                  DZD
                                </span>
                              </td>
                              <td className="px-4 py-4 text-right text-sm">
                                <span className="font-medium text-red-600">
                                  {supplierPayment.toLocaleString("fr-DZ")} DZD
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-4 mt-4">
              <Button
                size="lg"
                className="h-14 text-base font-medium bg-blue-600 hover:bg-blue-700 text-white shadow-md rounded-xl"
                onClick={() => setActiveTab("add-sale")}
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                Nouvelle Vente
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-14 text-base font-medium border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100 shadow-sm rounded-xl"
                onClick={() => setActiveTab("stock")}
              >
                <Package className="mr-2 h-5 w-5" />
                Voir Stock
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-14 text-base font-medium border-green-200 text-green-700 bg-green-50 hover:bg-green-100 shadow-sm rounded-xl"
                onClick={() => setActiveTab("orders")}
              >
                <Calendar className="mr-2 h-5 w-5" />
                Planifier
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-14 text-base font-medium border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 shadow-sm rounded-xl"
                onClick={() => router.push("/find-supermarkets")}
              >
                <MapPin className="mr-2 h-5 w-5" />
                Trouver
              </Button>
            </div>
          </div>
        );
      case "add-sale":
        return (
          <AddSalePage
            onBack={() => setActiveTab("dashboard")}
            preFillData={preFillSaleData}
          />
        );
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
        return (
          <OrdersPage
            onBack={() => setActiveTab("dashboard")}
            onCompleteOrder={(order) => {
              setPreFillSaleData({
                supermarketId: order.supermarketId,
                quantity: order.quantity,
                orderId: order.id,
              });
              setActiveTab("add-sale");
            }}
          />
        );
      case "pending-payments":
        router.push("/pending-payments");
        return null;
      default:
        return null;
    }
  };

  return (
    <main className="container max-w-md mx-auto p-4 bg-gradient-to-b from-gray-50 to-white min-h-screen">
      {/* Top Navigation */}
      <div className="fixed top-0 left-0 right-0 bg-white backdrop-blur-lg bg-opacity-80 border-b flex justify-between items-center h-16 px-4 shadow-lg z-50">
        <Button
          variant={activeTab === "dashboard" ? "default" : "ghost"}
          className="flex items-center h-14 rounded-xl relative transition-all duration-200"
          onClick={() => setActiveTab("dashboard")}
        >
          <Home
            className={`h-5 w-5 transition-colors duration-200 ${
              activeTab === "dashboard" ? "text-white" : "text-gray-500"
            }`}
          />
          <span
            className={`ml-2 transition-colors duration-200 ${
              activeTab === "dashboard"
                ? "text-white font-medium"
                : "text-gray-500"
            }`}
          >
            Tableau de Bord
          </span>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full"
          onClick={() => setShowMenu(!showMenu)}
        >
          <Menu className="h-5 w-5 text-gray-500" />
        </Button>
      </div>

      {/* Hamburger Menu */}
      {showMenu && (
        <div className="fixed top-16 left-0 right-0 bg-white border-b shadow-lg z-40">
          <div className="p-4 space-y-2">
            <Button
              variant={activeTab === "add-sale" ? "default" : "ghost"}
              className="w-full justify-start h-12 rounded-xl"
              onClick={() => {
                setActiveTab("add-sale");
                setShowMenu(false);
              }}
            >
              <ShoppingCart
                className={`h-5 w-5 mr-2 ${
                  activeTab === "add-sale" ? "text-white" : "text-gray-500"
                }`}
              />
              <span
                className={
                  activeTab === "add-sale" ? "text-white" : "text-gray-500"
                }
              >
                Ventes
              </span>
            </Button>

            <Button
              variant={activeTab === "supermarkets" ? "default" : "ghost"}
              className="w-full justify-start h-12 rounded-xl"
              onClick={() => {
                setActiveTab("supermarkets");
                setShowMenu(false);
              }}
            >
              <Store
                className={`h-5 w-5 mr-2 ${
                  activeTab === "supermarkets" ? "text-white" : "text-gray-500"
                }`}
              />
              <span
                className={
                  activeTab === "supermarkets" ? "text-white" : "text-gray-500"
                }
              >
                Supermarchés
              </span>
            </Button>

            <Button
              variant={activeTab === "stock" ? "default" : "ghost"}
              className="w-full justify-start h-12 rounded-xl"
              onClick={() => {
                setActiveTab("stock");
                setShowMenu(false);
              }}
            >
              <Package
                className={`h-5 w-5 mr-2 ${
                  activeTab === "stock" ? "text-white" : "text-gray-500"
                }`}
              />
              <span
                className={
                  activeTab === "stock" ? "text-white" : "text-gray-500"
                }
              >
                Stock
              </span>
            </Button>

            <Button
              variant={activeTab === "orders" ? "default" : "ghost"}
              className="w-full justify-start h-12 rounded-xl"
              onClick={() => {
                setActiveTab("orders");
                setShowMenu(false);
              }}
            >
              <Calendar
                className={`h-5 w-5 mr-2 ${
                  activeTab === "orders" ? "text-white" : "text-gray-500"
                }`}
              />
              <span
                className={
                  activeTab === "orders" ? "text-white" : "text-gray-500"
                }
              >
                Commandes
              </span>
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start h-12 rounded-xl"
              onClick={() => {
                setShowMenu(false);
                setTimeout(() => {
                  router.push("/find-supermarkets");
                }, 0);
              }}
            >
              <MapPin className="h-5 w-5 mr-2 text-gray-500" />
              <span className="text-gray-500">Trouve</span>
            </Button>
          </div>
        </div>
      )}

      {/* Add padding to account for fixed top navigation */}
      <div className="pt-20">{renderContent()}</div>
      <ClearDataButton />
    </main>
  );
}

function AddSalePage({ onBack, preFillData }: AddSalePageProps) {
  const [supermarketId, setSupermarketId] = useState(
    preFillData?.supermarketId || ""
  );
  const [cartons, setCartons] = useState(
    preFillData ? Math.ceil(preFillData.quantity / 9) : 1
  );
  const [priceOption, setPriceOption] = useState<"option1" | "option2">(
    "option1"
  );
  const [isPaidImmediately, setIsPaidImmediately] = useState(false);
  const [paymentNote, setPaymentNote] = useState("");
  const [expectedPaymentDate, setExpectedPaymentDate] = useState("");
  const [saleDate, setSaleDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  // Calculate quantity based on cartons (9 pieces per carton)
  const quantity = cartons * 9;

  // Price options configuration
  const priceOptions = {
    option1: {
      pricePerUnit: 180,
      benefitPerUnit: 25,
      costToSupplier: 155,
      label: "Option 1 (180 DZD)",
    },
    option2: {
      pricePerUnit: 180,
      benefitPerUnit: 17,
      costToSupplier: 163,
      label: "Option 2 (180 DZD)",
    },
  };

  const selectedPrice = priceOptions[priceOption];
  const totalValue = quantity * selectedPrice.pricePerUnit;
  const totalBenefit = quantity * selectedPrice.benefitPerUnit;
  const totalCostToSupplier = quantity * selectedPrice.costToSupplier;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const sale: Omit<Sale, "id"> = {
      date: new Date(saleDate).toISOString(),
      supermarketId,
      quantity,
      cartons,
      pricePerUnit: selectedPrice.pricePerUnit,
      totalValue,
      isPaid: isPaidImmediately,
      paymentDate: isPaidImmediately
        ? saleDate
          ? new Date(saleDate).toISOString()
          : new Date().toISOString()
        : undefined,
      paymentNote: !isPaidImmediately ? paymentNote : "",
      expectedPaymentDate: !isPaidImmediately ? expectedPaymentDate : "",
      payments: isPaidImmediately
        ? [
            {
              id: Date.now().toString(),
              date: saleDate
                ? new Date(saleDate).toISOString()
                : new Date().toISOString(),
              amount: totalValue,
              note: "Paiement complet",
            },
          ]
        : [],
      remainingAmount: isPaidImmediately ? 0 : totalValue,
    };

    addSale(sale);

    // Update stock by removing the sold cartons
    updateStock(
      -cartons,
      "removed",
      `Vente de ${cartons} cartons (${quantity} pièces) - ${new Date(
        saleDate
      ).toLocaleDateString()}`
    );

    if (preFillData?.orderId) {
      deleteOrder(preFillData.orderId);
    }

    // Reload the page to refresh all data
    window.location.reload();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pb-20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="mr-1"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-gray-800">
            {preFillData ? "Confirmer la Livraison" : "Nouvelle Vente"}
          </h1>
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Date de vente
          </label>
          <input
            type="date"
            className="w-full rounded-xl border border-gray-200 p-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all shadow-sm"
            value={saleDate}
            onChange={(e) => setSaleDate(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Supermarché
          </label>
          <select
            className="w-full rounded-xl border border-gray-200 p-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all shadow-sm"
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
          <label className="text-sm font-medium text-gray-700">
            Nombre de Cartons (9 pièces/carton)
          </label>
          <div className="flex items-center">
            <Button
              type="button"
              variant="outline"
              className="rounded-l-xl h-12 w-12 flex items-center justify-center border-gray-200"
              onClick={() => setCartons((c) => Math.max(1, c - 1))}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <input
              type="number"
              className="flex-1 h-12 text-center border-x-0 border-y border-gray-200"
              value={cartons}
              onChange={(e) => {
                const value =
                  e.target.value === "" ? 0 : parseInt(e.target.value);
                setCartons(value);
              }}
              onBlur={() => {
                if (cartons < 1) setCartons(1);
              }}
              min="0"
              required
            />
            <Button
              type="button"
              variant="outline"
              className="rounded-r-xl h-12 w-12 flex items-center justify-center border-gray-200"
              onClick={() => setCartons((c) => c + 1)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Quantité Totale (Pièces)
          </label>
          <div className="flex items-center border border-gray-200 rounded-xl p-3 bg-gray-50">
            <span className="text-lg font-medium">{quantity} pièces</span>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Option de Prix
          </label>
          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant={priceOption === "option1" ? "default" : "outline"}
              className={`w-full rounded-xl py-3 px-4 h-auto ${
                priceOption === "option1"
                  ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md border-transparent"
                  : "bg-white hover:bg-gray-50 border-gray-200"
              }`}
              onClick={() => setPriceOption("option1")}
            >
              <div className="text-left">
                <div className="font-medium text-base">180 DZD</div>
                <div
                  className={`text-xs ${
                    priceOption === "option1"
                      ? "text-blue-100"
                      : "text-gray-500"
                  }`}
                >
                  Retour: 155 DZD/unité
                </div>
              </div>
            </Button>
            <Button
              type="button"
              variant={priceOption === "option2" ? "default" : "outline"}
              className={`w-full rounded-xl py-3 px-4 h-auto ${
                priceOption === "option2"
                  ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md border-transparent"
                  : "bg-white hover:bg-gray-50 border-gray-200"
              }`}
              onClick={() => setPriceOption("option2")}
            >
              <div className="text-left">
                <div className="font-medium text-base">180 DZD</div>
                <div
                  className={`text-xs ${
                    priceOption === "option2"
                      ? "text-blue-100"
                      : "text-gray-500"
                  }`}
                >
                  Retour: 163 DZD/unité
                </div>
              </div>
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Valeur totale
          </label>
          <div className="flex items-center border border-gray-200 rounded-xl p-3 bg-gray-50">
            <span className="text-lg font-medium text-blue-600">
              {totalValue.toLocaleString("fr-DZ")} DZD
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2 p-3 border border-gray-200 rounded-xl">
          <input
            type="checkbox"
            id="isPaid"
            checked={isPaidImmediately}
            onChange={(e) => setIsPaidImmediately(e.target.checked)}
            className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label
            htmlFor="isPaid"
            className="text-base font-medium text-gray-700"
          >
            Payé immédiatement
          </label>
        </div>

        {!isPaidImmediately && (
          <div className="space-y-4 border rounded-xl p-4 bg-gray-50">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Date de paiement prévue
              </label>
              <input
                type="date"
                className="w-full rounded-xl border border-gray-200 p-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all shadow-sm"
                value={expectedPaymentDate}
                onChange={(e) => setExpectedPaymentDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Note de paiement
              </label>
              <textarea
                className="w-full rounded-xl border border-gray-200 p-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all shadow-sm min-h-[100px]"
                value={paymentNote}
                onChange={(e) => setPaymentNote(e.target.value)}
                placeholder="Ex: Paiement prévu après 15 jours..."
              />
            </div>
          </div>
        )}

        <div className="rounded-xl bg-gray-50 p-4 text-sm border border-gray-200">
          <p className="font-medium mb-2 text-gray-800">Information:</p>
          <div className="space-y-1">
            <p>1 carton = 9 pièces de savon</p>
            <p>
              Quantité totale = {cartons} cartons × 9 = {quantity} pièces
            </p>
            <p>Prix unitaire = {selectedPrice.pricePerUnit} DZD</p>
            <p>
              Montant total = {quantity} × {selectedPrice.pricePerUnit} ={" "}
              {totalValue.toLocaleString("fr-DZ")} DZD
            </p>
            <p className="text-green-600">
              Bénéfice total = {totalBenefit.toLocaleString("fr-DZ")} DZD
            </p>
            <p className="text-red-600">
              À retourner au fournisseur ={" "}
              {totalCostToSupplier.toLocaleString("fr-DZ")} DZD
            </p>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full h-14 mt-6 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-md"
        >
          {preFillData ? "Confirmer la Livraison" : "Enregistrer la Vente"}
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
  const [newSupermarket, setNewSupermarket] = useState({
    name: "",
    address: "",
    phoneNumbers: [{ name: "", number: "" }],
    email: "",
    location: {
      lat: 36.7538,
      lng: 3.0588,
      formattedAddress: "",
    },
  });
  const [supermarkets, setSupermarkets] = useState<Supermarket[]>([]);
  const [loading, setLoading] = useState(false);

  // Load supermarkets on component mount
  useEffect(() => {
    const loadedSupermarkets = getSupermarkets();
    setSupermarkets(loadedSupermarkets);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Make sure at least one phone number is provided
      if (!newSupermarket.phoneNumbers[0].number) {
        alert("Veuillez entrer au moins un numéro de téléphone");
        setLoading(false);
        return;
      }

      // Geocode the address
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          newSupermarket.address
        )}`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const location = {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          formattedAddress: data[0].display_name,
        };

        // Create a properly formatted supermarket object
        const supermarketWithLocation = {
          name: newSupermarket.name,
          address: newSupermarket.address,
          phoneNumbers: newSupermarket.phoneNumbers.filter(
            (p) => p.number.trim() !== ""
          ),
          location,
          email: newSupermarket.email || undefined,
        };

        console.log("Adding supermarket:", supermarketWithLocation);

        // Add the supermarket
        const added = addSupermarket(supermarketWithLocation);
        console.log("Added supermarket result:", added);

        // Reset form and state
        setShowAddForm(false);
        setNewSupermarket({
          name: "",
          address: "",
          phoneNumbers: [{ name: "", number: "" }],
          email: "",
          location: {
            lat: 36.7538,
            lng: 3.0588,
            formattedAddress: "",
          },
        });

        // Refresh the supermarkets list
        const loadedSupermarkets = getSupermarkets();
        setSupermarkets(loadedSupermarkets);
      }
    } catch (error) {
      console.error("Error adding supermarket:", error);
      alert("Une erreur s'est produite lors de l'ajout du supermarché");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 pb-20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={onBack} className="mr-1">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-gray-800">Supermarchés</h1>
        </div>
        <Button
          size="sm"
          className="rounded-full px-3 shadow-sm"
          onClick={() => setShowAddForm(true)}
        >
          <Plus className="h-4 w-4 mr-1" />
          Nouveau
        </Button>
      </div>

      {/* Add Supermarket Form */}
      {showAddForm && (
        <Card className="border-none shadow-md rounded-xl overflow-hidden mb-5">
          <form onSubmit={handleSubmit} className="space-y-4 p-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Nom du Supermarché
              </label>
              <input
                type="text"
                className="w-full h-12 rounded-xl border border-gray-200 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all shadow-sm"
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

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Adresse
              </label>
              <input
                type="text"
                className="w-full h-12 rounded-xl border border-gray-200 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all shadow-sm"
                value={newSupermarket.address}
                onChange={(e) =>
                  setNewSupermarket((prev) => ({
                    ...prev,
                    address: e.target.value,
                  }))
                }
                required
                placeholder="Adresse complète du supermarché"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Téléphone
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="Nom du contact"
                  className="flex-1 h-12 rounded-xl border border-gray-200 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all shadow-sm"
                  value={newSupermarket.phoneNumbers[0].name}
                  onChange={(e) =>
                    setNewSupermarket((prev) => ({
                      ...prev,
                      phoneNumbers: prev.phoneNumbers.map((phone, index) =>
                        index === 0 ? { ...phone, name: e.target.value } : phone
                      ),
                    }))
                  }
                />
                <input
                  type="tel"
                  placeholder="Numéro de téléphone"
                  className="flex-1 h-12 rounded-xl border border-gray-200 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all shadow-sm"
                  value={newSupermarket.phoneNumbers[0].number}
                  onChange={(e) =>
                    setNewSupermarket((prev) => ({
                      ...prev,
                      phoneNumbers: prev.phoneNumbers.map((phone, index) =>
                        index === 0
                          ? { ...phone, number: e.target.value }
                          : phone
                      ),
                    }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Email (Optionnel)
              </label>
              <input
                type="email"
                className="w-full h-12 rounded-xl border border-gray-200 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all shadow-sm"
                value={newSupermarket.email}
                onChange={(e) =>
                  setNewSupermarket((prev) => ({
                    ...prev,
                    email: e.target.value,
                  }))
                }
                placeholder="Entrez l'email (optionnel)"
              />
            </div>

            <div className="flex space-x-2 pt-2">
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? "Ajout en cours..." : "Confirmer"}
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
              className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-blue-200 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
              onClick={() => onViewSupermarket(supermarket.id)}
            >
              <div>
                <h3 className="font-medium">{supermarket.name}</h3>
                <p className="text-sm text-muted-foreground">
                  Total des ventes:{" "}
                  {supermarket.totalValue.toLocaleString("fr-DZ")} DZD
                </p>
                <p className="text-xs text-muted-foreground">
                  {supermarket.location.formattedAddress}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium">
                  {Math.ceil(supermarket.totalSales / 9)} cartons
                </p>
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
  const router = useRouter();
  const [supermarket, setSupermarket] = useState<Supermarket | null>(null);
  const [salesHistory, setSalesHistory] = useState<Sale[]>([]);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentNote, setPaymentNote] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editedSupermarket, setEditedSupermarket] = useState<
    Partial<Supermarket>
  >({});
  const [loading, setLoading] = useState(false);
  const [newPhoneNumber, setNewPhoneNumber] = useState({
    name: "",
    number: "",
  });

  useEffect(() => {
    // Load supermarket data
    const sm = getSupermarkets().find((s) => s.id === supermarketId);
    setSupermarket(sm || null);

    // Load all sales for this supermarket
    const allSales = getSales();
    const filteredSales = allSales.filter(
      (sale) => sale.supermarketId === supermarketId
    );
    setSalesHistory(filteredSales);
  }, [supermarketId]);

  const handleEdit = () => {
    setIsEditing(true);
    setEditedSupermarket({
      name: supermarket?.name || "",
      address: supermarket?.address || "",
      phoneNumbers: supermarket?.phoneNumbers || [],
      email: supermarket?.email || "",
      location: supermarket?.location || {
        lat: 36.7538,
        lng: 3.0588,
        formattedAddress: "",
      },
    });
  };

  const handleAddPhoneNumber = () => {
    if (newPhoneNumber.name && newPhoneNumber.number) {
      setEditedSupermarket((prev) => ({
        ...prev,
        phoneNumbers: [...(prev.phoneNumbers || []), newPhoneNumber],
      }));
      setNewPhoneNumber({ name: "", number: "" });
    }
  };

  const handleRemovePhoneNumber = (index: number) => {
    setEditedSupermarket((prev) => ({
      ...prev,
      phoneNumbers: prev.phoneNumbers?.filter((_, i) => i !== index),
    }));
  };

  const handleUpdatePhoneNumber = (
    index: number,
    field: "name" | "number",
    value: string
  ) => {
    setEditedSupermarket((prev) => ({
      ...prev,
      phoneNumbers: prev.phoneNumbers?.map((phone, i) =>
        i === index ? { ...phone, [field]: value } : phone
      ),
    }));
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
          editedSupermarket.location = {
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon),
            formattedAddress: data[0].display_name,
          };
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
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedSupermarket({});
  };

  const handlePaymentUpdate = (saleId: string, isPaid: boolean) => {
    updateSalePayment(saleId, isPaid);
    // Reload the page to refresh all data
    window.location.reload();
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

  // Calculate monthly benefits
  const monthlyBenefits = salesHistory.reduce((acc, sale) => {
    const date = new Date(sale.date);
    const monthYear = date.toLocaleDateString("fr-FR", {
      month: "long",
      year: "numeric",
    });

    if (!acc[monthYear]) {
      acc[monthYear] = {
        quantity: 0,
        value: 0,
        netBenefit: 0,
      };
    }

    const benefitPerUnit =
      sale.pricePerUnit === 180 ? 25 : sale.pricePerUnit === 166 ? 17 : 0;

    acc[monthYear].quantity += sale.quantity;
    acc[monthYear].value += sale.totalValue;
    acc[monthYear].netBenefit += sale.quantity * benefitPerUnit;

    return acc;
  }, {} as Record<string, { quantity: number; value: number; netBenefit: number }>);

  return (
    <div className="space-y-6">
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
                      {editedSupermarket.phoneNumbers?.map((phone, index) => (
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
                      ))}
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
                      {supermarket.phoneNumbers?.map((phone, index) => (
                        <div
                          key={index}
                          className="flex flex-col sm:flex-row items-start sm:items-center gap-2"
                        >
                          <p className="font-medium min-w-[100px]">
                            {phone.name}:
                          </p>
                          <p className="text-sm">{phone.number}</p>
                        </div>
                      ))}
                    </div>
                    <p className="text-sm mt-2">{supermarket.email}</p>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Updated Statistics Card */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Ventes</p>
              <p className="text-2xl font-bold">
                {totalStats.totalQuantity} pièces
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                ({totalStats.totalCartons} cartons)
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Valeur Totale</p>
              <p className="text-2xl font-bold">
                {totalStats.totalValue.toLocaleString("fr-DZ")} DZD
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Net Benefit Card */}
      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-md">Bénéfice Net</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-xl font-bold text-green-600">
                {totalStats.totalNetBenefit.toLocaleString("fr-DZ")} DZD
              </p>
            </div>
            <div className="text-sm text-muted-foreground">(25 DZD/unité)</div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Benefits Card */}
      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-md">Bénéfices Mensuels</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-4">
            {Object.entries(monthlyBenefits)
              .sort((a, b) => {
                // Parse month names in French to properly sort them
                const monthNamesMap: Record<string, number> = {
                  janvier: 0,
                  février: 1,
                  mars: 2,
                  avril: 3,
                  mai: 4,
                  juin: 5,
                  juillet: 6,
                  août: 7,
                  septembre: 8,
                  octobre: 9,
                  novembre: 10,
                  décembre: 11,
                };

                // Extract month and year from the formatted strings
                const monthA = a[0].split(" ")[0].toLowerCase();
                const yearA = a[0].split(" ")[1];
                const monthB = b[0].split(" ")[0].toLowerCase();
                const yearB = b[0].split(" ")[1];

                // Compare years first
                const yearDiff = parseInt(yearB) - parseInt(yearA);
                if (yearDiff !== 0) return yearDiff;

                // If years are equal, compare months
                return (
                  (monthNamesMap[monthB] || 0) - (monthNamesMap[monthA] || 0)
                );
              })
              .map(([month, data]) => {
                const typedData = data as {
                  quantity: number;
                  value: number;
                  netBenefit: number;
                };
                return (
                  <div
                    key={month}
                    className="border-b last:border-0 pb-4 last:pb-0"
                  >
                    <div className="flex justify-between items-center">
                      <p className="font-medium">{month}</p>
                      <p className="text-green-600">
                        {typedData.netBenefit.toLocaleString("fr-DZ")} DZD
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {typedData.quantity} pièces (
                      {Math.floor(typedData.quantity / 9)} cartons)
                    </div>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>

      {/* Payment Status Card */}
      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-md">État des Paiements</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <p className="text-sm text-green-600">Payé</p>
              <p className="font-medium">
                {totalStats.totalPaid.toLocaleString("fr-DZ")} DZD
              </p>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-sm text-red-600">Non Payé</p>
              <p className="font-medium">
                {totalStats.totalUnpaid.toLocaleString("fr-DZ")} DZD
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Updated Sales History */}
      <div className="space-y-3 mt-4 relative">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold text-gray-800">
            Historique des Ventes
          </h2>
          <button
            className="text-blue-600 flex items-center text-sm"
            onClick={() => {
              // Refresh data
              const allSales = getSales();
              const filteredSales = allSales.filter(
                (sale) => sale.supermarketId === supermarketId
              );
              setSalesHistory(filteredSales);
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1 animate-spin-slow"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
            </svg>
            Actualiser
          </button>
        </div>

        {/* Sales history list with animations */}
        {salesHistory
          .sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          )
          .map((sale, index) => (
            <div
              key={sale.id}
              className={`flex items-center justify-between p-4 bg-white border rounded-xl shadow-sm transition-all duration-300 cursor-pointer hover:shadow-md animate-in slide-in-from-bottom ${
                !sale.isPaid ? "border-red-200" : "border-green-200"
              }`}
              style={{ animationDelay: `${index * 50}ms` }}
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
                  Prix unitaire: {sale.pricePerUnit.toLocaleString("fr-DZ")} DZD
                </p>
                {sale.paymentDate && (
                  <p className="text-xs text-green-600">
                    Payé le{" "}
                    {new Date(sale.paymentDate).toLocaleDateString("fr-FR")}
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
                      className="ml-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePaymentUpdate(sale.id, true);
                      }}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
      </div>

      {/* Sale Details Modal */}
      {showSaleModal && selectedSale && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
          onClick={() => {
            setShowSaleModal(false);
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
                Détails de la Vente
              </h2>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full h-8 w-8 hover:bg-gray-100"
                onClick={() => {
                  setShowSaleModal(false);
                  setSelectedSale(null);
                  setPaymentAmount(0);
                  setPaymentNote("");
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-medium text-gray-800">
                    {new Date(selectedSale.date).toLocaleDateString("fr-FR")}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Quantité</p>
                  <p className="font-medium text-gray-800">
                    {selectedSale.quantity} pièces
                  </p>
                  <p className="text-sm text-gray-500">
                    {selectedSale.cartons} cartons
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Prix unitaire</p>
                  <p className="font-medium text-gray-800">
                    {selectedSale.pricePerUnit.toLocaleString("fr-DZ")} DZD
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Montant total</p>
                  <p className="font-medium text-gray-800">
                    {selectedSale.totalValue.toLocaleString("fr-DZ")} DZD
                  </p>
                </div>
              </div>

              <div className="space-y-1 py-2 border-t border-gray-100">
                <p className="text-sm text-gray-500">Statut de paiement</p>
                <div className="flex items-center">
                  <div
                    className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                      selectedSale.isPaid
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {selectedSale.isPaid ? "Payé" : "Non payé"}
                  </div>
                </div>
                {selectedSale.paymentDate && (
                  <p className="text-sm text-green-600 mt-1">
                    Payé le{" "}
                    {new Date(selectedSale.paymentDate).toLocaleDateString(
                      "fr-FR"
                    )}
                  </p>
                )}
                {!selectedSale.isPaid && selectedSale.expectedPaymentDate && (
                  <p className="text-sm text-red-600 mt-1">
                    Paiement prévu le{" "}
                    {new Date(
                      selectedSale.expectedPaymentDate
                    ).toLocaleDateString("fr-FR")}
                  </p>
                )}
              </div>

              {selectedSale.paymentNote && (
                <div className="space-y-1 py-2 border-t border-gray-100">
                  <p className="text-sm text-gray-500">Note de paiement</p>
                  <p className="font-medium text-gray-800 bg-gray-50 p-3 rounded-xl">
                    {selectedSale.paymentNote}
                  </p>
                </div>
              )}

              {selectedSale.payments && selectedSale.payments.length > 0 && (
                <div className="space-y-2 py-2 border-t border-gray-100">
                  <p className="text-sm text-gray-500">
                    Historique des versements
                  </p>
                  <div className="space-y-2">
                    {selectedSale.payments.map(
                      (payment: {
                        id: string;
                        date: string;
                        amount: number;
                        note?: string;
                      }) => (
                        <div
                          key={payment.id}
                          className="bg-gray-50 p-3 rounded-xl"
                        >
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">
                              {new Date(payment.date).toLocaleDateString(
                                "fr-FR"
                              )}
                            </span>
                            <span className="font-medium text-green-600">
                              {payment.amount.toLocaleString("fr-DZ")} DZD
                            </span>
                          </div>
                          {payment.note && (
                            <p className="text-muted-foreground mt-1 border-t border-gray-100 pt-1">
                              {payment.note}
                            </p>
                          )}
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {!selectedSale.isPaid && (
                <div className="space-y-4 border-t border-gray-100 pt-4">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-500">Reste à payer</p>
                    <p className="text-xl font-bold text-red-600">
                      {selectedSale.remainingAmount.toLocaleString("fr-DZ")} DZD
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Montant du versement
                    </label>
                    <input
                      type="number"
                      className="w-full rounded-xl border border-gray-200 p-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all shadow-sm"
                      value={paymentAmount}
                      onChange={(e) =>
                        setPaymentAmount(
                          Math.max(0, Number(e.target.value) || 0)
                        )
                      }
                      max={selectedSale.remainingAmount}
                      min="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Note
                    </label>
                    <textarea
                      className="w-full rounded-xl border border-gray-200 p-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all shadow-sm min-h-[80px]"
                      value={paymentNote}
                      onChange={(e) => setPaymentNote(e.target.value)}
                      placeholder="Détails du versement..."
                    />
                  </div>

                  <Button
                    className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-md"
                    onClick={() => {
                      if (
                        paymentAmount > 0 &&
                        paymentAmount <= selectedSale.remainingAmount
                      ) {
                        try {
                          // Add the payment
                          addPayment(selectedSale.id, {
                            date: new Date().toISOString(),
                            amount: paymentAmount,
                            note: paymentNote,
                          });

                          // Reload the page to refresh all data
                          window.location.reload();
                        } catch (error) {
                          console.error("Error adding payment:", error);
                          alert(
                            "Une erreur est survenue lors de l'ajout du versement. Veuillez réessayer."
                          );
                        }
                      }
                    }}
                    disabled={
                      paymentAmount <= 0 ||
                      paymentAmount > selectedSale.remainingAmount
                    }
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter un versement
                  </Button>
                </div>
              )}
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

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-4 mt-4">
        <Button
          size="lg"
          className="h-14 text-base font-medium bg-blue-600 hover:bg-blue-700 text-white shadow-md rounded-xl"
          onClick={() => setActiveTab("add-sale")}
        >
          <ShoppingCart className="mr-2 h-5 w-5" />
          Nouvelle Vente
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="h-14 text-base font-medium border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100 shadow-sm rounded-xl"
          onClick={() => setActiveTab("stock")}
        >
          <Package className="mr-2 h-5 w-5" />
          Voir Stock
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="h-14 text-base font-medium border-green-200 text-green-700 bg-green-50 hover:bg-green-100 shadow-sm rounded-xl"
          onClick={() => setActiveTab("orders")}
        >
          <Calendar className="mr-2 h-5 w-5" />
          Planifier
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="h-14 text-base font-medium border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 shadow-sm rounded-xl"
          onClick={() => router.push("/find-supermarkets")}
        >
          <MapPin className="mr-2 h-5 w-5" />
          Trouver
        </Button>
      </div>
    </div>
  );
}

function StockPage({ onBack }: StockPageProps) {
  const [showAdjustForm, setShowAdjustForm] = useState<boolean>(false);
  const [newStock, setNewStock] = useState<{ cartons: number }>({ cartons: 0 });
  const [stockHistory, setStockHistory] = useState<StockHistoryItem[]>([]);
  const [currentStock, setCurrentStock] = useState<number>(0);

  // Load initial data
  useEffect(() => {
    setStockHistory(getStockHistory());
    setCurrentStock(getCurrentStock());
  }, []);

  const handleAdjustStock = (e: React.FormEvent): void => {
    e.preventDefault();
    const difference = newStock.cartons - currentStock;
    updateStock(difference, "adjusted", "Ajustement manuel");
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
          <h1 className="text-xl font-bold text-gray-800">Gestion du Stock</h1>
        </div>
      </div>

      {/* Current Stock Card */}
      <Card className="border-none shadow-md rounded-xl overflow-hidden mb-6">
        <CardContent className="p-6 flex flex-col items-center justify-center">
          <h2 className="text-lg font-medium text-gray-500 mb-2">
            Stock Actuel
          </h2>
          <div className="text-5xl font-bold mb-4 text-purple-700">
            {currentStock} cartons
          </div>
          <div className="h-3 w-full rounded-full bg-purple-100 overflow-hidden">
            <div
              className="h-3 rounded-full bg-purple-600 transition-all duration-300"
              style={{ width: `${(currentStock / 300) * 100}%` }}
            />
          </div>
          <div className="w-full flex justify-between items-center mt-2 text-sm text-gray-500">
            <p>0 cartons</p>
            <p>{((currentStock / 300) * 100).toFixed(1)}%</p>
            <p>300 cartons</p>
          </div>
          <p className="text-sm text-gray-600 mt-4">
            {currentStock * 9} pièces au total
          </p>
        </CardContent>
      </Card>

      {/* Single Adjust Stock Button */}
      <Button
        size="lg"
        className="w-full h-14 rounded-xl font-medium bg-purple-600 hover:bg-purple-700 text-white shadow-md"
        onClick={() => setShowAdjustForm(true)}
      >
        <Settings className="mr-2 h-5 w-5" />
        Ajuster Stock
      </Button>

      {/* Adjust Stock Form */}
      {showAdjustForm && (
        <Card className="border-none shadow-md rounded-xl overflow-hidden mt-5">
          <form onSubmit={handleAdjustStock} className="space-y-4 p-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Nouveau Stock Total (Cartons)
              </label>
              <div className="flex items-center">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-l-xl h-12 w-12 flex items-center justify-center border-gray-200"
                  onClick={() =>
                    setNewStock({ cartons: Math.max(0, newStock.cartons - 1) })
                  }
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <input
                  type="number"
                  className="flex-1 h-12 text-center border-x-0 border-y border-gray-200"
                  value={newStock.cartons}
                  onChange={(e) =>
                    setNewStock({ cartons: parseInt(e.target.value) || 0 })
                  }
                  min="0"
                  max="300"
                  required
                />
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-r-xl h-12 w-12 flex items-center justify-center border-gray-200"
                  onClick={() =>
                    setNewStock({
                      cartons: Math.min(300, newStock.cartons + 1),
                    })
                  }
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex justify-between items-center text-sm text-gray-500 mt-2">
                <p>{newStock.cartons * 9} pièces au total</p>
                <p
                  className={
                    newStock.cartons > currentStock
                      ? "text-green-600"
                      : newStock.cartons < currentStock
                      ? "text-red-600"
                      : ""
                  }
                >
                  {newStock.cartons > currentStock
                    ? `+${newStock.cartons - currentStock}`
                    : newStock.cartons < currentStock
                    ? `${newStock.cartons - currentStock}`
                    : "Aucun changement"}
                </p>
              </div>
            </div>
            <div className="flex space-x-3">
              <Button
                type="submit"
                className="flex-1 h-12 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-medium shadow-md"
              >
                Confirmer
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-12 rounded-xl border-gray-200 text-gray-700"
                onClick={() => setShowAdjustForm(false)}
              >
                Annuler
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Stock History */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          Historique des Mouvements
        </h2>
        <div className="space-y-3">
          {stockHistory
            .slice()
            .reverse()
            .map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl shadow-sm"
              >
                <div>
                  <h3 className="font-medium text-gray-800">
                    {new Date(item.date).toLocaleDateString("fr-FR")}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {"type" in item && item.type === "adjusted"
                      ? "Ajustement"
                      : "type" in item && item.type === "removed"
                      ? "Vente"
                      : "Livraison"}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={`text-base font-medium ${
                      item.quantity > 0
                        ? "text-green-600"
                        : item.quantity < 0
                        ? "text-red-600"
                        : ""
                    }`}
                  >
                    {item.quantity > 0 ? "+" : ""}
                    {item.quantity} cartons
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Stock: {item.quantity + getCurrentStock()} cartons
                  </p>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

interface NewOrder {
  date: string;
  supermarketId: string;
  quantity: number;
  cartons: number;
  priceOption: "option1" | "option2";
}

function OrdersPage({ onBack, onCompleteOrder }: OrdersPageProps) {
  const [showForm, setShowForm] = useState<boolean>(false);
  const [newOrder, setNewOrder] = useState<NewOrder>({
    date: "",
    supermarketId: "",
    quantity: 0,
    cartons: 0,
    priceOption: "option1",
  });
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    setOrders(getOrders());
  }, []);

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    const selectedSupermarket = getSupermarkets().find(
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
                {getSupermarkets().map((sm) => (
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
                      cartons: Math.max(1, prev.cartons - 1),
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
                      cartons: Math.max(1, parseInt(e.target.value) || 1),
                    }))
                  }
                  min="1"
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

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Option de Prix
              </label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant={
                    newOrder.priceOption === "option1" ? "default" : "outline"
                  }
                  className={`w-full rounded-xl py-3 px-4 h-auto ${
                    newOrder.priceOption === "option1"
                      ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md border-transparent"
                      : "bg-white hover:bg-gray-50 border-gray-200"
                  }`}
                  onClick={() =>
                    setNewOrder((prev) => ({ ...prev, priceOption: "option1" }))
                  }
                >
                  <div className="text-left">
                    <div className="font-medium text-base">180 DZD</div>
                    <div
                      className={`text-xs ${
                        newOrder.priceOption === "option1"
                          ? "text-blue-100"
                          : "text-gray-500"
                      }`}
                    >
                      Bénéfice: 25 DZD/unité
                    </div>
                  </div>
                </Button>
                <Button
                  type="button"
                  variant={
                    newOrder.priceOption === "option2" ? "default" : "outline"
                  }
                  className={`w-full rounded-xl py-3 px-4 h-auto ${
                    newOrder.priceOption === "option2"
                      ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md border-transparent"
                      : "bg-white hover:bg-gray-50 border-gray-200"
                  }`}
                  onClick={() =>
                    setNewOrder((prev) => ({ ...prev, priceOption: "option2" }))
                  }
                >
                  <div className="text-left">
                    <div className="font-medium text-base">180 DZD</div>
                    <div
                      className={`text-xs ${
                        newOrder.priceOption === "option2"
                          ? "text-blue-100"
                          : "text-gray-500"
                      }`}
                    >
                      Retour: 163 DZD/unité
                    </div>
                  </div>
                </Button>
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
                        title="Transformer en vente"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 text-red-600 rounded-full border-red-200 hover:bg-red-50"
                        onClick={() => handleDelete(order.id)}
                        title="Supprimer la commande"
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

function ClearDataButton() {
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);

  const handleClearData = (): void => {
    localStorage.clear();
    window.location.reload(); // Reload the page to reset all states
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setShowConfirmation(true)}
        className="fixed bottom-20 right-4 bg-white hover:bg-gray-50 border-gray-200 text-gray-600 shadow-sm rounded-full h-10 w-10 flex items-center justify-center"
      >
        <Settings className="h-5 w-5" />
      </Button>

      {showConfirmation && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
          onClick={() => setShowConfirmation(false)}
        >
          <div
            className="bg-white p-5 rounded-2xl w-full max-w-md mx-auto shadow-xl"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            <div className="text-center mb-4">
              <div className="bg-red-100 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="h-8 w-8 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                Réinitialiser les données
              </h2>
              <p className="text-gray-600">
                Êtes-vous sûr de vouloir supprimer toutes les données ? Cette
                action est irréversible.
              </p>
            </div>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                className="flex-1 rounded-xl h-12 border-gray-200 hover:bg-gray-50 text-gray-700"
                onClick={() => setShowConfirmation(false)}
              >
                Annuler
              </Button>
              <Button
                variant="destructive"
                onClick={handleClearData}
                className="flex-1 rounded-xl h-12 bg-red-600 hover:bg-red-700 text-white font-medium shadow-md"
              >
                Confirmer
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
