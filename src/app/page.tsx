"use client";

import React from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DashboardOverview } from "@/components/DashboardOverview";
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

// Lazy-loaded page components for better performance
import { LazyComponentWrapper } from "@/components/LazyComponentWrapper";

const SupermarketsPage = React.lazy(() => import("@/components/SupermarketsPage").then(module => ({ default: module.SupermarketsPage })));
const SupermarketProfilePage = React.lazy(() => import("@/components/SupermarketProfilePage").then(module => ({ default: module.SupermarketProfilePage })));
const OrdersPage = React.lazy(() => import("@/components/OrdersPage").then(module => ({ default: module.OrdersPage })));
const AddSalePage = React.lazy(() => import("@/components/AddSalePage").then(module => ({ default: module.AddSalePage })));
const StockPage = React.lazy(() => import("@/components/StockPage").then(module => ({ default: module.StockPage })));
const MigrationModal = React.lazy(() => import("@/components/MigrationModal").then(module => ({ default: module.MigrationModal })));

/**
 * Main Dashboard Component
 * 
 * This is the primary dashboard component for the Comercila application.
 * It orchestrates the entire dashboard experience including:
 * - Navigation between different pages (dashboard, supermarkets, orders, etc.)
 * - Data management and refresh functionality
 * - Error handling and loading states
 * - Migration modal handling
 * - Lazy loading of page components for performance
 * 
 * The component has been refactored to be under 200 lines by extracting:
 * - Custom hooks for state management
 * - Individual page components
 * - Layout and navigation components
 * - Error boundaries and loading components
 * 
 * @returns {JSX.Element} The main dashboard interface
 */
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
  const handleCompleteOrder = React.useCallback((order: { id: string; supermarketId: string; quantity: number }) => {
    navigateWithPreFill("add-sale", {
      supermarketId: order.supermarketId,
      quantity: order.quantity,
      orderId: order.id,
    });
  }, [navigateWithPreFill]);

  // Memoized navigation handlers
  const handleBackToDashboard = React.useCallback(() => setActiveTab("dashboard"), [setActiveTab]);
  const handleBackToSupermarkets = React.useCallback(() => setActiveTab("supermarkets"), [setActiveTab]);
  const handleNavigateToPendingPayments = React.useCallback(() => setActiveTab("pending-payments"), [setActiveTab]);

  // Render main content based on active tab
  const renderContent = React.useCallback(() => {
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
                  onClick={handleNavigateToPendingPayments}
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
            <LazyComponentWrapper pageName="la page Supermarchés">
              <SupermarketsPage
                onBack={handleBackToDashboard}
                onViewSupermarket={navigateToSupermarket}
              />
            </LazyComponentWrapper>
          </PageErrorBoundary>
        );

      case "supermarket-profile":
        return (
          <PageErrorBoundary pageName="Profil Supermarché">
            <LazyComponentWrapper pageName="le profil du supermarché">
              <SupermarketProfilePage
                onBack={handleBackToSupermarkets}
                supermarketId={selectedSupermarketId}
                setActiveTab={setActiveTab}
              />
            </LazyComponentWrapper>
          </PageErrorBoundary>
        );

      case "orders":
        return (
          <PageErrorBoundary pageName="Commandes">
            <LazyComponentWrapper pageName="la page Commandes">
              <OrdersPage
                onBack={handleBackToDashboard}
                onCompleteOrder={handleCompleteOrder}
              />
            </LazyComponentWrapper>
          </PageErrorBoundary>
        );

      case "add-sale":
        return (
          <PageErrorBoundary pageName="Nouvelle Vente">
            <LazyComponentWrapper pageName="la page Nouvelle Vente">
              <AddSalePage
                onBack={handleBackToDashboard}
                preFillData={preFillSaleData}
              />
            </LazyComponentWrapper>
          </PageErrorBoundary>
        );

      case "stock":
        return (
          <PageErrorBoundary pageName="Gestion du Stock">
            <LazyComponentWrapper pageName="la page Gestion du Stock">
              <StockPage
                onBack={handleBackToDashboard}
              />
            </LazyComponentWrapper>
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
              onClick={handleBackToDashboard}
              className="mt-4"
            >
              Retour au tableau de bord
            </Button>
          </div>
        );
    }
  }, [
    activeTab,
    refreshData,
    handleNavigateToPendingPayments,
    dashboardData,
    monthlyBenefits,
    setActiveTab,
    isLoading,
    error,
    handleBackToDashboard,
    navigateToSupermarket,
    handleBackToSupermarkets,
    selectedSupermarketId,
    handleCompleteOrder,
    preFillSaleData
  ]);

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
        <LazyComponentWrapper pageName="la modal de migration">
          <MigrationModal
            isOpen={showMigrationModal}
            onComplete={handleMigrationComplete}
            onClose={handleMigrationClose}
          />
        </LazyComponentWrapper>
      )}
    </ErrorBoundary>
  );
}