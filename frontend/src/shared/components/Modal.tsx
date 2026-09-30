/**
 * Modal Dialog UI Primitive
 * Accessible dialog with keyboard Escape support, backdrop dismiss, and custom footer
 */

import React, { useEffect, useId, useCallback } from 'react';
import { X } from 'lucide-react';
import { clsx } from 'clsx';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

export interface ModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly title?: string;
  readonly description?: string;
  readonly size?: ModalSize;
  readonly children: React.ReactNode;
  readonly footer?: React.ReactNode;
  readonly closeOnEscape?: boolean;
  readonly closeOnBackdropClick?: boolean;
}

const SIZE_CLASSES: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
};

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  size = 'md',
  children,
  footer,
  closeOnEscape = true,
  closeOnBackdropClick = true,
}: ModalProps): React.ReactElement | null {
  const titleId = useId();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent): void => {
      if (closeOnEscape && e.key === 'Escape') {
        onClose();
      }
    },
    [closeOnEscape, onClose]
  );

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) {
    return null;
  }

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (closeOnBackdropClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
      data-testid="modal-backdrop"
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        className={clsx(
          'w-full bg-surface-cardLight dark:bg-surface-cardDark border border-surface-borderLight dark:border-surface-borderDark rounded-xl shadow-xl flex flex-col overflow-hidden max-h-[90vh]',
          SIZE_CLASSES[size]
        )}
      >
        {(title || description) && (
          <div className="flex items-start justify-between px-6 pt-5 pb-3 border-b border-surface-borderLight dark:border-surface-borderDark">
            <div>
              {title && (
                <h3
                  id={titleId}
                  className="text-base font-semibold text-slate-900 dark:text-slate-100"
                >
                  {title}
                </h3>
              )}
              {description && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {description}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              aria-label="Đóng hộp thoại"
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="p-6 overflow-y-auto flex-1 text-sm text-slate-700 dark:text-slate-300">
          {children}
        </div>

        {footer && (
          <div className="px-6 py-3 border-t border-surface-borderLight dark:border-surface-borderDark bg-slate-50 dark:bg-slate-900/50 flex items-center justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
