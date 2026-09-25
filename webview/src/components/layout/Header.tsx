/**
 * Header — Top bar of the application shell.
 * Contains the brand, navigation actions, and view-switching controls.
 */

import React from 'react';
import { Plus, History, Settings, ArrowLeft } from 'lucide-react';
import { IconButton } from '../primitives/IconButton';
import { useAppState, useAppDispatch } from '../../context/AppStateContext';
import { useMessenger } from '../../context/MessengerContext';
import { AppView } from '../../types/state';

export const Header: React.FC = () => {
  const { view } = useAppState();
  const dispatch = useAppDispatch();
  const messenger = useMessenger();

  const setView = (v: AppView) => dispatch({ type: 'SET_VIEW', view: v });

  const handleNewChat = () => {
    messenger.post({ type: 'newChat' });
    dispatch({ type: 'NEW_SESSION' });
    setView('chat');
  };

  // Sub-view header with back button
  if (view !== 'chat') {
    const title = view === 'history' ? 'History' : 'Settings';
    return (
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--arc-border)] bg-[var(--arc-bg-primary)] shrink-0">
        <IconButton
          icon={<ArrowLeft size={16} />}
          title="Back to chat"
          onClick={() => setView('chat')}
        />
        <span className="font-semibold text-[var(--arc-text-title)] text-[var(--arc-font-size-lg)]">
          {title}
        </span>
      </div>
    );
  }

  // Main chat header
  return (
    <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--arc-border)] bg-[var(--arc-bg-primary)] shrink-0">
      <span className="font-semibold text-[var(--arc-text-title)] text-[var(--arc-font-size-lg)] select-none">
        Arc1610
      </span>
      <div className="flex items-center gap-0.5">
        <IconButton
          icon={<Plus size={16} />}
          title="New Chat"
          onClick={handleNewChat}
        />
        <IconButton
          icon={<History size={16} />}
          title="History"
          onClick={() => setView('history')}
        />
        <IconButton
          icon={<Settings size={16} />}
          title="Settings"
          onClick={() => setView('settings')}
        />
      </div>
    </div>
  );
};
