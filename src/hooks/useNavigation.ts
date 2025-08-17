import { useState, useEffect, useCallback } from "react";

interface PreFillData {
    supermarketId: string;
    quantity: number;
    orderId?: string;
}

interface UseNavigationReturn {
    activeTab: string;
    showMobileMenu: boolean;
    selectedSupermarketId: string;
    preFillSaleData: PreFillData | null;
    setActiveTab: (tab: string) => void;
    toggleMobileMenu: () => void;
    setShowMobileMenu: (show: boolean) => void;
    setSelectedSupermarketId: (id: string) => void;
    setPreFillSaleData: (data: PreFillData | null) => void;
    navigateWithPreFill: (tab: string, data?: PreFillData) => void;
    navigateToSupermarket: (id: string) => void;
}

export function useNavigation(): UseNavigationReturn {
    const [activeTab, setActiveTab] = useState("dashboard");
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [selectedSupermarketId, setSelectedSupermarketId] = useState<string>("");
    const [preFillSaleData, setPreFillSaleData] = useState<PreFillData | null>(null);

    // Load saved tab from localStorage on mount
    useEffect(() => {
        const savedTab = localStorage.getItem("activeTab");
        if (savedTab) {
            setActiveTab(savedTab);
            localStorage.removeItem("activeTab"); // Clear it after using
        }
    }, []);

    // Toggle mobile menu
    const toggleMobileMenu = useCallback(() => {
        setShowMobileMenu(prev => !prev);
    }, []);

    // Navigate with pre-fill data
    const navigateWithPreFill = useCallback((tab: string, data?: PreFillData) => {
        setActiveTab(tab);
        if (data) {
            setPreFillSaleData(data);
        }
        setShowMobileMenu(false); // Close mobile menu when navigating
    }, []);

    // Navigate to supermarket profile
    const navigateToSupermarket = useCallback((id: string) => {
        setSelectedSupermarketId(id);
        setActiveTab("supermarket-profile");
        setShowMobileMenu(false);
    }, []);

    // Enhanced setActiveTab that also closes mobile menu
    const handleSetActiveTab = useCallback((tab: string) => {
        setActiveTab(tab);
        setShowMobileMenu(false);

        // Clear pre-fill data when navigating away from add-sale
        if (tab !== "add-sale") {
            setPreFillSaleData(null);
        }

        // Clear selected supermarket when navigating away from supermarket-profile
        if (tab !== "supermarket-profile") {
            setSelectedSupermarketId("");
        }
    }, []);

    return {
        activeTab,
        showMobileMenu,
        selectedSupermarketId,
        preFillSaleData,
        setActiveTab: handleSetActiveTab,
        toggleMobileMenu,
        setShowMobileMenu,
        setSelectedSupermarketId,
        setPreFillSaleData,
        navigateWithPreFill,
        navigateToSupermarket,
    };
}