/**
 * Feature: Auth & Whitelist Check
 * Domain Types & Interfaces
 */

import type { UserRole, AuthUser } from '@/shared';

export type SignInProvider = 'microsoft' | 'google';

export type AuthErrorType =
  | 'POPUP_CLOSED'
  | 'BLOCKED_POPUP'
  | 'UNAUTHORIZED_EMAIL'
  | 'INACTIVE_ACCOUNT'
  | 'NETWORK_ERROR'
  | 'UNKNOWN';

export interface AuthErrorInfo {
  readonly type: AuthErrorType;
  readonly message: string;
  readonly originalError?: unknown;
}

export type WhitelistCheckStatus = 'CHECKING' | 'ALLOWED' | 'NOT_WHITELISTED' | 'INACTIVE';

export interface BlockedUserInfo {
  readonly email: string;
  readonly displayName?: string;
  readonly reason: 'NOT_WHITELISTED' | 'INACTIVE';
}

export interface CustomClaimsPayload {
  readonly role?: UserRole;
  readonly isActive?: boolean;
  readonly department?: string;
}

export interface ClaimsCheckResult {
  readonly role: UserRole | null;
  readonly isActive: boolean;
  readonly department?: string;
  readonly isReady: boolean;
}

export interface AuthState {
  readonly user: AuthUser | null;
  readonly isLoggingIn: boolean;
  readonly error: AuthErrorInfo | null;
  readonly blockedUser: BlockedUserInfo | null;
}
