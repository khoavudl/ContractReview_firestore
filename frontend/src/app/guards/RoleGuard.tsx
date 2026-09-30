/**
 * Role Guard
 * Enforces Role-Based Access Control (RBAC) across protected routes
 */

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import type { UserRole } from '@/shared';
import { useAuthContext } from '../providers';

export interface RoleGuardProps {
  readonly allowedRoles: ReadonlyArray<UserRole>;
  readonly children?: React.ReactNode;
}

export function RoleGuard({
  allowedRoles,
  children,
}: RoleGuardProps): React.ReactElement {
  const { currentUser } = useAuthContext();

  const isRoleAllowed =
    currentUser !== null && allowedRoles.includes(currentUser.role);

  if (!isRoleAllowed) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
