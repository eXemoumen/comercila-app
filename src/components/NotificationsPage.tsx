import React, { useState, useEffect } from "react";
import { ArrowLeft, Bell, Settings, Check, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { notificationService } from "@/services/notificationService";
import { Notification as AppNotification } from "@/types/notifications";
import { isAndroid, mobileUtils } from "@/utils/mobileConfig";

interface NotificationsPageProps {
  onBack: () => void;
  onNavigate?: (tab: string) => void;
}

export const NotificationsPage: React.FC<NotificationsPageProps> = ({
  onBack,
  onNavigate,
}) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [counts, setCounts] = useState({
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
    loadNotifications();

    // Refresh notifications every minute
    const interval = setInterval(loadNotifications, 60000);

    return () => clearInterval(interval);
  }, []);

  const loadNotifications = () => {
    const allNotifications = notificationService.getNotifications();
    const notificationCounts = notificationService.getNotificationCounts();

    setNotifications(allNotifications);
    setCounts(notificationCounts);
  };

  const handleNotificationClick = (notification: AppNotification) => {
    // Mark as read
    notificationService.markAsRead(notification.id);

    // Navigate to action URL if provided
    if (notification.actionUrl && onNavigate) {
      const route = mapActionUrlToTab(notification.actionUrl);
      if (route) {
        onNavigate(route);
      }
    }

    loadNotifications();
  };

  const handleActionButtonClick = (
    notification: AppNotification,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();

    // Mark as read
    notificationService.markAsRead(notification.id);

    // Navigate to the correct page
    if (notification.actionUrl && onNavigate) {
      const route = mapActionUrlToTab(notification.actionUrl);
      if (route) {
        onNavigate(route);
      }
    }

    loadNotifications();
  };

  const markAllAsRead = () => {
    notificationService.markAllAsRead();
    loadNotifications();
  };

  const clearAll = () => {
    notificationService.clearAllNotifications();
    loadNotifications();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-500";
      case "high":
        return "bg-orange-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "payment_overdue":
        return "💰";
      case "virement_reminder":
        return "📅";
      case "order_scheduled":
        return "📦";
      case "order_delivered":
        return "✅";
      case "low_stock":
        return "⚠️";
      case "stock_alert":
        return "🚨";
      default:
        return "🔔";
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return date.toLocaleDateString("fr-FR");
  };

  const mapActionUrlToTab = (actionUrl: string): string => {
    // Map notification action URLs to app tab names
    switch (actionUrl) {
      case "virements":
        return "virements";
      case "stock":
        return "stock";
      case "orders":
        return "orders";
      case "supermarkets":
        return "supermarkets";
      case "add-sale":
        return "add-sale";
      default:
        // Remove leading slash if present
        return actionUrl.replace("/", "");
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="rounded-full h-9 w-9 border-gray-200"
            style={{
              minHeight: isMobile ? "44px" : "auto",
              minWidth: isMobile ? "44px" : "auto",
            }}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            <p className="text-sm text-gray-600">
              {counts.unread} non lue{counts.unread > 1 ? "s" : ""} •{" "}
              {counts.urgent} urgent{counts.urgent > 1 ? "es" : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onNavigate?.("settings")}
            className="text-gray-600 hover:text-gray-900"
            style={{
              minHeight: isMobile ? "44px" : "auto",
              minWidth: isMobile ? "44px" : "auto",
            }}
          >
            <Settings className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={markAllAsRead}
            className="text-gray-600 hover:text-gray-900"
            style={{
              minHeight: isMobile ? "44px" : "auto",
              minWidth: isMobile ? "44px" : "auto",
            }}
          >
            <Check className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={clearAll}
            className="text-gray-600 hover:text-gray-900"
            style={{
              minHeight: isMobile ? "44px" : "auto",
              minWidth: isMobile ? "44px" : "auto",
            }}
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucune notification
            </h3>
            <p className="text-gray-600">
              Vous n&apos;avez pas encore de notifications.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all cursor-pointer ${
                  !notification.isRead
                    ? "border-l-4 border-l-blue-500 bg-blue-50"
                    : ""
                }`}
                onClick={() => handleNotificationClick(notification)}
                style={{
                  minHeight: isMobile ? "100px" : "auto",
                }}
              >
                <div className="flex items-start space-x-4">
                  {/* Type Icon */}
                  <div className="flex-shrink-0 text-2xl">
                    {getTypeIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h4
                        className={`text-base font-medium ${
                          !notification.isRead
                            ? "text-gray-900"
                            : "text-gray-700"
                        }`}
                      >
                        {notification.title}
                      </h4>
                      <div className="flex items-center space-x-2">
                        {/* Priority Indicator */}
                        <div
                          className={`w-3 h-3 rounded-full ${getPriorityColor(
                            notification.priority
                          )}`}
                        />
                        <span className="text-sm text-gray-500">
                          {formatTime(notification.timestamp)}
                        </span>
                      </div>
                    </div>

                    <p className="text-gray-600 mb-4 leading-relaxed">
                      {notification.message}
                    </p>

                    {/* Action Button */}
                    {notification.actionText && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300"
                        onClick={(e) =>
                          handleActionButtonClick(notification, e)
                        }
                        style={{
                          minHeight: isMobile ? "44px" : "auto",
                          minWidth: isMobile ? "auto" : "auto",
                        }}
                      >
                        {notification.actionText}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notification Settings Modal */}
      {/* Removed NotificationSettings modal */}
    </div>
  );
};
