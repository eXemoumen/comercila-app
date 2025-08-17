import React, { useState, useEffect } from "react";
import { Bell, X, Settings, Check, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { notificationService } from "@/services/notificationService";
import {
  Notification as AppNotification,
  NotificationCounts,
} from "@/types/notifications";
import { isAndroid, mobileUtils } from "@/utils/mobileConfig";
import { NotificationSettings } from "./NotificationSettings";

interface NotificationBellProps {
  className?: string;
  onNavigate?: (tab: string) => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  className = "",
  onNavigate,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
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
      const route = notification.actionUrl.replace("/", "");
      onNavigate(route);
      setIsOpen(false);
    }

    // Close panel on mobile
    if (isMobile) {
      setIsOpen(false);
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
      const route = notification.actionUrl.replace("/", "");
      onNavigate(route);
      setIsOpen(false);
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

  return (
    <div className={`relative ${className}`}>
      {/* Notification Bell Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
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

      {/* Notification Panel */}
      {isOpen && (
        <div
          className={`absolute right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 z-50 ${
            isMobile ? "w-[calc(100vw-2rem)] max-w-sm left-4 right-4" : "w-96"
          } max-h-[80vh] overflow-hidden`}
        >
          {/* Header */}
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800 text-sm">
              Notifications ({counts.unread})
            </h3>
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(true)}
                className="text-xs p-1 h-6 hover:bg-gray-200"
                style={{
                  minHeight: isMobile ? "32px" : "auto",
                  minWidth: isMobile ? "32px" : "auto",
                }}
              >
                <Settings className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs p-1 h-6 hover:bg-gray-200"
                style={{
                  minHeight: isMobile ? "32px" : "auto",
                  minWidth: isMobile ? "auto" : "auto",
                }}
              >
                <Check className="h-3 w-3 mr-1" />
                <span className={isMobile ? "hidden" : "inline"}>
                  Tout lire
                </span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                className="text-xs p-1 h-6 text-red-600 hover:text-red-700 hover:bg-red-50"
                style={{
                  minHeight: isMobile ? "32px" : "auto",
                  minWidth: isMobile ? "auto" : "auto",
                }}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                <span className={isMobile ? "hidden" : "inline"}>Effacer</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="text-xs p-1 h-6 hover:bg-gray-200"
                style={{
                  minHeight: isMobile ? "32px" : "auto",
                  minWidth: isMobile ? "32px" : "auto",
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-[calc(80vh-120px)] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <Bell className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">Aucune notification</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      !notification.isRead ? "bg-blue-50" : ""
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                    style={{
                      minHeight: isMobile ? "80px" : "auto",
                    }}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Type Icon */}
                      <div className="flex-shrink-0 text-lg">
                        {getTypeIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h4
                            className={`text-sm font-medium ${
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
                              className={`w-2 h-2 rounded-full ${getPriorityColor(
                                notification.priority
                              )}`}
                            />
                            <span className="text-xs text-gray-500">
                              {formatTime(notification.timestamp)}
                            </span>
                          </div>
                        </div>

                        <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                          {notification.message}
                        </p>

                        {/* Action Button */}
                        {notification.actionText && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-7 px-3 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300"
                            onClick={(e) =>
                              handleActionButtonClick(notification, e)
                            }
                            style={{
                              minHeight: isMobile ? "36px" : "auto",
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

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 text-center">
              <p className="text-xs text-gray-500">
                {counts.unread} non lue{counts.unread > 1 ? "s" : ""} •{" "}
                {counts.urgent} urgent{counts.urgent > 1 ? "es" : ""}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Backdrop for mobile */}
      {isOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black bg-opacity-25 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Notification Settings Modal */}
      <NotificationSettings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  );
};
