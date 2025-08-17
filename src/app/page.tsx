"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DashboardOverview } from "@/components/DashboardOverview";
import { StockPage } from "@/components/StockPage";
import { AddSalePage } from "@/components/AddSalePage";
import { SupermarketsPage } from "@/components/SupermarketsPage";
import { OrdersPage } from "@/components/OrdersPage";
import { SupermarketProfilePage } from "@/components/SupermarketProfilePage";
import { VirementsPage } from "@/components/VirementsPage";
import { useDashboardData } from "@/hooks/useDashboardData";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  ChevronLeft,
  Plus,
  Package,
  Store,
  DollarSign,
  Calendar,
} from "lucide-react";

export default function HomePage() {
  const { dashboardData, monthlyBenefits, isLoading, error } =
    useDashboardData();
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [selectedSupermarketId, setSelectedSupermarketId] =
    useState<string>("");

  useEffect(() => {
    // Add a simple test to see if the app loads
    console.log("HomePage component loaded");
    console.log("Dashboard data:", dashboardData);
    console.log("Loading state:", isLoading);
    console.log("Error state:", error);

    // Debug stock data
    if (dashboardData?.monthlySales) {
      console.log("Stock data:", {
        stock: dashboardData.monthlySales.stock,
        fragmentStock: dashboardData.monthlySales.fragmentStock,
        fullData: dashboardData.monthlySales,
      });
    }

    // Set loaded state after a short delay
    const timer = setTimeout(() => {
      setIsLoaded(true);
      console.log("App should now be visible");
    }, 1000);

    return () => clearTimeout(timer);
  }, [dashboardData, isLoading, error]);

  // Callback functions for navigation
  const handleBack = () => {
    if (activeTab === "supermarket-profile") {
      setActiveTab("supermarkets");
      setSelectedSupermarketId("");
    } else if (activeTab === "virements") {
      setActiveTab("dashboard");
    } else {
      setActiveTab("dashboard");
    }
  };

  const handleViewSupermarket = (id: string) => {
    // Navigate to supermarket profile
    setSelectedSupermarketId(id);
    setActiveTab("supermarket-profile");
  };

  const handleVirementsClick = () => {
    setActiveTab("virements");
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleCompleteOrder = (_order: unknown) => {
    // Handle order completion
    // For now, just go back to dashboard
    setActiveTab("dashboard");
  };

  // Show a simple loading screen for testing
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-4">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="animate-spin rounded-full border-b-2 border-blue-600 h-12 w-12"></div>
          <p className="text-lg font-medium text-gray-800">
            Loading TopFresh App...
          </p>
          <p className="text-sm text-gray-600">
            Please wait while we initialize
          </p>
        </div>
      </div>
    );
  }

  // Render content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <div className="space-y-6 pb-20">
            {/* Enhanced Header with Quick Actions */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">
                    Tableau de Bord
                  </h1>
                  <p className="text-sm text-gray-600">
                    Vue d&apos;ensemble de vos activités
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full h-10 w-10 border-gray-200 hover:border-red-300 hover:bg-red-50"
                  onClick={handleVirementsClick}
                >
                  <AlertCircle className="h-5 w-5 text-red-500" />
                </Button>
              </div>

              {/* Quick Action Buttons - Most Important Actions First */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => setActiveTab("add-sale")}
                  className="h-12 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Nouvelle Vente
                </Button>
                <Button
                  onClick={() => setActiveTab("stock")}
                  variant="outline"
                  className="h-12 border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300"
                >
                  <Package className="h-5 w-5 mr-2" />
                  Gérer Stock
                </Button>
              </div>

              {/* Secondary Quick Actions */}
              <div className="grid grid-cols-3 gap-2 mt-3">
                <Button
                  onClick={() => setActiveTab("supermarkets")}
                  variant="ghost"
                  size="sm"
                  className="h-10 text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                >
                  <Store className="h-4 w-4 mr-1" />
                  Marchés
                </Button>
                <Button
                  onClick={() => setActiveTab("orders")}
                  variant="ghost"
                  size="sm"
                  className="h-10 text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                >
                  <Calendar className="h-4 w-4 mr-1" />
                  Commandes
                </Button>
                <Button
                  onClick={() => setActiveTab("virements")}
                  variant="ghost"
                  size="sm"
                  className="h-10 text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                >
                  <DollarSign className="h-4 w-4 mr-1" />
                  Virements
                </Button>
              </div>
            </div>

            {/* Main Dashboard Content */}
            <DashboardOverview
              dashboardData={dashboardData}
              monthlyBenefits={monthlyBenefits}
              onNavigate={setActiveTab}
              isLoading={isLoading}
              error={error}
            />
          </div>
        );

      case "stock":
        return <StockPage onBack={handleBack} />;

      case "add-sale":
        return <AddSalePage onBack={handleBack} />;

      case "supermarkets":
        return (
          <SupermarketsPage
            onBack={handleBack}
            onViewSupermarket={handleViewSupermarket}
          />
        );

      case "orders":
        return (
          <OrdersPage
            onBack={handleBack}
            onCompleteOrder={handleCompleteOrder}
          />
        );

      case "supermarket-profile":
        return (
          <SupermarketProfilePage
            onBack={handleBack}
            supermarketId={selectedSupermarketId}
            setActiveTab={setActiveTab}
          />
        );

      case "virements":
        return <VirementsPage onBack={handleBack} />;

      case "find-supermarkets":
        // Show the find supermarkets page instead of redirecting
        return (
          <div className="space-y-6 pb-20">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">
                    Trouver Supermarchés
                  </h1>
                  <p className="text-sm text-gray-600">
                    Localisez les marchés à proximité
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full h-10 w-10 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  onClick={handleBack}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              </div>

              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Store className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-lg text-gray-600 mb-2">
                  Fonctionnalité en cours de développement
                </p>
                <p className="text-sm text-gray-500">
                  Bientôt disponible pour localiser les supermarchés
                </p>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-6 pb-20">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">
                    Tableau de Bord
                  </h1>
                  <p className="text-sm text-gray-600">
                    Vue d&apos;ensemble de vos activités
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full h-10 w-10 border-gray-200 hover:border-red-300 hover:bg-red-50"
                  onClick={handleVirementsClick}
                >
                  <AlertCircle className="h-5 w-5 text-red-500" />
                </Button>
              </div>

              <DashboardOverview
                dashboardData={dashboardData}
                monthlyBenefits={monthlyBenefits}
                onNavigate={setActiveTab}
                isLoading={isLoading}
                error={error}
              />
            </div>
          </div>
        );
    }
  };

  return (
    <DashboardLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      showMobileMenu={showMobileMenu}
      onToggleMobileMenu={() => setShowMobileMenu(!showMobileMenu)}
    >
      {renderContent()}
    </DashboardLayout>
  );
}
