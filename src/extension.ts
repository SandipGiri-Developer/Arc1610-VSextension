import * as vscode from 'vscode';
import { CodebaseIndexer } from './indexing/indexer';
import { ProviderRegistry } from './providers/registry';
import { Logger } from './utils/logger';
import { Arc1610ViewProvider } from './webview/viewProvider';

let indexer: CodebaseIndexer;
let providerRegistry: ProviderRegistry;
let logger: Logger;

export async function activate(context: vscode.ExtensionContext) {
  // Initialize logger
  logger = Logger.getInstance();
  logger.info('Arc1610 activating...');

  try {
    // Initialize core services
    providerRegistry = new ProviderRegistry(context.secrets);
    
    const indexerConfig = CodebaseIndexer.readConfig();
    indexer = new CodebaseIndexer(indexerConfig);
    
    // Register webview provider
    const viewProvider = new Arc1610ViewProvider(context.extensionUri, providerRegistry, indexer);
    
    context.subscriptions.push(
      vscode.window.registerWebviewViewProvider(
        Arc1610ViewProvider.viewType,
        viewProvider,
        {
          webviewOptions: { retainContextWhenHidden: true },
        }
      )
    );

    // Register commands
    context.subscriptions.push(
      vscode.commands.registerCommand('arc1610.openChat', () => {
        vscode.commands.executeCommand('arc1610.chatView.focus');
      }),
      
      vscode.commands.registerCommand('arc1610.newChat', () => {
        viewProvider.newChat();
      }),
      
      vscode.commands.registerCommand('arc1610.indexWorkspace', () => {
        indexer.indexWorkspace(false); // incremental
      }),
      
      vscode.commands.registerCommand('arc1610.reindexWorkspace', () => {
        indexer.indexWorkspace(true); // full
      }),
      
      vscode.commands.registerCommand('arc1610.cancelIndexing', () => {
        indexer.cancelIndexing();
      }),
      
      vscode.commands.registerCommand('arc1610.addFileContext', async () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          const filepath = editor.document.uri.fsPath;
          viewProvider.addContext(filepath);
        } else {
          vscode.window.showInformationMessage('No active editor to add file from.');
        }
      }),
      
      vscode.commands.registerCommand('arc1610.addSelectionContext', async () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          const filepath = editor.document.uri.fsPath;
          const selection = editor.document.getText(editor.selection);
          if (selection) {
            viewProvider.addContext(filepath, undefined, selection);
          } else {
            vscode.window.showInformationMessage('No text selected.');
          }
        }
      }),
      
      vscode.commands.registerCommand('arc1610.configureProvider', async () => {
        const providers = providerRegistry.getSupportedProviders();
        
        // Show QuickPick to select provider
        const selected = await vscode.window.showQuickPick(providers, {
          title: 'Select AI Provider to Configure',
        });
        
        if (selected) {
          // If it needs an API key (not Ollama), prompt for it
          if (selected !== 'ollama') {
            await providerRegistry.promptForApiKey(selected);
          }
          
          // Update setting
          await vscode.workspace.getConfiguration('arc1610').update('provider', selected, true);
          viewProvider.sendConfig();
          vscode.window.showInformationMessage(`Provider set to ${selected}`);
        }
      })
    );

    // Listen for configuration changes
    context.subscriptions.push(
      vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration('arc1610.indexing') || e.affectsConfiguration('arc1610.ollama')) {
          indexer.updateConfig(CodebaseIndexer.readConfig());
        }
        if (e.affectsConfiguration('arc1610.provider') || e.affectsConfiguration('arc1610.modelName')) {
          viewProvider.sendConfig();
        }
      })
    );

    // Auto-start incremental indexing if enabled
    const autoIndex = vscode.workspace.getConfiguration('arc1610').get<boolean>('indexing.enabled', true);
    if (autoIndex && vscode.workspace.workspaceFolders) {
      // Small delay to not block startup
      setTimeout(() => {
        indexer.indexWorkspace(false).catch(err => {
          logger.error('Auto-indexing failed', err);
        });
      }, 5000);
    }

    logger.info('Arc1610 activation complete');
    
  } catch (error) {
    logger.error('Failed to activate Arc1610', error);
    vscode.window.showErrorMessage(`Arc1610 failed to activate: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export function deactivate() {
  indexer?.dispose();
  providerRegistry?.dispose();
  logger?.dispose();
}
