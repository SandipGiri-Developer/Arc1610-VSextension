/**
 * LLM Provider abstraction for ARC1610.
 *
 * Inspired by ARC's BaseLLM interface but simplified for the first release.
 * Each provider implements streaming chat completion with tool support where available.
 */
/** A single message in a conversation. */
export interface ChatMessage {
    role: 'system' | 'user' | 'assistant' | 'tool';
    content: string;
    /** For tool result messages */
    toolCallId?: string;
    /** Tool calls requested by the assistant */
    toolCalls?: ToolCall[];
}
/** A tool call request from the model. */
export interface ToolCall {
    id: string;
    function: {
        name: string;
        arguments: string;
    };
}
/** A tool definition to provide to the model. */
export interface ToolDefinition {
    type: 'function';
    function: {
        name: string;
        description: string;
        parameters: Record<string, unknown>;
    };
}
/** A single streamed chunk from the model. */
export interface StreamChunk {
    /** Text content delta */
    content?: string;
    /** Tool call deltas */
    toolCalls?: Partial<ToolCall>[];
    /** Whether this is the final chunk */
    done?: boolean;
    /** Token usage info (available on final chunk for some providers) */
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
}
/** Options for a completion request. */
export interface CompletionOptions {
    model?: string;
    maxTokens?: number;
    temperature?: number;
    topP?: number;
    stop?: string[];
    tools?: ToolDefinition[];
    /** AbortSignal for cancellation */
    signal?: AbortSignal;
}
/** Provider capability flags. */
export interface ProviderCapabilities {
    /** Whether this provider supports streaming */
    streaming: boolean;
    /** Whether this provider supports tool/function calling */
    toolCalling: boolean;
    /** Whether this provider supports vision/image input */
    vision: boolean;
}
/**
 * The core LLM provider interface.
 * All providers must implement this to work with ARC1610's agent loop.
 */
export interface ILLMProvider {
    /** Unique provider identifier (e.g., 'ollama', 'openai', 'anthropic') */
    readonly id: string;
    /** Human-readable provider name */
    readonly displayName: string;
    /** Provider capabilities */
    readonly capabilities: ProviderCapabilities;
    /**
     * Stream a chat completion.
     * Yields chunks as they arrive from the provider.
     * The final chunk should have `done: true`.
     */
    streamChat(messages: ChatMessage[], options: CompletionOptions): AsyncGenerator<StreamChunk>;
    /**
     * Verify the provider is reachable and properly configured.
     * Returns a list of available models or throws on failure.
     */
    testConnection(): Promise<string[]>;
    /**
     * Get the default model for this provider.
     */
    getDefaultModel(): string;
    /**
     * Clean up provider resources.
     */
    dispose(): void;
}
/**
 * Provider configuration, read from VS Code settings and SecretStorage.
 */
export interface ProviderConfig {
    provider: string;
    modelName: string;
    endpoint?: string;
    apiKey?: string;
    maxTokens: number;
}
//# sourceMappingURL=types.d.ts.map