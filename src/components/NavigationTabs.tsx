"use client";

import { Button } from "@/components/ui/button";
import { Home, Menu } from "lucide-react";

interface NavigationTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onToggleMobileMenu: () => void;
  className?: string;
}

export function NavigationTabs({
  activeTab,
  onTabChange,
  onToggleMobileMenu,
  className = "",
}: NavigationTabsProps) {
  const handleKeyDown = (event: React.KeyboardEvent, tab: string) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onTabChange(tab);
    }
  };

  const handleMenuKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onToggleMobileMenu();
    }
  };

  return (
    <div
      className={`fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-b border-gray-200/50 flex justify-between items-center h-16 px-4 shadow-lg z-50 ${className}`}
      role="navigation"
      aria-label="Navigation principale"
    >
      {/* Home Button - Primary Navigation */}
      <Button
        variant={activeTab === "dashboard" ? "default" : "ghost"}
        className={`flex items-center h-12 rounded-2xl relative transition-all duration-300 ${
          activeTab === "dashboard"
            ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/25"
            : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
        }`}
        onClick={() => onTabChange("dashboard")}
        onKeyDown={(e) => handleKeyDown(e, "dashboard")}
        aria-pressed={activeTab === "dashboard"}
        aria-label="Aller au tableau de bord"
      >
        <Home
          className={`h-5 w-5 transition-all duration-300 ${
            activeTab === "dashboard" ? "text-white" : "text-gray-500"
          }`}
          aria-hidden="true"
        />
        <span
          className={`ml-2 font-medium transition-all duration-300 ${
            activeTab === "dashboard" ? "text-white" : "text-gray-600"
          }`}
        >
          Tableau de Bord
        </span>
      </Button>

      {/* Menu Button - Secondary Navigation */}
      <Button
        variant="ghost"
        size="icon"
        className="h-12 w-12 rounded-2xl bg-gray-100 hover:bg-gray-200 transition-all duration-300 hover:scale-105 active:scale-95 shadow-sm"
        onClick={onToggleMobileMenu}
        onKeyDown={handleMenuKeyDown}
        aria-label="Ouvrir le menu de navigation"
        aria-expanded="false"
      >
        <Menu className="h-6 w-6 text-gray-600" aria-hidden="true" />
      </Button>
    </div>
  );
}
