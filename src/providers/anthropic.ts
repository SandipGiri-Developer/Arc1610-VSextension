/**
 * Anthropic Claude LLM Provider.
 *
 * Uses the Anthropic Messages API with streaming.
 * Claude has its own message format and tool-calling convention.
 * Users must provide their own API key.
 */

import { Arc1610Error, ErrorReason, isCancellationError } from '../utils/errors';
import {
  ChatMessage,
  CompletionOptions,
  ILLMProvider,
  ProviderCapabilities,
  StreamChunk,
  ToolCall,
} from './types';

interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string | Array<{ type: string; text?: string; id?: string; name?: string; input?: unknown; tool_use_id?: string; content?: string }>;
}

export class AnthropicProvider implements ILLMProvider {
  readonly id = 'anthropic';
  readonly displayName = 'Anthropic Claude';
  readonly capabilities: ProviderCapabilities = {
    streaming: true,
    toolCalling: true,
    vision: false,
  };

  private readonly baseUrl = 'https://api.anthropic.com/v1';

  constructor(private apiKey: string) {}

  async *streamChat(
    messages: ChatMessage[],
    options: CompletionOptions,
  ): AsyncGenerator<StreamChunk> {
    const model = options.model || this.getDefaultModel();

    // Extract system message (Anthropic expects it as a separate field)
    const systemMessage = messages.find(m => m.role === 'system')?.content;
    const nonSystemMessages = messages.filter(m => m.role !== 'system');

    const body: Record<string, unknown> = {
      model,
      max_tokens: options.maxTokens || 4096,
      stream: true,
      messages: this.convertMessages(nonSystemMessages),
    };

    if (systemMessage) {
      body.system = systemMessage;
    }

    if (options.temperature !== undefined) {
      body.temperature = options.temperature;
    }
    if (options.topP !== undefined) {
      body.top_p = options.topP;
    }
    if (options.stop) {
      body.stop_sequences = options.stop;
    }
    if (options.tools && options.tools.length > 0) {
      body.tools = options.tools.map(t => ({
        name: t.function.name,
        description: t.function.description,
        input_schema: t.function.parameters,
      }));
    }

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(body),
        signal: options.signal,
      });
    } catch (error: unknown) {
      if (isCancellationError(error)) {
        throw new Arc1610Error(ErrorReason.Cancelled, 'Request cancelled');
      }
      throw new Arc1610Error(
        ErrorReason.ProviderConnectionFailed,
        'Failed to connect to Anthropic API.',
        error instanceof Error ? error : undefined,
      );
    }

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      this.handleHttpError(response.status, errorBody, model);
    }

    if (!response.body) {
      throw new Arc1610Error(ErrorReason.ProviderConnectionFailed, 'Empty response from Anthropic');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    // Track current tool use block
    let currentToolId = '';
    let currentToolName = '';
    let currentToolArgs = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) { break; }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) { continue; }
          const data = trimmed.slice(6);

          try {
            const event = JSON.parse(data);

            switch (event.type) {
              case 'content_block_start':
                if (event.content_block?.type === 'tool_use') {
                  currentToolId = event.content_block.id || `call_${Date.now()}`;
                  currentToolName = event.content_block.name || '';
                  currentToolArgs = '';
                }
                break;

              case 'content_block_delta':
                if (event.delta?.type === 'text_delta' && event.delta.text) {
                  yield { content: event.delta.text };
                } else if (event.delta?.type === 'input_json_delta' && event.delta.partial_json) {
                  currentToolArgs += event.delta.partial_json;
                }
                break;

              case 'content_block_stop':
                // If we were accumulating a tool call, emit it
                if (currentToolName) {
                  const toolCall: ToolCall = {
                    id: currentToolId,
                    function: {
                      name: currentToolName,
                      arguments: currentToolArgs || '{}',
                    },
                  };
                  yield { toolCalls: [toolCall] };
                  currentToolId = '';
                  currentToolName = '';
                  currentToolArgs = '';
                }
                break;

              case 'message_delta':
                if (event.delta?.stop_reason) {
                  const chunk: StreamChunk = { done: true };
                  if (event.usage) {
                    chunk.usage = {
                      promptTokens: 0,
                      completionTokens: event.usage.output_tokens || 0,
                      totalTokens: event.usage.output_tokens || 0,
                    };
                  }
                  yield chunk;
                }
                break;

              case 'message_start':
                // Can extract input tokens
                if (event.message?.usage?.input_tokens) {
                  // Store for later — will be included in final usage
                }
                break;

              case 'error':
                throw new Arc1610Error(
                  ErrorReason.ProviderConnectionFailed,
                  `Anthropic stream error: ${event.error?.message || 'Unknown'}`,
                );
            }
          } catch (e) {
            if (e instanceof Arc1610Error) { throw e; }
            // Skip malformed events
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  async testConnection(): Promise<string[]> {
    // Anthropic doesn't have a models list endpoint, so we verify with a minimal request
    try {
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'hi' }],
        }),
        signal: AbortSignal.timeout(15_000),
      });

      if (response.status === 401) {
        throw new Arc1610Error(ErrorReason.ProviderAuthFailed, 'Invalid Anthropic API key.');
      }

      // Even a 400 means we can reach the API
      return ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'];
    } catch (error: unknown) {
      if (error instanceof Arc1610Error) { throw error; }
      throw new Arc1610Error(
        ErrorReason.ProviderConnectionFailed,
        'Cannot reach Anthropic API.',
        error instanceof Error ? error : undefined,
      );
    }
  }

  getDefaultModel(): string {
    return 'claude-3-5-sonnet-20241022';
  }

  dispose(): void {
    // No persistent resources
  }

  private convertMessages(messages: ChatMessage[]): AnthropicMessage[] {
    const result: AnthropicMessage[] = [];

    for (const msg of messages) {
      if (msg.role === 'assistant' && msg.toolCalls && msg.toolCalls.length > 0) {
        // Assistant message with tool calls
        const content: Array<{ type: string; text?: string; id?: string; name?: string; input?: unknown }> = [];
        if (msg.content) {
          content.push({ type: 'text', text: msg.content });
        }
        for (const tc of msg.toolCalls) {
          content.push({
            type: 'tool_use',
            id: tc.id,
            name: tc.function.name,
            input: JSON.parse(tc.function.arguments),
          });
        }
        result.push({ role: 'assistant', content });
      } else if (msg.role === 'tool') {
        // Tool result — Anthropic expects this as a user message with tool_result content
        result.push({
          role: 'user',
          content: [
            {
              type: 'tool_result',
              tool_use_id: msg.toolCallId,
              content: msg.content,
            },
          ],
        });
      } else {
        result.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content,
        });
      }
    }

    return result;
  }

  private handleHttpError(status: number, body: string, model: string): never {
    if (status === 401) {
      throw new Arc1610Error(ErrorReason.ProviderAuthFailed, 'Invalid Anthropic API key.');
    }
    if (status === 429) {
      throw new Arc1610Error(ErrorReason.ProviderRateLimit, 'Anthropic rate limit exceeded.');
    }
    if (status === 404) {
      throw new Arc1610Error(ErrorReason.ProviderModelNotFound, `Model "${model}" not found.`);
    }
    try {
      const parsed = JSON.parse(body);
      if (parsed.error?.message) {
        throw new Arc1610Error(ErrorReason.ProviderConnectionFailed, parsed.error.message);
      }
    } catch (e) {
      if (e instanceof Arc1610Error) { throw e; }
    }
    throw new Arc1610Error(ErrorReason.ProviderConnectionFailed, `Anthropic error ${status}: ${body.slice(0, 200)}`);
  }
}
