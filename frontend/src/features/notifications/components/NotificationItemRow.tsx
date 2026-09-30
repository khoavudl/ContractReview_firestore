/**
 * Feature: In-App Notifications
 * Component: NotificationItemRow.tsx — Single Notification Card in Dropdown
 */

import React from 'react';
import { RefreshCw, MessageSquare, CheckSquare, Bell } from 'lucide-react';
import { formatDate } from '@/shared';
import type { NotificationItem, NotificationType } from '../types';

export interface NotificationItemRowProps {
  notification: NotificationItem;
  onSelect: (item: NotificationItem) => void;
}

const TYPE_ICON_MAP: Record<NotificationType, React.ReactNode> = {
  STATUS_CHANGE: <RefreshCw className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />,
  NEW_COMMENT: <MessageSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />,
  TASK_ASSIGNED: <CheckSquare className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />,
};

export const NotificationItemRow: React.FC<NotificationItemRowProps> = ({
  notification,
  onSelect,
}) => {
  return (
    <div
      onClick={() => onSelect(notification)}
      className={`p-3 rounded-lg border transition-all cursor-pointer text-left space-y-1 ${
        notification.isRead
          ? 'bg-white dark:bg-slate-850 border-slate-150 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 opacity-80'
          : 'bg-brand-50/40 dark:bg-brand-950/20 border-brand-200/70 dark:border-brand-900/60 hover:bg-brand-50/70 dark:hover:bg-brand-950/30'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="p-1 rounded bg-slate-100 dark:bg-slate-800 flex-shrink-0">
            {TYPE_ICON_MAP[notification.type] || <Bell className="w-3.5 h-3.5 text-slate-500" />}
          </div>
          <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
            {notification.title}
          </span>
        </div>

        {!notification.isRead && (
          <span className="w-2 h-2 rounded-full bg-brand-600 flex-shrink-0 mt-1" />
        )}
      </div>

      <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
        {notification.message}
      </p>

      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
        <span className="font-mono text-slate-500 dark:text-slate-400 font-semibold">
          {notification.contractId}
        </span>
        <span>{formatDate(notification.createdAt)}</span>
      </div>
    </div>
  );
};
