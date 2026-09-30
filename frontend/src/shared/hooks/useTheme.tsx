/**
 * Theme Management Hook & Provider
 * Supports light, dark, and system preference with localStorage persistence
 */

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';

export type Theme = 'light' | 'dark' | 'system';
export type EffectiveTheme = 'light' | 'dark';

export interface ThemeContextValue {
  readonly theme: Theme;
  readonly effectiveTheme: EffectiveTheme;
  readonly setTheme: (theme: Theme) => void;
  readonly toggleTheme: () => void;
}

const THEME_STORAGE_KEY = 'cr_theme_mode';
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'system';
  const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
  if (stored === 'light' || stored === 'dark' || stored === 'system') {
    return stored;
  }
  return 'system';
}

function getSystemTheme(): EffectiveTheme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyThemeClass(effective: EffectiveTheme): void {
  if (typeof document === 'undefined') return;
  if (effective === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

export function ThemeProvider({ children }: { readonly children: React.ReactNode }): React.ReactElement {
  const [theme, setThemeState] = useState<Theme>(getStoredTheme);
  const [systemTheme, setSystemTheme] = useState<EffectiveTheme>(getSystemTheme);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent): void => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const effectiveTheme: EffectiveTheme = theme === 'system' ? systemTheme : theme;

  useEffect(() => {
    applyThemeClass(effectiveTheme);
  }, [effectiveTheme]);

  const setTheme = useCallback((newTheme: Theme): void => {
    setThemeState(newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
  }, []);

  const toggleTheme = useCallback((): void => {
    const next: Theme = effectiveTheme === 'dark' ? 'light' : 'dark';
    setTheme(next);
  }, [effectiveTheme, setTheme]);

  const value = useMemo<ThemeContextValue>(() => {
    return { theme, effectiveTheme, setTheme, toggleTheme };
  }, [theme, effectiveTheme, setTheme, toggleTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
