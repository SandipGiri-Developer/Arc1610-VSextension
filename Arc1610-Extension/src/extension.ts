import * as vscode from 'vscode'; // VS Code Extension API

export function activate(context: vscode.ExtensionContext) { // activating the extension
    const provider = new Arc1610ViewProvider(context.extensionUri);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider("arc1610.view", provider) // registering the webview
    );
}

class Arc1610ViewProvider implements vscode.WebviewViewProvider { // implementing the interface
    private _view?: vscode.WebviewView;

    constructor(private readonly _extensionUri: vscode.Uri) {} // to get the extension URI

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri],
        };
        webviewView.webview.html = this._getHtmlForWebview();
    }

private _getHtmlForWebview(): string {
    // Libraries from CDN for markdown and syntax highlighting
    const markdown_it_url = "https://cdn.jsdelivr.net/npm/markdown-it@14.1.0/dist/markdown-it.min.js";
    const highlight_js_url = "https://cdn.jsdelivr.net/npm/highlight.js@11.9.0/lib/common.min.js";
    const highlight_css_url = "https://cdn.jsdelivr.net/npm/highlight.js@11.9.0/styles/github-dark.min.css";

    const webview = this._view!.webview;
    const logo_uri = webview.asWebviewUri(vscode.Uri.joinPath(
        this._extensionUri, 'media', 'icon.png' 
    ));

    // HTML content of the webview with evrthing like styles and scripts, buttons, input areas, chat log, includes icon.png etc.
    return `<!DOCTYPE html> 
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Arc1610</title>
        
        <link rel="stylesheet" href="${highlight_css_url}">
        <script src="${markdown_it_url}"></script>
        <script src="${highlight_js_url}"></script>

        <style>
            
            body, html { margin: 0; padding: 0; height: 100%; overflow: hidden; color: var(--vscode-editor-foreground); background-color: var(--vscode-sideBar-background, var(--vscode-editor-background)); font-family: var(--vscode-font-family); }
            .chat-container { display: flex; flex-direction: column; height: 100vh; padding: 10px; box-sizing: border-box; }
            #chat-log { flex-grow: 1; overflow-y: auto; padding-bottom: 10px; }
            .message { padding: 8px 12px; border-radius: 6px; margin-bottom: 8px; max-width: 90%; line-height: 1.5; }
            .message.user { background-color: var(--vscode-list-activeSelectionBackground); align-self: flex-end; }
            .message.assistant { background-color: var(--vscode-list-hoverBackground); align-self: flex-start; white-space: pre-wrap; }
            
             .header {
                display: flex;
                align-items: center;
                padding: 10px;
                border-bottom: 1px solid var(--vscode-sideBar-border, #252526);
            }
            .logo {
                width: 24px;
                height: 24px;
                margin-right: 8px;
            }
            .header h4 {
                margin: 0;
                font-size: 14px;
                color: var(--vscode-sideBar-foreground);
            }

            .message.assistant pre code.hljs {
                padding: 1em;
                border-radius: 4px;
            }
            .message.assistant code {
                font-family: var(--vscode-editor-font-family);
            }

            
            .code-container:hover .copy-btn {
                opacity: 1;
            }
            .copy-btn:hover {
                background: var(--vscode-button-secondaryHoverBackground);
            }

    
            .input-form { display: flex; align-items: center; border-top: 1px solid var(--vscode-sideBar-border); padding-top: 10px; }
            #question-input { flex-grow: 1; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); border-radius: 4px; padding: 8px; resize: none; }
            #ask-button { background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; border-radius: 4px; padding: 8px 12px; margin-left: 10px; cursor: pointer; }
        </style>
    </head>
    <body>
        <div class="chat-container">

        <div class="header">
                <img src="${logo_uri}" alt="Arc1610 Logo" class="logo">
                <h4>ARC1610 ASSISTANT</h4>
            </div>

            <div id="chat-log"></div>
            <div class="input-form">
                <textarea id="question-input" rows="3" placeholder="Ask a question..."></textarea>
                <button id="ask-button">Ask</button>
            </div>
        </div>

        <script>
            const vscode = acquireVsCodeApi();
            const chatLog = document.getElementById('chat-log');
            const questionInput = document.getElementById('question-input');
            const askButton = document.getElementById('ask-button');
            
            const md = window.markdownit({
                html: true, linkify: true, typographer: true,
                highlight: (str, lang) => {
                    if (lang && hljs.getLanguage(lang)) {
                        try {
                            return '<pre class="hljs"><code>' + hljs.highlight(str, { language: lang, ignoreIllegals: true }).value + '</code></pre>';
                        } catch (__) {}
                    }
                    return '<pre class="hljs"><code>' + md.utils.escapeHtml(str) + '</code></pre>';
                }
            });
            
            let event_source;

            askButton.addEventListener('click', askQuestion);
            questionInput.addEventListener('keydown', (e) => (e.key === 'Enter' && !e.shiftKey) && (e.preventDefault(), askQuestion()));
            
            function askQuestion() {
                const question = questionInput.value.trim();
                if (!question) return;

                append_message('user', question);
                questionInput.value = '';

                const assistant_message_element = append_message('assistant', '▍');
                let fullResponse = "";

                const url = 'http://127.0.0.1:8000/ask?question=' + encodeURIComponent(question);
                event_source = new EventSource(url);

                event_source.onmessage = (event) => {
                    if (event.data) {
                        fullResponse += event.data;
                        assistant_message_element.innerHTML = md.render(fullResponse + " ▍");
                    }
                };
                
                event_source.onerror = () => {
                    event_source.close();
                    assistant_message_element.innerHTML = md.render(fullResponse);
                    
                };
            }

            function append_message(sender, text) {
                const m_element = document.createElement('div');
                m_element.className = 'message ' + sender;
                m_element.innerHTML = md.render(text);
                chatLog.appendChild(m_element);
                chatLog.scrollTop = chatLog.scrollHeight;
                return m_element;
            }

        </script>
    </body>
    </html>`;
}
}

export function deactivate() {}
