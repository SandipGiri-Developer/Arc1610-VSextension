/**
 * Message types for webview. Must match src/webview/messageTypes.ts in the extension.
 */

export interface IndexingProgress {
  status: 'starting' | 'walking' | 'chunking' | 'embedding' | 'storing' | 'complete' | 'error' | 'cancelled' | 'idle';
  progress: number;
  description: string;
  filesProcessed?: number;
  totalFiles?: number;
}

export type WebviewToExtensionMessage =
  | { type: 'sendMessage'; text: string; contextFiles?: string[] }
  | { type: 'cancelGeneration' }
  | { type: 'newChat' }
  | { type: 'approveAction'; approved: boolean }
  | { type: 'getConfig' }
  | { type: 'setProvider'; provider: string }
  | { type: 'setModel'; model: string }
  | { type: 'setApiKey'; provider: string; key: string }
  | { type: 'testConnection' }
  | { type: 'startIndexing'; fullReindex?: boolean }
  | { type: 'cancelIndexing' }
  | { type: 'getIndexStatus' }
  | { type: 'executeCommand'; command: string }
  | { type: 'webviewReady' };

export type ExtensionToWebviewMessage =
  | { type: 'streamContent'; content: string }
  | { type: 'streamDone' }
  | { type: 'streamError'; error: string }
  | { type: 'streamCancelled' }
  | { type: 'toolCall'; toolName: string; args: Record<string, unknown> }
  | { type: 'toolResult'; toolName: string; content: string; success: boolean }
  | { type: 'approvalRequest'; toolName: string; description: string; diff?: string; filepath?: string }
  | { type: 'config'; provider: string; model: string; hasApiKey: boolean; availableProviders: string[] }
  | { type: 'connectionResult'; success: boolean; models?: string[]; error?: string }
  | { type: 'indexingProgress'; progress: IndexingProgress }
  | { type: 'indexStatus'; indexed: boolean; entryCount: number; fileCount: number; inProgress: boolean }
  | { type: 'addContext'; filepath: string; content?: string; selection?: string };
