import React, { useState, useEffect } from "react";
import { Settings, Bell, Volume2, Smartphone, Shield, X } from "lucide-react";
import { Button } from "./ui/button";
import { notificationService } from "@/services/notificationService";
import { NotificationSettings as NotificationSettingsType } from "@/types/notifications";
import { isAndroid, mobileUtils } from "@/utils/mobileConfig";

interface NotificationSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  isOpen,
  onClose,
}) => {
  const [settings, setSettings] = useState<NotificationSettingsType>({
    paymentDue: true,
    orderUpdates: true,
    stockAlerts: true,
    virementReminders: true,
    systemNotifications: true,
    soundEnabled: true,
    vibrationEnabled: true,
    pushNotifications: true,
  });
  const [isMobile, setIsMobile] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<string>("default");

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
    if (isOpen) {
      loadSettings();
      checkPermissionStatus();
    }
  }, [isOpen]);

  const loadSettings = () => {
    const currentSettings = notificationService.getSettings();
    setSettings(currentSettings);
  };

  const checkPermissionStatus = () => {
    if ("Notification" in window) {
      setPermissionStatus(Notification.permission);
    }
  };

  const handleSettingChange = (
    key: keyof NotificationSettingsType,
    value: boolean
  ) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    notificationService.updateSettings(newSettings);
  };

  const requestNotificationPermission = async () => {
    const granted = await notificationService.requestPermission();
    if (granted) {
      setPermissionStatus("granted");
    }
  };

  const testNotification = () => {
    const testNotification = {
      id: "test",
      type: "system" as const,
      title: "Test de notification",
      message:
        "Ceci est un test de notification pour vérifier que tout fonctionne correctement.",
      priority: "medium" as const,
      timestamp: new Date().toISOString(),
      isRead: false,
      isDismissed: false,
    };

    notificationService.addNotification(testNotification);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div
        className={`bg-white rounded-xl w-full h-full max-h-[95vh] overflow-hidden ${
          isMobile ? "max-w-none mx-0" : "max-w-2xl"
        }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white bg-opacity-20 rounded-full p-2">
                <Settings className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold">
                  Paramètres des Notifications
                </h2>
                <p className="text-sm text-blue-100">
                  Personnalisez vos alertes
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full"
              style={{
                minHeight: isMobile ? "44px" : "auto",
                minWidth: isMobile ? "44px" : "auto",
              }}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-4 space-y-6 max-h-[calc(95vh-80px)]">
          {/* Notification Types */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
              <Bell className="h-5 w-5 text-blue-600" />
              <span>Types de Notifications</span>
            </h3>

            <div className="grid gap-3">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center space-x-3 flex-1">
                  <div className="w-3 h-3 bg-red-500 rounded-full flex-shrink-0"></div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-800 text-sm">
                      Paiements en retard
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Alertes pour les paiements manqués
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.paymentDue}
                  onChange={(e) =>
                    handleSettingChange("paymentDue", e.target.checked)
                  }
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 flex-shrink-0"
                  style={{
                    minHeight: isMobile ? "20px" : "auto",
                    minWidth: isMobile ? "20px" : "auto",
                  }}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center space-x-3 flex-1">
                  <div className="w-3 h-3 bg-orange-500 rounded-full flex-shrink-0"></div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-800 text-sm">
                      Mises à jour des commandes
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Statut des commandes et livraisons
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.orderUpdates}
                  onChange={(e) =>
                    handleSettingChange("orderUpdates", e.target.checked)
                  }
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 flex-shrink-0"
                  style={{
                    minHeight: isMobile ? "20px" : "auto",
                    minWidth: isMobile ? "20px" : "auto",
                  }}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center space-x-3 flex-1">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full flex-shrink-0"></div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-800 text-sm">
                      Alertes de stock
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Stock faible et critique
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.stockAlerts}
                  onChange={(e) =>
                    handleSettingChange("stockAlerts", e.target.checked)
                  }
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 flex-shrink-0"
                  style={{
                    minHeight: isMobile ? "20px" : "auto",
                    minWidth: isMobile ? "20px" : "auto",
                  }}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center space-x-3 flex-1">
                  <div className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0"></div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-800 text-sm">
                      Rappels de virement
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Suivi des paiements échelonnés
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.virementReminders}
                  onChange={(e) =>
                    handleSettingChange("virementReminders", e.target.checked)
                  }
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 flex-shrink-0"
                  style={{
                    minHeight: isMobile ? "20px" : "auto",
                    minWidth: isMobile ? "20px" : "auto",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Notification Preferences */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
              <Volume2 className="h-5 w-5 text-green-600" />
              <span>Préférences</span>
            </h3>

            <div className="grid gap-3">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center space-x-3 flex-1">
                  <Volume2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-gray-800 text-sm">Sons</p>
                    <p className="text-xs text-gray-600 mt-1">
                      Jouer un son pour les notifications
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.soundEnabled}
                  onChange={(e) =>
                    handleSettingChange("soundEnabled", e.target.checked)
                  }
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 flex-shrink-0"
                  style={{
                    minHeight: isMobile ? "20px" : "auto",
                    minWidth: isMobile ? "20px" : "auto",
                  }}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center space-x-3 flex-1">
                  <Smartphone className="h-4 w-4 text-purple-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-gray-800 text-sm">
                      Vibration
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Vibrer sur mobile
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.vibrationEnabled}
                  onChange={(e) =>
                    handleSettingChange("vibrationEnabled", e.target.checked)
                  }
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 flex-shrink-0"
                  style={{
                    minHeight: isMobile ? "20px" : "auto",
                    minWidth: isMobile ? "20px" : "auto",
                  }}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center space-x-3 flex-1">
                  <Shield className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-gray-800 text-sm">
                      Notifications push
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Notifications du navigateur
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={settings.pushNotifications}
                    onChange={(e) =>
                      handleSettingChange("pushNotifications", e.target.checked)
                    }
                    disabled={permissionStatus !== "granted"}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 disabled:opacity-50"
                    style={{
                      minHeight: isMobile ? "20px" : "auto",
                      minWidth: isMobile ? "20px" : "auto",
                    }}
                  />
                  {permissionStatus !== "granted" && (
                    <Button
                      size="sm"
                      onClick={requestNotificationPermission}
                      className="text-xs h-8 px-3 bg-blue-600 hover:bg-blue-700 text-white"
                      style={{
                        minHeight: isMobile ? "32px" : "auto",
                        minWidth: isMobile ? "auto" : "auto",
                      }}
                    >
                      Autoriser
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Test Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Test</h3>
            <div className="flex space-x-3">
              <Button
                onClick={testNotification}
                variant="outline"
                className="flex items-center space-x-2 bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:border-green-300"
                style={{
                  minHeight: isMobile ? "44px" : "auto",
                  minWidth: isMobile ? "auto" : "auto",
                }}
              >
                <Bell className="h-4 w-4" />
                <span>Tester les notifications</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-4 py-4 border-t border-gray-200">
          <div className="flex justify-end">
            <Button
              onClick={onClose}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              style={{
                minHeight: isMobile ? "44px" : "auto",
                minWidth: isMobile ? "auto" : "auto",
              }}
            >
              Fermer
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
