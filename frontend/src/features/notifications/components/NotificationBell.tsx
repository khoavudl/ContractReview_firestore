/**
 * Feature: In-App Notifications
 * Component: NotificationBell.tsx — Topbar Bell with Unread Badge & Dropdown Trigger
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { FEATURE_FLAGS } from '@/shared';
import { useNotifications } from '../hooks/useNotifications';
import { NotificationDropdown } from './NotificationDropdown';
import type { NotificationItem } from '../types';

export interface NotificationBellProps {
  userId?: string;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ userId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const {
    notifications,
    filteredNotifications,
    unreadCount,
    isLoading,
    filter,
    setFilter,
    markAsRead,
    markAllAsRead,
  } = useNotifications({ userId });

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelectNotification = async (item: NotificationItem) => {
    await markAsRead(item.notifId);
    setIsOpen(false);
    navigate(`/contracts/${item.contractId}`);
  };

  if (!FEATURE_FLAGS.ENABLE_NOTIFICATIONS) {
    return null;
  }

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Thông báo"
        className="relative p-1.5 rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
      >
        <Bell className="w-4 h-4" />

        {/* Unread Counter Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white shadow-xs">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 z-50 animate-fadeIn">
          <NotificationDropdown
            notifications={notifications}
            filteredNotifications={filteredNotifications}
            unreadCount={unreadCount}
            isLoading={isLoading}
            filter={filter}
            onFilterChange={setFilter}
            onMarkAllAsRead={markAllAsRead}
            onSelectNotification={handleSelectNotification}
          />
        </div>
      )}
    </div>
  );
};
