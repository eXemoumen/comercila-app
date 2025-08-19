import React, { useState, useEffect } from "react";
import {
  Settings,
  Bell,
  Volume2,
  Smartphone,
  Shield,
  X,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Button } from "./ui/button";
import { notificationService } from "@/services/notificationService";
import { nativeNotificationService } from "@/services/nativeNotificationService";
import { NotificationSettings as NotificationSettingsType } from "@/types/notifications";
import { isAndroid, mobileUtils } from "@/utils/mobileConfig";
import { Capacitor } from "@capacitor/core";

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
  const [isNativePlatform, setIsNativePlatform] = useState(false);
  const [testStatus, setTestStatus] = useState<{
    type: "success" | "error" | "info" | null;
    message: string;
  }>({ type: null, message: "" });

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
      setIsNativePlatform(Capacitor.isNativePlatform());
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
    try {
      
      setTestStatus({
        type: "info",
        message: "Demande d'autorisation en cours...",
      });

      const granted = await nativeNotificationService.requestPermission();

      if (granted) {
        setPermissionStatus("granted");
        setTestStatus({
          type: "success",
          message:
            "Notifications autorisées avec succès! Vous pouvez maintenant tester les notifications natives.",
        });

        // Clear status after 3 seconds
        setTimeout(() => setTestStatus({ type: null, message: "" }), 3000);
      } else {
        setTestStatus({
          type: "error",
          message:
            "Impossible d'autoriser les notifications. Vérifiez les paramètres de votre appareil.",
        });

        // Clear status after 5 seconds
        setTimeout(() => setTestStatus({ type: null, message: "" }), 5000);
      }
    } catch (error) {
      console.error("Error requesting permission:", error);
      setTestStatus({
        type: "error",
        message: "Erreur lors de la demande d'autorisation des notifications.",
      });

      // Clear status after 5 seconds
      setTimeout(() => setTestStatus({ type: null, message: "" }), 5000);
    }
  };

  const testNotification = async () => {
    try {
      setTestStatus({
        type: "info",
        message: "Envoi de la notification de test...",
      });
      await nativeNotificationService.testNotification();
      setTestStatus({
        type: "success",
        message:
          "Notification de test envoyée! Vérifiez votre centre de notifications.",
      });

      // Clear status after 3 seconds
      setTimeout(() => setTestStatus({ type: null, message: "" }), 3000);
    } catch {
      setTestStatus({
        type: "error",
        message: "Erreur lors de l'envoi de la notification de test.",
      });

      // Clear status after 5 seconds
      setTimeout(() => setTestStatus({ type: null, message: "" }), 5000);
    }
  };

  const testNativeNotification = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        setTestStatus({
          type: "info",
          message: "Envoi de la notification native...",
        });
        await nativeNotificationService.testNativeNotification();
        setTestStatus({
          type: "success",
          message:
            "Notification native envoyée! Elle devrait apparaître en dehors de l&apos;app.",
        });

        // Clear status after 3 seconds
        setTimeout(() => setTestStatus({ type: null, message: "" }), 3000);
      } catch {
        setTestStatus({
          type: "error",
          message: "Erreur lors de l'envoi de la notification native.",
        });

        // Clear status after 5 seconds
        setTimeout(() => setTestStatus({ type: null, message: "" }), 5000);
      }
    } else {
      setTestStatus({
        type: "error",
        message:
          "Notifications natives non supportées sur le web. Testez sur Android pour voir les notifications système.",
      });

      // Clear status after 5 seconds
      setTimeout(() => setTestStatus({ type: null, message: "" }), 5000);
    }
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
          {/* Status Messages */}
          {testStatus.type && (
            <div
              className={`p-4 rounded-lg border ${
                testStatus.type === "success"
                  ? "bg-green-50 border-green-200 text-green-800"
                  : testStatus.type === "error"
                  ? "bg-red-50 border-red-200 text-red-800"
                  : "bg-blue-50 border-blue-200 text-blue-800"
              }`}
            >
              <div className="flex items-center space-x-2">
                {testStatus.type === "success" ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : testStatus.type === "error" ? (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                ) : (
                  <Bell className="h-5 w-5 text-blue-600" />
                )}
                <span className="text-sm font-medium">
                  {testStatus.message}
                </span>
              </div>
            </div>
          )}

          {/* Platform Info */}
          {isNativePlatform && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <Smartphone className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-800">
                  Plateforme native détectée - Notifications système disponibles
                </span>
              </div>
            </div>
          )}

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
            <div className="flex flex-col space-y-3">
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

              <Button
                onClick={testNativeNotification}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                style={{
                  minHeight: isMobile ? "44px" : "auto",
                }}
              >
                <Smartphone className="h-4 w-4 mr-2" />
                Tester notification native
              </Button>
            </div>

            {isNativePlatform && (
              <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg">
                <p>
                  <strong>Note:</strong> Les notifications natives apparaissent
                  en dehors de l&apos;application, comme les notifications
                  d&apos;Instagram et Facebook. Assurez-vous que les
                  notifications sont activées dans les paramètres de votre
                  appareil.
                </p>
              </div>
            )}
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
