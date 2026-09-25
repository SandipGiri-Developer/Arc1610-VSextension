/**
 * Composer — The chat input area.
 * Handles auto-resize, shift+enter, and sending messages.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Send, Square } from 'lucide-react';
import { useAppState, useAppDispatch } from '../../context/AppStateContext';
import { useMessenger } from '../../context/MessengerContext';
import { IconButton } from '../primitives/IconButton';
import { Badge } from '../primitives/Badge';

export const Composer: React.FC = () => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const { isStreaming, config } = useAppState();
  const dispatch = useAppDispatch();
  const messenger = useMessenger();

  // Auto-resize
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isStreaming) return;

    const text = input.trim();
    setInput('');
    
    // Reset height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    dispatch({ type: 'ADD_USER_MESSAGE', content: text });
    dispatch({ type: 'START_STREAMING' });
    messenger.post({ type: 'sendMessage', text });
  };

  const handleStop = () => {
    dispatch({ type: 'STOP_STREAMING' });
    messenger.post({ type: 'cancelGeneration' });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="p-3 bg-[var(--arc-bg-primary)] border-t border-[var(--arc-border)] shrink-0 z-10">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col bg-[var(--arc-bg-input)] border border-[var(--arc-input-border)] rounded-[var(--arc-radius-md)] shadow-sm focus-within:border-[var(--arc-focus-border)] transition-colors relative"
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question or request a change..."
          className="w-full bg-transparent text-[var(--arc-text-input)] p-3 resize-none outline-none min-h-[44px] max-h-[200px] font-sans text-[var(--arc-font-size-base)] border-none"
          rows={1}
          disabled={isStreaming}
        />
        
        <div className="flex justify-between items-center px-2 pb-2 mt-1">
          <div className="flex items-center gap-1.5 opacity-80">
            <Badge>{config.provider}</Badge>
            {config.model && (
              <span className="text-[10px] text-[var(--arc-text-secondary)] truncate max-w-[120px]" title={config.model}>
                {config.model}
              </span>
            )}
          </div>
          
          <IconButton
            icon={isStreaming ? <Square size={14} fill="currentColor" /> : <Send size={14} />}
            title={isStreaming ? "Stop Generation" : "Send (Enter)"}
            onClick={isStreaming ? handleStop : () => handleSubmit()}
            disabled={!isStreaming && !input.trim()}
            variant={isStreaming ? 'danger' : 'primary'}
          />
        </div>
      </form>
    </div>
  );
};
