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
  X,
  Sparkles,
  BarChart3,
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
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  action: "navigate" | "external";
  path?: string;
}

const navigationItems: NavigationItem[] = [
  {
    id: "add-sale",
    label: "Ventes",
    description: "Enregistrer une vente",
    icon: ShoppingCart,
    color: "from-blue-500 to-indigo-600",
    action: "navigate",
  },
  {
    id: "supermarkets",
    label: "Supermarchés",
    description: "Gérer vos clients",
    icon: Store,
    color: "from-indigo-500 to-purple-600",
    action: "navigate",
  },
  {
    id: "stock",
    label: "Stock",
    description: "Inventaire fragrances",
    icon: Package,
    color: "from-emerald-500 to-teal-600",
    action: "navigate",
  },
  {
    id: "orders",
    label: "Commandes",
    description: "Suivre les commandes",
    icon: Calendar,
    color: "from-amber-500 to-orange-600",
    action: "navigate",
  },
  {
    id: "virements",
    label: "Virements",
    description: "Paiements en attente",
    icon: AlertCircle,
    color: "from-rose-500 to-pink-600",
    action: "navigate",
  },
  {
    id: "recap",
    label: "Récapitulatif",
    description: "Analyses et statistiques",
    icon: BarChart3,
    color: "from-indigo-500 to-purple-600",
    action: "navigate",
  },
  {
    id: "find-supermarkets",
    label: "Localiser",
    description: "Trouver sur la carte",
    icon: MapPin,
    color: "from-cyan-500 to-blue-600",
    action: "navigate",
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

  useEffect(() => {
    if (isOpen && firstButtonRef.current) {
      firstButtonRef.current.focus();
    }
  }, [isOpen]);

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
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

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
      case "recap":
        preloadComponent(() => import("@/components/RecapPage"));
        break;
    }
  }, []);

  const handleNavigation = (item: NavigationItem) => {
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

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300"
        aria-hidden="true"
      />

      {/* Menu Panel */}
      <div
        ref={menuRef}
        className="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out animate-slide-in-right"
        role="menu"
        aria-label="Menu de navigation mobile"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">TopFresh</h2>
              <p className="text-xs text-gray-500">Navigation</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-xl hover:bg-gray-100"
            onClick={onClose}
            aria-label="Fermer le menu"
          >
            <X className="h-5 w-5 text-gray-500" />
          </Button>
        </div>

        {/* Navigation Items */}
        <div className="p-4 space-y-2 overflow-y-auto max-h-[calc(100vh-80px)]">
          {navigationItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                ref={index === 0 ? firstButtonRef : undefined}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r " + item.color + " text-white shadow-lg"
                    : "bg-gray-50 hover:bg-gray-100 text-gray-700"
                }`}
                onClick={() => handleNavigation(item)}
                onKeyDown={(e) => handleKeyDown(e, item)}
                onMouseEnter={() => handleMouseEnter(item.id)}
                role="menuitem"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                    isActive
                      ? "bg-white/20"
                      : "bg-gradient-to-br " + item.color + " shadow-lg"
                  }`}
                >
                  <Icon
                    className={`h-6 w-6 ${isActive ? "text-white" : "text-white"}`}
                    aria-hidden="true"
                  />
                </div>
                <div className="flex-1 text-left">
                  <p className={`font-semibold ${isActive ? "text-white" : "text-gray-900"}`}>
                    {item.label}
                  </p>
                  <p className={`text-sm ${isActive ? "text-white/80" : "text-gray-500"}`}>
                    {item.description}
                  </p>
                </div>
                {isActive && (
                  <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                )}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100 bg-gradient-to-t from-white to-transparent">
          <p className="text-xs text-center text-gray-400">
            Comercila © 2024 • Gestion commerciale
          </p>
        </div>
      </div>
    </>
  );
}
