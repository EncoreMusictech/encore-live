import React, { createContext, useContext } from 'react';
import { useNotifications as useNotificationsHook, Notification, NotificationType } from '@/hooks/useNotifications';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  createNotification: (
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    data?: any,
    priority?: 'low' | 'medium' | 'high' | 'critical',
    expiresAt?: Date
  ) => Promise<any>;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const value = useNotificationsHook();
  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useSharedNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useSharedNotifications must be used within a NotificationProvider');
  }
  return context;
}
