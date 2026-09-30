import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export type BadgeVariant =
  | 'slate'
  | 'amber'
  | 'orange'
  | 'blue'
  | 'indigo'
  | 'emerald'
  | 'rose';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  children: React.ReactNode;
}

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  slate:
    'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  amber:
    'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/60',
  orange:
    'bg-orange-50 text-orange-800 border-orange-200 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-800/60',
  blue:
    'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800/60',
  indigo:
    'bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800/60',
  emerald:
    'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60',
  rose:
    'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800/60',
};

const SIZE_CLASSES = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-xs font-medium px-2.5 py-1',
};

export const Badge: React.FC<BadgeProps> = ({
  variant = 'slate',
  size = 'md',
  className,
  children,
  ...props
}) => {
  const mergedClass = twMerge(
    clsx(
      'inline-flex items-center rounded-full border transition-colors font-medium',
      VARIANT_CLASSES[variant],
      SIZE_CLASSES[size],
      className
    )
  );

  return (
    <span className={mergedClass} {...props}>
      {children}
    </span>
  );
};
