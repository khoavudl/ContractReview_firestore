/**
 * Feature: In-App Notifications
 * Master Barrel Export — Public API for feature 'notifications'
 */

// Types & Configs
export * from './types';

// Services
export {
  subscribeToNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  DEV_SAMPLE_NOTIFICATIONS,
} from './services/notificationService';

// Hooks
export { useNotifications } from './hooks/useNotifications';
export type { UseNotificationsProps, UseNotificationsReturn } from './hooks/useNotifications';

// Components
export { NotificationItemRow } from './components/NotificationItemRow';
export type { NotificationItemRowProps } from './components/NotificationItemRow';
export { NotificationDropdown } from './components/NotificationDropdown';
export type { NotificationDropdownProps } from './components/NotificationDropdown';
export { NotificationBell } from './components/NotificationBell';
export type { NotificationBellProps } from './components/NotificationBell';
