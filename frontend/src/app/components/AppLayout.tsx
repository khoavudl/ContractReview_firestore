/**
 * Application Shell Layout
 * Responsive Header with Navigation, Dark/Light Mode, User Profile, Content Outlet, and Toasts
 */

import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LogOut, FileText } from 'lucide-react';
import {
  Badge,
  ToastContainer,
  type UserRole,
  type BadgeVariant,
} from '@/shared';
import { NotificationBell } from '@/features/notifications';
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

  return (
    <div className="min-h-screen flex flex-col bg-surface-bgLight dark:bg-surface-bgDark text-slate-800 dark:text-slate-100">
      <header className="sticky top-0 z-30 border-b border-surface-borderLight dark:border-surface-borderDark bg-surface-cardLight/95 dark:bg-surface-cardDark/95 backdrop-blur px-6 py-3 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/dashboard" className="flex items-center gap-3 group">
              <div className="h-9 w-9 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold text-sm shadow-xs group-hover:bg-brand-700 transition-colors">
                CR
              </div>
              <div>
                <h1 className="text-sm font-semibold leading-tight text-slate-900 dark:text-slate-100">
                  Contract Review v2.0
                </h1>
                <p className="text-xs text-slate-400">Food Empire Vietnam</p>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              <Link
                to="/dashboard"
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  location.pathname === '/dashboard' || location.pathname === '/'
                    ? 'bg-slate-100 dark:bg-slate-800 text-brand-600 dark:text-brand-400'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  Danh sách Hợp đồng
                </span>
              </Link>
            </nav>
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
              <NotificationBell userId={currentUser.uid} />
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

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6">
        <Outlet />
      </main>

      <ToastContainer />

      <footer className="border-t border-surface-borderLight dark:border-surface-borderDark py-4 text-center text-xs text-slate-400">
        © 2026 Food Empire Vietnam • Clean Modular Architecture
      </footer>
    </div>
  );
}
