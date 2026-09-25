/**
 * Badge — Small label/indicator primitive.
 * Used for provider name, model name, status indicators.
 */

import React from 'react';
import { clsx } from 'clsx';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  className,
}) => {
  return (
    <span
      className={clsx(
        'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] uppercase font-semibold leading-tight',
        variant === 'default' && 'bg-[var(--arc-bg-badge)] text-[var(--arc-text-badge)]',
        variant === 'success' && 'bg-green-500/15 text-[var(--arc-success)]',
        variant === 'warning' && 'bg-yellow-500/15 text-[var(--arc-warning)]',
        variant === 'error' && 'bg-red-500/15 text-[var(--arc-error)]',
        className,
      )}
    >
      {children}
    </span>
  );
};
