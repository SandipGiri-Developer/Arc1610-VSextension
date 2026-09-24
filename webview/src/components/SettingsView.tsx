import React from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import { useMessaging } from '../hooks/useMessaging';

interface SettingsViewProps {
  onBack: () => void;
  currentProvider: string;
  currentModel: string;
  hasApiKey: boolean;
  availableProviders: string[];
}

export const SettingsView: React.FC<SettingsViewProps> = ({ 
  onBack, 
  currentProvider,
  currentModel,
  hasApiKey,
  availableProviders
}) => {
  const { postMessage } = useMessaging(() => {});

  const openProviderConfig = () => {
    postMessage({ type: 'webviewReady' }); // Just generic heartbeat
    postMessage({ type: 'executeCommand', command: 'arc1610.configureProvider' });
  };

  return (
    <div className="flex flex-col h-full bg-[var(--vscode-sideBar-background)] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-2 p-3 border-b border-[var(--vscode-panel-border)] sticky top-0 bg-[var(--vscode-sideBar-background)]">
        <button 
          onClick={onBack}
          className="p-1 rounded hover:bg-[var(--vscode-toolbar-hoverBackground)] text-[var(--vscode-icon-foreground)] transition-colors"
        >
          <ArrowLeft size={16} />
        </button>
        <span className="font-semibold text-[var(--vscode-sideBarTitle-foreground)]">Settings</span>
      </div>

      <div className="p-4 flex flex-col gap-6">
        {/* Provider Settings Section */}
        <section className="flex flex-col gap-3">
          <h2 className="text-sm uppercase font-bold text-[var(--vscode-descriptionForeground)] tracking-wider">AI Provider</h2>
          
          <div className="flex flex-col gap-2 p-3 bg-[var(--vscode-editor-background)] border border-[var(--vscode-panel-border)] rounded">
            <div className="flex justify-between items-center">
              <span className="text-[var(--vscode-foreground)] font-medium capitalize">{currentProvider || 'None'}</span>
              <button 
                onClick={openProviderConfig}
                className="flex items-center gap-1 text-xs px-2 py-1 bg-[var(--vscode-button-background)] text-[var(--vscode-button-foreground)] rounded hover:bg-[var(--vscode-button-hoverBackground)] transition-colors"
              >
                Change Provider
              </button>
            </div>
            
            <div className="text-xs text-[var(--vscode-descriptionForeground)] mt-1">
              Model: <span className="font-mono">{currentModel || '(Default)'}</span>
            </div>
            
            {!hasApiKey && currentProvider !== 'ollama' && (
              <div className="text-xs text-red-400 mt-2 flex items-center gap-1 p-2 bg-red-500/10 rounded">
                ⚠️ API Key not configured. Please change provider to set it.
              </div>
            )}
            {hasApiKey && currentProvider !== 'ollama' && (
              <div className="text-xs text-green-400 mt-2 flex items-center gap-1">
                ✓ API Key securely stored
              </div>
            )}
          </div>
        </section>

        {/* Indexing Settings Section */}
        <section className="flex flex-col gap-3">
          <h2 className="text-sm uppercase font-bold text-[var(--vscode-descriptionForeground)] tracking-wider">Codebase Context</h2>
          
          <div className="flex flex-col gap-2">
            <button 
              onClick={() => postMessage({ type: 'executeCommand', command: 'arc1610.indexWorkspace' })}
              className="text-left p-2 rounded text-[var(--vscode-foreground)] hover:bg-[var(--vscode-list-hoverBackground)] border border-transparent hover:border-[var(--vscode-panel-border)] transition-colors"
            >
              <div className="font-medium">Force Incremental Index</div>
              <div className="text-xs text-[var(--vscode-descriptionForeground)] mt-0.5">Scan workspace for modified files</div>
            </button>
            
            <button 
              onClick={() => postMessage({ type: 'executeCommand', command: 'arc1610.reindexWorkspace' })}
              className="text-left p-2 rounded text-[var(--vscode-foreground)] hover:bg-[var(--vscode-list-hoverBackground)] border border-transparent hover:border-[var(--vscode-panel-border)] transition-colors"
            >
              <div className="font-medium">Full Re-Index</div>
              <div className="text-xs text-[var(--vscode-descriptionForeground)] mt-0.5">Clear vector DB and rescan entire workspace</div>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};
