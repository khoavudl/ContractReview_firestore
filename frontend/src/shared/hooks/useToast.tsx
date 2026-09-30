/**
 * Toast Notification Hook & Provider
 * Manages queue of floating notification toasts with auto-dismiss
 */

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  readonly id: string;
  readonly message: string;
  readonly title?: string;
  readonly variant: ToastVariant;
  readonly duration: number;
}

export interface ToastOptions {
  readonly message: string;
  readonly title?: string;
  readonly variant?: ToastVariant;
  readonly duration?: number;
}

export interface ToastContextValue {
  readonly toasts: ReadonlyArray<ToastItem>;
  readonly showToast: (options: ToastOptions) => string;
  readonly removeToast: (id: string) => void;
  readonly clearToasts: () => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);
const DEFAULT_DURATION = 4000;

export function ToastProvider({ children }: { readonly children: React.ReactNode }): React.ReactElement {
  const [toasts, setToasts] = useState<ReadonlyArray<ToastItem>>([]);

  const removeToast = useCallback((id: string): void => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const clearToasts = useCallback((): void => {
    setToasts([]);
  }, []);

  const showToast = useCallback(
    (options: ToastOptions): string => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const duration = options.duration ?? DEFAULT_DURATION;

      const newToast: ToastItem = {
        id,
        message: options.message,
        title: options.title,
        variant: options.variant ?? 'info',
        duration,
      };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }

      return id;
    },
    [removeToast]
  );

  const value = useMemo<ToastContextValue>(() => {
    return { toasts, showToast, removeToast, clearToasts };
  }, [toasts, showToast, removeToast, clearToasts]);

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
