/**
 * Enhanced network detection utility
 */

export class NetworkDetector {
    private static instance: NetworkDetector;
    private isOnlineState: boolean = true;
    private listeners: Array<(isOnline: boolean) => void> = [];
    
    private constructor() {
        this.isOnlineState = this.checkInitialNetworkState();
        this.setupEventListeners();
    }
    
    static getInstance(): NetworkDetector {
        if (!NetworkDetector.instance) {
            NetworkDetector.instance = new NetworkDetector();
        }
        return NetworkDetector.instance;
    }
    
    private checkInitialNetworkState(): boolean {
        if (typeof window === 'undefined' || typeof navigator === 'undefined') {
            return false; // Assume offline in SSR
        }
        return navigator.onLine;
    }
    
    private setupEventListeners() {
        if (typeof window === 'undefined') return;
        
        window.addEventListener('online', () => {
            console.log('🌐 Network: Online');
            this.isOnlineState = true;
            this.notifyListeners(true);
        });
        
        window.addEventListener('offline', () => {
            console.log('📱 Network: Offline');
            this.isOnlineState = false;
            this.notifyListeners(false);
        });
    }
    
    isOnline(): boolean {
        return this.isOnlineState;
    }
    
    isOffline(): boolean {
        return !this.isOnlineState;
    }
    
    addListener(callback: (isOnline: boolean) => void) {
        this.listeners.push(callback);
    }
    
    removeListener(callback: (isOnline: boolean) => void) {
        this.listeners = this.listeners.filter(listener => listener !== callback);
    }
    
    private notifyListeners(isOnline: boolean) {
        this.listeners.forEach(listener => {
            try {
                listener(isOnline);
            } catch (error) {
                console.error('Error in network listener:', error);
            }
        });
    }
    
    /**
     * Test network connectivity by making a request
     */
    async testConnectivity(): Promise<boolean> {
        if (!this.isOnlineState) return false;
        
        try {
            // Try to fetch a small resource with timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            await fetch('/api/ping', {
                method: 'HEAD',
                signal: controller.signal,
                cache: 'no-cache'
            });
            
            clearTimeout(timeoutId);
            return true;
        } catch (error) {
            console.warn('Connectivity test failed:', error);
            return false;
        }
    }
}

// Export singleton instance
export const networkDetector = NetworkDetector.getInstance();
