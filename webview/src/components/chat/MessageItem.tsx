/**
 * MessageItem — Wrapper for a single chat message.
 * Handles role-based styling (user vs assistant) and composes content + actions.
 */

import React from 'react';
import { clsx } from 'clsx';
import { ChatMessage } from '../../types/state';
import { MarkdownRenderer } from '../markdown/MarkdownRenderer';
import { ToolCallMessage } from './ToolCallMessage';
import { MessageActions } from './MessageActions';

interface MessageItemProps {
  message: ChatMessage;
}

export const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  // Delegate tool messages
  if (message.role === 'tool' || message.toolName) {
    return <ToolCallMessage message={message} />;
  }

  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  if (isSystem) {
    return (
      <div className="py-2 text-center text-[var(--arc-text-secondary)] text-[var(--arc-font-size-sm)] italic">
        {message.content}
      </div>
    );
  }

  return (
    <div
      className={clsx(
        'group flex flex-col py-3 px-4 border-b border-[var(--arc-border)]',
        isUser ? 'bg-[var(--arc-bg-primary)]' : 'bg-[var(--arc-bg-secondary)]'
      )}
    >
      <div className="font-semibold text-[var(--arc-font-size-sm)] text-[var(--arc-text-title)] mb-1 uppercase tracking-wider select-none">
        {isUser ? 'You' : 'Arc1610'}
      </div>
      
      <div className="flex-1">
        {isUser ? (
          <div className="whitespace-pre-wrap break-words text-[var(--arc-text-primary)]">
            {message.content}
          </div>
        ) : (
          <MarkdownRenderer content={message.content} />
        )}
      </div>

      {!isUser && message.content && (
        <MessageActions content={message.content} />
      )}
    </div>
  );
};
