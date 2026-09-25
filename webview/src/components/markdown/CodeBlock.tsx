/**
 * CodeBlock — Syntax-highlighted code block with language label and copy button.
 * Separated from MarkdownRenderer for reusability and independent testability.
 */

import React, { useCallback, useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check } from 'lucide-react';

interface CodeBlockProps {
  code: string;
  language?: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ code, language }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [code]);

  return (
    <div className="rounded-[var(--arc-radius-md)] my-2 overflow-hidden border border-[var(--arc-border)] bg-[var(--arc-bg-secondary)]">
      {/* Header bar */}
      <div className="flex justify-between items-center px-3 py-1 bg-[var(--vscode-editorGroupHeader-tabsBackground)] text-[var(--arc-text-secondary)] text-[var(--arc-font-size-xs)]">
        <span className="font-mono select-none">{language || 'text'}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1 bg-transparent border-none cursor-pointer text-[var(--arc-text-secondary)] hover:text-[var(--arc-text-primary)] transition-colors p-0.5"
          title={copied ? 'Copied' : 'Copy code'}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>

      {/* Code content */}
      <SyntaxHighlighter
        language={language || 'text'}
        style={vscDarkPlus}
        customStyle={{
          margin: 0,
          background: 'transparent',
          padding: '12px',
          fontSize: 'var(--arc-font-size-sm)',
        }}
        codeTagProps={{
          style: { fontFamily: 'var(--arc-font-mono)' },
        }}
      >
        {code.replace(/\n$/, '')}
      </SyntaxHighlighter>
    </div>
  );
};
