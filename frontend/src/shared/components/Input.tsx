/**
 * Input UI Primitive
 * Enterprise text input with label, icons, helper text, and validation error states
 */

import React, { forwardRef, useId } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  readonly label?: string;
  readonly error?: string;
  readonly helperText?: string;
  readonly leftIcon?: React.ReactNode;
  readonly rightIcon?: React.ReactNode;
  readonly fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      fullWidth = false,
      className,
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || (label ? `input-${generatedId}` : undefined);

    const hasError = Boolean(error);

    const inputClasses = twMerge(
      clsx(
        'h-9 rounded-md text-sm border px-3 transition-colors bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50',
        hasError
          ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-200 dark:focus:ring-rose-950/50'
          : 'border-slate-200 dark:border-slate-700 focus:border-brand-500 focus:ring-brand-200 dark:focus:ring-brand-950/50',
        leftIcon ? 'pl-9' : 'pl-3',
        rightIcon ? 'pr-9' : 'pr-3',
        fullWidth ? 'w-full' : 'w-auto',
        className
      )
    );

    return (
      <div className={clsx('flex flex-col gap-1', fullWidth && 'w-full')}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-medium text-slate-700 dark:text-slate-300 select-none"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-2.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
              {leftIcon}
            </div>
          )}

          <input
            id={inputId}
            ref={ref}
            disabled={disabled}
            aria-invalid={hasError}
            className={inputClasses}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-2.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
              {rightIcon}
            </div>
          )}
        </div>

        {error ? (
          <p className="text-xs text-rose-500 dark:text-rose-400">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-slate-400 dark:text-slate-500">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
