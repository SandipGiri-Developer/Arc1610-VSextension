/**
 * Provider Registry — Factory for creating and managing LLM providers.
 *
 * Reads configuration from VS Code settings and SecretStorage,
 * instantiates the appropriate provider, and caches it for reuse.
 */
import * as vscode from 'vscode';
import { ILLMProvider, ProviderConfig } from './types';
export declare class ProviderRegistry {
    private readonly secretStorage;
    private currentProvider;
    private currentConfig;
    constructor(secretStorage: vscode.SecretStorage);
    /**
     * Get the current provider, creating it if necessary.
     * Re-creates the provider if configuration has changed.
     */
    getProvider(): Promise<ILLMProvider>;
    /**
     * Read provider configuration from VS Code settings and SecretStorage.
     */
    readConfig(): Promise<ProviderConfig>;
    /**
     * Store an API key securely in SecretStorage.
     */
    setApiKey(provider: string, key: string): Promise<void>;
    /**
     * Delete a stored API key.
     */
    deleteApiKey(provider: string): Promise<void>;
    /**
     * Interactively configure an API key for a provider.
     */
    promptForApiKey(provider: string): Promise<boolean>;
    /**
     * Get the list of supported provider IDs.
     */
    getSupportedProviders(): string[];
    dispose(): void;
    private createProvider;
    private configsMatch;
}
//# sourceMappingURL=registry.d.ts.map