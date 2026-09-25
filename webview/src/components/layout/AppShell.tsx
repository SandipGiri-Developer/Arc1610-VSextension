/**
 * AppShell — Root layout container.
 * Combines Header and ViewContainer.
 */

import React from 'react';
import { Header } from './Header';
import { useAppState } from '../../context/AppStateContext';
import { ChatView } from '../chat/ChatView';
import { SettingsView } from '../settings/SettingsView';
import { HistoryView } from '../history/HistoryView';

export const AppShell: React.FC = () => {
  const { view } = useAppState();

  return (
    <div className="flex flex-col h-full bg-[var(--arc-bg-primary)] text-[var(--arc-text-primary)] overflow-hidden font-sans text-[var(--arc-font-size-base)]">
      <Header />
      
      {/* View Container */}
      <div className="flex-1 overflow-hidden relative">
        {view === 'chat' && <ChatView />}
        {view === 'settings' && <SettingsView />}
        {view === 'history' && <HistoryView />}
      </div>
    </div>
  );
};
