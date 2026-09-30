/**
 * Feature: Auth & Whitelist Check
 * Auth Context & State Provider
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { getFirebaseAuth, type AuthUser } from '@/shared';
import type {
  SignInProvider,
  AuthErrorInfo,
  BlockedUserInfo,
  ClaimsCheckResult,
} from '../types';
import {
  signInWithProvider,
  signOutUser,
  fetchClaimsWithRetry,
  buildAuthUser,
  parseAuthError,
} from '../services/authService';

export interface AuthContextValue {
  readonly currentUser: AuthUser | null;
  readonly isLoading: boolean;
  readonly isLoggingIn: boolean;
  readonly isAuthenticated: boolean;
  readonly error: AuthErrorInfo | null;
  readonly blockedUser: BlockedUserInfo | null;
  readonly login: (user: AuthUser) => void;
  readonly logout: () => Promise<void>;
  readonly signIn: (provider: SignInProvider) => Promise<boolean>;
  readonly clearError: () => void;
  readonly clearBlockedUser: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export interface AuthProviderProps {
  readonly children: React.ReactNode;
  readonly initialUser?: AuthUser | null;
  readonly initialLoading?: boolean;
  readonly skipAuthListener?: boolean;
}

function handleInvalidClaims(user: User, claims: ClaimsCheckResult): BlockedUserInfo {
  const email = user.email ?? '';
  const displayName = user.displayName || undefined;

  if (claims.role && !claims.isActive) {
    return { email, displayName, reason: 'INACTIVE' };
  }
  return { email, displayName, reason: 'NOT_WHITELISTED' };
}

export function AuthProvider({
  children,
  initialUser = null,
  initialLoading = false,
  skipAuthListener = false,
}: AuthProviderProps): React.ReactElement {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(initialUser);
  const [isLoading, setIsLoading] = useState<boolean>(initialLoading);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [error, setError] = useState<AuthErrorInfo | null>(null);
  const [blockedUser, setBlockedUser] = useState<BlockedUserInfo | null>(null);

  const clearError = useCallback(() => setError(null), []);
  const clearBlockedUser = useCallback(() => setBlockedUser(null), []);

  const login = useCallback((user: AuthUser) => {
    setCurrentUser(user);
    setIsLoading(false);
    setError(null);
    setBlockedUser(null);
  }, []);

  const logout = useCallback(async () => {
    try {
      await signOutUser();
    } catch {
      // Ignored during sign out
    } finally {
      setCurrentUser(null);
      setError(null);
      setBlockedUser(null);
      setIsLoading(false);
    }
  }, []);

  const executeSignIn = useCallback(async (provider: SignInProvider): Promise<boolean> => {
    setIsLoggingIn(true);
    setError(null);
    setBlockedUser(null);
    try {
      const cred = await signInWithProvider(provider);
      const claims = await fetchClaimsWithRetry(cred.user, 3, 1200);

      if (!claims.role || !claims.isActive) {
        await signOutUser();
        setBlockedUser(handleInvalidClaims(cred.user, claims));
        return false;
      }

      setCurrentUser(buildAuthUser(cred.user, claims));
      return true;
    } catch (err) {
      setError(parseAuthError(err));
      return false;
    } finally {
      setIsLoggingIn(false);
    }
  }, []);

  useEffect(() => {
    if (skipAuthListener) return undefined;

    try {
      const auth = getFirebaseAuth();
      return onAuthStateChanged(auth, async (firebaseUser) => {
        if (!firebaseUser) {
          setCurrentUser(null);
          setIsLoading(false);
          return;
        }

        try {
          const claims = await fetchClaimsWithRetry(firebaseUser, 2, 800);
          if (claims.role && claims.isActive) {
            setCurrentUser(buildAuthUser(firebaseUser, claims));
          } else {
            setCurrentUser(null);
            await signOutUser(auth);
            setBlockedUser(handleInvalidClaims(firebaseUser, claims));
          }
        } catch (err) {
          setError(parseAuthError(err));
          setCurrentUser(null);
        } finally {
          setIsLoading(false);
        }
      });
    } catch {
      setIsLoading(false);
      return undefined;
    }
  }, [skipAuthListener]);

  const value = useMemo<AuthContextValue>(() => ({
    currentUser,
    isLoading,
    isLoggingIn,
    isAuthenticated: currentUser !== null,
    error,
    blockedUser,
    login,
    logout,
    signIn: executeSignIn,
    clearError,
    clearBlockedUser,
  }), [currentUser, isLoading, isLoggingIn, error, blockedUser, login, logout, executeSignIn, clearError, clearBlockedUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
