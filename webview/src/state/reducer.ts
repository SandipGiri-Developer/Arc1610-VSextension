/**
 * Application reducer.
 *
 * Pure function that produces new state from current state + action.
 * Organized by slice (session, streaming, config, indexing, UI).
 */

import { AppAction } from './actions';
import {
  AppState,
  ChatMessage,
  createEmptySession,
  createSessionId,
} from '../types/state';

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    /* ─── View ──────────────────────────────────────────────────────── */

    case 'SET_VIEW':
      return { ...state, view: action.view };

    /* ─── Session ───────────────────────────────────────────────────── */

    case 'NEW_SESSION': {
      const historyEntry = state.session.messages.length > 0
        ? [...state.sessionHistory, state.session]
        : state.sessionHistory;

      return {
        ...state,
        session: createEmptySession(),
        sessionHistory: historyEntry,
        isStreaming: false,
        pendingApproval: null,
      };
    }

    case 'LOAD_SESSION':
      return {
        ...state,
        session: action.session,
        view: 'chat',
        isStreaming: false,
        pendingApproval: null,
      };

    case 'SET_SESSION_TITLE':
      return {
        ...state,
        session: { ...state.session, title: action.title, updatedAt: Date.now() },
      };

    /* ─── Messages ──────────────────────────────────────────────────── */

    case 'ADD_USER_MESSAGE': {
      const userMsg: ChatMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        role: 'user',
        content: action.content,
        timestamp: Date.now(),
      };

      // Auto-set title from first user message
      const isFirstMessage = state.session.messages.length === 0;
      const title = isFirstMessage
        ? action.content.slice(0, 60) + (action.content.length > 60 ? '...' : '')
        : state.session.title;

      return {
        ...state,
        session: {
          ...state.session,
          title,
          messages: [...state.session.messages, userMsg],
          updatedAt: Date.now(),
        },
      };
    }

    case 'APPEND_ASSISTANT_CONTENT': {
      const msgs = [...state.session.messages];
      const last = msgs[msgs.length - 1];

      if (last && last.role === 'assistant' && !last.toolName) {
        // Append to existing assistant message (streaming)
        msgs[msgs.length - 1] = {
          ...last,
          content: last.content + action.content,
        };
      } else {
        // Start new assistant message
        msgs.push({
          id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          role: 'assistant',
          content: action.content,
          timestamp: Date.now(),
        });
      }

      return {
        ...state,
        session: { ...state.session, messages: msgs, updatedAt: Date.now() },
      };
    }

    case 'ADD_TOOL_CALL': {
      const toolMsg: ChatMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        role: 'tool',
        content: `Calling: ${action.toolName}`,
        timestamp: Date.now(),
        toolName: action.toolName,
      };
      return {
        ...state,
        session: {
          ...state.session,
          messages: [...state.session.messages, toolMsg],
          updatedAt: Date.now(),
        },
      };
    }

    case 'ADD_TOOL_RESULT': {
      const resultMsg: ChatMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        role: 'tool',
        content: action.content,
        timestamp: Date.now(),
        toolName: action.toolName,
        toolSuccess: action.success,
      };
      return {
        ...state,
        session: {
          ...state.session,
          messages: [...state.session.messages, resultMsg],
          updatedAt: Date.now(),
        },
      };
    }

    case 'ADD_ERROR_MESSAGE': {
      const errMsg: ChatMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        role: 'assistant',
        content: `Error: ${action.error}`,
        timestamp: Date.now(),
      };
      return {
        ...state,
        session: {
          ...state.session,
          messages: [...state.session.messages, errMsg],
          updatedAt: Date.now(),
        },
        isStreaming: false,
      };
    }

    /* ─── Streaming ─────────────────────────────────────────────────── */

    case 'START_STREAMING':
      return { ...state, isStreaming: true };

    case 'STOP_STREAMING':
      return { ...state, isStreaming: false };

    /* ─── Approval ──────────────────────────────────────────────────── */

    case 'SET_PENDING_APPROVAL':
      return {
        ...state,
        pendingApproval: {
          toolName: action.toolName,
          description: action.description,
          diff: action.diff,
          filepath: action.filepath,
        },
      };

    case 'CLEAR_PENDING_APPROVAL':
      return { ...state, pendingApproval: null };

    /* ─── Config ────────────────────────────────────────────────────── */

    case 'SET_CONFIG':
      return { ...state, config: action.config };

    /* ─── Indexing ──────────────────────────────────────────────────── */

    case 'SET_INDEX_STATUS':
      return { ...state, indexStatus: action.status };

    case 'SET_INDEXING_PROGRESS':
      return {
        ...state,
        indexStatus: {
          ...state.indexStatus,
          progress: action.progress,
          inProgress: !['complete', 'error', 'cancelled', 'idle'].includes(action.progress.status),
        },
      };

    /* ─── Fallthrough ───────────────────────────────────────────────── */

    default:
      return state;
  }
}
