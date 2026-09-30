/**
 * Application Providers
 * Authentication State & Global Context Providers
 */

import React, { createContext, useContext, useState, useMemo } from 'react';
import { ThemeProvider, ToastProvider, type AuthUser } from '@/shared';

export interface AuthContextValue {
  readonly currentUser: AuthUser | null;
  readonly isLoading: boolean;
  readonly isAuthenticated: boolean;
  readonly login: (user: AuthUser) => void;
  readonly logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export interface AuthProviderProps {
  readonly children: React.ReactNode;
  readonly initialUser?: AuthUser | null;
  readonly initialLoading?: boolean;
}

export function AuthProvider({
  children,
  initialUser = null,
  initialLoading = false,
}: AuthProviderProps): React.ReactElement {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(initialUser);
  const [isLoading, setIsLoading] = useState<boolean>(initialLoading);

  const value = useMemo<AuthContextValue>(() => {
    return {
      currentUser,
      isLoading,
      isAuthenticated: currentUser !== null,
      login: (user: AuthUser) => {
        setCurrentUser(user);
        setIsLoading(false);
      },
      logout: () => {
        setCurrentUser(null);
        setIsLoading(false);
      },
    };
  }, [currentUser, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}

export function AppProviders({
  children,
  initialUser = null,
  initialLoading = false,
}: AuthProviderProps): React.ReactElement {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider initialUser={initialUser} initialLoading={initialLoading}>
          {children}
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
