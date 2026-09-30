/**
 * Toast UI Primitive & ToastContainer
 * Floating notification alerts with colored variant accents and dismiss action
 */

import React from 'react';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useToast, type ToastItem, type ToastVariant } from '../hooks/useToast';

const VARIANT_ICONS: Record<ToastVariant, React.ReactElement> = {
  success: <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />,
  error: <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />,
  warning: <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />,
  info: <Info className="w-4 h-4 text-brand-500 shrink-0" />,
};

const VARIANT_CONTAINER_CLASSES: Record<ToastVariant, string> = {
  success: 'border-l-4 border-l-emerald-500',
  error: 'border-l-4 border-l-rose-500',
  warning: 'border-l-4 border-l-amber-500',
  info: 'border-l-4 border-l-brand-500',
};

export interface ToastProps {
  readonly toast: ToastItem;
  readonly onClose: (id: string) => void;
}

export function Toast({ toast, onClose }: ToastProps): React.ReactElement {
  return (
    <div
      role="alert"
      data-testid={`toast-${toast.variant}`}
      className={clsx(
        'w-80 p-3.5 bg-surface-cardLight dark:bg-surface-cardDark border border-surface-borderLight dark:border-surface-borderDark rounded-lg shadow-lg flex items-start gap-3 transition-all animate-in slide-in-from-bottom-2',
        VARIANT_CONTAINER_CLASSES[toast.variant]
      )}
    >
      <div className="pt-0.5">{VARIANT_ICONS[toast.variant]}</div>

      <div className="flex-1 min-w-0">
        {toast.title && (
          <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
            {toast.title}
          </h4>
        )}
        <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
          {toast.message}
        </p>
      </div>

      <button
        onClick={() => onClose(toast.id)}
        aria-label="Đóng thông báo"
        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export function ToastContainer(): React.ReactElement | null {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div
      aria-live="polite"
      data-testid="toast-container"
      className="fixed bottom-4 right-4 z-50 flex flex-col-reverse gap-2 pointer-events-auto"
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onClose={removeToast} />
      ))}
    </div>
  );
}
