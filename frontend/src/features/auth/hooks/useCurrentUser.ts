/**
 * Feature: Auth & Whitelist Check
 * Hook: useCurrentUser — Access current authenticated user and role-based permissions
 */

import { useMemo } from 'react';
import type { AuthUser, UserRole } from '@/shared';

export interface CurrentUserPermissions {
  readonly user: AuthUser | null;
  readonly uid: string | null;
  readonly email: string;
  readonly displayName: string;
  readonly role: UserRole | null;
  readonly department: string | undefined;
  readonly isAuthenticated: boolean;
  readonly isActive: boolean;
  readonly isStaff: boolean;
  readonly isLegal: boolean;
  readonly isHOL: boolean;
  readonly isUser: boolean;
}

/**
 * Compute role flags and user permissions from AuthUser
 */
export function computeUserPermissions(user: AuthUser | null): CurrentUserPermissions {
  if (!user) {
    return {
      user: null,
      uid: null,
      email: '',
      displayName: '',
      role: null,
      department: undefined,
      isAuthenticated: false,
      isActive: false,
      isStaff: false,
      isLegal: false,
      isHOL: false,
      isUser: false,
    };
  }

  const role = user.role;
  return {
    user,
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    role,
    department: user.department,
    isAuthenticated: true,
    isActive: user.isActive,
    isStaff: role === 'LEGAL' || role === 'HOL',
    isLegal: role === 'LEGAL',
    isHOL: role === 'HOL',
    isUser: role === 'USER',
  };
}

/**
 * Custom hook returning current user and convenience permission booleans
 */
export function useCurrentUser(user: AuthUser | null): CurrentUserPermissions {
  return useMemo(() => computeUserPermissions(user), [user]);
}
