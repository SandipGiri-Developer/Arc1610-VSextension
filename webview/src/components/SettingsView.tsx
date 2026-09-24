import React, { useState, useEffect } from 'react';
import { WebviewToExtensionMessage } from '../types/messages';

interface SettingsViewProps {
  currentProvider: string;
  currentModel: string;
  hasApiKey: boolean;
  availableProviders: string[];
  postMessage: (msg: WebviewToExtensionMessage) => void;
  onClose: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentProvider,
  currentModel,
  hasApiKey,
  availableProviders,
  postMessage,
  onClose
}) => {
  const [provider, setProvider] = useState(currentProvider);
  const [model, setModel] = useState(currentModel);
  const [apiKey, setApiKey] = useState('');
  
  // Track categories for future extensibility as requested
  const [activeCategory, setActiveCategory] = useState('AI Provider');
  const categories = ['AI Provider', 'Indexing', 'Codebase Context', 'Appearance'];

  useEffect(() => {
    setProvider(currentProvider);
    setModel(currentModel);
  }, [currentProvider, currentModel]);

  const handleSave = () => {
    if (provider !== currentProvider) {
      postMessage({ type: 'setProvider', provider });
    }
    if (model !== currentModel) {
      postMessage({ type: 'setModel', model });
    }
    if (apiKey.trim()) {
      postMessage({ type: 'setApiKey', provider, key: apiKey.trim() });
    }
    onClose();
  };

  const requiresApiKey = provider === 'openai' || provider === 'anthropic';

  return (
    <div style={{ display: 'flex', height: '100%', flexDirection: 'column' }}>
      <div style={{ padding: '10px 15px', borderBottom: '1px solid var(--vscode-panel-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontSize: '14px' }}>Arc1610 Settings</h2>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--vscode-foreground)', cursor: 'pointer' }}>✕</button>
      </div>
      
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar Categories */}
        <div style={{ width: '140px', borderRight: '1px solid var(--vscode-panel-border)', padding: '10px 0', overflowY: 'auto' }}>
          {categories.map(cat => (
            <div 
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: '8px 15px',
                cursor: 'pointer',
                opacity: cat === 'AI Provider' ? 1 : 0.5,
                background: activeCategory === cat ? 'var(--vscode-list-activeSelectionBackground)' : 'transparent',
                color: activeCategory === cat ? 'var(--vscode-list-activeSelectionForeground)' : 'inherit',
              }}
            >
              {cat}
            </div>
          ))}
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
          {activeCategory === 'AI Provider' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Active AI Provider</label>
                <select 
                  value={provider} 
                  onChange={(e) => setProvider(e.target.value)}
                  style={{ width: '100%', padding: '6px', background: 'var(--vscode-input-background)', color: 'var(--vscode-input-foreground)', border: '1px solid var(--vscode-input-border)' }}
                >
                  {availableProviders.map(p => (
                    <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                  ))}
                </select>
                {provider === 'ollama' && (
                  <small style={{ display: 'block', marginTop: '5px', opacity: 0.7 }}>Ollama is a local, privacy-first AI provider. Models run on your machine.</small>
                )}
              </div>

              {requiresApiKey && (
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>API Key</label>
                  <input 
                    type="password" 
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={hasApiKey && provider === currentProvider ? '•••••••••••••••• (Already Set)' : 'Enter your API key...'}
                    style={{ width: '100%', padding: '6px', background: 'var(--vscode-input-background)', color: 'var(--vscode-input-foreground)', border: '1px solid var(--vscode-input-border)' }}
                  />
                  <small style={{ display: 'block', marginTop: '5px', opacity: 0.7 }}>Keys are stored securely in VS Code SecretStorage.</small>
                </div>
              )}

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Model Name</label>
                <input 
                  type="text" 
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="e.g. llama3.2, gpt-4o"
                  style={{ width: '100%', padding: '6px', background: 'var(--vscode-input-background)', color: 'var(--vscode-input-foreground)', border: '1px solid var(--vscode-input-border)' }}
                />
                <small style={{ display: 'block', marginTop: '5px', opacity: 0.7 }}>Leave blank to use the provider's default model.</small>
              </div>

              <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                <button 
                  onClick={handleSave}
                  style={{ padding: '8px 16px', background: 'var(--vscode-button-background)', color: 'var(--vscode-button-foreground)', border: 'none', cursor: 'pointer' }}
                >
                  Save Configuration
                </button>
                <button 
                  onClick={() => postMessage({ type: 'testConnection' })}
                  style={{ padding: '8px 16px', background: 'var(--vscode-button-secondaryBackground)', color: 'var(--vscode-button-secondaryForeground)', border: 'none', cursor: 'pointer' }}
                >
                  Test Connection
                </button>
              </div>
            </div>
          )}

          {activeCategory !== 'AI Provider' && (
            <div style={{ opacity: 0.6, fontStyle: 'italic' }}>
              These settings will be available in a future update.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
