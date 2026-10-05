/**
 * Application Providers
 * Authentication State & Global Context Providers
 */

import React from 'react';
import { ThemeProvider, ToastProvider } from '@/shared';
import {
  AuthProvider,
  useAuthContext,
  type AuthContextValue,
  type AuthProviderProps,
} from '@/features/auth';

export {
  AuthProvider,
  useAuthContext,
  type AuthContextValue,
  type AuthProviderProps,
};

export function AppProviders({
  children,
  initialUser = null,
  initialLoading,
  skipAuthListener = false,
}: AuthProviderProps): React.ReactElement {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider
          initialUser={initialUser}
          initialLoading={initialLoading}
          skipAuthListener={skipAuthListener}
        >
          {children}
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
