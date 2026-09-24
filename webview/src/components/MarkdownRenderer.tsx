import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  return (
    <div className="prose prose-sm prose-invert max-w-none break-words leading-relaxed text-[var(--vscode-foreground)]">
      <ReactMarkdown
        components={{
          code(props: any) {
            const {children, className, node, ...rest} = props;
            const match = /language-(\w+)/.exec(className || '');
            const isInline = !match && !className?.includes('language-');
            
            if (isInline) {
              return (
                <code {...rest} className="bg-[var(--vscode-textCodeBlock-background)] text-[var(--vscode-textPreformat-foreground)] px-1 py-0.5 rounded font-mono text-[0.9em]">
                  {children}
                </code>
              );
            }
            
            return (
              <div className="rounded-md my-2 overflow-hidden border border-[var(--vscode-panel-border)] bg-[var(--vscode-editor-background)]">
                <div className="flex justify-between items-center px-3 py-1 bg-[var(--vscode-editorGroupHeader-tabsBackground)] text-[var(--vscode-tab-inactiveForeground)] text-xs font-sans">
                  <span>{match ? match[1] : 'code'}</span>
                  <button className="hover:text-[var(--vscode-tab-activeForeground)] transition-colors" onClick={() => navigator.clipboard.writeText(String(children))}>
                    Copy
                  </button>
                </div>
                <SyntaxHighlighter
                  {...rest}
                  PreTag="div"
                  children={String(children).replace(/\n$/, '')}
                  language={match ? match[1] : 'text'}
                  style={vscDarkPlus}
                  customStyle={{ margin: 0, background: 'transparent', padding: '12px' }}
                  codeTagProps={{ style: { fontFamily: 'var(--vscode-editor-font-family)' } }}
                />
              </div>
            );
          },
          p({ children }) {
            return <p className="mb-2 last:mb-0">{children}</p>;
          },
          a({ href, children }) {
            return <a href={href} className="text-[var(--vscode-textLink-foreground)] hover:text-[var(--vscode-textLink-activeForeground)] hover:underline">{children}</a>;
          },
          ul({ children }) {
            return <ul className="list-disc pl-5 mb-2">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="list-decimal pl-5 mb-2">{children}</ol>;
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
