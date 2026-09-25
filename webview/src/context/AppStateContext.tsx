/**
 * Application state context.
 *
 * Provides the global state tree and dispatch to all components.
 * Also wires up the messenger to dispatch actions from extension messages.
 */

import React, { createContext, useCallback, useContext, useEffect, useReducer } from 'react';
import { AppAction } from '../state/actions';
import { appReducer } from '../state/reducer';
import { AppState, createInitialState } from '../types/state';
import { useMessenger, useExtensionMessage } from './MessengerContext';
import { ExtensionToWebviewMessage } from '../types/messages';

/* ─── Context ────────────────────────────────────────────────────────── */

interface AppStateContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

const AppStateContext = createContext<AppStateContextValue | null>(null);

/* ─── Provider ───────────────────────────────────────────────────────── */

export const AppStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const messenger = useMessenger();
  const [state, dispatch] = useReducer(appReducer, undefined, createInitialState);

  // Send webviewReady on mount
  useEffect(() => {
    messenger.post({ type: 'webviewReady' });
    messenger.post({ type: 'getConfig' });
    messenger.post({ type: 'getIndexStatus' });
  }, [messenger]);

  // Wire extension messages → dispatch
  const handleExtensionMessage = useCallback((msg: ExtensionToWebviewMessage) => {
    switch (msg.type) {
      case 'streamContent':
        dispatch({ type: 'APPEND_ASSISTANT_CONTENT', content: msg.content });
        break;

      case 'toolCall':
        dispatch({ type: 'ADD_TOOL_CALL', toolName: msg.toolName });
        break;

      case 'toolResult':
        dispatch({
          type: 'ADD_TOOL_RESULT',
          toolName: msg.toolName,
          content: msg.content,
          success: msg.success,
        });
        break;

      case 'streamDone':
      case 'streamCancelled':
        dispatch({ type: 'STOP_STREAMING' });
        break;

      case 'streamError':
        dispatch({ type: 'ADD_ERROR_MESSAGE', error: msg.error });
        break;

      case 'config':
        dispatch({
          type: 'SET_CONFIG',
          config: {
            provider: msg.provider,
            model: msg.model,
            hasApiKey: msg.hasApiKey,
            availableProviders: msg.availableProviders || ['ollama', 'openai', 'anthropic'],
          },
        });
        break;

      case 'indexStatus':
        dispatch({
          type: 'SET_INDEX_STATUS',
          status: {
            indexed: msg.indexed,
            entryCount: msg.entryCount,
            fileCount: msg.fileCount,
            inProgress: msg.inProgress,
          },
        });
        break;

      case 'indexingProgress':
        dispatch({ type: 'SET_INDEXING_PROGRESS', progress: msg.progress });
        break;

      case 'approvalRequest':
        dispatch({
          type: 'SET_PENDING_APPROVAL',
          toolName: msg.toolName,
          description: msg.description,
          diff: msg.diff,
          filepath: msg.filepath,
        });
        break;

      case 'addContext': {
        const filename = msg.filepath.split(/[\\/]/).pop() || msg.filepath;
        dispatch({ type: 'APPEND_INPUT_CONTEXT', text: `@${filename} ` });
        break;
      }
    }
  }, []);

  useExtensionMessage(handleExtensionMessage);

  return (
    <AppStateContext.Provider value={{ state, dispatch }}>
      {children}
    </AppStateContext.Provider>
  );
};

/* ─── Hooks ──────────────────────────────────────────────────────────── */

export function useAppState(): AppState {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
  return ctx.state;
}

export function useAppDispatch(): React.Dispatch<AppAction> {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppDispatch must be used within AppStateProvider');
  return ctx.dispatch;
}
