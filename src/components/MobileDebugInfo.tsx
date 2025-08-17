import React, { useState, useEffect } from "react";
import {
  isAndroid,
  isMobile,
  getDeviceType,
  supportsTouch,
  isLandscape,
} from "@/utils/mobileConfig";

export const MobileDebugInfo: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState({
    isAndroid: false,
    isMobile: false,
    deviceType: "unknown",
    supportsTouch: false,
    isLandscape: false,
    windowWidth: 0,
    windowHeight: 0,
    userAgent: "",
  });

  useEffect(() => {
    const updateDebugInfo = () => {
      setDebugInfo({
        isAndroid: isAndroid(),
        isMobile: isMobile(),
        deviceType: getDeviceType(),
        supportsTouch: supportsTouch(),
        isLandscape: isLandscape(),
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
        userAgent: navigator.userAgent,
      });
    };

    updateDebugInfo();
    window.addEventListener("resize", updateDebugInfo);
    window.addEventListener("orientationchange", updateDebugInfo);

    return () => {
      window.removeEventListener("resize", updateDebugInfo);
      window.removeEventListener("orientationchange", updateDebugInfo);
    };
  }, []);

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-80 text-white p-4 rounded-lg text-xs max-w-xs z-50">
      <h3 className="font-bold mb-2">📱 Mobile Debug Info</h3>
      <div className="space-y-1">
        <div>🤖 Android: {debugInfo.isAndroid ? "✅ Yes" : "❌ No"}</div>
        <div>📱 Mobile: {debugInfo.isMobile ? "✅ Yes" : "❌ No"}</div>
        <div>📱 Device: {debugInfo.deviceType}</div>
        <div>👆 Touch: {debugInfo.supportsTouch ? "✅ Yes" : "❌ No"}</div>
        <div>🔄 Landscape: {debugInfo.isLandscape ? "✅ Yes" : "❌ No"}</div>
        <div>
          📏 Size: {debugInfo.windowWidth} × {debugInfo.windowHeight}
        </div>
        <div className="text-xs opacity-75 truncate">
          🌐 {debugInfo.userAgent.substring(0, 50)}...
        </div>
      </div>
    </div>
  );
};
