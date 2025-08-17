/**
 * Utilities for preloading components and resources
 */

// Preload component modules
export const preloadComponent = (importFn: () => Promise<unknown>) => {
    if (typeof window !== 'undefined') {
        // Use requestIdleCallback if available, otherwise use setTimeout
        if ('requestIdleCallback' in window) {
            (window as unknown as { requestIdleCallback: (callback: () => void) => void }).requestIdleCallback(() => {
                importFn().catch(console.error);
            });
        } else {
            setTimeout(() => {
                importFn().catch(console.error);
            }, 100);
        }
    }
};

// Preload multiple components
export const preloadComponents = (importFns: Array<() => Promise<unknown>>) => {
    importFns.forEach((importFn, index) => {
        // Stagger the preloading to avoid blocking the main thread
        setTimeout(() => {
            preloadComponent(importFn);
        }, index * 50);
    });
};

// Resource hints for better loading performance
export const addResourceHints = () => {
    if (typeof document === 'undefined') return;

    // Preconnect to external domains
    const preconnectDomains: string[] = [
        // Add any external domains used by the app
    ];

    preconnectDomains.forEach(domain => {
        const link = document.createElement('link');
        link.rel = 'preconnect';
        link.href = domain;
        document.head.appendChild(link);
    });

    // DNS prefetch for external resources
    const dnsPrefetchDomains: string[] = [
        // Add domains for DNS prefetch
    ];

    dnsPrefetchDomains.forEach(domain => {
        const link = document.createElement('link');
        link.rel = 'dns-prefetch';
        link.href = domain;
        document.head.appendChild(link);
    });
};

// Preload critical CSS
export const preloadCriticalCSS = (href: string) => {
    if (typeof document === 'undefined') return;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'style';
    link.href = href;
    link.onload = () => {
        link.rel = 'stylesheet';
    };
    document.head.appendChild(link);
};

const preloadUtils = {
    preloadComponent,
    preloadComponents,
    addResourceHints,
    preloadCriticalCSS,
};

export default preloadUtils;