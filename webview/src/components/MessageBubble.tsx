import React from 'react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { Copy, RefreshCw, Trash2 } from 'lucide-react';

interface MessageBubbleProps {
  role: 'user' | 'assistant' | 'tool';
  content: string;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ role, content }) => {
  const isUser = role === 'user';
  const isTool = role === 'tool';

  if (isTool) {
    return (
      <div className="px-4 py-2 my-2 mx-4 text-xs font-mono text-[var(--vscode-descriptionForeground)] bg-[var(--vscode-editorWidget-background)] border border-[var(--vscode-widget-border)] rounded overflow-x-auto opacity-75">
        {content}
      </div>
    );
  }

  return (
    <div className={`px-4 py-4 group flex flex-col gap-2 ${isUser ? 'bg-[var(--vscode-editor-background)]' : 'bg-transparent'}`}>
      <div className="flex items-center gap-2 text-xs font-semibold text-[var(--vscode-descriptionForeground)] uppercase tracking-wider">
        {isUser ? 'You' : 'Arc1610'}
      </div>
      
      {isUser ? (
        <div className="text-[var(--vscode-foreground)] whitespace-pre-wrap break-words">
          {content}
        </div>
      ) : (
        <MarkdownRenderer content={content} />
      )}

      {/* Message Actions (visible on hover) */}
      {!isUser && (
        <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            title="Copy response"
            className="p-1 rounded text-[var(--vscode-descriptionForeground)] hover:text-[var(--vscode-foreground)] hover:bg-[var(--vscode-toolbar-hoverBackground)]"
            onClick={() => navigator.clipboard.writeText(content)}
          >
            <Copy size={14} />
          </button>
          <button 
            title="Regenerate"
            className="p-1 rounded text-[var(--vscode-descriptionForeground)] hover:text-[var(--vscode-foreground)] hover:bg-[var(--vscode-toolbar-hoverBackground)]"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      )}
    </div>
  );
};
