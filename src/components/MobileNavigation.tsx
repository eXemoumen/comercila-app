"use client";

import { useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  ShoppingCart,
  Store,
  Package,
  Calendar,
  MapPin,
  AlertCircle,
} from "lucide-react";
import { preloadComponent } from "@/utils/preloadUtils";

interface MobileNavigationProps {
  isOpen: boolean;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onClose: () => void;
}

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  action: "navigate" | "external";
  path?: string;
  description: string;
  priority: "high" | "medium" | "low";
}

const navigationItems: NavigationItem[] = [
  {
    id: "add-sale",
    label: "Nouvelle Vente",
    icon: ShoppingCart,
    action: "navigate",
    description: "Enregistrer une nouvelle vente",
    priority: "high",
  },
  {
    id: "stock",
    label: "Gérer Stock",
    icon: Package,
    action: "navigate",
    description: "Vérifier et ajuster l'inventaire",
    priority: "high",
  },
  {
    id: "supermarkets",
    label: "Supermarchés",
    icon: Store,
    action: "navigate",
    description: "Gérer les partenaires commerciaux",
    priority: "medium",
  },
  {
    id: "orders",
    label: "Commandes",
    icon: Calendar,
    action: "navigate",
    description: "Suivre les commandes en cours",
    priority: "medium",
  },
  {
    id: "virements",
    label: "Virements",
    icon: AlertCircle,
    action: "navigate",
    description: "Gérer les transferts financiers",
    priority: "low",
  },
  {
    id: "find-supermarkets",
    label: "Trouver Marchés",
    icon: MapPin,
    action: "navigate",
    description: "Localiser de nouveaux partenaires",
    priority: "low",
  },
];

export function MobileNavigation({
  isOpen,
  activeTab,
  onTabChange,
  onClose,
}: MobileNavigationProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const firstButtonRef = useRef<HTMLButtonElement>(null);

  // Handle keyboard navigation
  useEffect(() => {
    if (isOpen && firstButtonRef.current) {
      firstButtonRef.current.focus();
    }
  }, [isOpen]);

  // Handle escape key and outside clicks
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.addEventListener("mousedown", handleClickOutside);
      // Prevent body scroll when menu is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  // Preload components on hover
  const handleMouseEnter = useCallback((itemId: string) => {
    switch (itemId) {
      case "supermarkets":
        preloadComponent(() => import("@/components/SupermarketsPage"));
        break;
      case "orders":
        preloadComponent(() => import("@/components/OrdersPage"));
        break;
      case "add-sale":
        preloadComponent(() => import("@/components/AddSalePage"));
        break;
      case "stock":
        preloadComponent(() => import("@/components/StockPage"));
        break;
    }
  }, []);

  const handleNavigation = (item: NavigationItem) => {
    // All navigation items now use internal tab navigation
    onTabChange(item.id);
    onClose();
  };

  const handleKeyDown = (event: React.KeyboardEvent, item: NavigationItem) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleNavigation(item);
    }
  };

  if (!isOpen) return null;

  // Group items by priority for better organization
  const highPriorityItems = navigationItems.filter(
    (item) => item.priority === "high"
  );
  const mediumPriorityItems = navigationItems.filter(
    (item) => item.priority === "medium"
  );
  const lowPriorityItems = navigationItems.filter(
    (item) => item.priority === "low"
  );

  return (
    <>
      {/* Enhanced Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-all duration-300"
        aria-hidden="true"
        onClick={onClose}
      />

      {/* Enhanced Menu with Better Organization */}
      <div
        ref={menuRef}
        className="fixed top-20 left-4 right-4 bg-white rounded-3xl shadow-2xl border border-gray-200/50 z-50 transform transition-all duration-300 ease-out overflow-hidden max-h-[80vh]"
        role="menu"
        aria-label="Menu de navigation mobile"
      >
        {/* Header with App Branding */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <h3 className="text-xl font-bold mb-1">TopFresh</h3>
          <p className="text-blue-100 text-sm">Navigation rapide</p>
        </div>

        {/* Navigation Items Organized by Priority */}
        <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* High Priority Items - Most Important */}
          {highPriorityItems.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2">
                Actions Principales
              </h4>
              {highPriorityItems.map((item, index) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <Button
                    key={item.id}
                    ref={index === 0 ? firstButtonRef : undefined}
                    variant={isActive ? "default" : "ghost"}
                    className={`w-full justify-start h-16 rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${
                      isActive
                        ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-500/25"
                        : "hover:bg-gray-50 text-gray-700 hover:text-gray-900"
                    }`}
                    onClick={() => handleNavigation(item)}
                    onKeyDown={(e) => handleKeyDown(e, item)}
                    onMouseEnter={() => handleMouseEnter(item.id)}
                    role="menuitem"
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center mr-4 ${
                        isActive
                          ? "bg-white/20 backdrop-blur-sm"
                          : "bg-green-100 text-green-600"
                      }`}
                    >
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium text-base">{item.label}</div>
                      <div
                        className={`text-xs ${
                          isActive ? "text-green-100" : "text-gray-500"
                        }`}
                      >
                        {item.description}
                      </div>
                    </div>
                    {isActive && (
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    )}
                  </Button>
                );
              })}
            </div>
          )}

          {/* Medium Priority Items */}
          {mediumPriorityItems.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2">
                Gestion
              </h4>
              {mediumPriorityItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <Button
                    key={item.id}
                    variant={isActive ? "default" : "ghost"}
                    className={`w-full justify-start h-14 rounded-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${
                      isActive
                        ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25"
                        : "hover:bg-gray-50 text-gray-700 hover:text-gray-900"
                    }`}
                    onClick={() => handleNavigation(item)}
                    onKeyDown={(e) => handleKeyDown(e, item)}
                    onMouseEnter={() => handleMouseEnter(item.id)}
                    role="menuitem"
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${
                        isActive
                          ? "bg-white/20 backdrop-blur-sm"
                          : "bg-blue-100 text-blue-600"
                      }`}
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium text-sm">{item.label}</div>
                      <div
                        className={`text-xs ${
                          isActive ? "text-blue-100" : "text-gray-500"
                        }`}
                      >
                        {item.description}
                      </div>
                    </div>
                  </Button>
                );
              })}
            </div>
          )}

          {/* Low Priority Items */}
          {lowPriorityItems.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2">
                Utilitaires
              </h4>
              {lowPriorityItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <Button
                    key={item.id}
                    variant={isActive ? "default" : "ghost"}
                    className={`w-full justify-start h-12 rounded-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${
                      isActive
                        ? "bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-lg shadow-gray-500/25"
                        : "hover:bg-gray-50 text-gray-700 hover:text-gray-900"
                    }`}
                    onClick={() => handleNavigation(item)}
                    onKeyDown={(e) => handleKeyDown(e, item)}
                    onMouseEnter={() => handleMouseEnter(item.id)}
                    role="menuitem"
                  >
                    <div
                      className={`w-6 h-6 rounded-md flex items-center justify-center mr-3 ${
                        isActive
                          ? "bg-white/20 backdrop-blur-sm"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      <Icon className="h-3 w-3" aria-hidden="true" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium text-sm">{item.label}</div>
                      <div
                        className={`text-xs ${
                          isActive ? "text-gray-100" : "text-gray-500"
                        }`}
                      >
                        {item.description}
                      </div>
                    </div>
                  </Button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer with Quick Actions */}
        <div className="p-4 border-t border-gray-100 bg-gray-50">
          <div className="flex justify-between items-center">
            <p className="text-xs text-gray-500">
              TopFresh - Gestion des ventes
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Fermer
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
