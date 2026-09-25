/**
 * HistoryView — Shows previous chat sessions.
 */

import React from 'react';
import { useAppState, useAppDispatch } from '../../context/AppStateContext';
import { MessageSquare, Clock } from 'lucide-react';
import { Session } from '../../types/state';

export const HistoryView: React.FC = () => {
  const { sessionHistory } = useAppState();
  const dispatch = useAppDispatch();

  const handleLoadSession = (session: Session) => {
    dispatch({ type: 'LOAD_SESSION', session });
  };

  if (sessionHistory.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center text-[var(--arc-text-secondary)] arc-fade-in">
        <Clock size={32} className="mb-4 opacity-50" />
        <p className="text-[var(--arc-font-size-sm)]">No past sessions found.</p>
      </div>
    );
  }

  // Sort newest first
  const sortedHistory = [...sessionHistory].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div className="flex flex-col h-full overflow-y-auto arc-fade-in">
      <div className="flex flex-col">
        {sortedHistory.map((session) => (
          <button
            key={session.id}
            onClick={() => handleLoadSession(session)}
            className="flex flex-col items-start gap-1 p-3 border-b border-[var(--arc-border)] bg-transparent hover:bg-[var(--arc-bg-hover)] transition-colors cursor-pointer text-left w-full border-x-0 border-t-0"
          >
            <div className="flex items-center gap-2 text-[var(--arc-text-primary)] w-full">
              <MessageSquare size={14} className="shrink-0 text-[var(--arc-text-secondary)]" />
              <span className="font-medium text-[var(--arc-font-size-sm)] truncate flex-1">
                {session.title || 'Untitled Session'}
              </span>
            </div>
            
            <div className="flex items-center justify-between w-full text-[var(--arc-font-size-xs)] text-[var(--arc-text-secondary)] pl-6">
              <span>{new Date(session.updatedAt).toLocaleDateString()}</span>
              <span>{session.messages.length} msgs</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
