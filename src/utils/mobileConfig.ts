// Mobile configuration utilities for Android compatibility and responsive design

/**
 * Detect if the current device is Android
 */
export function isAndroid(): boolean {
  if (typeof window === 'undefined') return false;
  
  const userAgent = window.navigator.userAgent.toLowerCase();
  const isAndroidDevice = userAgent.includes('android');
  
  // Debug logging
  console.log('🔍 Mobile Detection Debug:', {
    userAgent: window.navigator.userAgent,
    isAndroid: isAndroidDevice,
    windowWidth: window.innerWidth,
    windowHeight: window.innerHeight
  });
  
  return isAndroidDevice;
}

/**
 * Detect if the current device is mobile
 */
export function isMobile(): boolean {
  if (typeof window === 'undefined') return false;
  
  const mobile = window.innerWidth < 768;
  
  // Debug logging
  console.log('📱 Mobile Check:', {
    width: window.innerWidth,
    isMobile: mobile,
    breakpoint: 768
  });
  
  return mobile;
}

/**
 * Detect if the current device is a tablet
 */
export function isTablet(): boolean {
  if (typeof window === 'undefined') return false;
  const width = window.innerWidth;
  return width >= 768 && width < 1024;
}

/**
 * Detect if the current device is desktop
 */
export function isDesktop(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= 1024;
}

/**
 * Get the current device type
 */
export function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (isMobile()) return 'mobile';
  if (isTablet()) return 'tablet';
  return 'desktop';
}

/**
 * Check if the device supports touch
 */
export function supportsTouch(): boolean {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/**
 * Check if the device is in landscape mode
 */
export function isLandscape(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth > window.innerHeight;
}

/**
 * Get the current viewport dimensions
 */
export function getViewportDimensions() {
  if (typeof window === 'undefined') return { width: 0, height: 0 };
  
  return {
    width: window.innerWidth,
    height: window.innerHeight,
    scrollWidth: document.documentElement.scrollWidth,
    scrollHeight: document.documentElement.scrollHeight
  };
}

/**
 * Mobile utilities for virement system optimization
 */
export const mobileUtils = {
  /**
   * Optimize the virement system for mobile devices
   */
  optimizeForVirements() {
    console.log('📱 Applying mobile optimizations for virements...');
    
    // Add mobile-specific CSS classes
    document.body.classList.add('mobile-virements');
    
    // Optimize touch interactions
    this.optimizeTouchInteractions();
    
    // Optimize scrolling
    this.optimizeScrolling();
    
    // Add mobile-specific event listeners
    this.addMobileEventListeners();
    
    console.log('✅ Mobile optimizations applied');
  },

  /**
   * Optimize touch interactions for better mobile UX
   */
  optimizeTouchInteractions() {
    // Increase touch target sizes
    const touchTargets = document.querySelectorAll('button, [role="button"], .cursor-pointer');
    touchTargets.forEach(target => {
      if (target instanceof HTMLElement) {
        target.style.minHeight = '44px';
        target.style.minWidth = '44px';
      }
    });

    // Add touch feedback
    const addTouchFeedback = (element: Element) => {
      element.addEventListener('touchstart', () => {
        element.classList.add('touch-active');
      });
      
      element.addEventListener('touchend', () => {
        setTimeout(() => {
          element.classList.remove('touch-active');
        }, 150);
      });
    };

    // Apply to clickable elements
    document.querySelectorAll('.cursor-pointer, button, [role="button"]').forEach(addTouchFeedback);
  },

  /**
   * Optimize scrolling for mobile devices
   */
  optimizeScrolling() {
    // Enable smooth scrolling on mobile
    if ('scrollBehavior' in document.documentElement.style) {
      document.documentElement.style.scrollBehavior = 'smooth';
    }

    // Optimize modal scrolling
    const modals = document.querySelectorAll('.modal, [role="dialog"]');
    modals.forEach(modal => {
      if (modal instanceof HTMLElement) {
        modal.style.webkitOverflowScrolling = 'touch';
        modal.style.overscrollBehavior = 'contain';
      }
    });
  },

  /**
   * Add mobile-specific event listeners
   */
  addMobileEventListeners() {
    // Handle orientation changes
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        this.handleOrientationChange();
      }, 100);
    });

    // Handle viewport resize
    let resizeTimeout: NodeJS.Timeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        this.handleViewportResize();
      }, 250);
    });

    // Handle back button on mobile
    if (isAndroid()) {
      this.handleAndroidBackButton();
    }
  },

  /**
   * Handle orientation change for mobile devices
   */
  handleOrientationChange() {
    console.log('📱 Orientation changed, adjusting layout...');
    
    // Recalculate mobile state
    const newMobileState = isMobile();
    
    // Adjust modal sizes if needed
    const modals = document.querySelectorAll('.modal, [role="dialog"]');
    modals.forEach(modal => {
      if (modal instanceof HTMLElement) {
        if (newMobileState) {
          modal.style.height = '100%';
          modal.style.maxHeight = '100vh';
        } else {
          modal.style.height = 'auto';
          modal.style.maxHeight = '90vh';
        }
      }
    });

    // Trigger resize event for components
    window.dispatchEvent(new Event('resize'));
  },

  /**
   * Handle viewport resize for responsive design
   */
  handleViewportResize() {
    const deviceType = getDeviceType();
    console.log(`📱 Device type changed to: ${deviceType}`);
    
    // Update body classes
    document.body.classList.remove('mobile', 'tablet', 'desktop');
    document.body.classList.add(deviceType);
    
    // Adjust modal layouts
    this.adjustModalLayouts(deviceType);
  },

  /**
   * Adjust modal layouts based on device type
   */
  adjustModalLayouts(deviceType: string) {
    const modals = document.querySelectorAll('.modal, [role="dialog"]');
    
    modals.forEach(modal => {
      if (modal instanceof HTMLElement) {
        switch (deviceType) {
          case 'mobile':
            modal.style.width = '100%';
            modal.style.height = '100%';
            modal.style.maxWidth = 'none';
            modal.style.maxHeight = '100vh';
            modal.style.borderRadius = '0';
            break;
          case 'tablet':
            modal.style.width = '90%';
            modal.style.height = 'auto';
            modal.style.maxWidth = '800px';
            modal.style.maxHeight = '90vh';
            modal.style.borderRadius = '12px';
            break;
          case 'desktop':
            modal.style.width = 'auto';
            modal.style.height = 'auto';
            modal.style.maxWidth = '1200px';
            modal.style.maxHeight = '90vh';
            modal.style.borderRadius = '16px';
            break;
        }
      }
    });
  },

  /**
   * Handle Android back button for modals
   */
  handleAndroidBackButton() {
    // Listen for Android back button events
    if ('onpopstate' in window) {
      window.addEventListener('popstate', (event) => {
        // Check if we have open modals
        const openModals = document.querySelectorAll('.modal[style*="display: block"], .modal[style*="display: flex"]');
        
        if (openModals.length > 0) {
          event.preventDefault();
          
          // Close the topmost modal
          const topModal = openModals[openModals.length - 1];
          const closeButton = topModal.querySelector('button[aria-label="Close"], .close-button, [data-close]');
          
          if (closeButton instanceof HTMLElement) {
            closeButton.click();
          }
          
          // Push a new state to prevent back button from going to previous page
          history.pushState(null, '', window.location.href);
        }
      });
    }
  },

  /**
   * Add haptic feedback for Android devices
   */
  addHapticFeedback() {
    if (isAndroid() && 'vibrate' in navigator) {
      // Add haptic feedback to buttons
      const buttons = document.querySelectorAll('button, [role="button"]');
      buttons.forEach(button => {
        button.addEventListener('click', () => {
          navigator.vibrate(50); // 50ms vibration
        });
      });
    }
  },

  /**
   * Optimize images for mobile devices
   */
  optimizeImages() {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      if (img instanceof HTMLImageElement) {
        // Add loading="lazy" for better mobile performance
        img.loading = 'lazy';
        
        // Optimize image sizes for mobile
        if (isMobile()) {
          img.style.maxWidth = '100%';
          img.style.height = 'auto';
        }
      }
    });
  },

  /**
   * Clean up mobile optimizations
   */
  cleanup() {
    // Remove mobile-specific classes
    document.body.classList.remove('mobile-virements', 'mobile', 'tablet', 'desktop');
    
    // Remove touch feedback classes
    document.querySelectorAll('.touch-active').forEach(element => {
      element.classList.remove('touch-active');
    });
    
    // Reset touch target sizes
    const touchTargets = document.querySelectorAll('button, [role="button"], .cursor-pointer');
    touchTargets.forEach(target => {
      if (target instanceof HTMLElement) {
        target.style.minHeight = '';
        target.style.minWidth = '';
      }
    });
    
    console.log('🧹 Mobile optimizations cleaned up');
  }
};

/**
 * CSS-in-JS styles for mobile optimizations
 */
export const mobileStyles = `
  .mobile-virements {
    --touch-target-size: 44px;
    --mobile-spacing: 16px;
    --mobile-border-radius: 12px;
  }

  .mobile-virements .modal,
  .mobile-virements [role="dialog"] {
    width: 100% !important;
    height: 100% !important;
    max-width: none !important;
    max-height: 100vh !important;
    border-radius: 0 !important;
    margin: 0 !important;
  }

  .mobile-virements button,
  .mobile-virements [role="button"],
  .mobile-virements .cursor-pointer {
    min-height: var(--touch-target-size);
    min-width: var(--touch-target-size);
    padding: 12px 16px;
    font-size: 16px;
  }

  .mobile-virements .touch-active {
    transform: scale(0.95);
    transition: transform 0.1s ease;
  }

  .mobile-virements .mobile-card {
    padding: var(--mobile-spacing);
    margin-bottom: var(--mobile-spacing);
    border-radius: var(--mobile-border-radius);
  }

  .mobile-virements .mobile-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: var(--mobile-spacing);
  }

  @media (max-width: 767px) {
    .mobile-virements .hide-mobile {
      display: none !important;
    }
    
    .mobile-virements .show-mobile {
      display: block !important;
    }
  }

  @media (min-width: 768px) {
    .mobile-virements .hide-desktop {
      display: none !important;
    }
    
    .mobile-virements .show-desktop {
      display: block !important;
    }
  }
`;

/**
 * Initialize mobile configuration
 */
export function initializeMobileConfig() {
  // Add mobile styles to document
  if (typeof document !== 'undefined') {
    const styleElement = document.createElement('style');
    styleElement.textContent = mobileStyles;
    document.head.appendChild(styleElement);
    
    // Apply initial mobile optimizations
    if (isMobile()) {
      console.log('📱 Mobile detected - applying optimizations');
      mobileUtils.optimizeForVirements();
    } else {
      console.log('🖥️ Desktop detected - skipping mobile optimizations');
    }
    
    console.log('📱 Mobile configuration initialized');
  }
}

// Auto-initialize when module is imported
if (typeof window !== 'undefined') {
  console.log('🌐 Window detected - initializing mobile config');
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      console.log('📄 DOM loaded - initializing mobile config');
      initializeMobileConfig();
    });
  } else {
    console.log('📄 DOM already loaded - initializing mobile config');
    initializeMobileConfig();
  }
} 