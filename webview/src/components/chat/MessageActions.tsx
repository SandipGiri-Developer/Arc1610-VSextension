/**
 * MessageActions — Toolbar for message operations (Copy, Retry, Delete).
 * Appears below assistant messages.
 */

import React, { useState } from 'react';
import { Copy, Check, RotateCcw, Trash2 } from 'lucide-react';
import { IconButton } from '../primitives/IconButton';
import { useMessenger } from '../../context/MessengerContext';

interface MessageActionsProps {
  content: string;
  onRetry?: () => void;
  onDelete?: () => void;
}

export const MessageActions: React.FC<MessageActionsProps> = ({
  content,
  onRetry,
  onDelete,
}) => {
  const [copied, setCopied] = useState(false);
  const messenger = useMessenger();

  const handleCopy = () => {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleInsertAtCursor = () => {
    messenger.post({ type: 'executeCommand', command: 'arc1610.insertAtCursor', args: [content] });
  };

  return (
    <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <IconButton
        icon={copied ? <Check size={14} /> : <Copy size={14} />}
        title={copied ? 'Copied' : 'Copy'}
        onClick={handleCopy}
        size="sm"
      />
      {onRetry && (
        <IconButton
          icon={<RotateCcw size={14} />}
          title="Retry"
          onClick={onRetry}
          size="sm"
        />
      )}
      {onDelete && (
        <IconButton
          icon={<Trash2 size={14} />}
          title="Delete"
          onClick={onDelete}
          size="sm"
          className="hover:text-red-400"
        />
      )}
    </div>
  );
};
