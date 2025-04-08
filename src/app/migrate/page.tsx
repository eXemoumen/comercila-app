"use client";

import { useState } from "react";
import { migrateToSupabase } from "@/utils/migrate";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function MigratePage() {
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState<string | null>(null);
  const router = useRouter();

  const handleMigrate = async () => {
    setIsMigrating(true);
    setMigrationStatus("Starting migration...");

    try {
      const success = await migrateToSupabase();
      if (success) {
        setMigrationStatus("Migration completed successfully!");
        // Clear localStorage after successful migration
        localStorage.clear();
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          router.push("/");
        }, 2000);
      } else {
        setMigrationStatus("Migration failed. Please try again.");
      }
    } catch (error) {
      console.error("Migration error:", error);
      setMigrationStatus(
        "An error occurred during migration. Please try again."
      );
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            Migrate to Supabase
          </h2>
          <p className="mt-2 text-gray-600">
            This will migrate your data from localStorage to Supabase.
          </p>
        </div>

        <div className="mt-8 space-y-6">
          <div className="rounded-md bg-gray-50 p-4">
            <p className="text-sm text-gray-600">This process will:</p>
            <ul className="mt-2 text-sm text-gray-600 list-disc list-inside">
              <li>Transfer all your supermarkets</li>
              <li>Transfer all your sales records</li>
              <li>Transfer all your orders</li>
              <li>Transfer your stock history</li>
              <li>Clear localStorage after successful migration</li>
            </ul>
          </div>

          {migrationStatus && (
            <div className="rounded-md p-4 bg-blue-50">
              <p className="text-sm text-blue-700">{migrationStatus}</p>
            </div>
          )}

          <Button
            onClick={handleMigrate}
            disabled={isMigrating}
            className="w-full"
          >
            {isMigrating ? "Migrating..." : "Start Migration"}
          </Button>
        </div>
      </div>
    </div>
  );
}
