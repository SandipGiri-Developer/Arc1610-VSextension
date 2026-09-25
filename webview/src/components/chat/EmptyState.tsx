/**
 * EmptyState — Shown when a new session starts.
 */

import React from 'react';
import { useAppState } from '../../context/AppStateContext';

export const EmptyState: React.FC = () => {
  const { indexStatus } = useAppState();

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center text-[var(--arc-text-secondary)] arc-fade-in">
      <div className="text-4xl mb-4 select-none opacity-50">✨</div>
      <h3 className="text-[var(--arc-font-size-lg)] font-semibold text-[var(--arc-text-primary)] mb-2">
        How can I help you today?
      </h3>
      <p className="text-[var(--arc-font-size-sm)] mb-4 max-w-[240px]">
        Arc1610 uses your configured codebase index to provide context-aware responses.
      </p>

      {indexStatus.indexed ? (
        <div className="text-[var(--arc-font-size-xs)] flex items-center gap-1.5 px-3 py-1 bg-[var(--arc-bg-secondary)] border border-[var(--arc-border)] rounded-full text-green-500 dark:text-green-400">
          <div className="w-2 h-2 rounded-full bg-current"></div>
          Workspace indexed ({indexStatus.fileCount} files)
        </div>
      ) : (
        <div className="text-[var(--arc-font-size-xs)] flex items-center gap-1.5 px-3 py-1 bg-[var(--arc-bg-secondary)] border border-[var(--arc-border)] rounded-full text-yellow-600 dark:text-yellow-500">
          <div className="w-2 h-2 rounded-full bg-current animate-pulse"></div>
          Workspace not fully indexed
        </div>
      )}
    </div>
  );
};
