"use client";

import { Button } from "@/components/ui/button";
import { Home, Menu, Sparkles } from "lucide-react";

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
      className={`fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-b border-gray-100 flex justify-between items-center h-16 px-4 shadow-sm z-50 ${className}`}
      role="navigation"
      aria-label="Navigation principale"
    >
      {/* Logo & Home Button */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-gray-900 hidden sm:block">TopFresh</span>
        </div>
        
        <div className="h-6 w-px bg-gray-200 hidden sm:block" />
        
        <Button
          variant="ghost"
          className={`flex items-center h-10 px-4 rounded-xl transition-all duration-200 ${
            activeTab === "dashboard"
              ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40"
              : "text-gray-600 hover:bg-gray-100"
          }`}
          onClick={() => onTabChange("dashboard")}
          onKeyDown={(e) => handleKeyDown(e, "dashboard")}
          aria-pressed={activeTab === "dashboard"}
          aria-label="Aller au tableau de bord"
        >
          <Home className="h-4 w-4" aria-hidden="true" />
          <span className="ml-2 font-medium hidden sm:inline">
            Tableau de Bord
          </span>
        </Button>
      </div>

      {/* Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-10 w-10 rounded-xl hover:bg-gray-100 transition-colors"
        onClick={onToggleMobileMenu}
        onKeyDown={handleMenuKeyDown}
        aria-label="Ouvrir le menu de navigation"
        aria-expanded="false"
      >
        <Menu className="h-5 w-5 text-gray-600" aria-hidden="true" />
      </Button>
    </div>
  );
}
