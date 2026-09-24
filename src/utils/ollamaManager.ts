import * as vscode from 'vscode';
import * as cp from 'child_process';
import { Logger } from './logger';

export class OllamaManager {
  private static isPrompting = false;

  /**
   * Check if Ollama is running. If not, prompt the user to start it.
   * Returns true if Ollama is running (or successfully started), false otherwise.
   */
  static async ensureRunning(endpoint: string = 'http://127.0.0.1:11434'): Promise<boolean> {
    const isRunning = await this.ping(endpoint);
    if (isRunning) {
      return true;
    }

    if (this.isPrompting) {
      return false; // Don't prompt multiple times simultaneously
    }

    this.isPrompting = true;
    try {
      const selection = await vscode.window.showWarningMessage(
        'Ollama is not currently running. Arc1610 needs it to generate code and index your workspace.',
        'Start Ollama',
        'Cancel'
      );

      if (selection === 'Start Ollama') {
        return await this.startOllama(endpoint);
      }
      return false;
    } finally {
      this.isPrompting = false;
    }
  }

  private static async ping(endpoint: string): Promise<boolean> {
    try {
      // The base endpoint typically returns "Ollama is running"
      const response = await fetch(endpoint, { signal: AbortSignal.timeout(2000) });
      return response.ok;
    } catch {
      return false;
    }
  }

  private static async startOllama(endpoint: string): Promise<boolean> {
    const logger = Logger.getInstance();
    
    return new Promise((resolve) => {
      logger.info('Attempting to start Ollama automatically...');
      
      try {
        // Run 'ollama serve' as a detached background process
        const child = cp.spawn('ollama', ['serve'], {
          detached: true,
          windowsHide: true,
          stdio: 'ignore'
        });
        
        // Unref so the VS Code extension host doesn't hang waiting for Ollama to close
        child.unref();
      } catch (error) {
        logger.error('Failed to spawn Ollama process', error);
        vscode.window.showErrorMessage('Failed to start Ollama. Make sure it is installed and in your system PATH.');
        resolve(false);
        return;
      }

      // Show progress while waiting for it to start up
      vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Starting Ollama...",
        cancellable: false
      }, async () => {
        // Poll for up to 10 seconds
        for (let i = 0; i < 10; i++) {
          await new Promise(r => setTimeout(r, 1000));
          const isUp = await this.ping(endpoint);
          if (isUp) {
            vscode.window.showInformationMessage('Ollama started successfully!');
            resolve(true);
            return;
          }
        }
        
        vscode.window.showErrorMessage('Ollama process started, but it is not responding to requests. You may need to start it manually.');
        resolve(false);
      });
    });
  }
}
