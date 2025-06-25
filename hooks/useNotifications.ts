import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { api, subscriptions } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';

// Web-compatible notification hook
export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    // Subscribe to real-time notifications
    const subscription = subscriptions.subscribeToNotifications(
      user.id,
      (payload) => {
        if (payload.eventType === 'INSERT') {
          setNotifications(prev => [payload.new, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          // Show browser notification on web
          if (Platform.OS === 'web' && 'Notification' in window) {
            if (Notification.permission === 'granted') {
              new Notification('SafeTalk', {
                body: payload.new.payload?.message || 'You have a new notification',
                icon: '/favicon.png'
              });
            }
          }
        } else if (payload.eventType === 'UPDATE') {
          setNotifications(prev => 
            prev.map(n => n.id === payload.new.id ? payload.new : n)
          );
          
          // Update unread count
          if (payload.old.is_read === false && payload.new.is_read === true) {
            setUnreadCount(prev => Math.max(0, prev - 1));
          }
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const markAsRead = async (notificationId: string) => {
    await api.markNotificationRead(notificationId);
  };

  const requestPermission = async () => {
    if (Platform.OS === 'web' && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    requestPermission,
  };
}