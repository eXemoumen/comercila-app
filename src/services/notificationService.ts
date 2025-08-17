import { Notification as AppNotification, NotificationType, NotificationSettings } from '@/types/notifications';
import { Sale } from '@/types/index';
import { Order } from '@/utils/storage';

// Define browser notification types
interface BrowserNotificationConstructor {
  new(title: string, options?: NotificationOptions): Notification;
  permission: NotificationPermission;
  requestPermission(): Promise<NotificationPermission>;
}

interface NotificationOptions {
  body?: string;
  icon?: string;
  tag?: string;
}

// Define webkit audio context interface
interface WindowWithWebkitAudio extends Window {
  webkitAudioContext?: {
    new(): AudioContext;
  };
}

class NotificationService {
  private notifications: AppNotification[] = [];
  private settings: NotificationSettings = {
    paymentDue: true,
    orderUpdates: true,
    stockAlerts: true,
    virementReminders: true,
    systemNotifications: true,
    soundEnabled: true,
    vibrationEnabled: true,
    pushNotifications: true
  };

  constructor() {
    this.loadNotifications();
    this.loadSettings();
  }

  // Load notifications from localStorage
  private loadNotifications(): void {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('topfresh_notifications');
      if (stored) {
        this.notifications = JSON.parse(stored);
      }
    }
  }

  // Save notifications to localStorage
  private saveNotifications(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('topfresh_notifications', JSON.stringify(this.notifications));
    }
  }

  // Load settings from localStorage
  private loadSettings(): void {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('topfresh_notification_settings');
      if (stored) {
        this.settings = { ...this.settings, ...JSON.parse(stored) };
      }
    }
  }

  // Save settings to localStorage
  private saveSettings(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('topfresh_notification_settings', JSON.stringify(this.settings));
    }
  }

  // Generate payment due notifications
  generatePaymentDueNotifications(sales: Sale[]): void {
    if (!this.settings.paymentDue) return;

    const today = new Date();
    const overdueSales = sales.filter(sale => 
      !sale.isPaid && 
      sale.expectedPaymentDate && 
      new Date(sale.expectedPaymentDate) < today
    );

    overdueSales.forEach(sale => {
      const daysOverdue = Math.floor((today.getTime() - new Date(sale.expectedPaymentDate!).getTime()) / (1000 * 60 * 60 * 24));
      
      const notification: AppNotification = {
        id: `payment_overdue_${sale.id}`,
        type: 'payment_overdue',
        title: 'Paiement en retard',
        message: `Le paiement pour la vente ${sale.id} est en retard de ${daysOverdue} jour(s). Montant restant: ${sale.remainingAmount?.toLocaleString('fr-DZ')} DZD`,
        priority: daysOverdue > 7 ? 'urgent' : daysOverdue > 3 ? 'high' : 'medium',
        timestamp: new Date().toISOString(),
        isRead: false,
        isDismissed: false,
        actionUrl: 'virements',
        actionText: 'Voir les paiements',
        metadata: {
          saleId: sale.id,
          amount: sale.remainingAmount,
          dueDate: sale.expectedPaymentDate
        }
      };

      this.addNotification(notification);
    });
  }

  // Generate virement reminder notifications
  generateVirementReminders(sales: Sale[]): void {
    if (!this.settings.virementReminders) return;

    const today = new Date();
    const virementSales = sales.filter(sale => 
      !sale.isPaid && 
      sale.payments && 
      sale.payments.length > 0
    );

    virementSales.forEach(sale => {
      const lastPayment = sale.payments[sale.payments.length - 1];
      const daysSinceLastPayment = Math.floor((today.getTime() - new Date(lastPayment.date).getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSinceLastPayment > 7) {
        const notification: AppNotification = {
          id: `virement_reminder_${sale.id}`,
          type: 'virement_reminder',
          title: 'Rappel de virement',
          message: `Rappel: Le virement pour la vente ${sale.id} n'a pas été complété. Montant restant: ${sale.remainingAmount?.toLocaleString('fr-DZ')} DZD`,
          priority: daysSinceLastPayment > 14 ? 'high' : 'medium',
          timestamp: new Date().toISOString(),
          isRead: false,
          isDismissed: false,
          actionUrl: 'virements',
          actionText: 'Gérer les virements',
          metadata: {
            saleId: sale.id,
            amount: sale.remainingAmount
          }
        };

        this.addNotification(notification);
      }
    });
  }

  // Generate order notifications
  generateOrderNotifications(orders: Order[]): void {
    if (!this.settings.orderUpdates) return;

    orders.forEach(order => {
      if (order.status === 'pending') {
        const notification: AppNotification = {
          id: `order_pending_${order.id}`,
          type: 'order_scheduled',
          title: 'Commande en attente',
          message: `Commande ${order.id} pour ${order.supermarketName} - ${order.quantity} unités en attente de livraison`,
          priority: 'medium',
          timestamp: new Date().toISOString(),
          isRead: false,
          isDismissed: false,
          actionUrl: 'orders',
          actionText: 'Voir les commandes',
          metadata: {
            orderId: order.id,
            supermarketId: order.supermarketId,
            quantity: order.quantity
          }
        };

        this.addNotification(notification);
      } else if (order.status === 'delivered') {
        const notification: AppNotification = {
          id: `order_delivered_${order.id}`,
          type: 'order_delivered',
          title: 'Commande livrée',
          message: `Commande ${order.id} livrée avec succès à ${order.supermarketName}`,
          priority: 'low',
          timestamp: new Date().toISOString(),
          isRead: false,
          isDismissed: false,
          actionUrl: 'orders',
          actionText: 'Voir les commandes',
          metadata: {
            orderId: order.id,
            supermarketId: order.supermarketId
          }
        };

        this.addNotification(notification);
      }
    });
  }

  // Generate stock alert notifications
  generateStockAlerts(currentStock: number, maxStock: number = 2700): void {
    if (!this.settings.stockAlerts) return;

    const stockPercentage = (currentStock / maxStock) * 100;
    
    if (stockPercentage < 20) {
      const notification: AppNotification = {
        id: `stock_critical_${Date.now()}`,
        type: 'stock_alert',
        title: 'Stock critique',
        message: `Attention: Le stock est très bas (${stockPercentage.toFixed(1)}%). Il est temps de réapprovisionner.`,
        priority: 'urgent',
        timestamp: new Date().toISOString(),
        isRead: false,
        isDismissed: false,
        actionUrl: 'stock',
        actionText: 'Gérer le stock',
        metadata: {
          quantity: currentStock
        }
      };

      this.addNotification(notification);
    } else if (stockPercentage < 40) {
      const notification: AppNotification = {
        id: `stock_low_${Date.now()}`,
        type: 'low_stock',
        title: 'Stock faible',
        message: `Le stock est faible (${stockPercentage.toFixed(1)}%). Pensez à commander.`,
        priority: 'medium',
        timestamp: new Date().toISOString(),
        isRead: false,
        isDismissed: false,
        actionUrl: 'stock',
        actionText: 'Voir le stock',
        metadata: {
          quantity: currentStock
        }
      };

      this.addNotification(notification);
    }
  }

  // Add a new notification
  addNotification(notification: AppNotification): void {
    // Check if notification already exists
    const existingIndex = this.notifications.findIndex(n => n.id === notification.id);
    
    if (existingIndex >= 0) {
      // Update existing notification
      this.notifications[existingIndex] = {
        ...this.notifications[existingIndex],
        ...notification,
        timestamp: new Date().toISOString(),
        isRead: false,
        isDismissed: false
      };
    } else {
      // Add new notification
      this.notifications.unshift(notification);
    }

    this.saveNotifications();
    this.showNotification(notification);
  }

  // Show notification (browser notification + sound/vibration)
  private showNotification(notification: AppNotification): void {
    // Browser notification
    if (this.settings.pushNotifications && 'Notification' in window) {
      const BrowserNotification = (window as WindowWithWebkitAudio & { Notification: BrowserNotificationConstructor }).Notification;
      if (BrowserNotification.permission === 'granted') {
        try {
          new BrowserNotification(notification.title, {
            body: notification.message,
            icon: '/favicon.ico',
            tag: notification.id
          });
        } catch (error) {
          console.log('Browser notification failed, using fallback:', error);
          this.showInAppNotification(notification);
        }
      } else {
        // Fallback to in-app notification
        this.showInAppNotification(notification);
      }
    } else {
      // Fallback to in-app notification
      this.showInAppNotification(notification);
    }

    // Sound notification
    if (this.settings.soundEnabled) {
      this.playNotificationSound();
    }

    // Vibration notification
    if (this.settings.vibrationEnabled && 'vibrate' in navigator) {
      navigator.vibrate(200);
    }
  }

  // Fallback in-app notification system
  private showInAppNotification(notification: AppNotification): void {
    // Create a simple in-app notification toast
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-blue-600 text-white px-4 py-3 rounded-lg shadow-lg z-50 max-w-sm';
    toast.innerHTML = `
      <div class="font-medium">${notification.title}</div>
      <div class="text-sm opacity-90">${notification.message}</div>
    `;
    
    document.body.appendChild(toast);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 5000);
  }

  // Play notification sound
  private playNotificationSound(): void {
    try {
      const audio = new Audio('/notification.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {
        // Fallback: create a simple beep sound
        const AudioContextClass = window.AudioContext || (window as WindowWithWebkitAudio).webkitAudioContext;
        if (AudioContextClass) {
          const audioContext = new AudioContextClass();
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.value = 800;
          oscillator.type = 'sine';
          
          gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
          
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.1);
        }
      });
    } catch {
      console.log('Could not play notification sound');
    }
  }

  // Get all notifications
  getNotifications(): AppNotification[] {
    return this.notifications.filter(n => !n.isDismissed);
  }

  // Get unread notifications
  getUnreadNotifications(): AppNotification[] {
    return this.notifications.filter(n => !n.isRead && !n.isDismissed);
  }

  // Get notification counts
  getNotificationCounts() {
    const unread = this.getUnreadNotifications();
    const urgent = unread.filter(n => n.priority === 'urgent');
    
    const byType = unread.reduce((acc, notification) => {
      acc[notification.type] = (acc[notification.type] || 0) + 1;
      return acc;
    }, {} as Record<NotificationType, number>);

    return {
      total: this.notifications.length,
      unread: unread.length,
      urgent: urgent.length,
      byType
    };
  }

  // Mark notification as read
  markAsRead(notificationId: string): void {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.isRead = true;
      this.saveNotifications();
    }
  }

  // Mark all notifications as read
  markAllAsRead(): void {
    this.notifications.forEach(n => n.isRead = true);
    this.saveNotifications();
  }

  // Dismiss notification
  dismissNotification(notificationId: string): void {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.isDismissed = true;
      this.saveNotifications();
    }
  }

  // Clear all notifications
  clearAllNotifications(): void {
    this.notifications = [];
    this.saveNotifications();
  }

  // Update settings
  updateSettings(newSettings: Partial<NotificationSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();
  }

  // Get settings
  getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  // Request notification permission
  async requestPermission(): Promise<boolean> {
    try {
      if ('Notification' in window) {
        const BrowserNotification = (window as WindowWithWebkitAudio & { Notification: BrowserNotificationConstructor }).Notification;
        
        // Check current permission status
        if (BrowserNotification.permission === 'granted') {
          return true;
        }
        
        if (BrowserNotification.permission === 'denied') {
          console.log('Notification permission denied by user');
          return false;
        }
        
        // Request permission
        console.log('Requesting notification permission...');
        const permission = await BrowserNotification.requestPermission();
        console.log('Permission result:', permission);
        
        if (permission === 'granted') {
          // Update settings to enable push notifications
          this.settings.pushNotifications = true;
          this.saveSettings();
          return true;
        } else {
          console.log('Permission not granted:', permission);
          return false;
        }
      } else {
        console.log('Notifications not supported in this browser');
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  // Check if notifications are supported
  isSupported(): boolean {
    return 'Notification' in window;
  }
}

// Export singleton instance
export const notificationService = new NotificationService(); 