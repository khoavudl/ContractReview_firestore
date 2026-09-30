/**
 * Unit Tests for useCurrentUser
 */

import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { AuthUser } from '@/shared';
import { useCurrentUser, computeUserPermissions } from './useCurrentUser';

describe('useCurrentUser & computeUserPermissions', () => {
  it('returns default unauthenticated state when user is null', () => {
    const { result } = renderHook(() => useCurrentUser(null));

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.role).toBeNull();
    expect(result.current.isStaff).toBe(false);
    expect(result.current.isLegal).toBe(false);
    expect(result.current.isHOL).toBe(false);
    expect(result.current.isUser).toBe(false);
  });

  it('computes correct permissions for USER role', () => {
    const user: AuthUser = {
      uid: 'u-1',
      email: 'creator@foodempire.vn',
      displayName: 'Creator One',
      role: 'USER',
      isActive: true,
      department: 'Marketing',
    };

    const perms = computeUserPermissions(user);
    expect(perms.isAuthenticated).toBe(true);
    expect(perms.isUser).toBe(true);
    expect(perms.isStaff).toBe(false);
    expect(perms.isLegal).toBe(false);
    expect(perms.isHOL).toBe(false);
    expect(perms.department).toBe('Marketing');
  });

  it('computes correct permissions for LEGAL role (staff)', () => {
    const user: AuthUser = {
      uid: 'u-2',
      email: 'legal@foodempire.vn',
      displayName: 'Legal Specialist',
      role: 'LEGAL',
      isActive: true,
      department: 'Legal',
    };

    const perms = computeUserPermissions(user);
    expect(perms.isAuthenticated).toBe(true);
    expect(perms.isStaff).toBe(true);
    expect(perms.isLegal).toBe(true);
    expect(perms.isHOL).toBe(false);
    expect(perms.isUser).toBe(false);
  });

  it('computes correct permissions for HOL role (staff)', () => {
    const user: AuthUser = {
      uid: 'u-3',
      email: 'hol@foodempire.vn',
      displayName: 'Head of Legal',
      role: 'HOL',
      isActive: true,
      department: 'Legal',
    };

    const perms = computeUserPermissions(user);
    expect(perms.isAuthenticated).toBe(true);
    expect(perms.isStaff).toBe(true);
    expect(perms.isLegal).toBe(false);
    expect(perms.isHOL).toBe(true);
    expect(perms.isUser).toBe(false);
  });
});
