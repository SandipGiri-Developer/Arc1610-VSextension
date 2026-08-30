import * as vscode from 'vscode'; // VS Code Extension API
import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';

let apiProcess: ChildProcess | undefined;

export function activate(context: vscode.ExtensionContext) { // activating the extension
    const apiPath = path.join(context.extensionPath, '..', 'api.py');
    const port = vscode.workspace.getConfiguration('arc1610').get<number>('apiPort', 8000);
    
    // Attempt to spawn the backend process automatically
    apiProcess = spawn('python', [apiPath, port.toString()], { cwd: path.join(context.extensionPath, '..') });
    apiProcess.stdout?.on('data', (data) => console.log(`API: ${data}`));
    apiProcess.stderr?.on('data', (data) => console.error(`API Error: ${data}`));

    const provider = new Arc1610ViewProvider(context.extensionUri, port);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider("arc1610.view", provider) // registering the webview
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('arc1610.indexWorkspace', async () => {
            const folders = vscode.workspace.workspaceFolders;
            if (!folders || folders.length === 0) {
                vscode.window.showErrorMessage('No workspace open to index.');
                return;
            }
            const workspacePath = folders[0].uri.fsPath;
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Arc1610: Indexing workspace...",
                cancellable: false
            }, async () => {
                try {
                    const response = await fetch(`http://127.0.0.1:${port}/index?path=${encodeURIComponent(workspacePath)}`, { method: 'POST' });
                    if (response.ok) {
                        vscode.window.showInformationMessage('Arc1610: Indexing completed successfully!');
                    } else {
                        vscode.window.showErrorMessage('Arc1610: Indexing failed.');
                    }
                } catch (error: any) {
                    vscode.window.showErrorMessage(`Failed to connect to backend: ${error.message}`);
                }
            });
        })
    );
}

class Arc1610ViewProvider implements vscode.WebviewViewProvider { // implementing the interface
    private _view?: vscode.WebviewView;

    constructor(private readonly _extensionUri: vscode.Uri, private readonly _port: number) {} // to get the extension URI

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
    const webview = this._view!.webview;
    
    // Local assets
    const markdown_it_uri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'markdown-it.min.js'));
    const highlight_js_uri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'highlight.min.js'));
    const highlight_css_uri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'github-dark.min.css'));
    const logo_uri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'icon.png'));

    const nonce = getNonce();

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} https:; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; connect-src http://127.0.0.1:*;">
        <title>Arc1610 Assistant</title>

        <link rel="stylesheet" href="${highlight_css_uri}">
        <script nonce="${nonce}" src="${markdown_it_uri}"></script>
        <script nonce="${nonce}" src="${highlight_js_uri}"></script>

        <style>
            
            body, html {
                margin: 0; padding: 0; height: 100%;
                color: var(--vscode-editor-foreground);
                background: var(--vscode-editor-background);
                font-family: var(--vscode-font-family);
            }
            .chat-container {
                display: flex; flex-direction: column;
                height: 100vh; padding: 10px; box-sizing: border-box;
            }
            .header {
                display: flex; align-items: center;
                border-bottom: 1px solid var(--vscode-sideBar-border, #252526);
                padding: 8px 10px; margin-bottom: 8px;
            }
            .header img {
                width: 22px; height: 22px; margin-right: 8px;
            }
            .header h4 {
                margin: 0; font-size: 13px; color: var(--vscode-sideBar-foreground);
            }
            #chat-log {
                flex-grow: 1; overflow-y: auto; padding: 10px;
                scroll-behavior: smooth;
            }
            .message {
                padding: 10px 14px; border-radius: 6px;
                margin-bottom: 8px; max-width: 92%; line-height: 1.5;
                white-space: pre-wrap; word-break: break-word;
            }
            .message.user {
                align-self: flex-end;
                background-color: var(--vscode-list-activeSelectionBackground);
            }
            .message.assistant {
                align-self: flex-start;
                background-color: var(--vscode-editorHoverWidget-background);
            }
            .message.assistant pre code.hljs {
                display: block; overflow-x: auto; padding: 1em;
                border-radius: 5px;
                background: var(--vscode-editor-background);
            }
            .message.assistant code {
                font-family: var(--vscode-editor-font-family);
                font-size: var(--vscode-editor-font-size);
            }
            .input-form {
                display: flex; align-items: center;
                border-top: 1px solid var(--vscode-sideBar-border);
                padding-top: 8px;
            }
            #question-input {
                flex-grow: 1; resize: none;
                background: var(--vscode-input-background);
                color: var(--vscode-input-foreground);
                border: 1px solid var(--vscode-input-border);
                border-radius: 4px; padding: 8px;
            }
            #ask-button {
                margin-left: 8px; padding: 8px 14px;
                background: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
                border: none; border-radius: 4px; cursor: pointer;
            }
            #ask-button:hover {
                background: var(--vscode-button-hoverBackground);
            }
        </style>
    </head>
    <body>
        <div class="chat-container">
            <div class="header">
                <img src="${logo_uri}" alt="Logo">
                <h4>ARC1610 ASSISTANT</h4>
            </div>

            <div id="chat-log"></div>

            <div class="input-form">
                <textarea id="question-input" rows="3" placeholder="Ask a question..."></textarea>
                <button id="ask-button">Ask</button>
            </div>
        </div>

        <script nonce="${nonce}">
            const vscode = acquireVsCodeApi();
            const chatLog = document.getElementById('chat-log');
            const questionInput = document.getElementById('question-input');
            const askButton = document.getElementById('ask-button');

            const md = window.markdownit({
                html: true,
                linkify: true,
                typographer: true,
                highlight: (str, lang) => {
                    if (lang && hljs.getLanguage(lang)) {
                        try {
                            return '<pre><code class="hljs">' + 
                                   hljs.highlight(str, { language: lang, ignoreIllegals: true }).value + 
                                   '</code></pre>';
                        } catch (_) {}
                    }
                    return '<pre><code class="hljs">' + md.utils.escapeHtml(str) + '</code></pre>';
                }
            });

            askButton.addEventListener('click', askQuestion);
            questionInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    askQuestion();
                }
            });

            function askQuestion() {
                const question = questionInput.value.trim();
                if (!question) return;
                appendMessage('user', question);
                questionInput.value = '';
                const assistantMessage = appendMessage('assistant', '▍');
                let fullResponse = '';
                const url = 'http://127.0.0.1:${this._port}/ask?question=' + encodeURIComponent(question);
                const eventSource = new EventSource(url);

                eventSource.onmessage = (event) => {
                    if (event.data) {
                        fullResponse += event.data;
                        assistantMessage.innerHTML = md.render(fullResponse + ' ▍');
                        chatLog.scrollTop = chatLog.scrollHeight;
                    }
                };
                eventSource.onerror = () => {
                    eventSource.close();
                    assistantMessage.innerHTML = md.render(fullResponse);
                };
            }

            function appendMessage(sender, text) {
                const div = document.createElement('div');
                div.className = 'message ' + sender;
                div.innerHTML = md.render(text);
                chatLog.appendChild(div);
                chatLog.scrollTop = chatLog.scrollHeight;
                return div;
            }
        </script>
    </body>
    </html>`;
}

}

export function deactivate() {
    if (apiProcess) {
        apiProcess.kill();
    }
}

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
