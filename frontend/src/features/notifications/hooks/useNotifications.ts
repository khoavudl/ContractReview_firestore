/**
 * Feature: In-App Notifications
 * Hook: useNotifications.ts — Realtime sync, unread count & mark-as-read actions
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { FEATURE_FLAGS } from '@/shared';
import type { NotificationItem } from '../types';
import {
  subscribeToNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../services/notificationService';

export interface UseNotificationsProps {
  userId?: string;
}

export interface UseNotificationsReturn {
  notifications: NotificationItem[];
  filteredNotifications: NotificationItem[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  filter: 'ALL' | 'UNREAD';
  setFilter: (filter: 'ALL' | 'UNREAD') => void;
  markAsRead: (notifId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

export function useNotifications({
  userId,
}: UseNotificationsProps = {}): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL');

  useEffect(() => {
    if (!userId || !FEATURE_FLAGS.ENABLE_NOTIFICATIONS) {
      setNotifications([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const unsub = subscribeToNotifications(
      userId,
      (list) => {
        setNotifications(list);
        setIsLoading(false);
      },
      (err) => {
        setError(err.message || 'Không thể đồng bộ thông báo');
        setIsLoading(false);
      }
    );

    return () => {
      unsub();
    };
  }, [userId]);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    if (filter === 'UNREAD') {
      return notifications.filter((n) => !n.isRead);
    }
    return notifications;
  }, [notifications, filter]);

  const markAsRead = useCallback(
    async (notifId: string) => {
      if (!userId || !FEATURE_FLAGS.ENABLE_NOTIFICATIONS) return;
      try {
        await markNotificationAsRead(userId, notifId);
      } catch (err) {
        console.warn(`[useNotifications] Failed to mark ${notifId} as read:`, err);
      }
    },
    [userId]
  );

  const markAllAsRead = useCallback(async () => {
    if (!userId || unreadCount === 0 || !FEATURE_FLAGS.ENABLE_NOTIFICATIONS) return;
    try {
      await markAllNotificationsAsRead(userId);
    } catch (err) {
      console.warn('[useNotifications] Failed to mark all notifications as read:', err);
    }
  }, [userId, unreadCount]);

  return {
    notifications,
    filteredNotifications,
    unreadCount,
    isLoading,
    error,
    filter,
    setFilter,
    markAsRead,
    markAllAsRead,
  };
}
