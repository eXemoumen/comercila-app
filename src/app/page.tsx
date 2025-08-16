"use client";

import React from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DashboardOverview } from "@/components/DashboardOverview";
import { SupermarketsPage } from "@/components/SupermarketsPage";
import { SupermarketProfilePage } from "@/components/SupermarketProfilePage";
import { OrdersPage } from "@/components/OrdersPage";
import { AddSalePage } from "@/components/AddSalePage";
import { StockPage } from "@/components/StockPage";
import { MigrationModal } from "@/components/MigrationModal";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

// Error boundaries and loading components
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { DashboardErrorBoundary, PageErrorBoundary } from "@/components/DashboardErrorBoundary";
import { FullPageLoading, LoadingSpinner } from "@/components/LoadingSkeleton";

// Custom hooks
import { useDashboardData } from "@/hooks/useDashboardData";
import { useNavigation } from "@/hooks/useNavigation";
import { useMigration } from "@/hooks/useMigration";

export default function Dashboard() {
  // Custom hooks for state management
  const { dashboardData, monthlyBenefits, isLoading, error, refreshData } = useDashboardData();
  const {
    activeTab,
    showMobileMenu,
    selectedSupermarketId,
    preFillSaleData,
    setActiveTab,
    toggleMobileMenu,
    navigateWithPreFill,
    navigateToSupermarket,
  } = useNavigation();
  const {
    showMigrationModal,
    migrationChecked,
    handleMigrationComplete,
    handleMigrationClose,
  } = useMigration(refreshData);

  // Handle order completion
  const handleCompleteOrder = (order: { id: string; supermarketId: string; quantity: number }) => {
    navigateWithPreFill("add-sale", {
      supermarketId: order.supermarketId,
      quantity: order.quantity,
      orderId: order.id,
    });
  };

  // Render main content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <DashboardErrorBoundary section="tableau de bord" onRetry={refreshData}>
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

              <DashboardOverview
                dashboardData={dashboardData}
                monthlyBenefits={monthlyBenefits}
                onNavigate={setActiveTab}
                isLoading={isLoading}
                error={error}
              />
            </div>
          </DashboardErrorBoundary>
        );

      case "supermarkets":
        return (
          <PageErrorBoundary pageName="Supermarchés">
            <SupermarketsPage
              onBack={() => setActiveTab("dashboard")}
              onViewSupermarket={navigateToSupermarket}
            />
          </PageErrorBoundary>
        );

      case "supermarket-profile":
        return (
          <PageErrorBoundary pageName="Profil Supermarché">
            <SupermarketProfilePage
              onBack={() => setActiveTab("supermarkets")}
              supermarketId={selectedSupermarketId}
              setActiveTab={setActiveTab}
            />
          </PageErrorBoundary>
        );

      case "orders":
        return (
          <PageErrorBoundary pageName="Commandes">
            <OrdersPage
              onBack={() => setActiveTab("dashboard")}
              onCompleteOrder={handleCompleteOrder}
            />
          </PageErrorBoundary>
        );

      case "add-sale":
        return (
          <PageErrorBoundary pageName="Nouvelle Vente">
            <AddSalePage
              onBack={() => setActiveTab("dashboard")}
              preFillData={preFillSaleData}
            />
          </PageErrorBoundary>
        );

      case "stock":
        return (
          <PageErrorBoundary pageName="Gestion du Stock">
            <StockPage
              onBack={() => setActiveTab("dashboard")}
            />
          </PageErrorBoundary>
        );

      case "pending-payments":
        // Navigate to external pending payments page
        window.location.href = "/pending-payments";
        return (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner text="Redirection..." />
          </div>
        );

      default:
        return (
          <div className="text-center py-8">
            <p className="text-gray-500">Page non trouvée</p>
            <Button
              onClick={() => setActiveTab("dashboard")}
              className="mt-4"
            >
              Retour au tableau de bord
            </Button>
          </div>
        );
    }
  };

  // Show loading state during migration check
  if (!migrationChecked) {
    return <FullPageLoading text="Vérification des données..." />;
  }

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error("Critical dashboard error:", error, errorInfo);
        // Log to external service if needed
      }}
      showDetails={process.env.NODE_ENV === "development"}
    >
      <DashboardLayout
        activeTab={activeTab}
        onTabChange={setActiveTab}
        showMobileMenu={showMobileMenu}
        onToggleMobileMenu={toggleMobileMenu}
      >
        {renderContent()}
      </DashboardLayout>

      {/* Migration Modal */}
      {showMigrationModal && (
        <ErrorBoundary
          fallback={
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
              <div className="bg-white p-6 rounded-2xl text-center">
                <p className="text-red-600 mb-4">Erreur lors de la migration</p>
                <Button onClick={() => window.location.reload()}>
                  Recharger la page
                </Button>
              </div>
            </div>
          }
        >
          <MigrationModal
            isOpen={showMigrationModal}
            onComplete={handleMigrationComplete}
            onClose={handleMigrationClose}
          />
        </ErrorBoundary>
      )}
    </ErrorBoundary>
  );
}