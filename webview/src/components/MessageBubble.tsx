import { marked } from 'marked';
import hljs from 'highlight.js';
import 'highlight.js/styles/vs2015.css'; // Good match for VS Code dark
import { useEffect, useRef } from 'react';

// Configure marked with syntax highlighting
marked.setOptions({
  highlight: function (code, lang) {
    const language = hljs.getLanguage(lang) ? lang : 'plaintext';
    return hljs.highlight(code, { language }).value;
  },
  langPrefix: 'hljs language-',
});

interface MessageBubbleProps {
  role: 'user' | 'assistant' | 'tool';
  content: string;
  isStreaming?: boolean;
}

export function MessageBubble({ role, content, isStreaming }: MessageBubbleProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  // Render markdown safely
  const htmlContent = marked.parse(content || (isStreaming ? '...' : ''), { async: false }) as string;

  useEffect(() => {
    // Add copy buttons to code blocks after render
    if (!contentRef.current) return;
    
    const codeBlocks = contentRef.current.querySelectorAll('pre');
    codeBlocks.forEach(block => {
      if (block.querySelector('.copy-btn')) return;
      
      const btn = document.createElement('button');
      btn.className = 'copy-btn secondary';
      btn.innerText = 'Copy';
      btn.style.position = 'absolute';
      btn.style.top = '4px';
      btn.style.right = '4px';
      btn.style.fontSize = '10px';
      
      btn.onclick = () => {
        const code = block.querySelector('code')?.innerText || '';
        navigator.clipboard.writeText(code);
        btn.innerText = 'Copied!';
        setTimeout(() => btn.innerText = 'Copy', 2000);
      };
      
      block.style.position = 'relative';
      block.appendChild(btn);
    });
  }, [htmlContent]);

  if (role === 'tool') {
    return (
      <div style={{ padding: '8px', opacity: 0.7, fontSize: '0.9em', borderLeft: '2px solid var(--vscode-focusBorder)' }}>
        <details>
          <summary style={{ cursor: 'pointer' }}>Tool Execution</summary>
          <pre style={{ margin: '8px 0', padding: '8px', background: 'var(--vscode-textCodeBlock-background)', overflowX: 'auto' }}>
            {content}
          </pre>
        </details>
      </div>
    );
  }

  return (
    <div style={{
      padding: '12px',
      borderBottom: '1px solid var(--vscode-panel-border)',
      backgroundColor: role === 'user' ? 'transparent' : 'var(--vscode-sideBar-dropBackground)',
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        {role === 'user' ? (
          <>👤 You</>
        ) : (
          <>✨ Arc1610</>
        )}
      </div>
      <div 
        ref={contentRef}
        className="markdown-body" 
        dangerouslySetInnerHTML={{ __html: htmlContent }}
        style={{ wordBreak: 'break-word' }}
      />
    </div>
  );
}
