/**
 * Application state actions.
 *
 * Every state change goes through a typed action.
 * This is the single source of truth for what mutations are possible.
 */

import {
  AppView,
  ChatMessage,
  IndexStatus,
  ProviderConfig,
  Session,
} from './state';
import { IndexingProgress } from './messages';

export type AppAction =
  /* ─── View ─────────────────────────────────────────────────────────── */
  | { type: 'SET_VIEW'; view: AppView }

  /* ─── Session ──────────────────────────────────────────────────────── */
  | { type: 'NEW_SESSION' }
  | { type: 'LOAD_SESSION'; session: Session }
  | { type: 'SET_SESSION_TITLE'; title: string }

  /* ─── Messages ─────────────────────────────────────────────────────── */
  | { type: 'ADD_USER_MESSAGE'; content: string }
  | { type: 'APPEND_ASSISTANT_CONTENT'; content: string }
  | { type: 'ADD_TOOL_CALL'; toolName: string }
  | { type: 'ADD_TOOL_RESULT'; toolName: string; content: string; success: boolean }
  | { type: 'ADD_ERROR_MESSAGE'; error: string }

  /* ─── Streaming ────────────────────────────────────────────────────── */
  | { type: 'START_STREAMING' }
  | { type: 'STOP_STREAMING' }

  /* ─── Approval ─────────────────────────────────────────────────────── */
  | { type: 'SET_PENDING_APPROVAL'; toolName: string; description: string; diff?: string; filepath?: string }
  | { type: 'CLEAR_PENDING_APPROVAL' }

  /* ─── Config ───────────────────────────────────────────────────────── */
  | { type: 'SET_CONFIG'; config: ProviderConfig }

  /* ─── Indexing ─────────────────────────────────────────────────────── */
  | { type: 'SET_INDEX_STATUS'; status: IndexStatus }
  | { type: 'SET_INDEXING_PROGRESS'; progress: IndexingProgress }

  /* ─── Context ──────────────────────────────────────────────────────── */
  | { type: 'APPEND_INPUT_CONTEXT'; text: string };
