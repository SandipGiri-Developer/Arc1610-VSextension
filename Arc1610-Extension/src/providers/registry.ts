/**
 * Provider Registry — Factory for creating and managing LLM providers.
 * 
 * Reads configuration from VS Code settings and SecretStorage,
 * instantiates the appropriate provider, and caches it for reuse.
 */

import * as vscode from 'vscode';
import { Arc1610Error, ErrorReason } from '../utils/errors';
import { Logger } from '../utils/logger';
import { AnthropicProvider } from './anthropic';
import { OllamaProvider } from './ollama';
import { OpenAIProvider } from './openai';
import { ILLMProvider, ProviderConfig } from './types';

export class ProviderRegistry {
  private currentProvider: ILLMProvider | null = null;
  private currentConfig: ProviderConfig | null = null;

  constructor(private readonly secretStorage: vscode.SecretStorage) {}

  /**
   * Get the current provider, creating it if necessary.
   * Re-creates the provider if configuration has changed.
   */
  async getProvider(): Promise<ILLMProvider> {
    const config = await this.readConfig();

    // Check if we need to recreate the provider
    if (this.currentProvider && this.currentConfig &&
        this.configsMatch(this.currentConfig, config)) {
      return this.currentProvider;
    }

    // Dispose old provider
    this.currentProvider?.dispose();
    this.currentProvider = null;

    // Create new provider
    this.currentProvider = await this.createProvider(config);
    this.currentConfig = config;

    Logger.getInstance().info(`Provider initialized: ${this.currentProvider.displayName}`);
    return this.currentProvider;
  }

  /**
   * Read provider configuration from VS Code settings and SecretStorage.
   */
  async readConfig(): Promise<ProviderConfig> {
    const settings = vscode.workspace.getConfiguration('arc1610');
    const provider = settings.get<string>('provider', 'ollama');
    const modelName = settings.get<string>('modelName', '');
    const maxTokens = settings.get<number>('maxTokens', 4096);

    let endpoint: string | undefined;
    let apiKey: string | undefined;

    switch (provider) {
      case 'ollama':
        endpoint = settings.get<string>('ollama.endpoint', 'http://127.0.0.1:11434');
        break;
      case 'openai':
        endpoint = settings.get<string>('openai.baseUrl', 'https://api.openai.com/v1');
        apiKey = await this.secretStorage.get('arc1610.openai.apiKey');
        break;
      case 'anthropic':
        apiKey = await this.secretStorage.get('arc1610.anthropic.apiKey');
        break;
    }

    return { provider, modelName, endpoint, apiKey, maxTokens };
  }

  /**
   * Store an API key securely in SecretStorage.
   */
  async setApiKey(provider: string, key: string): Promise<void> {
    await this.secretStorage.store(`arc1610.${provider}.apiKey`, key);
    // Force provider recreation on next use
    this.currentProvider?.dispose();
    this.currentProvider = null;
    this.currentConfig = null;
    Logger.getInstance().info(`API key stored for provider: ${provider}`);
  }

  /**
   * Delete a stored API key.
   */
  async deleteApiKey(provider: string): Promise<void> {
    await this.secretStorage.delete(`arc1610.${provider}.apiKey`);
    this.currentProvider?.dispose();
    this.currentProvider = null;
    this.currentConfig = null;
  }

  /**
   * Interactively configure an API key for a provider.
   */
  async promptForApiKey(provider: string): Promise<boolean> {
    const providerNames: Record<string, string> = {
      openai: 'OpenAI',
      anthropic: 'Anthropic',
    };

    const key = await vscode.window.showInputBox({
      prompt: `Enter your ${providerNames[provider] || provider} API key`,
      password: true,
      placeHolder: 'sk-...',
      ignoreFocusOut: true,
      validateInput: (value) => {
        if (!value || value.trim().length < 10) {
          return 'API key seems too short. Please enter a valid key.';
        }
        return null;
      },
    });

    if (key) {
      await this.setApiKey(provider, key.trim());
      return true;
    }
    return false;
  }

  /**
   * Get the list of supported provider IDs.
   */
  getSupportedProviders(): string[] {
    return ['ollama', 'openai', 'anthropic'];
  }

  dispose(): void {
    this.currentProvider?.dispose();
    this.currentProvider = null;
  }

  private async createProvider(config: ProviderConfig): Promise<ILLMProvider> {
    switch (config.provider) {
      case 'ollama':
        return new OllamaProvider(config.endpoint);

      case 'openai': {
        if (!config.apiKey) {
          throw new Arc1610Error(
            ErrorReason.ProviderNotConfigured,
            'OpenAI API key not configured. Use "Arc1610: Configure AI Provider" to set it up.',
          );
        }
        return new OpenAIProvider(config.apiKey, config.endpoint);
      }

      case 'anthropic': {
        if (!config.apiKey) {
          throw new Arc1610Error(
            ErrorReason.ProviderNotConfigured,
            'Anthropic API key not configured. Use "Arc1610: Configure AI Provider" to set it up.',
          );
        }
        return new AnthropicProvider(config.apiKey);
      }

      default:
        throw new Arc1610Error(
          ErrorReason.ConfigInvalid,
          `Unknown provider: "${config.provider}". Supported providers: ollama, openai, anthropic.`,
        );
    }
  }

  private configsMatch(a: ProviderConfig, b: ProviderConfig): boolean {
    return a.provider === b.provider
      && a.modelName === b.modelName
      && a.endpoint === b.endpoint
      && a.apiKey === b.apiKey
      && a.maxTokens === b.maxTokens;
  }
}
