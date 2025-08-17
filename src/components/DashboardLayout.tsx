"use client";

import { useEffect, useCallback } from "react";
import { NavigationTabs } from "@/components/NavigationTabs";
import { MobileNavigation } from "@/components/MobileNavigation";

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  showMobileMenu: boolean;
  onToggleMobileMenu: () => void;
}

export function DashboardLayout({
  children,
  activeTab,
  onTabChange,
  showMobileMenu,
  onToggleMobileMenu,
}: DashboardLayoutProps) {
  // Handle mobile menu state management
  const handleMobileMenuToggle = () => {
    onToggleMobileMenu();
  };

  const handleMobileMenuClose = useCallback(() => {
    if (showMobileMenu) {
      onToggleMobileMenu();
    }
  }, [showMobileMenu, onToggleMobileMenu]);

  const handleTabChange = (tab: string) => {
    onTabChange(tab);
    // Close mobile menu when navigating
    if (showMobileMenu) {
      onToggleMobileMenu();
    }
  };

  // Handle escape key to close mobile menu (MobileNavigation handles body scroll)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && showMobileMenu) {
        handleMobileMenuClose();
      }
    };

    if (showMobileMenu) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showMobileMenu, handleMobileMenuClose]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Navigation Header */}
      <NavigationTabs
        activeTab={activeTab}
        onTabChange={onTabChange}
        onToggleMobileMenu={handleMobileMenuToggle}
        className="transition-all duration-200 ease-in-out"
      />

      {/* Mobile Navigation Menu */}
      <MobileNavigation
        isOpen={showMobileMenu}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onClose={handleMobileMenuClose}
      />

      {/* Main Content Area with Better Mobile Spacing */}
      <div className="pt-20 pb-6 transition-all duration-200 ease-in-out">
        <div className="container max-w-md mx-auto px-4">
          <div className="space-y-6">{children}</div>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40 md:hidden">
        <div className="flex justify-around items-center py-2 px-4">
          {/* Dashboard Tab */}
          <button
            onClick={() => handleTabChange("dashboard")}
            className={`flex flex-col items-center py-2 px-3 rounded-lg transition-all duration-200 ${
              activeTab === "dashboard"
                ? "text-blue-600 bg-blue-50"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <div className="w-6 h-6 mb-1">🏠</div>
            <span className="text-xs font-medium">Accueil</span>
          </button>

          {/* Sales Tab */}
          <button
            onClick={() => handleTabChange("add-sale")}
            className={`flex flex-col items-center py-2 px-3 rounded-lg transition-all duration-200 ${
              activeTab === "add-sale"
                ? "text-green-600 bg-green-50"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <div className="w-6 h-6 mb-1">💰</div>
            <span className="text-xs font-medium">Ventes</span>
          </button>

          {/* Stock Tab */}
          <button
            onClick={() => handleTabChange("stock")}
            className={`flex flex-col items-center py-2 px-3 rounded-lg transition-all duration-200 ${
              activeTab === "stock"
                ? "text-purple-600 bg-purple-50"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <div className="w-6 h-6 mb-1">📦</div>
            <span className="text-xs font-medium">Stock</span>
          </button>

          {/* Supermarkets Tab */}
          <button
            onClick={() => handleTabChange("supermarkets")}
            className={`flex flex-col items-center py-2 px-3 rounded-lg transition-all duration-200 ${
              activeTab === "supermarkets"
                ? "text-orange-600 bg-orange-50"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <div className="w-6 h-6 mb-1">🏪</div>
            <span className="text-xs font-medium">Marchés</span>
          </button>
        </div>
      </div>

      {/* Floating Action Button for Quick Sales */}
      <button
        onClick={() => handleTabChange("add-sale")}
        className="fixed bottom-20 right-4 w-14 h-14 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 active:scale-95 z-50 md:hidden"
        aria-label="Ajouter une vente"
      >
        <span className="text-2xl">+</span>
      </button>
    </main>
  );
}
