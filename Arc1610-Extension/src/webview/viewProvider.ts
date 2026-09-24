/**
 * Webview Provider for the ARC1610 sidebar chat interface.
 * 
 * Handles the lifecycle of the webview, message routing to the agent loop,
 * configuration updates, and indexing status reporting.
 */

import * as vscode from 'vscode';
import { AgentLoop } from '../agent/agentLoop';
import { CodebaseIndexer } from '../indexing/indexer';
import { ProviderRegistry } from '../providers/registry';
import { ChatMessage } from '../providers/types';
import { Logger } from '../utils/logger';
import { ExtensionToWebviewMessage, validateWebviewMessage, WebviewToExtensionMessage } from './messageTypes';
import { getCsp } from './securityPolicy';

export class Arc1610ViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'arc1610.chatView';
  
  private view?: vscode.WebviewView;
  private chatHistory: ChatMessage[] = [];
  private agent: AgentLoop | null = null;
  private readonly logger = Logger.getInstance();

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly providerRegistry: ProviderRegistry,
    private readonly indexer: CodebaseIndexer,
  ) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ) {
    this.view = webviewView;

    // Set webview options
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionUri],
    };

    // Set HTML content
    webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);

    // Handle messages from the webview
    webviewView.webview.onDidReceiveMessage(
      (data) => this.handleMessage(data),
      undefined,
      [], // disposables
    );
    
    // Send initial configuration and index status
    this.sendConfig();
    this.sendIndexStatus();
    
    // Subscribe to indexer progress events
    this.indexer.onProgress((progress) => {
      this.postMessage({ type: 'indexingProgress', progress });
      if (progress.status === 'complete' || progress.status === 'error' || progress.status === 'cancelled') {
        this.sendIndexStatus();
      }
    });
  }

  /**
   * Start a new chat session.
   */
  public newChat() {
    this.chatHistory = [];
    this.agent?.cancel();
    this.agent = null;
    
    if (this.view) {
      // In a real implementation, we'd tell the UI to clear its state
      // For now, we'll let the user message trigger a fresh start on the backend
      this.postMessage({ type: 'streamCancelled' }); 
    }
  }

  /**
   * Add context to the current chat (from editor commands).
   */
  public addContext(filepath: string, content?: string, selection?: string) {
    if (this.view) {
      this.view.show?.(true);
      this.postMessage({
        type: 'addContext',
        filepath,
        content,
        selection,
      });
    }
  }

  /**
   * Send configuration to the webview.
   */
  public async sendConfig() {
    try {
      const config = await this.providerRegistry.readConfig();
      const hasApiKey = Boolean(config.apiKey && config.apiKey.length > 0);
      
      this.postMessage({
        type: 'config',
        provider: config.provider,
        model: config.modelName,
        hasApiKey,
        availableProviders: this.providerRegistry.getSupportedProviders(),
      });
    } catch (e) {
      this.logger.error('Failed to send config', e);
    }
  }

  /**
   * Send index status to the webview.
   */
  public sendIndexStatus() {
    const status = this.indexer.getStatus();
    this.postMessage({
      type: 'indexStatus',
      indexed: status.indexed,
      entryCount: status.entryCount,
      fileCount: status.fileCount,
      inProgress: status.inProgress,
    });
  }

  private postMessage(message: ExtensionToWebviewMessage) {
    this.view?.webview.postMessage(message);
  }

  private async handleMessage(data: unknown) {
    const msg = validateWebviewMessage(data);
    if (!msg) {
      this.logger.warn('Received invalid message from webview', data);
      return;
    }

    try {
      switch (msg.type) {
        case 'webviewReady':
          this.sendConfig();
          this.sendIndexStatus();
          break;
          
        case 'sendMessage':
          await this.handleUserMessage(msg.text, msg.contextFiles);
          break;
          
        case 'cancelGeneration':
          this.agent?.cancel();
          this.postMessage({ type: 'streamCancelled' });
          break;
          
        case 'newChat':
          this.newChat();
          break;
          
        case 'approveAction':
          if (this.agent) {
            this.agent.resolveApproval(msg.approved);
          }
          break;
          
        case 'getConfig':
          await this.sendConfig();
          break;
          
        case 'setProvider':
          await vscode.workspace.getConfiguration('arc1610').update('provider', msg.provider, true);
          await this.sendConfig();
          break;
          
        case 'setModel':
          await vscode.workspace.getConfiguration('arc1610').update('modelName', msg.model, true);
          await this.sendConfig();
          break;
          
        case 'setApiKey':
          await this.providerRegistry.setApiKey(msg.provider, msg.key);
          await this.sendConfig();
          break;
          
        case 'testConnection':
          try {
            const provider = await this.providerRegistry.getProvider();
            const models = await provider.testConnection();
            this.postMessage({ type: 'connectionResult', success: true, models });
          } catch (e) {
            this.postMessage({ 
              type: 'connectionResult', 
              success: false, 
              error: e instanceof Error ? e.message : String(e) 
            });
          }
          break;
          
        case 'startIndexing':
          this.indexer.indexWorkspace(msg.fullReindex);
          break;
          
        case 'cancelIndexing':
          this.indexer.cancelIndexing();
          break;
          
        case 'getIndexStatus':
          this.sendIndexStatus();
          break;
      }
    } catch (error) {
      this.logger.error(`Error handling webview message: ${msg.type}`, error);
    }
  }

  private async handleUserMessage(text: string, contextFiles?: string[]) {
    try {
      // Ensure index is loaded
      await this.indexer.ensureLoaded();
      
      const provider = await this.providerRegistry.getProvider();
      
      // Save user message to history
      this.chatHistory.push({ role: 'user', content: text });
      
      const config = await this.providerRegistry.readConfig();
      const requireApproval = vscode.workspace.getConfiguration('arc1610').get<boolean>('agent.requireApproval', true);
      const maxIterations = vscode.workspace.getConfiguration('arc1610').get<number>('agent.maxIterations', 15);
      
      this.agent = new AgentLoop(this.indexer, requireApproval);
      
      // Note: In a robust implementation, we would append the full agent history (including tools).
      // Here, we simplify by passing the accumulated user/assistant history.
      const historyToPass = [...this.chatHistory];
      // Pop the last user message so we can pass it separately to `run`
      historyToPass.pop();
      
      const generator = this.agent.run(text, historyToPass, provider, {
        model: config.modelName || undefined,
        maxTokens: config.maxTokens,
        maxIterations: maxIterations,
        contextFiles,
      });

      let accumulatedContent = '';

      for await (const event of generator) {
        switch (event.type) {
          case 'content':
            accumulatedContent += event.content;
            this.postMessage({ type: 'streamContent', content: event.content });
            break;
            
          case 'toolCall':
            this.postMessage({ type: 'toolCall', toolName: event.toolName, args: event.args });
            break;
            
          case 'toolResult':
            this.postMessage({ 
              type: 'toolResult', 
              toolName: event.toolName, 
              content: event.result.content,
              success: event.result.success
            });
            break;
            
          case 'approval':
            this.postMessage({
              type: 'approvalRequest',
              toolName: event.toolName,
              description: event.description,
              diff: event.diff,
              filepath: event.filepath
            });
            break;
            
          case 'error':
            this.postMessage({ type: 'streamError', error: event.error });
            break;
            
          case 'cancelled':
            this.postMessage({ type: 'streamCancelled' });
            break;
            
          case 'done':
            this.postMessage({ type: 'streamDone' });
            if (accumulatedContent) {
              this.chatHistory.push({ role: 'assistant', content: accumulatedContent });
            }
            break;
        }
      }
    } catch (error) {
      this.logger.error('Failed to handle user message', error);
      this.postMessage({ 
        type: 'streamError', 
        error: error instanceof Error ? error.message : String(error) 
      });
    } finally {
      this.agent = null;
    }
  }

  private getHtmlForWebview(webview: vscode.Webview): string {
    // Determine paths to the compiled React webview assets
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'webview', 'dist', 'assets', 'index.js')
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'webview', 'dist', 'assets', 'index.css')
    );
    
    // In development mode, we could point this to localhost for Vite HMR,
    // but for simplicity and stability in this first release, we'll assume a built bundle.
    // If the bundle doesn't exist, provide a helpful message.

    const nonce = getNonce();
    const csp = getCsp(webview, nonce);

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="${csp}">
  <title>Arc1610</title>
  <link rel="stylesheet" href="${styleUri}">
  <style>
    body { padding: 0; margin: 0; height: 100vh; overflow: hidden; }
    #root { height: 100%; display: flex; flex-direction: column; }
    .fallback-message { padding: 20px; font-family: sans-serif; }
  </style>
</head>
<body>
  <div id="root">
    <div class="fallback-message">
      Loading Arc1610 interface...
      <br><br>
      <small>If this stays here, run <code>npm run build:webview</code> to compile the React frontend.</small>
    </div>
  </div>
  <script nonce="${nonce}">
    // Pass VS Code API to the React app
    window.vscode = acquireVsCodeApi();
  </script>
  <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
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
