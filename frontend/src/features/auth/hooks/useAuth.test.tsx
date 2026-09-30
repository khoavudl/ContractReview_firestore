/**
 * Unit Tests for useAuth and AuthProvider
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { User, UserCredential } from 'firebase/auth';
import type { AuthUser } from '@/shared';
import { AuthProvider } from '../context/AuthContext';
import { useAuth } from './useAuth';
import * as authService from '../services/authService';

vi.mock('../services/authService', async (importOriginal) => {
  const actual = await importOriginal<typeof authService>();
  return {
    ...actual,
    signInWithProvider: vi.fn(),
    signOutUser: vi.fn(),
    fetchClaimsWithRetry: vi.fn(),
  };
});

describe('useAuth & AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws error when used outside AuthProvider', () => {
    expect(() => renderHook(() => useAuth())).toThrow(
      'useAuthContext must be used within an AuthProvider'
    );
  });

  it('provides default initial state', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider skipAuthListener>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.currentUser).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isLoggingIn).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.blockedUser).toBeNull();
    expect(result.current.permissions.isStaff).toBe(false);
  });

  it('allows logging in and logging out manually', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider skipAuthListener>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    const mockUser: AuthUser = {
      uid: 'user-1',
      email: 'user1@foodempire.vn',
      displayName: 'User One',
      role: 'USER',
      isActive: true,
    };

    act(() => {
      result.current.login(mockUser);
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.currentUser?.uid).toBe('user-1');
    expect(result.current.permissions.isUser).toBe(true);

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.currentUser).toBeNull();
  });

  it('executes successful signIn flow', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider skipAuthListener>{children}</AuthProvider>
    );

    const mockFirebaseUser = {
      uid: 'ms-user',
      email: 'ms@foodempire.vn',
      displayName: 'MS User',
    } as User;

    vi.mocked(authService.signInWithProvider).mockResolvedValueOnce({
      user: mockFirebaseUser,
    } as UserCredential);

    vi.mocked(authService.fetchClaimsWithRetry).mockResolvedValueOnce({
      role: 'LEGAL',
      isActive: true,
      department: 'Pháp chế',
      isReady: true,
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    let success = false;
    await act(async () => {
      success = await result.current.signIn('microsoft');
    });

    expect(success).toBe(true);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.currentUser?.email).toBe('ms@foodempire.vn');
    expect(result.current.permissions.isLegal).toBe(true);
    expect(result.current.permissions.isStaff).toBe(true);
  });

  it('handles blocked user when account is not in whitelist', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider skipAuthListener>{children}</AuthProvider>
    );

    const mockFirebaseUser = {
      uid: 'unauthorized-user',
      email: 'stranger@gmail.com',
      displayName: 'Stranger',
    } as User;

    vi.mocked(authService.signInWithProvider).mockResolvedValueOnce({
      user: mockFirebaseUser,
    } as UserCredential);

    vi.mocked(authService.fetchClaimsWithRetry).mockResolvedValueOnce({
      role: null,
      isActive: false,
      isReady: false,
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    let success = true;
    await act(async () => {
      success = await result.current.signIn('google');
    });

    expect(success).toBe(false);
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.blockedUser?.email).toBe('stranger@gmail.com');
    expect(result.current.blockedUser?.reason).toBe('NOT_WHITELISTED');
    expect(authService.signOutUser).toHaveBeenCalled();
  });

  it('captures errors and allows clearing error', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider skipAuthListener>{children}</AuthProvider>
    );

    vi.mocked(authService.signInWithProvider).mockRejectedValueOnce({
      code: 'auth/popup-closed-by-user',
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.signIn('microsoft');
    });

    expect(result.current.error?.type).toBe('POPUP_CLOSED');

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });
});
