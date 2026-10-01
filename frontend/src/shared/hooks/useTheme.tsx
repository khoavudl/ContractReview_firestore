/**
 * Theme Management Hook & Provider
 * Locked to Clean Enterprise Light Theme
 */

import React, { createContext, useContext, useEffect, useMemo } from 'react';

export type Theme = 'light';
export type EffectiveTheme = 'light';

export interface ThemeContextValue {
  readonly theme: Theme;
  readonly effectiveTheme: EffectiveTheme;
  readonly setTheme: (theme?: string) => void;
  readonly toggleTheme: () => void;
}

const THEME_STORAGE_KEY = 'cr_theme_mode';
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { readonly children: React.ReactNode }): React.ReactElement {
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('dark');
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(THEME_STORAGE_KEY);
    }
  }, []);

  const value = useMemo<ThemeContextValue>(() => {
    return {
      theme: 'light',
      effectiveTheme: 'light',
      setTheme: () => {},
      toggleTheme: () => {},
    };
  }, []);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
