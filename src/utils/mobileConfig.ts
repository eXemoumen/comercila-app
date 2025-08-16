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
  
  // Mobile-specific storage preferences
  useLocalStorage: true,
  
  // Mobile-specific API timeouts
  apiTimeout: 10000,
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
};

export default mobileConfig; 