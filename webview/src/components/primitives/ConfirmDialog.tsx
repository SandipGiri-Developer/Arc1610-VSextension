/**
 * ConfirmDialog — Reusable dialog primitive.
 * Provides confirmation, error, and generic dialog functionality.
 * Uses native dialog-like overlay pattern without external dependencies.
 */

import React, { useEffect, useRef } from 'react';
import { clsx } from 'clsx';
import { X } from 'lucide-react';
import { IconButton } from './IconButton';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  children?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'danger';
  onConfirm?: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  description,
  children,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  onConfirm,
  onCancel,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Trap focus and handle Escape
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        className={clsx(
          'relative z-10 w-[calc(100%-32px)] max-w-[360px]',
          'bg-[var(--arc-bg-secondary)] border border-[var(--arc-border)]',
          'rounded-[var(--arc-radius-lg)] shadow-lg',
          'arc-fade-in',
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-[var(--arc-border)]">
          <h2
            id="dialog-title"
            className="text-[var(--arc-font-size-lg)] font-semibold text-[var(--arc-text-primary)] m-0"
          >
            {title}
          </h2>
          <IconButton
            icon={<X size={14} />}
            title="Close"
            onClick={onCancel}
            size="sm"
          />
        </div>

        {/* Body */}
        <div className="p-3">
          {description && (
            <p className="text-[var(--arc-font-size-sm)] text-[var(--arc-text-secondary)] m-0 mb-3">
              {description}
            </p>
          )}
          {children}
        </div>

        {/* Footer */}
        {onConfirm && (
          <div className="flex justify-end gap-2 p-3 border-t border-[var(--arc-border)]">
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1.5 text-[var(--arc-font-size-sm)] rounded-[var(--arc-radius-sm)] bg-transparent text-[var(--arc-text-secondary)] hover:bg-[var(--arc-bg-hover)] transition-colors border-none cursor-pointer"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className={clsx(
                'px-3 py-1.5 text-[var(--arc-font-size-sm)] rounded-[var(--arc-radius-sm)] border-none cursor-pointer transition-colors',
                variant === 'danger'
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-[var(--arc-btn-bg)] text-[var(--arc-btn-fg)] hover:bg-[var(--arc-btn-hover)]',
              )}
            >
              {confirmLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
