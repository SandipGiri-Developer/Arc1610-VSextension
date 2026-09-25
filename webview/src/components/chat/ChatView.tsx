/**
 * ChatView — The main view containing the message list and composer.
 */

import React, { useEffect, useRef } from 'react';
import { useAppState } from '../../context/AppStateContext';
import { MessageItem } from './MessageItem';
import { EmptyState } from './EmptyState';
import { Composer } from '../composer/Composer';
import { Loader2 } from 'lucide-react';

export const ChatView: React.FC = () => {
  const { session, isStreaming } = useAppState();
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change or streaming
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [session.messages, isStreaming]);

  return (
    <div className="flex flex-col h-full flex-1 overflow-hidden relative">
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth flex flex-col"
      >
        {session.messages.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="flex flex-col pb-4">
            {session.messages.map((msg) => (
              <MessageItem key={msg.id} message={msg} />
            ))}
            
            {/* Streaming Indicator */}
            {isStreaming && session.messages[session.messages.length - 1]?.role !== 'assistant' && (
              <div className="py-3 px-4 text-[var(--arc-text-secondary)] flex items-center gap-2 text-[var(--arc-font-size-sm)]">
                <Loader2 size={14} className="animate-spin" />
                <span>Generating...</span>
              </div>
            )}
            
            <div ref={bottomRef} className="h-1 shrink-0" />
          </div>
        )}
      </div>

      <Composer />
    </div>
  );
};
