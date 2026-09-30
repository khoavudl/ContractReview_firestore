/**
 * Feature: In-App Notifications
 * Types & Configurations
 */

export type NotificationType = 'STATUS_CHANGE' | 'NEW_COMMENT' | 'TASK_ASSIGNED';

export interface NotificationItem {
  notifId: string;
  contractId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: Date | { seconds: number; nanoseconds: number } | string;
}

export const NOTIFICATION_TYPE_CONFIG: Record<
  NotificationType,
  { label: string; badgeClass: string; iconType: string }
> = {
  STATUS_CHANGE: {
    label: 'Đổi trạng thái',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
    iconType: 'repeat',
  },
  NEW_COMMENT: {
    label: 'Bình luận mới',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
    iconType: 'message',
  },
  TASK_ASSIGNED: {
    label: 'Nhiệm vụ rà soát',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
    iconType: 'check-square',
  },
};
