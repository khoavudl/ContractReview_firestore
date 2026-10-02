/**
 * Feature: Auth & Whitelist Check
 * Public API Barrel Export
 */

// Types
export type {
  SignInProvider,
  AuthErrorType,
  AuthErrorInfo,
  WhitelistCheckStatus,
  BlockedUserInfo,
  CustomClaimsPayload,
  ClaimsCheckResult,
  AuthState,
} from './types';

// Services
export {
  createAuthProvider,
  signInWithProvider,
  signInWithEmail,
  signOutUser,
  extractClaims,
  fetchClaimsWithRetry,
  fetchUserDocClaims,
  buildAuthUser,
  parseAuthError,
} from './services/authService';

// Context & State
export {
  AuthProvider,
  useAuthContext,
  type AuthContextValue,
  type AuthProviderProps,
} from './context/AuthContext';

// Hooks
export { useAuth, type UseAuthReturn } from './hooks/useAuth';
export {
  useCurrentUser,
  computeUserPermissions,
  type CurrentUserPermissions,
} from './hooks/useCurrentUser';

// Components
export { LoginCard, type LoginCardProps } from './components/LoginCard';
export {
  WhitelistBlockModal,
  type WhitelistBlockModalProps,
} from './components/WhitelistBlockModal';
