import { ChatMessage, IDE, PromptLog } from 'core';
import { createContext } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { isJetBrains } from '../util';

type FromWebviewProtocol = any;
type ToWebviewProtocol = any;
type ToCoreProtocol = any;

export type Message = {
  messageId: string;
  messageType: string;
  data: any;
};

type WebviewSingleProtocolMessage<T> = any;
type GeneratorYieldType<T> = any;
type GeneratorReturnType<T> = any;

export interface IIdeMessenger {
  post(messageType: any, data: any, messageId?: string, attempt?: number): void;
  respond(messageType: any, data: any, messageId: string): void;
  request(messageType: any, data: any): Promise<any>;
  streamRequest(messageType: any, data: any, cancelToken?: AbortSignal): AsyncGenerator<any, any>;
  llmStreamChat(msg: any, cancelToken: AbortSignal): AsyncGenerator<ChatMessage[], PromptLog | undefined>;
  ide: IDE;
}

/**
 * IdeMessenger — lightweight bridge from webview to extension host.
 *
 * KODRA only supports the messages defined in messageTypes.ts.
 * All other message types (Continue-specific) are silently no-ops.
 *
 * IMPORTANT: request() adds a window.addEventListener that waits for a reply
 * keyed by messageId. If the extension does not reply, this listener leaks.
 * We guard against this with a REQUEST_TIMEOUT_MS timeout that self-cleans.
 */
const REQUEST_TIMEOUT_MS = 5_000; // 5 seconds — after this, orphaned listeners clean up

export class IdeMessenger implements IIdeMessenger {
  ide: IDE;

  constructor() {
    this.ide = {} as any;
  }

  private _postToIde(messageType: string, data: any, messageId: string = uuidv4()) {
    const msg: Message = { messageId, messageType, data };
    (window as any).vscode?.postMessage(msg);
  }

  post(messageType: any, data: any, messageId?: string, attempt: number = 0) {
    this._postToIde(messageType, data, messageId);
  }

  respond(messageType: any, data: any, messageId: string) {
    this._postToIde(messageType, data, messageId);
  }

  request(messageType: any, data: any): Promise<any> {
    const messageId = uuidv4();
    return new Promise((resolve) => {
      let resolved = false;

      const handler = (event: any) => {
        if (event.data?.messageId === messageId) {
          if (!resolved) {
            resolved = true;
            window.removeEventListener('message', handler);
            resolve(event.data.data);
          }
        }
      };

      window.addEventListener('message', handler);
      this._postToIde(messageType, data, messageId);

      // Safety net: if the extension never replies (unknown message type),
      // remove the listener after the timeout so it doesn't leak.
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          window.removeEventListener('message', handler);
          resolve({ status: 'error', error: `Request '${messageType}' timed out` });
        }
      }, REQUEST_TIMEOUT_MS);
    });
  }

  async *streamRequest(messageType: any, data: any, cancelToken?: AbortSignal): AsyncGenerator<any, any> {
    yield [];
    return undefined;
  }

  async *llmStreamChat(msg: any, cancelToken: AbortSignal): AsyncGenerator<ChatMessage[], PromptLog | undefined> {
    yield [];
    return undefined;
  }
}

export const IdeMessengerContext = createContext<IIdeMessenger>(new IdeMessenger());

export const IdeMessengerProvider: React.FC<{
  children: React.ReactNode;
  messenger?: IIdeMessenger;
}> = ({ children, messenger = new IdeMessenger() }) => {
  return (
    <IdeMessengerContext.Provider value={messenger}>
      {children}
    </IdeMessengerContext.Provider>
  );
};
