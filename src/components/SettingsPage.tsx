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
  Globe,
  CheckCircle2,
  XCircle,
  RefreshCw,
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
  const [, setIsMobile] = useState(false);
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
      const granted = await nativeNotificationService.requestPermission();

      if (granted) {
        setPermissionStatus("granted");
        setTestResults((prev) => ({ ...prev, permission: true }));
        alert("✅ Notifications autorisées avec succès!");
      } else {
        alert("❌ Impossible d'autoriser les notifications.");
      }
    } catch (error) {
      console.error("Error requesting permission:", error);
      alert("❌ Erreur lors de la demande d'autorisation.");
    }
  };

  const testBrowserNotification = async () => {
    try {
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Test Notification", {
          body: "Ceci est un test de notification navigateur!",
          icon: "/favicon.ico",
        });
        alert("✅ Notification navigateur testée avec succès!");
      } else {
        alert("❌ Notifications navigateur non autorisées.");
      }
    } catch {
      alert("❌ Erreur lors du test de notification navigateur.");
    }
  };

  const testNativeNotification = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        await nativeNotificationService.testNativeNotification();
        alert("✅ Notification native testée avec succès!");
      } catch {
        alert("❌ Erreur lors du test de notification native.");
      }
    } else {
      alert("ℹ️ Notifications natives non supportées sur le web.");
    }
  };

  const testAllNotifications = async () => {
    const results = [];

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

  const notificationTypes = [
    {
      key: "paymentDue" as keyof NotificationSettingsType,
      label: "Paiements en retard",
      description: "Alertes pour les paiements manqués",
      color: "from-red-500 to-rose-500",
      bgColor: "bg-red-100",
      textColor: "text-red-600",
    },
    {
      key: "orderUpdates" as keyof NotificationSettingsType,
      label: "Mises à jour des commandes",
      description: "Statut des commandes et livraisons",
      color: "from-orange-500 to-amber-500",
      bgColor: "bg-orange-100",
      textColor: "text-orange-600",
    },
    {
      key: "stockAlerts" as keyof NotificationSettingsType,
      label: "Alertes de stock",
      description: "Stock faible et critique",
      color: "from-amber-500 to-yellow-500",
      bgColor: "bg-amber-100",
      textColor: "text-amber-600",
    },
    {
      key: "virementReminders" as keyof NotificationSettingsType,
      label: "Rappels de virement",
      description: "Suivi des paiements échelonnés",
      color: "from-blue-500 to-indigo-500",
      bgColor: "bg-blue-100",
      textColor: "text-blue-600",
    },
  ];

  return (
    <div className="space-y-6 pb-24">
      {/* Premium Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="rounded-xl hover:bg-white/80 transition-all"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center shadow-lg">
            <Settings className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Paramètres</h1>
            <p className="text-sm text-gray-500">Gérez vos préférences</p>
          </div>
        </div>
      </div>

      {/* Notification Settings Card */}
      <div className="premium-card overflow-hidden animate-fade-in-up">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Bell className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Notifications</h2>
              <p className="text-sm text-blue-100">Personnalisez vos alertes</p>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-5">
          {/* Notification Types */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Zap className="h-4 w-4 text-blue-600" />
              <h3 className="font-semibold text-gray-800">Types de Notifications</h3>
            </div>

            <div className="space-y-2">
              {notificationTypes.map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg ${item.bgColor} flex items-center justify-center`}>
                      <div className={`w-2.5 h-2.5 rounded-full bg-gradient-to-r ${item.color}`} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 text-sm">{item.label}</p>
                      <p className="text-xs text-gray-500">{item.description}</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings[item.key]}
                      onChange={(e) => handleSettingChange(item.key, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Preferences */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Volume2 className="h-4 w-4 text-emerald-600" />
              <h3 className="font-semibold text-gray-800">Préférences</h3>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <Volume2 className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 text-sm">Sons</p>
                    <p className="text-xs text-gray-500">Jouer un son pour les notifications</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.soundEnabled}
                    onChange={(e) => handleSettingChange("soundEnabled", e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Smartphone className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 text-sm">Vibration</p>
                    <p className="text-xs text-gray-500">Vibrer sur mobile</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.vibrationEnabled}
                    onChange={(e) => handleSettingChange("vibrationEnabled", e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Permission Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Shield className="h-4 w-4 text-blue-600" />
              <h3 className="font-semibold text-gray-800">Autorisations</h3>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    permissionStatus === "granted" ? "bg-emerald-100" : "bg-amber-100"
                  }`}>
                    {permissionStatus === "granted" ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-amber-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">Notifications système</p>
                    <p className={`text-sm ${
                      permissionStatus === "granted" ? "text-emerald-600" : "text-amber-600"
                    }`}>
                      {permissionStatus === "granted" ? "✅ Autorisé" : "❌ Non autorisé"}
                    </p>
                  </div>
                </div>
                {permissionStatus !== "granted" && (
                  <Button
                    size="sm"
                    onClick={requestNotificationPermission}
                    className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Autoriser
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Testing & Diagnostics Card */}
      <div className="premium-card overflow-hidden animate-fade-in-up stagger-1">
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <TestTube className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Tests & Diagnostics</h2>
              <p className="text-sm text-emerald-100">Vérifiez le fonctionnement</p>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Platform Info */}
          <div className="p-4 rounded-xl bg-gray-50">
            <h3 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
              <Info className="h-4 w-4 text-gray-500" />
              Informations système
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Plateforme
                </span>
                <span className="font-medium text-gray-800 capitalize">{testResults.platform}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  Notifications natives
                </span>
                <span className={`font-medium flex items-center gap-1 ${
                  testResults.native ? "text-emerald-600" : "text-gray-400"
                }`}>
                  {testResults.native ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Supporté
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4" />
                      Non supporté
                    </>
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Autorisation
                </span>
                <span className={`font-medium flex items-center gap-1 ${
                  testResults.permission ? "text-emerald-600" : "text-red-600"
                }`}>
                  {testResults.permission ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Accordée
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4" />
                      Refusée
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Test Buttons */}
          <div className="space-y-2">
            <Button
              onClick={testBrowserNotification}
              variant="outline"
              className="w-full h-11 rounded-xl border-2 border-blue-200 text-blue-700 hover:bg-blue-50 font-medium"
            >
              <Globe className="h-4 w-4 mr-2" />
              Test Notification Navigateur
            </Button>

            <Button
              onClick={testNativeNotification}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-medium shadow-lg shadow-emerald-500/25"
            >
              <Smartphone className="h-4 w-4 mr-2" />
              Test Notification Native
            </Button>

            <Button
              onClick={testAllNotifications}
              variant="outline"
              className="w-full h-11 rounded-xl border-2 border-purple-200 text-purple-700 hover:bg-purple-50 font-medium"
            >
              <TestTube className="h-4 w-4 mr-2" />
              Test Complet
            </Button>
          </div>
        </div>
      </div>

      {/* Actions Card */}
      <div className="premium-card overflow-hidden animate-fade-in-up stagger-2">
        <div className="bg-gradient-to-r from-orange-500 to-amber-600 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Settings className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Actions</h2>
              <p className="text-sm text-orange-100">Gérez vos paramètres</p>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-2">
          <Button
            onClick={resetSettings}
            variant="outline"
            className="w-full h-11 rounded-xl border-2 border-orange-200 text-orange-700 hover:bg-orange-50 font-medium"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Réinitialiser les paramètres
          </Button>

          <Button
            onClick={() => onNavigate("notifications")}
            variant="outline"
            className="w-full h-11 rounded-xl border-2 border-blue-200 text-blue-700 hover:bg-blue-50 font-medium"
          >
            <Bell className="h-4 w-4 mr-2" />
            Voir les notifications
          </Button>
        </div>
      </div>
    </div>
  );
};
