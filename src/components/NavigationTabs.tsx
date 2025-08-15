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
            className={`fixed top-0 left-0 right-0 bg-white backdrop-blur-lg bg-opacity-80 border-b flex justify-between items-center h-16 px-4 shadow-lg z-50 ${className}`}
            role="navigation"
            aria-label="Navigation principale"
        >
            <Button
                variant={activeTab === "dashboard" ? "default" : "ghost"}
                className="flex items-center h-14 rounded-xl relative transition-all duration-200"
                onClick={() => onTabChange("dashboard")}
                onKeyDown={(e) => handleKeyDown(e, "dashboard")}
                aria-pressed={activeTab === "dashboard"}
                aria-label="Aller au tableau de bord"
            >
                <Home
                    className={`h-5 w-5 transition-colors duration-200 ${activeTab === "dashboard" ? "text-white" : "text-gray-500"
                        }`}
                    aria-hidden="true"
                />
                <span
                    className={`ml-2 transition-colors duration-200 ${activeTab === "dashboard"
                            ? "text-white font-medium"
                            : "text-gray-500"
                        }`}
                >
                    Tableau de Bord
                </span>
            </Button>

            <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full"
                onClick={onToggleMobileMenu}
                onKeyDown={handleMenuKeyDown}
                aria-label="Ouvrir le menu de navigation"
                aria-expanded="false"
            >
                <Menu className="h-5 w-5 text-gray-500" aria-hidden="true" />
            </Button>
        </div>
    );
}