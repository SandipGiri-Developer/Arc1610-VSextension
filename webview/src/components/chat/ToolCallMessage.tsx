/**
 * ToolCallMessage — Displays tool invocations and results inline.
 * Collapsible accordion for tool results to avoid taking up too much space.
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Wrench, CheckCircle2, XCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { ChatMessage } from '../../types/state';

interface ToolCallMessageProps {
  message: ChatMessage;
}

export const ToolCallMessage: React.FC<ToolCallMessageProps> = ({ message }) => {
  const [expanded, setExpanded] = useState(false);
  const isResult = message.role === 'tool' && message.toolSuccess !== undefined;
  const isSuccess = message.toolSuccess === true;
  const isError = message.toolSuccess === false;

  // Render tool invocation
  if (!isResult) {
    return (
      <div className="flex items-center gap-2 py-2 px-3 my-1 bg-blue-500/10 border border-blue-500/20 rounded-[var(--arc-radius-md)] text-blue-400 text-[var(--arc-font-size-sm)]">
        <Wrench size={14} className="shrink-0" />
        <span className="font-mono">{message.toolName}</span>
        <span className="animate-pulse">...</span>
      </div>
    );
  }

  // Render tool result
  return (
    <div className="my-1 border border-[var(--arc-border)] rounded-[var(--arc-radius-md)] overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className={clsx(
          'flex items-center gap-2 w-full px-3 py-1.5 text-left border-none cursor-pointer select-none transition-colors',
          'text-[var(--arc-font-size-sm)]',
          isSuccess ? 'bg-green-500/10 hover:bg-green-500/20 text-green-600 dark:text-green-400' : 
          isError ? 'bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400' :
          'bg-[var(--arc-bg-secondary)] hover:bg-[var(--arc-bg-hover)]'
        )}
      >
        {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        {isSuccess ? <CheckCircle2 size={14} /> : isError ? <XCircle size={14} /> : <Wrench size={14} />}
        <span className="font-mono flex-1 truncate">{message.toolName}</span>
      </button>

      {expanded && (
        <div className="p-2 border-t border-[var(--arc-border)] bg-[var(--arc-bg-secondary)] overflow-x-auto">
          <pre className="text-[var(--arc-font-size-xs)] font-mono text-[var(--arc-text-secondary)] m-0 whitespace-pre-wrap word-break-all">
            {message.content}
          </pre>
        </div>
      )}
    </div>
  );
};
