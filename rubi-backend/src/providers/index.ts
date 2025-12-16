import { LLMConfig, LLMProvider, LLMResponse } from '../types';
import { OpenAIProvider } from './openai.provider';
import { AnthropicProvider } from './anthropic.provider';
import { AzureOpenAIProvider } from './azure-openai.provider';
import { BaseLLMProvider } from './base.provider';

export class LLMOrchestrator {
  private providers: Map<LLMProvider, BaseLLMProvider> = new Map();
  // Phase 10A: Track execution metadata
  private lastExecutionMetadata: {
    providerPrimary: string | null;
    providerFinal: string | null;
    modelPrimary: string | null;
    modelFinal: string | null;
    fallbackOccurred: boolean;
    attemptCount: number;
  } | null = null;

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders(): void {
    const openaiKey = process.env.OPENAI_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const azureKey = process.env.AZURE_OPENAI_API_KEY;

    if (openaiKey) {
      const config: LLMConfig = {
        provider: 'openai',
        model: process.env.DEFAULT_MODEL || 'gpt-4-turbo-preview',
        apiKey: openaiKey,
      };
      this.providers.set('openai', new OpenAIProvider(config));
    }

    if (anthropicKey) {
      const config: LLMConfig = {
        provider: 'anthropic',
        model: 'claude-3-sonnet-20240229',
        apiKey: anthropicKey,
      };
      this.providers.set('anthropic', new AnthropicProvider(config));
    }

    if (azureKey && process.env.AZURE_OPENAI_ENDPOINT) {
      const config: LLMConfig = {
        provider: 'azure-openai',
        model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4',
        apiKey: azureKey,
        endpoint: process.env.AZURE_OPENAI_ENDPOINT,
        apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2023-12-01-preview',
      };
      this.providers.set('azure-openai', new AzureOpenAIProvider(config));
    }
  }

  async call(
    prompt: string,
    config: Partial<LLMConfig>,
    systemPrompt?: string
  ): Promise<LLMResponse> {
    const provider = config.provider || (process.env.DEFAULT_PROVIDER as LLMProvider) || 'openai';
    const model = config.model || this.getDefaultModel(provider);
    
    // Phase 10A: Initialize execution metadata
    this.lastExecutionMetadata = {
      providerPrimary: provider,
      providerFinal: null,
      modelPrimary: model,
      modelFinal: null,
      fallbackOccurred: false,
      attemptCount: 1
    };
    
    const llmProvider = this.providers.get(provider);

    if (!llmProvider) {
      return {
        success: false,
        error: `Provider ${provider} is not configured or available`,
        model: config.model || 'unknown',
        provider,
      };
    }

    const fullConfig: LLMConfig = {
      provider,
      model: config.model || this.getDefaultModel(provider),
      apiKey: this.getApiKey(provider),
      temperature: config.temperature ?? parseFloat(process.env.DEFAULT_TEMPERATURE || '0.7'),
      maxTokens: config.maxTokens ?? parseInt(process.env.DEFAULT_MAX_TOKENS || '2000'),
      topP: config.topP,
      frequencyPenalty: config.frequencyPenalty,
      presencePenalty: config.presencePenalty,
      responseFormat: config.responseFormat,
      endpoint: provider === 'azure-openai' ? process.env.AZURE_OPENAI_ENDPOINT : undefined,
      apiVersion: provider === 'azure-openai' ? process.env.AZURE_OPENAI_API_VERSION : undefined,
    };

    const specificProvider = this.createProvider(provider, fullConfig);
    const response = await specificProvider.call(prompt, systemPrompt);
    
    // Phase 10A: Update execution metadata with final values
    if (this.lastExecutionMetadata) {
      this.lastExecutionMetadata.providerFinal = response.success ? provider : 'none';
      this.lastExecutionMetadata.modelFinal = response.success ? fullConfig.model : null;
    }
    
    return response;
  }

  private createProvider(provider: LLMProvider, config: LLMConfig): BaseLLMProvider {
    switch (provider) {
      case 'openai':
        return new OpenAIProvider(config);
      case 'anthropic':
        return new AnthropicProvider(config);
      case 'azure-openai':
        return new AzureOpenAIProvider(config);
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  private getDefaultModel(provider: LLMProvider): string {
    switch (provider) {
      case 'openai':
        return process.env.DEFAULT_MODEL || 'gpt-4-turbo-preview';
      case 'anthropic':
        return 'claude-3-sonnet-20240229';
      case 'azure-openai':
        return process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4';
      default:
        return 'gpt-4-turbo-preview';
    }
  }

  private getApiKey(provider: LLMProvider): string {
    switch (provider) {
      case 'openai':
        return process.env.OPENAI_API_KEY || '';
      case 'anthropic':
        return process.env.ANTHROPIC_API_KEY || '';
      case 'azure-openai':
        return process.env.AZURE_OPENAI_API_KEY || '';
      default:
        return '';
    }
  }

  isProviderAvailable(provider: LLMProvider): boolean {
    return this.providers.has(provider);
  }

  getAvailableProviders(): LLMProvider[] {
    return Array.from(this.providers.keys());
  }
  
  // Phase 10A: Get last execution metadata
  getLastExecutionMetadata() {
    return this.lastExecutionMetadata;
  }
}

export const llmOrchestrator = new LLMOrchestrator();