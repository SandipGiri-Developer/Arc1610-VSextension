import React, { useRef, useEffect } from 'react';
import { Send, Square } from 'lucide-react';

interface ChatInputAreaProps {
  input: string;
  setInput: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isGenerating: boolean;
  onStop: () => void;
  config: { provider: string; model: string; availableProviders: string[] };
}

export const ChatInputArea: React.FC<ChatInputAreaProps> = ({
  input, setInput, onSubmit, isGenerating, onStop, config
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit(e);
    }
  };

  return (
    <div className="p-3 bg-[var(--vscode-sideBar-background)] border-t border-[var(--vscode-panel-border)] shrink-0">
      <form onSubmit={onSubmit} className="relative flex flex-col bg-[var(--vscode-input-background)] border border-[var(--vscode-input-border)] rounded shadow-sm focus-within:border-[var(--vscode-focusBorder)] transition-colors">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a follow-up..."
          className="w-full bg-transparent text-[var(--vscode-input-foreground)] p-3 pr-10 resize-none outline-none min-h-[44px] max-h-[200px] font-sans"
          rows={1}
        />
        
        <div className="flex justify-between items-center px-2 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-[var(--vscode-badge-background)] text-[var(--vscode-badge-foreground)] opacity-80">
              {config.provider}
            </span>
            {config.model && (
              <span className="text-[10px] text-[var(--vscode-descriptionForeground)] truncate max-w-[100px]">
                {config.model}
              </span>
            )}
          </div>
          
          <button
            type={isGenerating ? "button" : "submit"}
            onClick={isGenerating ? onStop : undefined}
            disabled={!isGenerating && !input.trim()}
            className={`p-1.5 rounded flex items-center justify-center transition-colors ${
              isGenerating 
                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                : 'text-[var(--vscode-button-background)] hover:bg-[var(--vscode-toolbar-hoverBackground)] disabled:opacity-30'
            }`}
            title={isGenerating ? "Stop Generation" : "Send Message (Enter)"}
          >
            {isGenerating ? <Square fill="currentColor" size={16} /> : <Send size={16} />}
          </button>
        </div>
      </form>
    </div>
  );
};
