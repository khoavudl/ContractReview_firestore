import { describe, it, expect, vi, beforeEach } from 'vitest';
import type * as admin from 'firebase-admin';
import { syncUserCustomClaims } from './claimsManager.js';
import type { UserDocument } from '../../types/index.js';

describe('claimsManager', () => {
  let mockAuth: {
    setCustomUserClaims: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockAuth = {
      setCustomUserClaims: vi.fn().mockResolvedValue(undefined),
    };
  });

  describe('syncUserCustomClaims', () => {
    it('sets custom claims successfully for a valid active USER', async () => {
      const userData: Partial<UserDocument> = {
        role: 'USER',
        isActive: true,
      };

      const result = await syncUserCustomClaims(
        mockAuth as unknown as admin.auth.Auth,
        'user-123',
        userData
      );

      expect(result.success).toBe(true);
      expect(result.reason).toBe('SYNCED');
      expect(result.claims).toEqual({ role: 'USER', isActive: true });
      expect(mockAuth.setCustomUserClaims).toHaveBeenCalledWith('user-123', {
        role: 'USER',
        isActive: true,
      });
    });

    it('sets custom claims for a LEGAL user with isActive=false', async () => {
      const userData: Partial<UserDocument> = {
        role: 'LEGAL',
        isActive: false,
      };

      const result = await syncUserCustomClaims(
        mockAuth as unknown as admin.auth.Auth,
        'legal-456',
        userData
      );

      expect(result.success).toBe(true);
      expect(result.claims).toEqual({ role: 'LEGAL', isActive: false });
      expect(mockAuth.setCustomUserClaims).toHaveBeenCalledWith('legal-456', {
        role: 'LEGAL',
        isActive: false,
      });
    });

    it('revokes claims when userData is undefined (document deleted)', async () => {
      const result = await syncUserCustomClaims(
        mockAuth as unknown as admin.auth.Auth,
        'user-deleted',
        undefined
      );

      expect(result.success).toBe(true);
      expect(result.reason).toBe('REVOKED_DELETED_USER');
      expect(result.claims).toBeNull();
      expect(mockAuth.setCustomUserClaims).toHaveBeenCalledWith('user-deleted', null);
    });

    it('fails when UID is empty or whitespace', async () => {
      const result = await syncUserCustomClaims(
        mockAuth as unknown as admin.auth.Auth,
        '   ',
        { role: 'USER', isActive: true }
      );

      expect(result.success).toBe(false);
      expect(result.reason).toBe('INVALID_USER_DATA');
      expect(mockAuth.setCustomUserClaims).not.toHaveBeenCalled();
    });

    it('fails when role is invalid and does not call setCustomUserClaims', async () => {
      const userData = {
        role: 'SUPERADMIN' as unknown,
        isActive: true,
      } as Partial<UserDocument>;

      const result = await syncUserCustomClaims(
        mockAuth as unknown as admin.auth.Auth,
        'user-bad-role',
        userData
      );

      expect(result.success).toBe(false);
      expect(result.reason).toBe('INVALID_USER_DATA');
      expect(mockAuth.setCustomUserClaims).not.toHaveBeenCalled();
    });

    it('fails when isActive is not boolean and does not call setCustomUserClaims', async () => {
      const userData = {
        role: 'USER',
        isActive: 'yes' as unknown,
      } as Partial<UserDocument>;

      const result = await syncUserCustomClaims(
        mockAuth as unknown as admin.auth.Auth,
        'user-bad-active',
        userData
      );

      expect(result.success).toBe(false);
      expect(result.reason).toBe('INVALID_USER_DATA');
      expect(mockAuth.setCustomUserClaims).not.toHaveBeenCalled();
    });

    it('handles auth/user-not-found gracefully without throwing', async () => {
      const authError = new Error('User not found');
      (authError as unknown as { code: string }).code = 'auth/user-not-found';
      mockAuth.setCustomUserClaims.mockRejectedValueOnce(authError);

      const result = await syncUserCustomClaims(
        mockAuth as unknown as admin.auth.Auth,
        'user-not-in-auth-yet',
        { role: 'USER', isActive: true }
      );

      expect(result.success).toBe(false);
      expect(result.reason).toBe('USER_NOT_FOUND_IN_AUTH');
    });

    it('handles generic Firebase Auth errors gracefully', async () => {
      mockAuth.setCustomUserClaims.mockRejectedValueOnce(new Error('Network error'));

      const result = await syncUserCustomClaims(
        mockAuth as unknown as admin.auth.Auth,
        'user-net-err',
        { role: 'USER', isActive: true }
      );

      expect(result.success).toBe(false);
      expect(result.reason).toBe('AUTH_ERROR');
      expect(result.error).toBe('Network error');
    });
  });

  describe('resolveUserAuthContext', () => {
    it('returns role and isActive directly from token claims if present', async () => {
      const mockDb = { collection: vi.fn() } as unknown as admin.firestore.Firestore;
      const { resolveUserAuthContext } = await import('./claimsManager.js');

      const result = await resolveUserAuthContext(mockDb, {
        uid: 'user-01',
        token: { role: 'LEGAL', isActive: true, email: 'legal@foodempire.vn' },
      });

      expect(result).toEqual({ role: 'LEGAL', isActive: true });
      expect(mockDb.collection).not.toHaveBeenCalled();
    });

    it('falls back to Firestore /users/{email} if token claims are missing', async () => {
      const mockDocGet = vi.fn().mockResolvedValue({
        exists: true,
        data: () => ({ role: 'USER', isActive: true }),
      });
      const mockCollection = vi.fn().mockReturnValue({
        doc: vi.fn().mockReturnValue({ get: mockDocGet }),
      });
      const mockDb = { collection: mockCollection } as unknown as admin.firestore.Firestore;
      const { resolveUserAuthContext } = await import('./claimsManager.js');

      const result = await resolveUserAuthContext(mockDb, {
        uid: 'user-no-claim',
        token: { email: 'Dkhoa8@Gmail.com' }, // tests case-insensitivity
      });

      expect(result).toEqual({ role: 'USER', isActive: true });
      expect(mockCollection).toHaveBeenCalledWith('users');
    });

    it('returns null role and false isActive if user is not in Firestore', async () => {
      const mockDocGet = vi.fn().mockResolvedValue({ exists: false });
      const mockCollection = vi.fn().mockReturnValue({
        doc: vi.fn().mockReturnValue({ get: mockDocGet }),
      });
      const mockDb = { collection: mockCollection } as unknown as admin.firestore.Firestore;
      const { resolveUserAuthContext } = await import('./claimsManager.js');

      const result = await resolveUserAuthContext(mockDb, {
        uid: 'unknown-uid',
        token: { email: 'stranger@foodempire.vn' },
      });

      expect(result).toEqual({ role: null, isActive: false });
    });
  });
});

