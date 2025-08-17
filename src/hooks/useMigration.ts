import { useState, useEffect, useCallback } from "react";
import { isMigrationNeeded } from "@/utils/migration";

interface UseMigrationReturn {
    showMigrationModal: boolean;
    migrationChecked: boolean;
    needsMigration: boolean;
    handleMigrationComplete: () => void;
    handleMigrationClose: () => void;
    checkMigrationStatus: () => void;
}

export function useMigration(onDataRefresh?: () => Promise<void>): UseMigrationReturn {
    const [showMigrationModal, setShowMigrationModal] = useState(false);
    const [migrationChecked, setMigrationChecked] = useState(false);
    const [needsMigration, setNeedsMigration] = useState(false);

    // Check migration status
    const checkMigrationStatus = useCallback(() => {
        const migrationNeeded = isMigrationNeeded();
        setNeedsMigration(migrationNeeded);

        if (migrationNeeded) {
            setShowMigrationModal(true);
        }

        setMigrationChecked(true);
    }, []);

    // Handle migration completion
    const handleMigrationComplete = useCallback(() => {
        setShowMigrationModal(false);
        setNeedsMigration(false);

        // Refresh data after migration if callback provided
        if (onDataRefresh) {
            onDataRefresh();
        }
    }, [onDataRefresh]);

    // Handle migration modal close
    const handleMigrationClose = useCallback(() => {
        setShowMigrationModal(false);

        // Refresh data after closing migration modal if callback provided
        if (onDataRefresh) {
            onDataRefresh();
        }
    }, [onDataRefresh]);

    // Check migration status on mount
    useEffect(() => {
        if (!migrationChecked) {
            checkMigrationStatus();
        }
    }, [migrationChecked, checkMigrationStatus]);

    return {
        showMigrationModal,
        migrationChecked,
        needsMigration,
        handleMigrationComplete,
        handleMigrationClose,
        checkMigrationStatus,
    };
}