import { useEffect, useState } from "react";
import { isOnline, getPendingOperations } from "@/utils/offline";
import { AlertCircle, Wifi, WifiOff } from "lucide-react";

export function OfflineStatus() {
  const [online, setOnline] = useState(true);
  const [pendingOperations, setPendingOperations] = useState(0);

  useEffect(() => {
    const updateStatus = () => {
      setOnline(isOnline());
      setPendingOperations(getPendingOperations().length);
    };

    // Initial check
    updateStatus();

    // Listen for online/offline events
    window.addEventListener("online", updateStatus);
    window.addEventListener("offline", updateStatus);

    // Check pending operations periodically
    const interval = setInterval(updateStatus, 5000);

    return () => {
      window.removeEventListener("online", updateStatus);
      window.removeEventListener("offline", updateStatus);
      clearInterval(interval);
    };
  }, []);

  if (online && pendingOperations === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <div className="bg-white rounded-lg shadow-lg p-4 flex items-center space-x-3">
        {!online ? (
          <>
            <WifiOff className="h-5 w-5 text-red-500" />
            <span className="text-sm font-medium text-gray-700">
              Vous êtes hors ligne
            </span>
          </>
        ) : (
          <>
            <Wifi className="h-5 w-5 text-green-500" />
            <span className="text-sm font-medium text-gray-700">En ligne</span>
          </>
        )}
        {pendingOperations > 0 && (
          <div className="flex items-center space-x-1">
            <AlertCircle className="h-4 w-4 text-yellow-500" />
            <span className="text-sm text-gray-600">
              {pendingOperations} opération{pendingOperations > 1 ? "s" : ""} en
              attente
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
