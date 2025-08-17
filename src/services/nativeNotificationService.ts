import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { Notification as AppNotification, NotificationType, NotificationSettings } from '@/types/notifications';
import { Sale } from '@/types/index';

class NativeNotificationService {
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
  private isNativePlatform: boolean;

  constructor() {
    this.isNativePlatform = Capacitor.isNativePlatform();
    this.loadNotifications();
    this.loadSettings();
    
    // Initialize local notifications on native platforms
    if (this.isNativePlatform) {
      this.initializeLocalNotifications();
    }
  }

  // Initialize local notifications
  private async initializeLocalNotifications(): Promise<void> {
    try {
      // Request permission for local notifications
      const permission = await LocalNotifications.requestPermissions();
      
      if (permission.display === 'granted') {
        console.log('Local notification permission granted');
        this.setupNotificationListeners();
        this.createNotificationChannel();
      } else {
        console.log('Local notification permission denied');
      }
    } catch (error) {
      console.error('Error initializing local notifications:', error);
    }
  }

  // Setup notification event listeners
  private setupNotificationListeners(): void {
    // Listen for notification received while app is in foreground
    LocalNotifications.addListener('localNotificationReceived', (notification) => {
      console.log('Notification received:', notification);
      // Handle notification received event
      this.handleNotificationReceived(notification);
    });

    // Listen for notification action clicked
    LocalNotifications.addListener('localNotificationActionPerformed', (notificationAction) => {
      console.log('Notification action performed:', notificationAction);
      // Handle notification action
      this.handleNotificationAction(notificationAction);
    });
  }

  // Create notification channel for Android
  private async createNotificationChannel(): Promise<void> {
    try {
      await LocalNotifications.createChannel({
        id: 'default',
        name: 'Default Channel',
        description: 'Default notification channel',
        importance: 4, // High importance
        visibility: 1, // Public visibility
        sound: this.settings.soundEnabled ? 'default' : undefined,
        vibration: this.settings.vibrationEnabled,
        lights: true,
        lightColor: '#FF0000'
      });
      console.log('Notification channel created successfully');
    } catch (error) {
      console.error('Error creating notification channel:', error);
    }
  }

  // Handle notification received
  private handleNotificationReceived(notification: any): void {
    // You can add custom logic here when notification is received
    console.log('Handling notification received:', notification);
  }

  // Handle notification action
  private handleNotificationAction(notificationAction: any): void {
    const { actionId, notification } = notificationAction;
    
    if (actionId === 'OPEN_APP') {
      // Handle app opening action
      console.log('Opening app from notification');
      // You can add navigation logic here
    }
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
    this.showNativeNotification(notification);
  }

  // Show native notification
  private async showNativeNotification(notification: AppNotification): Promise<void> {
    if (!this.isNativePlatform) {
      console.log('Native notifications not supported on web platform');
      return;
    }

    try {
      // Use non-exact scheduling to avoid the warning
      const scheduleTime = new Date(Date.now() + 1000); // Show after 1 second
      
      await LocalNotifications.schedule({
        notifications: [
          {
            title: notification.title,
            body: notification.message,
            id: Math.floor(Math.random() * 1000000), // Use smaller integer for Java compatibility
            schedule: { 
              at: scheduleTime,
              // Use non-exact scheduling to avoid warnings
              repeats: false
            },
            sound: this.settings.soundEnabled ? 'default' : undefined,
            actionTypeId: 'OPEN_APP',
            channelId: 'default',
            extra: {
              actionUrl: notification.actionUrl,
              actionText: notification.actionText,
              ...notification.metadata
            }
          }
        ]
      });
      
      console.log('Native notification scheduled successfully for:', scheduleTime);
    } catch (error) {
      console.error('Error showing native notification:', error);
    }
  }

  // Test notification
  async testNotification(): Promise<void> {
    const testNotification: AppNotification = {
      id: 'test',
      type: 'system',
      title: 'Test de notification',
      message: 'Ceci est un test de notification native pour vérifier que tout fonctionne correctement.',
      priority: 'medium',
      timestamp: new Date().toISOString(),
      isRead: false,
      isDismissed: false
    };

    this.addNotification(testNotification);
  }

  // Test native notification directly
  async testNativeNotification(): Promise<void> {
    if (!this.isNativePlatform) {
      console.log('Native notifications not supported on web platform');
      alert('Notifications natives non supportées sur le web. Testez sur Android.');
      return;
    }

    try {
      // Use non-exact scheduling to avoid the warning
      const scheduleTime = new Date(Date.now() + 1000);
      
      await LocalNotifications.schedule({
        notifications: [
          {
            title: 'Test Notification Native',
            body: 'Ceci est un test de notification native Android! Elle apparaît en dehors de l\'app comme Instagram et Facebook.',
            id: Math.floor(Math.random() * 1000000), // Use smaller integer for Java compatibility
            schedule: { 
              at: scheduleTime,
              repeats: false // Use non-exact scheduling
            },
            sound: 'default',
            actionTypeId: 'OPEN_APP',
            channelId: 'default'
          }
        ]
      });
      console.log('Native notification scheduled successfully for:', scheduleTime);
    } catch (error) {
      console.error('Error scheduling native notification:', error);
      alert('Erreur lors de l\'envoi de la notification native: ' + error);
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
    if (!this.isNativePlatform) {
      console.log('Push notifications not supported on web platform');
      return false;
    }

    try {
      const permission = await LocalNotifications.requestPermissions();
      if (permission.display === 'granted') {
        // Setup listeners and create channel after permission is granted
        this.setupNotificationListeners();
        this.createNotificationChannel();
      }
      return permission.display === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  // Cleanup listeners when service is destroyed
  destroy(): void {
    if (this.isNativePlatform) {
      LocalNotifications.removeAllListeners();
    }
  }
}

// Export singleton instance
export const nativeNotificationService = new NativeNotificationService();
