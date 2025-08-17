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
    <main className="container max-w-md mx-auto p-4 bg-gradient-to-b from-gray-50 to-white min-h-screen">
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

      {/* Main Content Area */}
      <div className="pt-16 transition-all duration-200 ease-in-out">
        <div className="space-y-4">{children}</div>
      </div>
    </main>
  );
}
