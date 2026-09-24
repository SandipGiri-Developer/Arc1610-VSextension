import { useEffect, useCallback } from 'react';
import { ExtensionToWebviewMessage, WebviewToExtensionMessage } from '../types/messages';

// Get the VS Code API injected by the webview HTML
// @ts-ignore
const vscode = window.vscode || {
  postMessage: () => {
    console.warn('vscode API not found - running outside of extension?');
  }
};

type MessageHandler = (message: ExtensionToWebviewMessage) => void;

/**
 * Hook for typed messaging between React and the VS Code Extension Host.
 */
export function useMessaging(handler?: MessageHandler) {
  useEffect(() => {
    const listener = (event: MessageEvent) => {
      const message = event.data as ExtensionToWebviewMessage;
      if (handler) {
        handler(message);
      }
    };

    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
  }, [handler]);

  const postMessage = useCallback((message: WebviewToExtensionMessage) => {
    vscode.postMessage(message);
  }, []);

  return { postMessage };
}
