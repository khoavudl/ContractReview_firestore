/**
 * Auth Guard
 * Protects routes requiring authentication and active whitelist status
 */

import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthContext } from '../providers';

export interface AuthGuardProps {
  readonly children?: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps): React.ReactElement {
  const { isLoading, isAuthenticated, currentUser } = useAuthContext();
  const location = useLocation();

  if (isLoading) {
    return (
      <div
        data-testid="auth-loading"
        className="min-h-screen flex items-center justify-center bg-surface-bgLight dark:bg-surface-bgDark"
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Đang xác thực phiên làm việc...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (currentUser && !currentUser.isActive) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
