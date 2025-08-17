export type NotificationType = 
  | 'payment_due' 
  | 'order_scheduled' 
  | 'order_delivered' 
  | 'low_stock' 
  | 'virement_reminder'
  | 'payment_overdue'
  | 'stock_alert'
  | 'system';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  timestamp: string;
  isRead: boolean;
  isDismissed: boolean;
  actionUrl?: string;
  actionText?: string;
  metadata?: {
    saleId?: string;
    orderId?: string;
    supermarketId?: string;
    amount?: number;
    dueDate?: string;
    quantity?: number;
  };
}

export interface NotificationSettings {
  paymentDue: boolean;
  orderUpdates: boolean;
  stockAlerts: boolean;
  virementReminders: boolean;
  systemNotifications: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  pushNotifications: boolean;
}

export interface NotificationCounts {
  total: number;
  unread: number;
  urgent: number;
  byType: Record<NotificationType, number>;
} 