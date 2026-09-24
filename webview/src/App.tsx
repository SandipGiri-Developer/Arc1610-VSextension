import { useState, useRef, useEffect } from 'react';
import { useMessaging } from './hooks/useMessaging';
import { ExtensionToWebviewMessage, IndexingProgress } from './types/messages';
import { MessageBubble } from './components/MessageBubble';
import { SettingsView } from './components/SettingsView';
import { SidebarHeader } from './components/SidebarHeader';
import { ChatInputArea } from './components/ChatInputArea';

interface Message {
  role: 'user' | 'assistant' | 'tool';
  content: string;
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [config, setConfig] = useState({ provider: '', model: '', hasApiKey: true, availableProviders: [] as string[] });
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
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isGenerating) return;

    const userText = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userText }]);
    setIsGenerating(true);
    postMessage({ type: 'sendMessage', text: userText });
  };

  const handleStop = () => {
    setIsGenerating(false);
    postMessage({ type: 'cancelGeneration' });
  };

  const handleNewChat = () => {
    setMessages([]);
    postMessage({ type: 'newChat' });
  };

  return (
    <div className="flex flex-col h-full bg-[var(--vscode-sideBar-background)] text-[var(--vscode-foreground)] overflow-hidden">
      {showSettings ? (
        <SettingsView 
          currentProvider={config.provider}
          currentModel={config.model}
          hasApiKey={config.hasApiKey}
          availableProviders={config.availableProviders}
          onBack={() => setShowSettings(false)}
        />
      ) : (
        <>
          <SidebarHeader 
            onNewChat={handleNewChat}
            onOpenSettings={() => setShowSettings(true)}
          />

          {/* Message List */}
          <div className="flex-1 overflow-y-auto flex flex-col scroll-smooth">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full opacity-50 p-6 text-center">
                <span className="text-4xl mb-4">✨</span>
                <p className="text-sm">How can I help you today?</p>
                <p className="text-xs mt-2 text-[var(--vscode-descriptionForeground)]">
                  Arc1610 uses your configured codebase index to provide context-aware responses.
                </p>
              </div>
            ) : (
              messages.map((m, i) => (
                <MessageBubble key={i} role={m.role} content={m.content} />
              ))
            )}
            <div ref={bottomRef} className="h-4 shrink-0" />
          </div>

          <ChatInputArea 
            input={input}
            setInput={setInput}
            onSubmit={handleSubmit}
            isGenerating={isGenerating}
            onStop={handleStop}
            config={config}
          />
        </>
      )}
    </div>
  );
}
