import React, { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Button } from "./ui/button";
import { notificationService } from "@/services/notificationService";
import { NotificationCounts } from "@/types/notifications";
import { isAndroid, mobileUtils } from "@/utils/mobileConfig";

interface NotificationBellProps {
  className?: string;
  onNavigate?: (tab: string) => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  className = "",
  onNavigate,
}) => {
  const [counts, setCounts] = useState<NotificationCounts>({
    total: 0,
    unread: 0,
    urgent: 0,
    byType: {} as Record<string, number>,
  });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);

      if (isAndroid() && mobile) {
        mobileUtils.optimizeTouchInteractions();
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    loadNotificationCounts();

    // Refresh notification counts every minute
    const interval = setInterval(loadNotificationCounts, 60000);

    return () => clearInterval(interval);
  }, []);

  const loadNotificationCounts = () => {
    const notificationCounts = notificationService.getNotificationCounts();
    setCounts(notificationCounts);
  };

  const handleNotificationClick = () => {
    if (onNavigate) {
      onNavigate("notifications");
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Notification Bell Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleNotificationClick}
        className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
        style={{
          minHeight: isMobile ? "44px" : "auto",
          minWidth: isMobile ? "44px" : "auto",
        }}
      >
        <Bell className="h-5 w-5 text-gray-600" />

        {/* Notification Badge */}
        {counts.unread > 0 && (
          <span
            className={`absolute -top-1 -right-1 h-5 w-5 rounded-full text-xs font-medium text-white flex items-center justify-center ${
              counts.urgent > 0 ? "bg-red-500" : "bg-blue-500"
            }`}
          >
            {counts.unread > 99 ? "99+" : counts.unread}
          </span>
        )}
      </Button>
    </div>
  );
};
