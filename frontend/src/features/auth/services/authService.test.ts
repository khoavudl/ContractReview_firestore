/**
 * Unit Tests for authService
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  OAuthProvider,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  type Auth,
  type User,
  type IdTokenResult,
} from 'firebase/auth';
import {
  createAuthProvider,
  signInWithProvider,
  signOutUser,
  extractClaims,
  fetchClaimsWithRetry,
  buildAuthUser,
  parseAuthError,
} from './authService';

vi.mock('firebase/auth', () => {
  const MockOAuthProvider = vi.fn().mockImplementation((providerId: string) => {
    return {
      providerId,
      setCustomParameters: vi.fn(),
    };
  });
  const MockGoogleAuthProvider = vi.fn().mockImplementation(() => {
    return {
      providerId: 'google.com',
      setCustomParameters: vi.fn(),
    };
  });

  return {
    OAuthProvider: MockOAuthProvider,
    GoogleAuthProvider: MockGoogleAuthProvider,
    signInWithPopup: vi.fn(),
    signOut: vi.fn(),
  };
});

vi.mock('@/shared', () => ({
  getFirebaseAuth: vi.fn(() => ({ currentUser: null } as unknown as Auth)),
}));

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createAuthProvider', () => {
    it('creates OAuthProvider configured for Microsoft', () => {
      const provider = createAuthProvider('microsoft');
      expect(OAuthProvider).toHaveBeenCalledWith('microsoft.com');
      expect(provider.setCustomParameters).toHaveBeenCalledWith({
        prompt: 'select_account',
      });
    });

    it('creates GoogleAuthProvider configured for Google', () => {
      const provider = createAuthProvider('google');
      expect(GoogleAuthProvider).toHaveBeenCalled();
      expect(provider.setCustomParameters).toHaveBeenCalledWith({
        prompt: 'select_account',
      });
    });
  });

  describe('signInWithProvider & signOutUser', () => {
    it('calls signInWithPopup with provided auth instance and provider', async () => {
      const mockAuth = {} as Auth;
      const mockCred = { user: { uid: 'u1' } };
      vi.mocked(signInWithPopup).mockResolvedValueOnce(mockCred as never);

      const result = await signInWithProvider('microsoft', mockAuth);

      expect(signInWithPopup).toHaveBeenCalledWith(mockAuth, expect.anything());
      expect(result).toBe(mockCred);
    });

    it('calls signOut with provided auth instance', async () => {
      const mockAuth = {} as Auth;
      vi.mocked(signOut).mockResolvedValueOnce(undefined);

      await signOutUser(mockAuth);

      expect(signOut).toHaveBeenCalledWith(mockAuth);
    });
  });

  describe('extractClaims', () => {
    it('extracts valid role and active status', () => {
      const tokenResult: IdTokenResult = {
        token: 'fake-token',
        authTime: '2026-09-30',
        issuedAtTime: '2026-09-30',
        expirationTime: '2026-09-30',
        signInProvider: 'microsoft.com',
        signInSecondFactor: null,
        claims: {
          role: 'LEGAL',
          isActive: true,
          department: 'Pháp chế',
        },
      };

      const result = extractClaims(tokenResult);
      expect(result).toEqual({
        role: 'LEGAL',
        isActive: true,
        department: 'Pháp chế',
        isReady: true,
      });
    });

    it('handles missing or invalid role gracefully', () => {
      const tokenResult: IdTokenResult = {
        token: 'fake-token',
        authTime: '',
        issuedAtTime: '',
        expirationTime: '',
        signInProvider: null,
        signInSecondFactor: null,
        claims: {
          role: 'INVALID_ROLE',
          isActive: false,
        },
      };

      const result = extractClaims(tokenResult);
      expect(result.role).toBeNull();
      expect(result.isActive).toBe(false);
      expect(result.isReady).toBe(false);
    });
  });

  describe('fetchClaimsWithRetry', () => {
    it('returns immediately if claims are already ready', async () => {
      const mockUser = {
        getIdTokenResult: vi.fn().mockResolvedValue({
          claims: { role: 'USER', isActive: true },
        }),
      } as unknown as User;

      const result = await fetchClaimsWithRetry(mockUser, 3, 10);
      expect(result.isReady).toBe(true);
      expect(result.role).toBe('USER');
      expect(mockUser.getIdTokenResult).toHaveBeenCalledTimes(1);
    });

    it('retries until claims are ready', async () => {
      const mockUser = {
        getIdTokenResult: vi
          .fn()
          .mockResolvedValueOnce({ claims: {} }) // attempt 0: not ready
          .mockResolvedValueOnce({ claims: { role: 'HOL', isActive: true } }), // attempt 1: ready
      } as unknown as User;

      const result = await fetchClaimsWithRetry(mockUser, 3, 10);
      expect(result.isReady).toBe(true);
      expect(result.role).toBe('HOL');
      expect(mockUser.getIdTokenResult).toHaveBeenCalledTimes(2);
    });
  });

  describe('buildAuthUser', () => {
    it('constructs an AuthUser correctly', () => {
      const mockUser = {
        uid: 'user-123',
        email: 'tindn@foodempire.vn',
        displayName: 'Tin Doan',
      } as User;

      const claims = {
        role: 'LEGAL' as const,
        isActive: true,
        department: 'Legal Team',
        isReady: true,
      };

      const authUser = buildAuthUser(mockUser, claims);
      expect(authUser).toEqual({
        uid: 'user-123',
        email: 'tindn@foodempire.vn',
        displayName: 'Tin Doan',
        role: 'LEGAL',
        isActive: true,
        department: 'Legal Team',
      });
    });
  });

  describe('parseAuthError', () => {
    it('translates auth/popup-closed-by-user correctly', () => {
      const error = { code: 'auth/popup-closed-by-user' };
      const parsed = parseAuthError(error);
      expect(parsed.type).toBe('POPUP_CLOSED');
      expect(parsed.message).toContain('Cửa sổ đăng nhập đã bị đóng');
    });

    it('translates auth/popup-blocked correctly', () => {
      const error = { code: 'auth/popup-blocked' };
      const parsed = parseAuthError(error);
      expect(parsed.type).toBe('BLOCKED_POPUP');
      expect(parsed.message).toContain('chặn cửa sổ đăng nhập');
    });

    it('translates auth/network-request-failed correctly', () => {
      const error = { code: 'auth/network-request-failed' };
      const parsed = parseAuthError(error);
      expect(parsed.type).toBe('NETWORK_ERROR');
      expect(parsed.message).toContain('kết nối mạng');
    });

    it('translates auth/user-disabled correctly', () => {
      const error = { code: 'auth/user-disabled' };
      const parsed = parseAuthError(error);
      expect(parsed.type).toBe('INACTIVE_ACCOUNT');
      expect(parsed.message).toContain('bị vô hiệu hóa');
    });

    it('handles unexpected error types safely', () => {
      const parsed = parseAuthError('Plain string error');
      expect(parsed.type).toBe('UNKNOWN');
      expect(parsed.message).toBe('Đã xảy ra lỗi không xác định khi đăng nhập.');
    });
  });
});
