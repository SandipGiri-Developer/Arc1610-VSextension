/**
 * Application state types.
 *
 * Defines the shape of all state managed by the app-level reducer.
 * Separated into slices matching Continue's Redux pattern but using
 * plain React context + useReducer.
 */

import { IndexingProgress } from './messages';

/* ─── Chat Message ───────────────────────────────────────────────────── */

export type MessageRole = 'user' | 'assistant' | 'tool' | 'system';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  /** For tool messages: which tool was called */
  toolName?: string;
  /** For tool messages: whether it succeeded */
  toolSuccess?: boolean;
}

/* ─── Session ────────────────────────────────────────────────────────── */

export interface Session {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

/* ─── Config ─────────────────────────────────────────────────────────── */

export interface ProviderConfig {
  provider: string;
  model: string;
  hasApiKey: boolean;
  availableProviders: string[];
}

/* ─── Index Status ───────────────────────────────────────────────────── */

export interface IndexStatus {
  indexed: boolean;
  entryCount: number;
  fileCount: number;
  inProgress: boolean;
  progress?: IndexingProgress;
}

/* ─── Application View ───────────────────────────────────────────────── */

export type AppView = 'chat' | 'history' | 'settings';

/* ─── Root State ─────────────────────────────────────────────────────── */

export interface AppState {
  /** Current view (replaces router) */
  view: AppView;

  /** Active session */
  session: Session;

  /** Past sessions (for history view) */
  sessionHistory: Session[];

  /** Whether the assistant is currently streaming */
  isStreaming: boolean;

  /** Provider/model configuration from extension */
  config: ProviderConfig;

  /** Index status from extension */
  indexStatus: IndexStatus;

  /** Pending approval request */
  pendingApproval: {
    toolName: string;
    description: string;
    diff?: string;
    filepath?: string;
  } | null;
}

/* ─── Initial State Factory ──────────────────────────────────────────── */

let sessionCounter = 0;

export function createSessionId(): string {
  return `session-${Date.now()}-${++sessionCounter}`;
}

export function createEmptySession(): Session {
  const now = Date.now();
  return {
    id: createSessionId(),
    title: 'New Chat',
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function createInitialState(): AppState {
  return {
    view: 'chat',
    session: createEmptySession(),
    sessionHistory: [],
    isStreaming: false,
    config: {
      provider: 'ollama',
      model: '',
      hasApiKey: true,
      availableProviders: ['ollama', 'openai', 'anthropic'],
    },
    indexStatus: {
      indexed: false,
      entryCount: 0,
      fileCount: 0,
      inProgress: false,
    },
    pendingApproval: null,
  };
}
