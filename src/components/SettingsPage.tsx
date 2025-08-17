import React, { useState, useEffect } from "react";
import {
  Settings,
  Bell,
  Volume2,
  Smartphone,
  Shield,
  ArrowLeft,
  TestTube,
  AlertTriangle,
  Info,
  Zap,
  Smartphone as PhoneIcon,
  Globe,
} from "lucide-react";
import { Button } from "./ui/button";
import { notificationService } from "@/services/notificationService";
import { nativeNotificationService } from "@/services/nativeNotificationService";
import { NotificationSettings as NotificationSettingsType } from "@/types/notifications";
import { isAndroid, mobileUtils } from "@/utils/mobileConfig";
import { Capacitor } from "@capacitor/core";

interface SettingsPageProps {
  onBack: () => void;
  onNavigate: (tab: string) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  onBack,
  onNavigate,
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
  const [testResults, setTestResults] = useState<{
    browser: boolean;
    native: boolean;
    permission: boolean;
    platform: string;
  }>({
    browser: false,
    native: false,
    permission: false,
    platform: "unknown",
  });

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
    loadSettings();
    checkPermissionStatus();
    runPlatformTests();
  }, []);

  const loadSettings = () => {
    const currentSettings = notificationService.getSettings();
    setSettings(currentSettings);
  };

  const checkPermissionStatus = () => {
    if ("Notification" in window) {
      setPermissionStatus(Notification.permission);
    }
  };

  const runPlatformTests = () => {
    const platform = Capacitor.isNativePlatform() ? "native" : "web";
    const permission =
      "Notification" in window ? Notification.permission : "denied";

    setTestResults({
      browser: "Notification" in window,
      native: Capacitor.isNativePlatform(),
      permission: permission === "granted",
      platform,
    });
  };

  const handleSettingChange = (
    key: keyof NotificationSettingsType,
    value: boolean
  ) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    notificationService.updateSettings(newSettings);
    nativeNotificationService.updateSettings(newSettings);
  };

  const requestNotificationPermission = async () => {
    try {
      console.log("Requesting notification permission...");
      const granted = await nativeNotificationService.requestPermission();

      if (granted) {
        setPermissionStatus("granted");
        setTestResults((prev) => ({ ...prev, permission: true }));
        alert("✅ Notifications autorisées avec succès!");
      } else {
        alert(
          "❌ Impossible d'autoriser les notifications. Vérifiez les paramètres de votre appareil."
        );
      }
    } catch (error) {
      console.error("Error requesting permission:", error);
      alert("❌ Erreur lors de la demande d'autorisation des notifications.");
    }
  };

  const testBrowserNotification = async () => {
    try {
      // Create a test notification using the browser API directly
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Test Notification", {
          body: "Ceci est un test de notification navigateur!",
          icon: "/favicon.ico",
        });
        alert("✅ Notification navigateur testée avec succès!");
      } else {
        alert(
          "❌ Notifications navigateur non autorisées. Cliquez sur 'Autoriser' d'abord."
        );
      }
    } catch {
      alert("❌ Erreur lors du test de notification navigateur.");
    }
  };

  const testNativeNotification = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        await nativeNotificationService.testNativeNotification();
        alert(
          "✅ Notification native testée avec succès! Vérifiez votre barre de notifications."
        );
      } catch {
        alert("❌ Erreur lors du test de notification native.");
      }
    } else {
      alert(
        "ℹ️ Notifications natives non supportées sur le web. Testez sur Android pour voir les notifications système."
      );
    }
  };

  const testAllNotifications = async () => {
    const results = [];

    // Test browser notification
    try {
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Test Complet", {
          body: "Test de notification navigateur",
          icon: "/favicon.ico",
        });
        results.push("✅ Navigateur");
      } else {
        results.push("❌ Navigateur (non autorisé)");
      }
    } catch {
      results.push("❌ Navigateur");
    }

    // Test native notification
    if (Capacitor.isNativePlatform()) {
      try {
        await nativeNotificationService.testNativeNotification();
        results.push("✅ Native");
      } catch {
        results.push("❌ Native");
      }
    } else {
      results.push("ℹ️ Native (non supporté sur web)");
    }

    alert(`Tests terminés:\n${results.join("\n")}`);
  };

  const resetSettings = () => {
    const defaultSettings = {
      paymentDue: true,
      orderUpdates: true,
      stockAlerts: true,
      virementReminders: true,
      systemNotifications: true,
      soundEnabled: true,
      vibrationEnabled: true,
      pushNotifications: true,
    };
    setSettings(defaultSettings);
    notificationService.updateSettings(defaultSettings);
    nativeNotificationService.updateSettings(defaultSettings);
    alert("✅ Paramètres réinitialisés!");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={onBack}
                className="text-gray-600 hover:text-gray-900"
                style={{
                  minHeight: isMobile ? "44px" : "auto",
                  minWidth: isMobile ? "44px" : "auto",
                }}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center space-x-3">
                <div className="bg-blue-600 rounded-lg p-2">
                  <Settings className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    Paramètres
                  </h1>
                  <p className="text-sm text-gray-500">Gérez vos préférences</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Notification Settings */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
              <div className="flex items-center space-x-3">
                <Bell className="h-6 w-6 text-white" />
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    Notifications
                  </h2>
                  <p className="text-sm text-blue-100">
                    Personnalisez vos alertes
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Notification Types */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-blue-600" />
                  <span>Types de Notifications</span>
                </h3>

                <div className="grid gap-3">
                  {[
                    {
                      key: "paymentDue" as keyof NotificationSettingsType,
                      label: "Paiements en retard",
                      description: "Alertes pour les paiements manqués",
                      color: "bg-red-500",
                      icon: AlertTriangle,
                    },
                    {
                      key: "orderUpdates" as keyof NotificationSettingsType,
                      label: "Mises à jour des commandes",
                      description: "Statut des commandes et livraisons",
                      color: "bg-orange-500",
                      icon: Info,
                    },
                    {
                      key: "stockAlerts" as keyof NotificationSettingsType,
                      label: "Alertes de stock",
                      description: "Stock faible et critique",
                      color: "bg-yellow-500",
                      icon: AlertTriangle,
                    },
                    {
                      key: "virementReminders" as keyof NotificationSettingsType,
                      label: "Rappels de virement",
                      description: "Suivi des paiements échelonnés",
                      color: "bg-blue-500",
                      icon: Bell,
                    },
                  ].map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center space-x-3 flex-1">
                        <div
                          className={`w-3 h-3 ${item.color} rounded-full flex-shrink-0`}
                        ></div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-800 text-sm">
                            {item.label}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            {item.description}
                          </p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings[item.key]}
                        onChange={(e) =>
                          handleSettingChange(item.key, e.target.checked)
                        }
                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 flex-shrink-0"
                        style={{
                          minHeight: isMobile ? "20px" : "auto",
                          minWidth: isMobile ? "20px" : "auto",
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Notification Preferences */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
                  <Volume2 className="h-5 w-5 text-green-600" />
                  <span>Préférences</span>
                </h3>

                <div className="grid gap-3">
                  {[
                    {
                      key: "soundEnabled" as keyof NotificationSettingsType,
                      label: "Sons",
                      description: "Jouer un son pour les notifications",
                      icon: Volume2,
                      color: "text-green-600",
                    },
                    {
                      key: "vibrationEnabled" as keyof NotificationSettingsType,
                      label: "Vibration",
                      description: "Vibrer sur mobile",
                      icon: Smartphone,
                      color: "text-purple-600",
                    },
                  ].map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center space-x-3 flex-1">
                        <item.icon
                          className={`h-4 w-4 ${item.color} flex-shrink-0`}
                        />
                        <div className="min-w-0">
                          <p className="font-medium text-gray-800 text-sm">
                            {item.label}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            {item.description}
                          </p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings[item.key]}
                        onChange={(e) =>
                          handleSettingChange(item.key, e.target.checked)
                        }
                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 flex-shrink-0"
                        style={{
                          minHeight: isMobile ? "20px" : "auto",
                          minWidth: isMobile ? "20px" : "auto",
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Permission Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  <span>Autorisations</span>
                </h3>

                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      <Shield className="h-4 w-4 text-blue-600 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-gray-800 text-sm">
                          Notifications système
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          Statut:{" "}
                          {permissionStatus === "granted"
                            ? "✅ Autorisé"
                            : "❌ Non autorisé"}
                        </p>
                      </div>
                    </div>
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
          </div>

          {/* Testing & System Info */}
          <div className="space-y-6">
            {/* Testing Panel */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
                <div className="flex items-center space-x-3">
                  <TestTube className="h-6 w-6 text-white" />
                  <div>
                    <h2 className="text-lg font-semibold text-white">
                      Tests & Diagnostics
                    </h2>
                    <p className="text-sm text-green-100">
                      Vérifiez le fonctionnement
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {/* Platform Info */}
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h3 className="font-medium text-gray-800 mb-2">
                    Informations système
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <Globe className="h-4 w-4 text-gray-500" />
                      <span>Plateforme: {testResults.platform}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <PhoneIcon className="h-4 w-4 text-gray-500" />
                      <span>
                        Notifications natives:{" "}
                        {testResults.native ? "✅ Supporté" : "❌ Non supporté"}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Shield className="h-4 w-4 text-gray-500" />
                      <span>
                        Autorisation:{" "}
                        {testResults.permission ? "✅ Accordée" : "❌ Refusée"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Test Buttons */}
                <div className="space-y-3">
                  <Button
                    onClick={testBrowserNotification}
                    variant="outline"
                    className="w-full flex items-center justify-center space-x-2 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                    style={{
                      minHeight: isMobile ? "44px" : "auto",
                    }}
                  >
                    <Globe className="h-4 w-4" />
                    <span>Test Notification Navigateur</span>
                  </Button>

                  <Button
                    onClick={testNativeNotification}
                    className="w-full flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 text-white"
                    style={{
                      minHeight: isMobile ? "44px" : "auto",
                    }}
                  >
                    <Smartphone className="h-4 w-4" />
                    <span>Test Notification Native</span>
                  </Button>

                  <Button
                    onClick={testAllNotifications}
                    variant="outline"
                    className="w-full flex items-center justify-center space-x-2 bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
                    style={{
                      minHeight: isMobile ? "44px" : "auto",
                    }}
                  >
                    <TestTube className="h-4 w-4" />
                    <span>Test Complet</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Actions Panel */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-orange-600 to-orange-700 px-6 py-4">
                <div className="flex items-center space-x-3">
                  <Settings className="h-6 w-6 text-white" />
                  <div>
                    <h2 className="text-lg font-semibold text-white">
                      Actions
                    </h2>
                    <p className="text-sm text-orange-100">
                      Gérez vos paramètres
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <Button
                  onClick={resetSettings}
                  variant="outline"
                  className="w-full flex items-center justify-center space-x-2 bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100"
                  style={{
                    minHeight: isMobile ? "44px" : "auto",
                  }}
                >
                  <Settings className="h-4 w-4" />
                  <span>Réinitialiser les paramètres</span>
                </Button>

                <Button
                  onClick={() => onNavigate("notifications")}
                  variant="outline"
                  className="w-full flex items-center justify-center space-x-2 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                  style={{
                    minHeight: isMobile ? "44px" : "auto",
                  }}
                >
                  <Bell className="h-4 w-4" />
                  <span>Voir les notifications</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
