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
import { NotificationBell } from "@/components/NotificationBell";
import { NotificationsPage } from "@/components/NotificationsPage";
import { useDashboardData } from "@/hooks/useDashboardData";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { ChevronLeft } from "lucide-react";

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
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-gray-800">
                Tableau de Bord
              </h1>
              <div className="flex items-center space-x-2">
                <NotificationBell onNavigate={setActiveTab} />
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full h-9 w-9 border-gray-200"
                  onClick={handleVirementsClick}
                >
                  <AlertCircle className="h-5 w-5 text-red-500" />
                </Button>
              </div>
            </div>

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

      case "notifications":
        return <NotificationsPage onBack={handleBack} />;

      case "find-supermarkets":
        // Show the find supermarkets page instead of redirecting
        return (
          <div className="space-y-6 pb-20">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-gray-800">
                Trouver Supermarchés
              </h1>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full h-9 w-9 border-gray-200"
                onClick={handleBack}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </div>
            <p className="text-lg text-gray-800">
              Page de recherche de supermarchés.
            </p>
          </div>
        );

      default:
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
