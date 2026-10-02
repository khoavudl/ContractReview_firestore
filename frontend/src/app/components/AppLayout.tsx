/**
 * Application Shell Layout
 * Responsive Header with Navigation, Dark/Light Mode, User Profile, Content Outlet, and Toasts
 */

import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Home, Archive } from 'lucide-react';
import {
  Badge,
  ToastContainer,
  FEATURE_FLAGS,
  type UserRole,
  type BadgeVariant,
} from '@/shared';
import { NotificationBell } from '@/features/notifications';
import { ArchivedSearchModal } from '@/features/contracts';
import { useAuthContext } from '../providers';

function getRoleBadgeVariant(role?: UserRole): BadgeVariant {
  switch (role) {
    case 'HOL':
      return 'amber';
    case 'LEGAL':
      return 'indigo';
    default:
      return 'slate';
  }
}

export function AppLayout(): React.ReactElement {
  const { currentUser, logout } = useAuthContext();
  const location = useLocation();
  const navigate = useNavigate();
  const [isArchivedModalOpen, setIsArchivedModalOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-surface-bgLight dark:bg-surface-bgDark text-slate-800 dark:text-slate-100">
      <header className="sticky top-0 z-30 border-b border-surface-borderLight dark:border-surface-borderDark bg-surface-cardLight/95 dark:bg-surface-cardDark/95 backdrop-blur px-6 py-3 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/dashboard" className="flex items-center gap-3 group">
              <img
                src="/Logo-fes.png"
                alt="Food Empire Vietnam"
                className="h-8 w-auto object-contain transition-transform group-hover:scale-105"
              />
              <div className="border-l border-slate-200 dark:border-slate-700 pl-3">
                <h1 className="text-sm font-semibold leading-tight text-slate-900 dark:text-slate-100">
                  Contract Review v2.0
                </h1>
                <p className="text-xs text-slate-400">Food Empire Vietnam</p>
              </div>
            </Link>

          </div>

          <div className="flex items-center gap-3">
            {currentUser && (
              <div className="flex items-center gap-2 pr-2 border-r border-slate-200 dark:border-slate-800">
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300 hidden sm:inline-block">
                  {currentUser.displayName || currentUser.email}
                </span>
                <Badge variant={getRoleBadgeVariant(currentUser.role)} size="sm">
                  {currentUser.role}
                </Badge>
              </div>
            )}

            {currentUser && (
              <Link
                to="/dashboard"
                aria-label="Trang chủ"
                title="Về Trang chủ"
                className={`p-1.5 rounded-md transition-colors ${
                  location.pathname === '/dashboard' || location.pathname === '/'
                    ? 'text-brand-600 dark:text-brand-400 bg-slate-100 dark:bg-slate-800'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Home className="w-4 h-4" />
              </Link>
            )}

            {currentUser && FEATURE_FLAGS.ENABLE_NOTIFICATIONS && (
              <NotificationBell userId={currentUser.uid} />
            )}

            {currentUser && (
              <button
                type="button"
                onClick={() => setIsArchivedModalOpen(true)}
                aria-label="Kho lưu trữ hợp đồng"
                title="Kho lưu trữ hợp đồng"
                className="p-1.5 rounded-md text-slate-500 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors"
              >
                <Archive className="w-4 h-4" />
              </button>
            )}

            {currentUser && (
              <button
                onClick={logout}
                aria-label="Đăng xuất"
                title="Đăng xuất"
                className="p-1.5 rounded-md text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-2 sm:py-2.5">
        <Outlet />
      </main>

      <ToastContainer />

      {currentUser && (
        <ArchivedSearchModal
          isOpen={isArchivedModalOpen}
          onClose={() => setIsArchivedModalOpen(false)}
          currentUser={currentUser}
          onSelectContract={(contractId) => navigate(`/contracts/${contractId}`)}
        />
      )}
    </div>
  );
}
