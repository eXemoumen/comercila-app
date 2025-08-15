"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { InvoiceModal } from "@/components/InvoiceModal";
import { MigrationModal } from "@/components/MigrationModal";
import { StockPage } from "@/components/StockPage";
// Import hybrid storage functions
import {
  getSupermarkets,
  getSales,
  getOrders,
  updateSalePayment,
  addSale,
  addOrder,
  addSupermarket,
  updateSupermarket,
  deleteOrder,
  addPayment,
  getFragranceStock,
  deleteSale,
} from "@/utils/hybridStorage";
import { getFragrances } from "@/utils/storage";
import { isMigrationNeeded } from "@/utils/migration";
import type { Sale, Order, Supermarket, FragranceStock, PhoneNumber } from "@/utils/storage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
  Phone,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { updateStock } from "@/utils/database";
import { getCurrentStock } from "@/utils/database";

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
    orderId?: string;
  } | null>(null);
  const [showMigrationModal, setShowMigrationModal] = useState(false);
  const [migrationChecked, setMigrationChecked] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    monthlySales: {
      quantity: 0,
      revenue: 0,
      profit: 0,
      stock: 0,
      supplierPayment: 0,
      paidProfit: 0,
    },
    salesData: [] as { name: string; value: number }[],
    fragranceStock: [] as { name: string; value: number; color: string }[],
  });

  // Add this calculation in the Dashboard component, after the dashboardData state
  const [monthlyBenefits, setMonthlyBenefits] = useState<
    Record<string, MonthlyData>
  >({});



  // Create a function to update dashboard data that can be reused
  const updateDashboardData = useCallback(async () => {
    // Get current month's sales
    const allSales = await getSales();
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

    // Calculate profit from paid sales only
    const paidProfit = monthlySales.reduce((acc, sale) => {
      if (sale.isPaid) {
        // Only include paid sales
        const benefitPerUnit =
          sale.pricePerUnit === 180 ? 25 : sale.pricePerUnit === 166 ? 17 : 0;
        return acc + sale.quantity * benefitPerUnit;
      }
      return acc;
    }, 0);

    // Calculate supplier payment amount
    const totalSupplierPayment = monthlySales.reduce((acc, sale) => {
      // Determine supplier cost per unit based on sale price
      const supplierCostPerUnit =
        sale.pricePerUnit === 180 ? 155 : sale.pricePerUnit === 166 ? 149 : 0;
      return acc + sale.quantity * supplierCostPerUnit;
    }, 0);

    const currentStock = await getCurrentStock();
    console.log("Dashboard - Raw current stock (cartons):", currentStock);
    console.log("Dashboard - Displayed stock (units):", currentStock * 9);

    // Get fragrance stock data for the pie chart
    const fragranceStock = await getFragranceStock();
    console.log("Dashboard - Fragrance stock:", fragranceStock);
    console.log("Dashboard - Individual fragrance quantities:", fragranceStock.map(f => `${f.name}: ${f.quantity}`));
    const fragranceData = fragranceStock.map((fragrance) => ({
      name: fragrance.name,
      value: fragrance.quantity,
      color: fragrance.color,
    }));

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
        supplierPayment: totalSupplierPayment,
        paidProfit: paidProfit,
      },
      salesData,
      fragranceStock: fragranceData,
    });
  }, []);

  // Calculate monthly benefits data
  const calculateMonthlyBenefits = useCallback(async () => {
    const allSales = await getSales();
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
  }, []);

  // Migration handlers
  const loadDashboardData = useCallback(async () => {
    await updateDashboardData();
    await calculateMonthlyBenefits();
  }, [updateDashboardData, calculateMonthlyBenefits]);

  const handleMigrationComplete = () => {
    setShowMigrationModal(false);
    loadDashboardData();
  };

  const handleMigrationClose = () => {
    setShowMigrationModal(false);
    loadDashboardData();
  };

  // Check for migration need and load data
  useEffect(() => {
    if (!migrationChecked) {
      const needsMigration = isMigrationNeeded();
      if (needsMigration) {
        setShowMigrationModal(true);
      } else {
        loadDashboardData();
      }
      setMigrationChecked(true);
    }

    // Set up interval to update data every minute
    const interval = setInterval(() => {
      if (!showMigrationModal) {
        updateDashboardData();
      }
    }, 60000);

    // Add event listener for saleDataChanged event
    const handleSaleDataChanged = async () => {
      await updateDashboardData();
      await calculateMonthlyBenefits();
    };

    window.addEventListener("saleDataChanged", handleSaleDataChanged);

    // Cleanup interval and event listener on unmount
    return () => {
      clearInterval(interval);
      window.removeEventListener("saleDataChanged", handleSaleDataChanged);
    };
  }, [migrationChecked, loadDashboardData, showMigrationModal, updateDashboardData, calculateMonthlyBenefits]);

  // Update monthly benefits
  useEffect(() => {
    calculateMonthlyBenefits();
  }, [calculateMonthlyBenefits]);

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
                    Bénéfice Estimé
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

              <Card className="overflow-hidden border-none shadow-md rounded-xl">
                <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-2">
                  <CardTitle className="text-xs font-medium text-white/90">
                    Bénéfice Réel (Payé)
                  </CardTitle>
                </div>
                <CardContent className="p-3">
                  <div className="text-2xl font-bold text-gray-800">
                    {dashboardData.monthlySales.paidProfit.toLocaleString(
                      "fr-DZ"
                    )}{" "}
                    DZD
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full">
                      Ventes payées uniquement
                    </span>
                    <span className="text-sm font-medium text-amber-600">
                      {dashboardData.monthlySales.profit > 0
                        ? Math.round(
                          (dashboardData.monthlySales.paidProfit /
                            dashboardData.monthlySales.profit) *
                          100
                        )
                        : 0}
                      %
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
                        width: `${(dashboardData.monthlySales.stock / 2700) * 100
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
                        formatter={(value: number | string) => [
                          `${Number(value).toLocaleString("fr-DZ")} DZD`,
                          "Bénéfice",
                        ]}
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
                      data={Object.entries(monthlyBenefits)
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
                          if (yearA !== yearB) {
                            return parseInt(yearA) - parseInt(yearB);
                          }

                          // If years are equal, compare months
                          return (
                            (monthNamesMap[monthA] || 0) -
                            (monthNamesMap[monthB] || 0)
                          );
                        })
                        // Take only the last 6 months of data for better visualization
                        .slice(-6)
                        .map(([month, data]) => ({
                          name: month.split(" ")[0].substring(0, 3),
                          benefit: data.netBenefit,
                          fill: "#22c55e",
                        }))}
                    >
                      <XAxis dataKey="name" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "8px",
                          border: "none",
                          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                        }}
                        formatter={(value: number | string) => [
                          `${Number(value).toLocaleString("fr-DZ")} DZD`,
                          "Bénéfice",
                        ]}
                      />
                      <Bar dataKey="benefit" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="px-4 py-2 text-xs text-gray-500 bg-gray-50 rounded-b-xl">
                  Bénéfice ce mois-ci:{" "}
                  <span className="font-medium text-green-600">
                    {dashboardData.monthlySales.profit.toLocaleString("fr-DZ")}{" "}
                    DZD
                  </span>
                  <div className="flex items-center mt-1 gap-2">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
                      <span>Bénéfice net mensuel</span>
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
                          if (yearA !== yearB) {
                            return parseInt(yearA) - parseInt(yearB);
                          }

                          // If years are equal, compare months
                          return (
                            (monthNamesMap[monthA] || 0) -
                            (monthNamesMap[monthB] || 0)
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

            <Card className="border-none shadow-md rounded-xl overflow-hidden">
              <div className="p-3 border-b">
                <CardTitle className="text-sm font-medium text-gray-700">
                  Distribution du Stock par Parfum
                </CardTitle>
              </div>
              <CardContent className="p-0">
                <div className="h-[300px] w-full p-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dashboardData.fragranceStock}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({
                          cx,
                          cy,
                          midAngle,
                          innerRadius,
                          outerRadius,
                          percent,
                        }) => {
                          const RADIAN = Math.PI / 180;
                          const radius =
                            innerRadius + (outerRadius - innerRadius) * 0.5;
                          const x = cx + radius * Math.cos(-midAngle * RADIAN);
                          const y = cy + radius * Math.sin(-midAngle * RADIAN);

                          return (
                            <text
                              x={x}
                              y={y}
                              fill="#fff"
                              textAnchor={x > cx ? "start" : "end"}
                              dominantBaseline="central"
                              fontSize={12}
                              fontWeight="bold"
                            >
                              {`${(percent * 100).toFixed(0)}%`}
                            </text>
                          );
                        }}
                      >
                        {dashboardData.fragranceStock.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => [`${value} cartons`, ""]}
                        contentStyle={{
                          borderRadius: "8px",
                          border: "none",
                          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                        }}
                      />
                      <Legend
                        layout="horizontal"
                        verticalAlign="bottom"
                        align="center"
                        formatter={(value) => (
                          <span style={{ color: "#666", fontSize: "12px" }}>
                            {value}
                          </span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="px-4 py-2 text-xs text-gray-500 bg-gray-50 rounded-b-xl">
                  Stock total:{" "}
                  <span className="font-medium text-purple-600">
                    {Math.floor(dashboardData.monthlySales.stock / 9)} cartons
                  </span>
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
            className={`h-5 w-5 transition-colors duration-200 ${activeTab === "dashboard" ? "text-white" : "text-gray-500"
              }`}
          />
          <span
            className={`ml-2 transition-colors duration-200 ${activeTab === "dashboard"
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
                className={`h-5 w-5 mr-2 ${activeTab === "add-sale" ? "text-white" : "text-gray-500"
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
                className={`h-5 w-5 mr-2 ${activeTab === "supermarkets" ? "text-white" : "text-gray-500"
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
                className={`h-5 w-5 mr-2 ${activeTab === "stock" ? "text-white" : "text-gray-500"
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
                className={`h-5 w-5 mr-2 ${activeTab === "orders" ? "text-white" : "text-gray-500"
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

      {/* Migration Modal */}
      <MigrationModal
        isOpen={showMigrationModal}
        onClose={handleMigrationClose}
        onComplete={handleMigrationComplete}
      />
    </main>
  );
}

function AddSalePage({ onBack, preFillData }: AddSalePageProps) {
  const [supermarketId, setSupermarketId] = useState(
    preFillData?.supermarketId || ""
  );
  const [cartons, setCartons] = useState(
    preFillData ? Math.ceil(preFillData.quantity / 9) : 0
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
  // Set showFragranceForm to true by default since it's now mandatory
  const [fragranceStock, setFragranceStock] = useState<FragranceStock[]>([]);
  const [fragranceDistribution, setFragranceDistribution] = useState<
    Record<string, number>
  >({});
  // Add search state
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredSupermarkets, setFilteredSupermarkets] = useState<
    Supermarket[]
  >([]);

  // Load fragrance data
  useEffect(() => {
    const loadFragranceStock = async () => {
      const stock = await getFragranceStock();
      setFragranceStock(stock);
    };
    loadFragranceStock();

    // Initialize fragrance distribution
    const initializeDistribution = async () => {
      const fragrances = await getFragrances();
      const initialDistribution: Record<string, number> = {};
      fragrances.forEach(
        (fragrance: { id: string; name: string; color: string }) => {
          initialDistribution[fragrance.id] = 0;
        }
      );
      setFragranceDistribution(initialDistribution);
    };
    initializeDistribution();

    // Initialize filtered supermarkets
    const loadSupermarkets = async () => {
      const supermarkets = await getSupermarkets();
      setFilteredSupermarkets(supermarkets);
    };
    loadSupermarkets();
  }, []);

  // Filter supermarkets when search query changes
  useEffect(() => {
    const filterSupermarkets = async () => {
      const supermarkets = await getSupermarkets();
      if (searchQuery.trim() === "") {
        setFilteredSupermarkets(supermarkets);
      } else {
        const filtered = supermarkets.filter((sm) =>
          sm.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredSupermarkets(filtered);
      }
    };
    filterSupermarkets();
  }, [searchQuery]);

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

  const handleFragranceChange = (fragranceId: string, value: number): void => {
    setFragranceDistribution((prev) => ({
      ...prev,
      [fragranceId]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate fragrance distribution
    const totalFragranceQty = Object.values(fragranceDistribution).reduce(
      (sum, qty) => sum + qty,
      0
    );
    if (totalFragranceQty !== cartons) {
      alert(
        `La distribution des parfums (${totalFragranceQty} cartons) doit correspondre au total des cartons vendus (${cartons} cartons).`
      );
      return;
    }

    // Verify we have enough stock for each fragrance
    for (const [fragranceId, qty] of Object.entries(fragranceDistribution)) {
      const fragrance = fragranceStock.find(
        (f) => f.fragranceId === fragranceId
      );
      if (fragrance && qty > fragrance.quantity) {
        alert(
          `Stock insuffisant pour le parfum "${fragrance.name}". Vous avez ${fragrance.quantity} cartons en stock.`
        );
        return;
      }
    }

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
      fragranceDistribution: fragranceDistribution,
    };

    addSale(sale);

    // Update stock by removing the sold cartons with fragrance distribution
    updateStock(
      -cartons,
      "removed",
      `Vente de ${cartons} cartons (${quantity} pièces) - ${new Date(
        saleDate
      ).toLocaleDateString()}`,
      fragranceDistribution
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
          <div className="relative">
            <input
              type="text"
              placeholder="Rechercher un supermarché..."
              className="w-full rounded-xl border border-gray-200 p-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all shadow-sm mb-2"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <select
              className="w-full rounded-xl border border-gray-200 p-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all shadow-sm"
              value={supermarketId}
              onChange={(e) => setSupermarketId(e.target.value)}
              required
            >
              <option value="">Sélectionner un supermarché</option>
              {filteredSupermarkets.map((sm) => (
                <option key={sm.id} value={sm.id}>
                  {sm.name}
                </option>
              ))}
            </select>
          </div>
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
              onClick={() => setCartons((c) => Math.max(0, c - 1))}
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
                // Don't force minimum of 1
                if (cartons < 0) setCartons(0);
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

        {/* Fragrance distribution section - now mandatory */}
        {cartons > 0 && (
          <div className="space-y-3 mt-4 border p-4 rounded-xl border-blue-100 bg-blue-50">
            <div>
              <span className="text-sm font-medium text-blue-700">
                Distribution par Parfum (Obligatoire)
              </span>
              <p className="text-xs text-blue-500 mt-1">
                Spécifiez la quantité exacte de chaque parfum
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-3">
              {fragranceStock.map((fragrance) => (
                <div key={fragrance.fragranceId} className="space-y-1">
                  <div className="flex items-center">
                    <div
                      className="w-3 h-3 rounded-full mr-1"
                      style={{ backgroundColor: fragrance.color }}
                    />
                    <label className="text-sm text-gray-600">
                      {fragrance.name}
                      <span className="text-xs text-gray-400 ml-1">
                        (Stock: {fragrance.quantity})
                      </span>
                    </label>
                  </div>
                  <div className="flex items-center">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-8 w-8 flex items-center justify-center border-gray-200 rounded-l-lg"
                      onClick={() =>
                        handleFragranceChange(
                          fragrance.fragranceId,
                          Math.max(
                            0,
                            (fragranceDistribution[fragrance.fragranceId] ||
                              0) - 1
                          )
                        )
                      }
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <input
                      type="number"
                      className="h-8 w-full text-center text-sm border-x-0 border-y border-gray-200"
                      value={fragranceDistribution[fragrance.fragranceId] || 0}
                      onChange={(e) =>
                        handleFragranceChange(
                          fragrance.fragranceId,
                          parseInt(e.target.value) || 0
                        )
                      }
                      min="0"
                      max={fragrance.quantity}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="h-8 w-8 flex items-center justify-center border-gray-200 rounded-r-lg"
                      onClick={() => {
                        const currentValue =
                          fragranceDistribution[fragrance.fragranceId] || 0;
                        if (currentValue < fragrance.quantity) {
                          handleFragranceChange(
                            fragrance.fragranceId,
                            currentValue + 1
                          );
                        }
                      }}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-sm text-blue-600 pt-1">
              <div>
                Total distribué:{" "}
                {Object.values(fragranceDistribution).reduce(
                  (sum, qty) => sum + qty,
                  0
                )}{" "}
                / {cartons} cartons
              </div>
              {Object.values(fragranceDistribution).reduce(
                (sum, qty) => sum + qty,
                0
              ) !== cartons && (
                  <div className="text-red-500 font-medium">
                    Les quantités doivent correspondre exactement
                  </div>
                )}
            </div>
          </div>
        )}

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
              className={`w-full rounded-xl py-3 px-4 h-auto ${priceOption === "option1"
                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md border-transparent"
                : "bg-white hover:bg-gray-50 border-gray-200"
                }`}
              onClick={() => setPriceOption("option1")}
            >
              <div className="text-left">
                <div className="font-medium text-base">180 DZD</div>
                <div
                  className={`text-xs ${priceOption === "option1"
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
              className={`w-full rounded-xl py-3 px-4 h-auto ${priceOption === "option2"
                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md border-transparent"
                : "bg-white hover:bg-gray-50 border-gray-200"
                }`}
              onClick={() => setPriceOption("option2")}
            >
              <div className="text-left">
                <div className="font-medium text-base">180 DZD</div>
                <div
                  className={`text-xs ${priceOption === "option2"
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
    phone_numbers: [{ name: "", number: "" }],
    email: "",
    latitude: 36.7538,
    longitude: 3.0588,
  });
  const [supermarkets, setSupermarkets] = useState<Supermarket[]>([]);
  const [loading, setLoading] = useState(false);

  // Load supermarkets on component mount
  useEffect(() => {
    const loadSupermarkets = async () => {
      const loadedSupermarkets = await getSupermarkets();
      setSupermarkets(loadedSupermarkets);
    };
    loadSupermarkets();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Make sure at least one phone number is provided
      if (!newSupermarket.phone_numbers[0].number) {
        alert("Veuillez entrer au moins un numéro de téléphone");
        setLoading(false);
        return;
      }

      // Try to geocode the address, but use default coordinates if it fails
      let latitude = 36.7538; // Default coordinates for Algeria
      let longitude = 3.0588;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            newSupermarket.address
          )}`,
          { signal: controller.signal }
        );

        clearTimeout(timeoutId);
        const data = await response.json();

        if (data && data.length > 0) {
          latitude = parseFloat(data[0].lat);
          longitude = parseFloat(data[0].lon);
          console.log("Geocoding successful:", { latitude, longitude });
        } else {
          console.log("Geocoding failed, using default coordinates");
        }
      } catch (geocodingError) {
        console.log("Geocoding service unavailable, using default coordinates:", geocodingError);
      }

      // Create a properly formatted supermarket object for Supabase
      const supabaseSupermarket = {
        name: newSupermarket.name,
        address: newSupermarket.address,
        latitude: latitude,
        longitude: longitude,
        email: newSupermarket.email || null,
        phone_numbers: newSupermarket.phone_numbers.filter(
          (p: PhoneNumber) => p.number.trim() !== ""
        ),
      };

      console.log("Adding supermarket:", supabaseSupermarket);

      // Add the supermarket
      const added = await addSupermarket(supabaseSupermarket);
      console.log("Added supermarket result:", added);

      if (added) {
        // Success - reset form and state
        setShowAddForm(false);
        alert("Supermarché ajouté avec succès!");

        // Reset form
        setNewSupermarket({
          name: "",
          address: "",
          phone_numbers: [{ name: "", number: "" }],
          email: "",
          latitude: 36.7538,
          longitude: 3.0588,
        });

        // Refresh the supermarkets list
        const loadedSupermarkets = await getSupermarkets();
        setSupermarkets(loadedSupermarkets);
      } else {
        // Failed to add
        alert("Erreur: Impossible d'ajouter le supermarché. Vérifiez la console pour plus de détails.");
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
                  value={newSupermarket.phone_numbers[0].name}
                  onChange={(e) =>
                    setNewSupermarket((prev) => ({
                      ...prev,
                      phone_numbers: prev.phone_numbers.map((phone, index) =>
                        index === 0 ? { ...phone, name: e.target.value } : phone
                      ),
                    }))
                  }
                />
                <input
                  type="tel"
                  placeholder="Numéro de téléphone"
                  className="flex-1 h-12 rounded-xl border border-gray-200 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all shadow-sm"
                  value={newSupermarket.phone_numbers[0].number}
                  onChange={(e) =>
                    setNewSupermarket((prev) => ({
                      ...prev,
                      phone_numbers: prev.phone_numbers.map((phone, index) =>
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
                  {supermarket.address}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium">
                  Voir détails
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState<string | null>(null);

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
      phone_numbers: prev.phone_numbers?.filter((_: PhoneNumber, i: number) => i !== index),
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

  const confirmDeleteSale = () => {
    if (saleToDelete) {
      // Delete the sale
      deleteSale(saleToDelete);

      // Refresh the sales history
      const refreshSales = async () => {
        const allSales = await getSales();
        const filteredSales = allSales.filter(
          (sale) => sale.supermarketId === supermarketId
        );
        setSalesHistory(filteredSales);
      };
      refreshSales();

      // Close the confirmation dialog
      setShowDeleteConfirm(false);
      setSaleToDelete(null);

      // Dispatch a custom event to notify that a sale was deleted
      const event = new CustomEvent("saleDataChanged");
      window.dispatchEvent(event);
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
    const updatedSale = await updateSalePayment(saleId, isPaid);
    if (updatedSale) {
      // Update the sale in the sales history
      setSalesHistory((prev) =>
        prev.map((sale) => (sale.id === saleId ? updatedSale : sale))
      );
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
                      {editedSupermarket.phone_numbers?.map((phone: PhoneNumber, index: number) => (
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
                      {supermarket.phone_numbers?.map((phone: PhoneNumber, index: number) => (
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
                  (monthNamesMap[monthA] || 0) - (monthNamesMap[monthB] || 0)
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
            onClick={async () => {
              // Refresh data
              const allSales = await getSales();
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
              className={`flex items-center justify-between p-4 bg-white border rounded-xl shadow-sm transition-all duration-300 cursor-pointer hover:shadow-md animate-in slide-in-from-bottom ${!sale.isPaid ? "border-red-200" : "border-green-200"
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
              <Button variant="destructive" onClick={confirmDeleteSale}>
                Supprimer
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
                    className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${selectedSale.isPaid
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



interface NewOrder {
  date: string;
  supermarketId: string;
  quantity: number;
  cartons: number;
  priceOption: "option1" | "option2";
}

function OrdersPage({ onBack, onCompleteOrder }: OrdersPageProps) {
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
