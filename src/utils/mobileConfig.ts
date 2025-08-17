// Mobile-specific configuration and utilities

// Extend Window interface for Capacitor
declare global {
  interface Window {
    Capacitor?: {
      Plugins?: {
        App?: {
          addListener?: (event: string, callback: () => void) => void;
        };
        StatusBar?: {
          setStyle?: (options: { style: string }) => void;
          setBackgroundColor?: (options: { color: string }) => void;
        };
        Network?: {
          getStatus?: () => Promise<{ connected: boolean; connectionType: string }>;
          addListener?: (event: string, callback: (status: { connected: boolean; connectionType: string }) => void) => void;
        };
      };
    };
  }
}

export const isMobile = () => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

export const isNativeApp = () => {
  if (typeof window === 'undefined') return false;
  return window.Capacitor !== undefined;
};

export const isAndroid = () => {
  if (typeof window === 'undefined') return false;
  return /Android/i.test(navigator.userAgent);
};

// Mobile-specific settings
export const mobileConfig = {
  // Adjust UI for mobile screens
  mobileBreakpoint: 768,
  
  // Mobile-specific navigation
  enableSwipeNavigation: true,
  
  // Touch-friendly button sizes
  minTouchTargetSize: 44,
  
  // Mobile-optimized charts
  chartHeight: 300,
  
  // Mobile-specific storage preferences - Use Supabase for Android
  useLocalStorage: false, // Changed to false to force Supabase usage
  
  // Mobile-specific API timeouts
  apiTimeout: 15000, // Increased timeout for mobile networks
  
  // Android-specific optimizations
  android: {
    // Enable hardware acceleration
    enableHardwareAcceleration: true,
    
    // Optimize for Android WebView
    webViewOptimizations: true,
    
    // Android-specific network handling
    networkRetryAttempts: 3,
    networkRetryDelay: 1000,
    
    // Android-specific storage
    useSupabase: true, // Force Supabase usage on Android
    enableOfflineCache: true,
  }
};

// Mobile-specific utility functions
export const mobileUtils = {
  // Prevent zoom on input focus (iOS)
  preventZoom: () => {
    if (typeof document !== 'undefined') {
      const viewport = document.querySelector('meta[name=viewport]');
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
      }
    }
  },

  // Add mobile-specific CSS classes
  addMobileClasses: () => {
    if (typeof document !== 'undefined' && isMobile()) {
      document.body.classList.add('mobile-app');
      if (isAndroid()) {
        document.body.classList.add('android-app');
      }
    }
  },

  // Handle mobile back button
  handleBackButton: (callback: () => void) => {
    if (typeof window !== 'undefined' && window.Capacitor?.Plugins?.App?.addListener) {
      window.Capacitor.Plugins.App.addListener('backButton', callback);
    }
  },

  // Show mobile status bar
  showStatusBar: () => {
    if (typeof window !== 'undefined' && window.Capacitor?.Plugins?.StatusBar) {
      window.Capacitor.Plugins.StatusBar.setStyle?.({ style: 'DARK' });
      window.Capacitor.Plugins.StatusBar.setBackgroundColor?.({ color: '#9F7AEA' });
    }
  },

  // Check network connectivity (Android-specific)
  checkNetworkStatus: async () => {
    if (typeof window !== 'undefined' && window.Capacitor?.Plugins?.Network?.getStatus) {
      try {
        const status = await window.Capacitor.Plugins.Network.getStatus();
        return status.connected;
      } catch (error) {
        console.warn('Network status check failed:', error);
        return navigator.onLine; // Fallback to browser API
      }
    }
    return navigator.onLine;
  },

  // Android-specific network listener
  addNetworkListener: (callback: (connected: boolean) => void) => {
    if (typeof window !== 'undefined' && window.Capacitor?.Plugins?.Network?.addListener) {
      window.Capacitor.Plugins.Network.addListener('networkStatusChange', (status) => {
        callback(status.connected);
      });
    }
  },

  // Android-specific optimizations for virements
  optimizeForVirements: () => {
    if (isAndroid()) {
      // Add Android-specific optimizations
      console.log('🔧 Applying Android-specific optimizations for virements');
      
      // Force Supabase usage on Android
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('force_supabase_android', 'true');
      }
      
      // Add Android-specific CSS classes
      document.body.classList.add('android-virements-optimized');
    }
  }
};

export default mobileConfig; 