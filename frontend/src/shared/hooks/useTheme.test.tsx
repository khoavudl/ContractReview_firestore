import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { ThemeProvider, useTheme } from './useTheme';

describe('useTheme hook (Locked Light Theme)', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.add('dark');
    localStorage.setItem('cr_theme_mode', 'dark');
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    vi.restoreAllMocks();
  });

  it('should throw error when used outside ThemeProvider', () => {
    expect(() => renderHook(() => useTheme())).toThrowError(
      /useTheme must be used within a ThemeProvider/
    );
  });

  it('should lock theme to light and remove dark class and stored preference', () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ThemeProvider,
    });

    expect(result.current.theme).toBe('light');
    expect(result.current.effectiveTheme).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem('cr_theme_mode')).toBeNull();
  });

  it('maintains light theme even when toggleTheme or setTheme is invoked', () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ThemeProvider,
    });

    act(() => {
      result.current.toggleTheme();
    });

    expect(result.current.theme).toBe('light');
    expect(result.current.effectiveTheme).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    act(() => {
      result.current.setTheme('dark');
    });

    expect(result.current.theme).toBe('light');
    expect(result.current.effectiveTheme).toBe('light');
  });
});
