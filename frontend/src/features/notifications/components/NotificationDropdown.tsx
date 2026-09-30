/**
 * Feature: In-App Notifications
 * Component: NotificationDropdown.tsx — Dropdown Popover List
 */

import React from 'react';
import { CheckCheck, BellOff, Bell } from 'lucide-react';
import type { NotificationItem } from '../types';
import { NotificationItemRow } from './NotificationItemRow';

export interface NotificationDropdownProps {
  notifications: NotificationItem[];
  filteredNotifications: NotificationItem[];
  unreadCount: number;
  isLoading: boolean;
  filter: 'ALL' | 'UNREAD';
  onFilterChange: (filter: 'ALL' | 'UNREAD') => void;
  onMarkAllAsRead: () => Promise<void>;
  onSelectNotification: (item: NotificationItem) => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  notifications,
  filteredNotifications,
  unreadCount,
  isLoading,
  filter,
  onFilterChange,
  onMarkAllAsRead,
  onSelectNotification,
}) => {
  return (
    <div className="w-80 sm:w-96 max-h-[28rem] flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden z-50 text-left">
      {/* Header */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-850">
        <div className="flex items-center gap-1.5">
          <Bell className="w-4 h-4 text-brand-600 dark:text-brand-400" />
          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
            Thông báo ({notifications.length})
          </h4>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={onMarkAllAsRead}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 transition-colors"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Đọc tất cả</span>
          </button>
        )}
      </div>

      {/* Tabs Filter */}
      <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 gap-2 text-xs">
        <button
          type="button"
          onClick={() => onFilterChange('ALL')}
          className={`px-2.5 py-1 rounded font-medium transition-colors ${
            filter === 'ALL'
              ? 'bg-slate-100 dark:bg-slate-800 text-brand-600 dark:text-brand-400 font-bold'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          Tất cả ({notifications.length})
        </button>
        <button
          type="button"
          onClick={() => onFilterChange('UNREAD')}
          className={`px-2.5 py-1 rounded font-medium transition-colors ${
            filter === 'UNREAD'
              ? 'bg-slate-100 dark:bg-slate-800 text-brand-600 dark:text-brand-400 font-bold'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          Chưa đọc ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-72">
        {isLoading && (
          <div className="py-8 text-center text-xs text-slate-400">
            <div className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Đang tải thông báo...
          </div>
        )}

        {!isLoading && filteredNotifications.length === 0 && (
          <div className="py-8 text-center text-slate-400 space-y-1">
            <BellOff className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
              Không có thông báo nào.
            </p>
            <p className="text-[10px] text-slate-400">
              Các cập nhật mới về hợp đồng sẽ xuất hiện tại đây.
            </p>
          </div>
        )}

        {!isLoading &&
          filteredNotifications.map((item) => (
            <NotificationItemRow
              key={item.notifId}
              notification={item}
              onSelect={onSelectNotification}
            />
          ))}
      </div>
    </div>
  );
};
