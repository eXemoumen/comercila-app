/**
 * Performance monitoring utilities for React components
 */

// Performance measurement utility
export const measurePerformance = (name: string, fn: () => void) => {
    if (typeof window !== 'undefined' && window.performance) {
        const start = performance.now();
        fn();
        const end = performance.now();
        console.log(`${name} took ${end - start} milliseconds`);
    } else {
        fn();
    }
};

// Memory usage tracker
export const trackMemoryUsage = (componentName: string) => {
    if (typeof window !== 'undefined' && 'memory' in performance) {
        const memory = (performance as unknown as { memory: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }).memory;
        console.log(`${componentName} memory usage:`, {
            used: Math.round(memory.usedJSHeapSize / 1048576) + ' MB',
            total: Math.round(memory.totalJSHeapSize / 1048576) + ' MB',
            limit: Math.round(memory.jsHeapSizeLimit / 1048576) + ' MB'
        });
    }
};

// Bundle size analyzer helper
export const logBundleInfo = () => {
    if (process.env.NODE_ENV === 'development') {
        console.log('Bundle optimization tips:');
        console.log('- Use React.lazy() for code splitting');
        console.log('- Implement React.memo() for expensive components');
        console.log('- Use useMemo() and useCallback() for expensive calculations');
        console.log('- Consider tree shaking for unused imports');
    }
};

// Intersection Observer for lazy loading
export const createIntersectionObserver = (
    callback: (entries: IntersectionObserverEntry[]) => void,
    options?: IntersectionObserverInit
) => {
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
        return new IntersectionObserver(callback, {
            rootMargin: '50px',
            threshold: 0.1,
            ...options,
        });
    }
    return null;
};

// Debounce utility for performance optimization
export const debounce = <T extends (...args: unknown[]) => unknown>(
    func: T,
    wait: number
): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout;

    return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
};

// Throttle utility for performance optimization
export const throttle = <T extends (...args: unknown[]) => unknown>(
    func: T,
    limit: number
): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean;

    return (...args: Parameters<T>) => {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
};