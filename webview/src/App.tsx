import { useState, useRef, useEffect } from 'react';
import { useMessaging } from './hooks/useMessaging';
import { ExtensionToWebviewMessage, IndexingProgress } from './types/messages';
import { MessageBubble } from './components/MessageBubble';
import { SettingsView } from './components/SettingsView';

interface Message {
  role: 'user' | 'assistant' | 'tool';
  content: string;
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [config, setConfig] = useState({ provider: '', model: '', hasApiKey: true, availableProviders: [] as string[] });
  const [indexStatus, setIndexStatus] = useState({ indexed: false, inProgress: false });
  const [progress, setProgress] = useState<IndexingProgress | null>(null);
  const [pendingApproval, setPendingApproval] = useState<{toolName: string, desc: string, diff?: string} | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  
  const bottomRef = useRef<HTMLDivElement>(null);

  const { postMessage } = useMessaging((msg: ExtensionToWebviewMessage) => {
    switch (msg.type) {
      case 'streamContent':
        setMessages(prev => {
          const newMsgs = [...prev];
          const last = newMsgs[newMsgs.length - 1];
          if (last && last.role === 'assistant') {
            last.content += msg.content;
          } else {
            newMsgs.push({ role: 'assistant', content: msg.content });
          }
          return newMsgs;
        });
        break;
      
      case 'toolCall':
        setMessages(prev => [
          ...prev, 
          { role: 'assistant', content: `\n> 🔧 Using tool: \`${msg.toolName}\`\n\n` }
        ]);
        break;

      case 'toolResult':
        setMessages(prev => [...prev, { role: 'tool', content: msg.content }]);
        break;
        
      case 'approvalRequest':
        setPendingApproval({ toolName: msg.toolName, desc: msg.description, diff: msg.diff });
        break;
        
      case 'streamDone':
      case 'streamCancelled':
      case 'streamError':
        setIsGenerating(false);
        if (msg.type === 'streamError') {
          setMessages(prev => [...prev, { role: 'assistant', content: `\n**Error:** ${msg.error}` }]);
        }
        break;
        
      case 'config':
        setConfig({ 
          provider: msg.provider, 
          model: msg.model, 
          hasApiKey: msg.hasApiKey,
          availableProviders: msg.availableProviders || ['ollama', 'openai', 'anthropic'] 
        });
        break;
        
      case 'indexStatus':
        setIndexStatus({ indexed: msg.indexed, inProgress: msg.inProgress });
        if (!msg.inProgress) setProgress(null);
        break;
        
      case 'indexingProgress':
        setProgress(msg.progress);
        break;

      case 'addContext':
        const contextRef = `[${msg.filepath.split(/[\\/]/).pop()}](${msg.filepath})`;
        setInput(prev => prev + (prev ? ' ' : '') + contextRef + ' ');
        break;
    }
  });

  useEffect(() => {
    postMessage({ type: 'webviewReady' });
  }, [postMessage]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, pendingApproval]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isGenerating || pendingApproval) return;

    if (!config.hasApiKey && config.provider !== 'ollama') {
      postMessage({ type: 'sendMessage', text: 'Error: API key required for ' + config.provider });
      return;
    }

    const text = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setIsGenerating(true);
    postMessage({ type: 'sendMessage', text });
  };

  const handleApproval = (approved: boolean) => {
    setPendingApproval(null);
    postMessage({ type: 'approveAction', approved });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {showSettings ? (
        <SettingsView 
          currentProvider={config.provider}
          currentModel={config.model}
          hasApiKey={config.hasApiKey}
          availableProviders={config.availableProviders}
          postMessage={postMessage}
          onClose={() => setShowSettings(false)}
        />
      ) : (
        <>
          {/* Header */}
          <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--vscode-panel-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--vscode-sideBar-background)' }}>
            <div style={{ fontWeight: 'bold' }}>Arc1610</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button title="Settings" className="secondary" onClick={() => setShowSettings(true)}>⚙️</button>
              <button title="New Chat" className="secondary" onClick={() => { setMessages([]); postMessage({ type: 'newChat' }); }}>+</button>
            </div>
          </div>

          {/* Index Status Bar */}
          <div style={{ padding: '4px 12px', fontSize: '11px', backgroundColor: 'var(--vscode-statusBar-background)', color: 'var(--vscode-statusBar-foreground)', display: 'flex', justifyContent: 'space-between' }}>
        <span>{config.provider} {config.model ? `(${config.model})` : ''}</span>
        {indexStatus.inProgress && progress ? (
          <span>Indexing: {(progress.progress * 100).toFixed(0)}%</span>
        ) : (
          <span style={{ cursor: 'pointer' }} onClick={() => postMessage({ type: 'startIndexing', fullReindex: false })}>
            {indexStatus.indexed ? '✅ Indexed' : '⚠️ Unindexed'}
          </span>
        )}
      </div>

      {/* Message List */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {messages.length === 0 ? (
          <div style={{ margin: 'auto', textAlign: 'center', opacity: 0.5, padding: '20px' }}>
            <p>Hi! I'm Arc1610.</p>
            <p>I can help you understand and write code across your entire workspace.</p>
            {!indexStatus.indexed && !indexStatus.inProgress && (
              <button onClick={() => postMessage({ type: 'startIndexing', fullReindex: false })}>
                Index Workspace Now
              </button>
            )}
          </div>
        ) : (
          messages.map((m, i) => (
            <MessageBubble 
              key={i} 
              role={m.role} 
              content={m.content} 
              isStreaming={isGenerating && i === messages.length - 1 && m.role === 'assistant'} 
            />
          ))
        )}
        
        {/* Approval Dialog */}
        {pendingApproval && (
          <div style={{ padding: '12px', border: '1px solid var(--vscode-editorError-border)', margin: '12px', borderRadius: '4px', backgroundColor: 'var(--vscode-editor-background)' }}>
            <h4 style={{ margin: '0 0 8px 0', color: 'var(--vscode-editorError-foreground)' }}>⚠️ Approval Required</h4>
            <p style={{ margin: '0 0 8px 0', fontSize: '12px' }}>{pendingApproval.desc}</p>
            {pendingApproval.diff && (
              <pre style={{ fontSize: '10px', padding: '8px', background: 'var(--vscode-textCodeBlock-background)', overflowX: 'auto', maxHeight: '200px' }}>
                {pendingApproval.diff}
              </pre>
            )}
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button onClick={() => handleApproval(true)} style={{ backgroundColor: 'var(--vscode-button-background)' }}>Approve</button>
              <button onClick={() => handleApproval(false)} className="secondary">Reject</button>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div style={{ padding: '12px', borderTop: '1px solid var(--vscode-panel-border)', backgroundColor: 'var(--vscode-sideBar-background)' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="Ask Arc1610 about your codebase..."
            disabled={isGenerating || !!pendingApproval}
            style={{ 
              resize: 'none', 
              height: '80px', 
              width: '100%', 
              backgroundColor: 'var(--vscode-input-background)',
              color: 'var(--vscode-input-foreground)'
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', opacity: 0.6 }}>Ctrl+Enter to add new line</span>
            {isGenerating ? (
              <button type="button" onClick={() => postMessage({ type: 'cancelGeneration' })} className="secondary">Stop</button>
            ) : (
              <button type="submit" disabled={!input.trim() || !!pendingApproval}>Send</button>
            )}
          </div>
        </form>
      </div>
        </>
      )}
    </div>
  );
}
