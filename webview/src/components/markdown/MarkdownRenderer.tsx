/**
 * MarkdownRenderer — Renders markdown content with code block delegation.
 * Uses react-markdown with the CodeBlock component for fenced code.
 */

import React from 'react';
import ReactMarkdown from 'react-markdown';
import { CodeBlock } from './CodeBlock';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  return (
    <div className="arc-markdown break-words leading-relaxed text-[var(--arc-text-primary)]">
      <ReactMarkdown
        components={{
          code(props: any) {
            const { children, className, node, ref, ...rest } = props;
            const match = /language-(\w+)/.exec(className || '');
            const isInline = !match && !String(children).includes('\n');

            if (isInline) {
              return (
                <code
                  {...rest}
                  className="bg-[var(--arc-bg-code)] text-[var(--vscode-textPreformat-foreground)] px-1 py-0.5 rounded-[var(--arc-radius-sm)] font-mono text-[0.9em]"
                >
                  {children}
                </code>
              );
            }

            return (
              <CodeBlock
                code={String(children)}
                language={match ? match[1] : undefined}
              />
            );
          },
          p({ children }) {
            return <p className="mb-2 last:mb-0">{children}</p>;
          },
          ul({ children }) {
            return <ul className="mb-2 pl-5 list-disc">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="mb-2 pl-5 list-decimal">{children}</ol>;
          },
          li({ children }) {
            return <li className="mb-0.5">{children}</li>;
          },
          h1({ children }) {
            return <h1 className="text-base font-bold mb-2 mt-3 first:mt-0">{children}</h1>;
          },
          h2({ children }) {
            return <h2 className="text-[var(--arc-font-size-lg)] font-bold mb-2 mt-3 first:mt-0">{children}</h2>;
          },
          h3({ children }) {
            return <h3 className="text-[var(--arc-font-size-base)] font-semibold mb-1 mt-2 first:mt-0">{children}</h3>;
          },
          blockquote({ children }) {
            return (
              <blockquote className="border-l-2 border-[var(--arc-text-link)] pl-3 my-2 text-[var(--arc-text-secondary)] italic">
                {children}
              </blockquote>
            );
          },
          a({ href, children }) {
            return (
              <a
                href={href}
                className="text-[var(--arc-text-link)] hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {children}
              </a>
            );
          },
          hr() {
            return <hr className="border-[var(--arc-border)] my-3" />;
          },
          table({ children }) {
            return (
              <div className="overflow-x-auto my-2">
                <table className="w-full border-collapse text-[var(--arc-font-size-sm)]">
                  {children}
                </table>
              </div>
            );
          },
          th({ children }) {
            return (
              <th className="border border-[var(--arc-border)] px-2 py-1 text-left font-semibold bg-[var(--arc-bg-secondary)]">
                {children}
              </th>
            );
          },
          td({ children }) {
            return (
              <td className="border border-[var(--arc-border)] px-2 py-1">
                {children}
              </td>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
