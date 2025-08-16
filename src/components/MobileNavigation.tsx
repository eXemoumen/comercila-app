"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    ShoppingCart,
    Store,
    Package,
    Calendar,
    MapPin,
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
}

const navigationItems: NavigationItem[] = [
    {
        id: "add-sale",
        label: "Ventes",
        icon: ShoppingCart,
        action: "navigate",
    },
    {
        id: "supermarkets",
        label: "Supermarchés",
        icon: Store,
        action: "navigate",
    },
    {
        id: "stock",
        label: "Stock",
        icon: Package,
        action: "navigate",
    },
    {
        id: "orders",
        label: "Commandes",
        icon: Calendar,
        action: "navigate",
    },
    {
        id: "find-supermarkets",
        label: "Trouve",
        icon: MapPin,
        action: "external",
        path: "/find-supermarkets",
    },
];

export function MobileNavigation({
    isOpen,
    activeTab,
    onTabChange,
    onClose,
}: MobileNavigationProps) {
    const router = useRouter();
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
        if (item.action === "external" && item.path) {
            onClose();
            setTimeout(() => {
                router.push(item.path!);
            }, 0);
        } else {
            onTabChange(item.id);
            onClose();
        }
    };

    const handleKeyDown = (
        event: React.KeyboardEvent,
        item: NavigationItem
    ) => {
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
                className="fixed inset-0 bg-black bg-opacity-25 z-40 transition-opacity duration-200"
                aria-hidden="true"
            />

            {/* Menu */}
            <div
                ref={menuRef}
                className="fixed top-16 left-0 right-0 bg-white border-b shadow-lg z-50 transform transition-transform duration-200 ease-out"
                role="menu"
                aria-label="Menu de navigation mobile"
            >
                <div className="p-4 space-y-2">
                    {navigationItems.map((item, index) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;

                        return (
                            <Button
                                key={item.id}
                                ref={index === 0 ? firstButtonRef : undefined}
                                variant={isActive ? "default" : "ghost"}
                                className="w-full justify-start h-12 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                                onClick={() => handleNavigation(item)}
                                onKeyDown={(e) => handleKeyDown(e, item)}
                                onMouseEnter={() => handleMouseEnter(item.id)}
                                role="menuitem"
                            >
                                <Icon
                                    className={`h-5 w-5 mr-2 transition-colors duration-200 ${isActive ? "text-white" : "text-gray-500"
                                        }`}
                                    aria-hidden="true"
                                />
                                <span
                                    className={`transition-colors duration-200 ${isActive ? "text-white font-medium" : "text-gray-500"
                                        }`}
                                >
                                    {item.label}
                                </span>
                            </Button>
                        );
                    })}
                </div>
            </div>
        </>
    );
}