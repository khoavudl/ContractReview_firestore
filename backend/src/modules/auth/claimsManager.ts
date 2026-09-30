import type * as admin from 'firebase-admin';
import type { UserDocument, UserRole } from '../../types/index.js';
import { isValidRole } from './whitelistValidator.js';

export interface CustomClaims {
  role: UserRole;
  isActive: boolean;
}

export type SyncClaimsReason =
  | 'SYNCED'
  | 'REVOKED_DELETED_USER'
  | 'INVALID_USER_DATA'
  | 'USER_NOT_FOUND_IN_AUTH'
  | 'AUTH_ERROR';

export interface SyncClaimsResult {
  success: boolean;
  uid: string;
  claims?: CustomClaims | null;
  reason: SyncClaimsReason;
  error?: string;
}

/**
 * Revokes all custom claims for a given UID (e.g. when deleted from whitelist).
 */
async function revokeClaims(
  auth: admin.auth.Auth,
  uid: string
): Promise<SyncClaimsResult> {
  try {
    await auth.setCustomUserClaims(uid, null);
    return { success: true, uid, claims: null, reason: 'REVOKED_DELETED_USER' };
  } catch (err: unknown) {
    return handleAuthError(uid, err);
  }
}

/**
 * Sets validated custom claims for an existing Auth user.
 */
async function applyClaims(
  auth: admin.auth.Auth,
  uid: string,
  role: UserRole,
  isActive: boolean
): Promise<SyncClaimsResult> {
  const claims: CustomClaims = { role, isActive };
  try {
    await auth.setCustomUserClaims(uid, claims);
    return { success: true, uid, claims, reason: 'SYNCED' };
  } catch (err: unknown) {
    return handleAuthError(uid, err);
  }
}

interface FirebaseAuthErrorLike {
  code?: string;
  message?: string;
}

/**
 * Type guard for error objects shaped like Firebase Auth errors.
 */
function isFirebaseAuthError(err: unknown): err is FirebaseAuthErrorLike {
  return typeof err === 'object' && err !== null && ('code' in err || 'message' in err);
}

/**
 * Handles Firebase Auth errors such as user-not-found using safe type narrowing.
 */
function handleAuthError(uid: string, err: unknown): SyncClaimsResult {
  if (isFirebaseAuthError(err)) {
    if (err.code === 'auth/user-not-found') {
      return { success: false, uid, reason: 'USER_NOT_FOUND_IN_AUTH' };
    }
    return {
      success: false,
      uid,
      reason: 'AUTH_ERROR',
      error: err.message ?? 'Unknown auth error',
    };
  }

  return {
    success: false,
    uid,
    reason: 'AUTH_ERROR',
    error: err instanceof Error ? err.message : 'Unknown auth error',
  };
}

/**
 * Synchronizes Firestore user whitelist document data with Firebase Auth Custom Claims.
 * Adheres to SRP with <= 25 lines of logic.
 */
export async function syncUserCustomClaims(
  auth: admin.auth.Auth,
  uid: string,
  userData: Partial<UserDocument> | undefined
): Promise<SyncClaimsResult> {
  if (!uid || uid.trim() === '') {
    return { success: false, uid: '', reason: 'INVALID_USER_DATA', error: 'Missing UID' };
  }

  if (!userData) {
    return revokeClaims(auth, uid);
  }

  if (!isValidRole(userData.role) || typeof userData.isActive !== 'boolean') {
    return {
      success: false,
      uid,
      reason: 'INVALID_USER_DATA',
      error: 'Invalid role or isActive flag',
    };
  }

  return applyClaims(auth, uid, userData.role, userData.isActive);
}
