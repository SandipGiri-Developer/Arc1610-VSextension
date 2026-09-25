/**
 * SettingsView — Modular settings page.
 */

import React from 'react';
import { useAppState } from '../../context/AppStateContext';
import { useMessenger } from '../../context/MessengerContext';
import { Badge } from '../primitives/Badge';

export const SettingsView: React.FC = () => {
  const { config } = useAppState();
  const messenger = useMessenger();

  const openProviderConfig = () => {
    messenger.post({ type: 'executeCommand', command: 'arc1610.configureProvider' });
  };

  const forceIndex = () => {
    messenger.post({ type: 'executeCommand', command: 'arc1610.indexWorkspace' });
  };

  const reindex = () => {
    messenger.post({ type: 'executeCommand', command: 'arc1610.reindexWorkspace' });
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto arc-fade-in pb-4">
      <div className="p-4 flex flex-col gap-6">
        
        {/* Provider Settings */}
        <section className="flex flex-col gap-3">
          <h2 className="text-[11px] uppercase font-bold text-[var(--arc-text-secondary)] tracking-wider m-0">
            AI Provider
          </h2>
          
          <div className="flex flex-col gap-2 p-3 bg-[var(--arc-bg-secondary)] border border-[var(--arc-border)] rounded-[var(--arc-radius-md)]">
            <div className="flex justify-between items-center">
              <span className="text-[var(--arc-text-primary)] font-medium capitalize">
                {config.provider || 'None'}
              </span>
              <button 
                onClick={openProviderConfig}
                className="text-[var(--arc-font-size-xs)] px-2 py-1 bg-[var(--arc-btn-bg)] text-[var(--arc-btn-fg)] rounded-[var(--arc-radius-sm)] hover:bg-[var(--arc-btn-hover)] transition-colors border-none cursor-pointer"
              >
                Change
              </button>
            </div>
            
            <div className="text-[var(--arc-font-size-xs)] text-[var(--arc-text-secondary)] mt-1">
              Model: <span className="font-mono">{config.model || '(Default)'}</span>
            </div>
            
            {!config.hasApiKey && config.provider !== 'ollama' && (
              <div className="text-[var(--arc-font-size-xs)] text-[var(--arc-error)] mt-2 flex items-center gap-1.5 p-2 bg-red-500/10 rounded-[var(--arc-radius-sm)]">
                ⚠️ API Key not configured
              </div>
            )}
            {config.hasApiKey && config.provider !== 'ollama' && (
              <div className="text-[var(--arc-font-size-xs)] text-[var(--arc-success)] mt-2 flex items-center gap-1.5">
                ✓ API Key securely stored
              </div>
            )}
          </div>
        </section>

        {/* Indexing Settings */}
        <section className="flex flex-col gap-3">
          <h2 className="text-[11px] uppercase font-bold text-[var(--arc-text-secondary)] tracking-wider m-0">
            Codebase Context
          </h2>
          
          <div className="flex flex-col gap-2">
            <button 
              onClick={forceIndex}
              className="text-left p-3 rounded-[var(--arc-radius-md)] bg-[var(--arc-bg-secondary)] border border-[var(--arc-border)] hover:border-[var(--arc-focus-border)] transition-colors cursor-pointer"
            >
              <div className="font-medium text-[var(--arc-text-primary)] text-[var(--arc-font-size-sm)] mb-0.5">Force Incremental Index</div>
              <div className="text-[var(--arc-font-size-xs)] text-[var(--arc-text-secondary)]">Scan workspace for modified files</div>
            </button>
            
            <button 
              onClick={reindex}
              className="text-left p-3 rounded-[var(--arc-radius-md)] bg-[var(--arc-bg-secondary)] border border-[var(--arc-border)] hover:border-[var(--arc-focus-border)] transition-colors cursor-pointer"
            >
              <div className="font-medium text-[var(--arc-text-primary)] text-[var(--arc-font-size-sm)] mb-0.5">Full Re-Index</div>
              <div className="text-[var(--arc-font-size-xs)] text-[var(--arc-text-secondary)]">Clear vector DB and rescan entire workspace</div>
            </button>
          </div>
        </section>

      </div>
    </div>
  );
};
