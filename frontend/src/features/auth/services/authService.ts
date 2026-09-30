/**
 * Feature: Auth & Whitelist Check
 * Auth Service — Firebase Auth Integration & Claims Management
 */

import {
  OAuthProvider,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  type Auth,
  type User,
  type UserCredential,
  type IdTokenResult,
} from 'firebase/auth';
import { getFirebaseAuth, type AuthUser, type UserRole } from '@/shared';
import type {
  SignInProvider,
  ClaimsCheckResult,
  AuthErrorInfo,
  AuthErrorType,
} from '../types';

/**
 * Configure Firebase Auth Provider instance based on selection
 */
export function createAuthProvider(
  provider: SignInProvider
): OAuthProvider | GoogleAuthProvider {
  if (provider === 'microsoft') {
    const msProvider = new OAuthProvider('microsoft.com');
    msProvider.setCustomParameters({ prompt: 'select_account' });
    return msProvider;
  }

  const googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({ prompt: 'select_account' });
  return googleProvider;
}

/**
 * Perform popup authentication with selected provider
 */
export async function signInWithProvider(
  provider: SignInProvider,
  authInstance?: Auth
): Promise<UserCredential> {
  const auth = authInstance ?? getFirebaseAuth();
  const authProvider = createAuthProvider(provider);
  return signInWithPopup(auth, authProvider);
}

/**
 * Sign out current user
 */
export async function signOutUser(authInstance?: Auth): Promise<void> {
  const auth = authInstance ?? getFirebaseAuth();
  await signOut(auth);
}

/**
 * Extract role and active status from Firebase IdTokenResult
 */
export function extractClaims(tokenResult: IdTokenResult): ClaimsCheckResult {
  const rawRole = tokenResult.claims.role;
  const rawActive = tokenResult.claims.isActive;
  const department = typeof tokenResult.claims.department === 'string'
    ? tokenResult.claims.department
    : undefined;

  const validRoles: readonly UserRole[] = ['USER', 'LEGAL', 'HOL'];
  const role: UserRole | null = typeof rawRole === 'string' && validRoles.includes(rawRole as UserRole)
    ? (rawRole as UserRole)
    : null;

  const isActive = rawActive === true;
  const isReady = role !== null && typeof rawActive === 'boolean';

  return { role, isActive, department, isReady };
}

/**
 * Polling delay helper
 */
function waitDelay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch Custom Claims with retry mechanism for newly provisioned users
 */
export async function fetchClaimsWithRetry(
  user: User,
  maxRetries = 3,
  delayMs = 1500
): Promise<ClaimsCheckResult> {
  for (let attempt = 0; attempt < maxRetries; attempt += 1) {
    const tokenResult = await user.getIdTokenResult(true);
    const result = extractClaims(tokenResult);
    if (result.isReady) {
      return result;
    }
    if (attempt < maxRetries - 1) {
      await waitDelay(delayMs);
    }
  }

  const finalToken = await user.getIdTokenResult(true);
  return extractClaims(finalToken);
}

/**
 * Construct AuthUser domain model from Firebase User and Claims
 */
export function buildAuthUser(
  user: User,
  claims: ClaimsCheckResult
): AuthUser {
  return {
    uid: user.uid,
    email: user.email ?? '',
    displayName: user.displayName || user.email || 'Người dùng',
    role: claims.role ?? 'USER',
    isActive: claims.isActive,
    department: claims.department,
  };
}

interface ErrorWithCode {
  readonly code?: unknown;
  readonly message?: unknown;
}

function resolveErrorCodeType(code: string): { type: AuthErrorType; message: string } {
  if (code === 'auth/popup-closed-by-user') {
    return { type: 'POPUP_CLOSED', message: 'Cửa sổ đăng nhập đã bị đóng trước khi hoàn tất.' };
  }
  if (code === 'auth/popup-blocked') {
    return { type: 'BLOCKED_POPUP', message: 'Trình duyệt đã chặn cửa sổ đăng nhập. Vui lòng cho phép popup.' };
  }
  if (code === 'auth/network-request-failed') {
    return { type: 'NETWORK_ERROR', message: 'Lỗi kết nối mạng. Vui lòng kiểm tra lại đường truyền internet.' };
  }
  if (code === 'auth/user-disabled') {
    return { type: 'INACTIVE_ACCOUNT', message: 'Tài khoản của bạn đã bị vô hiệu hóa.' };
  }
  if (code === 'auth/invalid-api-key' || code === 'auth/api-key-not-valid') {
    return { type: 'UNKNOWN', message: 'Khóa API Firebase không hợp lệ. Vui lòng cấu hình VITE_FIREBASE_API_KEY trong file .env.' };
  }
  if (code === 'auth/operation-not-allowed') {
    return { type: 'UNKNOWN', message: 'Phương thức đăng nhập chưa được kích hoạt trên Firebase Console.' };
  }
  if (code === 'auth/unauthorized-domain') {
    return { type: 'UNKNOWN', message: 'Domain hiện tại chưa được cấp phép trong Authorized Domains của Firebase.' };
  }
  return { type: 'UNKNOWN', message: 'Đăng nhập không thành công. Vui lòng thử lại.' };
}

/**
 * Parse Firebase and application errors into user-friendly Vietnamese messages
 */
export function parseAuthError(error: unknown): AuthErrorInfo {
  console.error('[Firebase Auth Error]:', error);

  if (typeof error === 'object' && error !== null) {
    const errObj = error as ErrorWithCode;
    if (typeof errObj.code === 'string') {
      const resolved = resolveErrorCodeType(errObj.code);
      return { ...resolved, originalError: error };
    }
    if (typeof errObj.message === 'string') {
      return {
        type: 'UNKNOWN',
        message: errObj.message,
        originalError: error,
      };
    }
  }

  return {
    type: 'UNKNOWN',
    message: 'Đã xảy ra lỗi không xác định khi đăng nhập.',
    originalError: error,
  };
}
