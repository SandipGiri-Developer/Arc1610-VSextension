/**
 * IconButton — Consistent icon-only button primitive.
 * Used throughout the UI for toolbar actions, message actions, etc.
 */

import React from 'react';
import { clsx } from 'clsx';

interface IconButtonProps {
  icon: React.ReactNode;
  onClick?: () => void;
  title: string;
  disabled?: boolean;
  variant?: 'default' | 'danger' | 'primary';
  size?: 'sm' | 'md';
  className?: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  onClick,
  title,
  disabled = false,
  variant = 'default',
  size = 'md',
  className,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={clsx(
        'inline-flex items-center justify-center rounded transition-colors',
        'bg-transparent border-none cursor-pointer',
        'text-[var(--arc-text-icon)]',
        size === 'sm' ? 'p-1' : 'p-1.5',
        variant === 'default' && 'hover:bg-[var(--arc-bg-toolbar-hover)]',
        variant === 'danger' && 'hover:bg-red-500/20 hover:text-red-400',
        variant === 'primary' && 'text-[var(--arc-btn-bg)] hover:bg-[var(--arc-bg-toolbar-hover)]',
        disabled && 'opacity-30 cursor-default pointer-events-none',
        className,
      )}
    >
      {icon}
    </button>
  );
};
