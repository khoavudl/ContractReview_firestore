/**
 * Feature: Auth & Whitelist Check
 * Hook: useAuth — Primary authentication hook for components
 */

import { useAuthContext, type AuthContextValue } from '../context/AuthContext';
import { useCurrentUser, type CurrentUserPermissions } from './useCurrentUser';

export interface UseAuthReturn extends AuthContextValue {
  readonly permissions: CurrentUserPermissions;
}

export function useAuth(): UseAuthReturn {
  const context = useAuthContext();
  const permissions = useCurrentUser(context.currentUser);

  return {
    ...context,
    permissions,
  };
}
