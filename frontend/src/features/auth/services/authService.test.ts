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
  DEFAULT_MICROSOFT_TENANT_ID,
  createAuthProvider,
  signInWithProvider,
  signOutUser,
  extractClaims,
  extractUserEmail,
  extractUserDisplayName,
  fetchClaimsWithRetry,
  fetchUserDocClaims,
  buildAuthUser,
  parseAuthError,
} from './authService';
import { doc, getDoc } from 'firebase/firestore';

vi.mock('firebase/firestore', () => ({
  doc: vi.fn((_db, _col, id) => ({ id, path: `users/${id}` })),
  getDoc: vi.fn(),
}));

vi.mock('firebase/auth', () => {
  const MockOAuthProvider = vi.fn().mockImplementation((providerId: string) => {
    return {
      providerId,
      setCustomParameters: vi.fn(),
      addScope: vi.fn(),
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
  getFirebaseDb: vi.fn(() => ({ type: 'mockDb' })),
}));

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createAuthProvider', () => {
    it('creates OAuthProvider configured for Microsoft with prompt, tenant and standard scopes', () => {
      const provider = createAuthProvider('microsoft') as OAuthProvider & { addScope: (scope: string) => void };
      expect(OAuthProvider).toHaveBeenCalledWith('microsoft.com');
      expect(provider.setCustomParameters).toHaveBeenCalledWith({
        prompt: 'select_account',
        tenant: DEFAULT_MICROSOFT_TENANT_ID,
      });
      expect(provider.addScope).toHaveBeenCalledWith('email');
      expect(provider.addScope).toHaveBeenCalledWith('profile');
      expect(provider.addScope).toHaveBeenCalledWith('openid');
      expect(provider.addScope).toHaveBeenCalledWith('User.Read');
    });

    it('creates OAuthProvider configured with custom tenantOverride', () => {
      const provider = createAuthProvider('microsoft', 'custom-tenant-override') as OAuthProvider & { addScope: (scope: string) => void };
      expect(OAuthProvider).toHaveBeenCalledWith('microsoft.com');
      expect(provider.setCustomParameters).toHaveBeenCalledWith({
        prompt: 'select_account',
        tenant: 'custom-tenant-override',
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

  describe('extractUserEmail & extractUserDisplayName', () => {
    it('extracts direct email and converts to lowercase', () => {
      const user = { email: 'User.Test@FoodEmpire.VN' };
      expect(extractUserEmail(user)).toBe('user.test@foodempire.vn');
    });

    it('extracts email from providerData when direct email is empty or null', () => {
      const user = {
        email: null,
        providerData: [
          { email: '' },
          { email: 'MS_SPECIALIST@FOODEMPIRE.VN' },
        ],
      };
      expect(extractUserEmail(user)).toBe('ms_specialist@foodempire.vn');
    });

    it('returns empty string when no email is found anywhere', () => {
      const user = { email: null, providerData: [] };
      expect(extractUserEmail(user)).toBe('');
    });

    it('extracts direct displayName when available', () => {
      const user = { displayName: 'Trần Văn Microsoft', email: 'tran@example.com' };
      expect(extractUserDisplayName(user)).toBe('Trần Văn Microsoft');
    });

    it('extracts displayName from providerData when direct displayName is missing', () => {
      const user = {
        displayName: null,
        email: 'tran@example.com',
        providerData: [{ displayName: 'Trần Văn Microsoft (Provider)' }],
      };
      expect(extractUserDisplayName(user)).toBe('Trần Văn Microsoft (Provider)');
    });

    it('falls back to fallbackEmail or default label when displayName is missing', () => {
      const user = { displayName: null, email: null, providerData: [] };
      expect(extractUserDisplayName(user, 'custom@fallback.com')).toBe('custom@fallback.com');
      expect(extractUserDisplayName(user)).toBe('Người dùng');
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

    it('falls back to Firestore /users/{email} document when token has no custom claims', async () => {
      const mockUser = {
        uid: 'user-spark-1',
        email: 'Legal.Person@Example.com',
        getIdTokenResult: vi.fn().mockResolvedValue({ claims: {} }),
      } as unknown as User;

      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          role: 'LEGAL',
          isActive: true,
          department: 'Legal Ops',
        }),
      } as never);

      const result = await fetchClaimsWithRetry(mockUser, 1, 10);
      expect(result.isReady).toBe(true);
      expect(result.role).toBe('LEGAL');
      expect(result.isActive).toBe(true);
      expect(result.department).toBe('Legal Ops');
      expect(vi.mocked(doc)).toHaveBeenLastCalledWith(expect.anything(), 'users', 'legal.person@example.com');
    });

    it('resolves email from providerData when direct email is empty for Microsoft accounts', async () => {
      const mockUser = {
        uid: 'user-ms-provider-data',
        email: null,
        providerData: [
          { email: 'MS.Account@FoodEmpire.vn' },
        ],
        getIdTokenResult: vi.fn().mockResolvedValue({ claims: {} }),
      } as unknown as User;

      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          role: 'USER',
          isActive: true,
          department: 'Purchasing',
        }),
      } as never);

      const result = await fetchClaimsWithRetry(mockUser, 1, 10);
      expect(result.isReady).toBe(true);
      expect(result.role).toBe('USER');
      expect(result.isActive).toBe(true);
      expect(vi.mocked(doc)).toHaveBeenLastCalledWith(expect.anything(), 'users', 'ms.account@foodempire.vn');
    });
  });

  describe('fetchUserDocClaims', () => {
    it('returns active claims when Firestore doc exists and isActive is true', async () => {
      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          role: 'HOL',
          isActive: true,
          department: 'Ban Giám Đốc',
        }),
      } as never);

      const result = await fetchUserDocClaims('hol@example.com');
      expect(result).toEqual({
        role: 'HOL',
        isActive: true,
        department: 'Ban Giám Đốc',
        isReady: true,
      });
    });

    it('returns not ready without querying Firestore when email is missing', async () => {
      vi.mocked(getDoc).mockClear();

      const result = await fetchUserDocClaims(null);
      expect(result).toEqual({ role: null, isActive: false, isReady: false });
      expect(getDoc).not.toHaveBeenCalled();
    });

    it('returns not ready when user document does not exist (not whitelisted)', async () => {
      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => false,
      } as never);

      const result = await fetchUserDocClaims('unknown@example.com');
      expect(result).toEqual({
        role: null,
        isActive: false,
        isReady: false,
      });
    });

    it('returns isReady: true with isActive: false when user document is disabled', async () => {
      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          role: 'USER',
          isActive: false,
        }),
      } as never);

      const result = await fetchUserDocClaims('inactive@example.com');
      expect(result).toEqual({
        role: 'USER',
        isActive: false,
        department: undefined,
        isReady: true,
      });
    });

    it('handles Firestore error gracefully and returns fallback not ready', async () => {
      vi.mocked(getDoc).mockRejectedValueOnce(new Error('Permission denied'));

      const result = await fetchUserDocClaims('err@example.com');
      expect(result).toEqual({
        role: null,
        isActive: false,
        isReady: false,
      });
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

    it('constructs an AuthUser from Microsoft user with email in providerData', () => {
      const mockUser = {
        uid: 'ms-user-456',
        email: null,
        displayName: null,
        providerData: [
          {
            email: 'ms.staff@foodempire.vn',
            displayName: 'Microsoft Staff Member',
          },
        ],
      } as unknown as User;

      const claims = {
        role: 'USER' as const,
        isActive: true,
        department: 'Sales',
        isReady: true,
      };

      const authUser = buildAuthUser(mockUser, claims);
      expect(authUser).toEqual({
        uid: 'ms-user-456',
        email: 'ms.staff@foodempire.vn',
        displayName: 'Microsoft Staff Member',
        role: 'USER',
        isActive: true,
        department: 'Sales',
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
