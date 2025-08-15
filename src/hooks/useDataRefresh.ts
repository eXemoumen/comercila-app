import { useState, useCallback, useEffect, useRef } from "react";

interface UseDataRefreshReturn {
    refreshData: () => Promise<void>;
    isRefreshing: boolean;
    lastRefreshTime: Date | null;
    autoRefreshEnabled: boolean;
    setAutoRefreshEnabled: (enabled: boolean) => void;
}

interface UseDataRefreshOptions {
    refreshInterval?: number; // in milliseconds, default 60000 (1 minute)
    autoRefresh?: boolean; // default true
    dependencies?: unknown[]; // dependencies to watch for changes
}

export function useDataRefresh(
    refreshCallback: () => Promise<void>,
    options: UseDataRefreshOptions = {}
): UseDataRefreshReturn {
    const {
        refreshInterval = 60000, // 1 minute default
        autoRefresh = true,
        dependencies = [],
    } = options;

    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
    const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(autoRefresh);

    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const refreshCallbackRef = useRef(refreshCallback);

    // Update callback ref when it changes
    useEffect(() => {
        refreshCallbackRef.current = refreshCallback;
    }, [refreshCallback]);

    // Manual refresh function
    const refreshData = useCallback(async () => {
        if (isRefreshing) return; // Prevent concurrent refreshes

        setIsRefreshing(true);
        try {
            await refreshCallbackRef.current();
            setLastRefreshTime(new Date());
        } catch (error) {
            console.error("Error during data refresh:", error);
            throw error; // Re-throw to allow caller to handle
        } finally {
            setIsRefreshing(false);
        }
    }, [isRefreshing]);

    // Set up automatic refresh interval
    useEffect(() => {
        if (autoRefreshEnabled && refreshInterval > 0) {
            intervalRef.current = setInterval(() => {
                if (!isRefreshing) {
                    refreshData();
                }
            }, refreshInterval);

            return () => {
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                    intervalRef.current = null;
                }
            };
        }
    }, [autoRefreshEnabled, refreshInterval, refreshData, isRefreshing]);

    // Refresh when dependencies change
    useEffect(() => {
        if (dependencies.length > 0) {
            refreshData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, dependencies);

    // Set up event listeners for data changes
    useEffect(() => {
        const handleSaleDataChanged = () => {
            refreshData();
        };

        const handleStockDataChanged = () => {
            refreshData();
        };

        const handleOrderDataChanged = () => {
            refreshData();
        };

        // Listen for custom events that indicate data changes
        window.addEventListener("saleDataChanged", handleSaleDataChanged);
        window.addEventListener("stockDataChanged", handleStockDataChanged);
        window.addEventListener("orderDataChanged", handleOrderDataChanged);

        return () => {
            window.removeEventListener("saleDataChanged", handleSaleDataChanged);
            window.removeEventListener("stockDataChanged", handleStockDataChanged);
            window.removeEventListener("orderDataChanged", handleOrderDataChanged);
        };
    }, [refreshData]);

    // Cleanup interval on unmount
    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

    return {
        refreshData,
        isRefreshing,
        lastRefreshTime,
        autoRefreshEnabled,
        setAutoRefreshEnabled,
    };
}