/**
 * Messenger Context — Centralized webview ↔ extension communication bridge.
 *
 * Follows Continue's IdeMessenger pattern: all components access the messenger
 * through React context rather than calling vscode.postMessage directly.
 *
 * This provides:
 * - Typed post() for fire-and-forget messages
 * - Typed request() for request-response patterns (future)
 * - Centralized message listener registration
 * - Single source of truth for the vscode API handle
 */

import React, { createContext, useCallback, useContext, useEffect, useRef } from 'react';
import {
  ExtensionToWebviewMessage,
  WebviewToExtensionMessage,
} from '../types/messages';

/* ─── VS Code API handle ─────────────────────────────────────────────── */

interface VsCodeApi {
  postMessage(message: unknown): void;
  getState(): unknown;
  setState(state: unknown): void;
}

declare function acquireVsCodeApi(): VsCodeApi;

// Acquire once. Outside of React to prevent double-init in StrictMode.
let vscodeApi: VsCodeApi | null = null;
function getVsCodeApi(): VsCodeApi {
  if (!vscodeApi) {
    try {
      vscodeApi = acquireVsCodeApi();
    } catch {
      // Running outside VS Code (e.g. vite dev server)
      vscodeApi = {
        postMessage: (msg) => console.log('[mock postMessage]', msg),
        getState: () => null,
        setState: () => {},
      };
    }
  }
  return vscodeApi;
}

/* ─── Context interface ──────────────────────────────────────────────── */

export type MessageHandler = (message: ExtensionToWebviewMessage) => void;

export interface IMessenger {
  /** Fire-and-forget typed message to the extension host. */
  post(message: WebviewToExtensionMessage): void;

  /** Subscribe to incoming messages. Returns unsubscribe function. */
  subscribe(handler: MessageHandler): () => void;

  /** Save UI state for webview restoration. */
  saveState(state: unknown): void;

  /** Restore saved UI state. */
  getState<T>(): T | null;
}

const MessengerContext = createContext<IMessenger | null>(null);

/* ─── Provider ───────────────────────────────────────────────────────── */

export const MessengerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const api = getVsCodeApi();
  const handlersRef = useRef<Set<MessageHandler>>(new Set());

  // Single global message listener
  useEffect(() => {
    const listener = (event: MessageEvent) => {
      const msg = event.data as ExtensionToWebviewMessage;
      for (const handler of handlersRef.current) {
        try {
          handler(msg);
        } catch (err) {
          console.error('[MessengerContext] Handler error:', err);
        }
      }
    };

    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
  }, []);

  const post = useCallback((message: WebviewToExtensionMessage) => {
    api.postMessage(message);
  }, [api]);

  const subscribe = useCallback((handler: MessageHandler): (() => void) => {
    handlersRef.current.add(handler);
    return () => {
      handlersRef.current.delete(handler);
    };
  }, []);

  const saveState = useCallback((state: unknown) => {
    api.setState(state);
  }, [api]);

  const restoreState = useCallback(<T,>(): T | null => {
    return api.getState() as T | null;
  }, [api]);

  const messenger: IMessenger = {
    post,
    subscribe,
    saveState,
    getState: restoreState,
  };

  return (
    <MessengerContext.Provider value={messenger}>
      {children}
    </MessengerContext.Provider>
  );
};

/* ─── Hook ───────────────────────────────────────────────────────────── */

export function useMessenger(): IMessenger {
  const ctx = useContext(MessengerContext);
  if (!ctx) {
    throw new Error('useMessenger must be used within MessengerProvider');
  }
  return ctx;
}

/**
 * Hook that subscribes to extension messages with automatic cleanup.
 * This is the convenience wrapper for components that need to react
 * to incoming messages.
 */
export function useExtensionMessage(handler: MessageHandler): void {
  const messenger = useMessenger();

  useEffect(() => {
    return messenger.subscribe(handler);
  }, [messenger, handler]);
}
