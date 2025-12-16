import { LLMConfig, LLMProvider, LLMResponse, PromptTemplate } from '../types';
import { OpenAIProvider } from './openai.provider';
import { AnthropicProvider } from './anthropic.provider';
import { AzureOpenAIProvider } from './azure-openai.provider';
import { GoogleGeminiProvider } from './google.provider';
import { BaseLLMProvider } from './base.provider';
import { logger } from '../logging/logger';

interface ProviderConfig {
  provider: LLMProvider | 'google';
  model: string;
  priority?: number;
}

interface FallbackConfig {
  maxRetries: number;
  retryDelay: number;
  fallbackProviders: ProviderConfig[];
}

export class EnhancedLLMOrchestrator {
  private providers: Map<string, any> = new Map();
  private providerConfigs: Map<string, ProviderConfig[]> = new Map();
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
    this.initializeActionConfigs();
  }

  private initializeProviders(): void {
    // OpenAI Provider
    const openaiKey = process.env.OPENAI_API_KEY;
    if (openaiKey) {
      const config: LLMConfig = {
        provider: 'openai',
        model: 'gpt-4-turbo-preview',
        apiKey: openaiKey,
      };
      this.providers.set('openai', new OpenAIProvider(config));
    }

    // Anthropic Provider
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (anthropicKey) {
      const config: LLMConfig = {
        provider: 'anthropic',
        model: 'claude-3-sonnet-20240229',
        apiKey: anthropicKey,
      };
      this.providers.set('anthropic', new AnthropicProvider(config));
    }

    // Azure OpenAI Provider
    const azureKey = process.env.AZURE_OPENAI_API_KEY;
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

    // Google Gemini Provider
    const googleKey = process.env.GOOGLE_API_KEY;
    if (googleKey) {
      this.providers.set('google', new GoogleGeminiProvider(googleKey));
    }
  }

  private initializeActionConfigs(): void {
    // LinkedIn Profile Summary - Anthropic primary
    this.providerConfigs.set('summarize_linkedin_profile', [
      { provider: 'anthropic', model: 'claude-3-sonnet-20240229', priority: 1 },
      { provider: 'openai', model: 'gpt-4-turbo-preview', priority: 2 },
      { provider: 'google', model: 'gemini-2.0-pro', priority: 3 },
    ]);

    // Salesforce Risk Analysis - OpenAI primary
    this.providerConfigs.set('analyze_opportunity_risk', [
      { provider: 'openai', model: 'gpt-4-turbo-preview', priority: 1 },
      { provider: 'anthropic', model: 'claude-3-sonnet-20240229', priority: 2 },
      { provider: 'google', model: 'gemini-2.0-pro', priority: 3 },
    ]);

    // Email Coaching - Gemini primary
    this.providerConfigs.set('coach_sales_email', [
      { provider: 'google', model: 'gemini-2.0-pro', priority: 1 },
      { provider: 'openai', model: 'gpt-4-turbo-preview', priority: 2 },
      { provider: 'anthropic', model: 'claude-3-sonnet-20240229', priority: 3 },
    ]);

    // Email Analysis - Gemini primary
    this.providerConfigs.set('analyze_email_message', [
      { provider: 'google', model: 'gemini-2.0-pro', priority: 1 },
      { provider: 'openai', model: 'gpt-4-turbo-preview', priority: 2 },
      { provider: 'anthropic', model: 'claude-3-sonnet-20240229', priority: 3 },
    ]);

    // Dashboard Insights - OpenAI primary
    this.providerConfigs.set('get_dashboard_insights', [
      { provider: 'openai', model: 'gpt-4-turbo-preview', priority: 1 },
      { provider: 'google', model: 'gemini-2.0-pro', priority: 2 },
      { provider: 'anthropic', model: 'claude-3-sonnet-20240229', priority: 3 },
    ]);

    // Raw Context Summary - Anthropic primary
    this.providerConfigs.set('summarize_raw_context', [
      { provider: 'anthropic', model: 'claude-3-sonnet-20240229', priority: 1 },
      { provider: 'openai', model: 'gpt-4-turbo-preview', priority: 2 },
      { provider: 'google', model: 'gemini-2.0-pro', priority: 3 },
    ]);

    // Entity Extraction - OpenAI primary
    this.providerConfigs.set('extract_key_entities', [
      { provider: 'openai', model: 'gpt-4-turbo-preview', priority: 1 },
      { provider: 'anthropic', model: 'claude-3-sonnet-20240229', priority: 2 },
      { provider: 'google', model: 'gemini-2.0-pro', priority: 3 },
    ]);

    // Engagement Recommendations - Anthropic primary
    this.providerConfigs.set('generate_engagement_recommendations', [
      { provider: 'anthropic', model: 'claude-3-sonnet-20240229', priority: 1 },
      { provider: 'google', model: 'gemini-2.0-pro', priority: 2 },
      { provider: 'openai', model: 'gpt-4-turbo-preview', priority: 3 },
    ]);

    // Historical Analysis - Anthropic primary
    this.providerConfigs.set('analyze_historical_interactions', [
      { provider: 'anthropic', model: 'claude-3-sonnet-20240229', priority: 1 },
      { provider: 'openai', model: 'gpt-4-turbo-preview', priority: 2 },
      { provider: 'google', model: 'gemini-2.0-pro', priority: 3 },
    ]);
  }

  async callWithFallback(
    prompt: string,
    template: PromptTemplate,
    config: Partial<LLMConfig>,
    systemPrompt?: string
  ): Promise<LLMResponse> {
    const actionId = template.id;
    const providerChain = this.getProviderChain(actionId, template);
    
    let lastError: Error | null = null;
    let retryCount = 0;
    const maxRetries = template.metadata?.maxRetries || 2;
    
    // Phase 10A: Reset and initialize metadata
    const primaryProvider = providerChain[0];
    this.lastExecutionMetadata = {
      providerPrimary: primaryProvider?.provider || null,
      providerFinal: null,
      modelPrimary: primaryProvider?.model || null,
      modelFinal: null,
      fallbackOccurred: false,
      attemptCount: 0
    };

    for (const providerConfig of providerChain) {
      const provider = this.providers.get(providerConfig.provider);
      
      if (!provider) {
        logger.warn(`Provider ${providerConfig.provider} not configured, skipping`);
        continue;
      }

      try {
        logger.info(`Attempting ${actionId} with provider ${providerConfig.provider}`, {
          model: providerConfig.model,
          attempt: retryCount + 1,
        });

        const llmConfig: Partial<LLMConfig> = {
          ...config,
          provider: providerConfig.provider as LLMProvider,
          model: providerConfig.model,
          temperature: template.model.temperature ?? config.temperature,
          maxTokens: template.model.maxTokens ?? config.maxTokens,
          topP: template.model.topP ?? config.topP,
          responseFormat: template.outputFormat === 'json' 
            ? { type: 'json_object' } 
            : undefined,
        };

        const response = await this.callProvider(
          provider,
          prompt,
          llmConfig,
          systemPrompt
        );

        if (response.success) {
          // Phase 10A: Update execution metadata
          this.lastExecutionMetadata!.providerFinal = providerConfig.provider;
          this.lastExecutionMetadata!.modelFinal = providerConfig.model;
          this.lastExecutionMetadata!.fallbackOccurred = retryCount > 0;
          this.lastExecutionMetadata!.attemptCount = retryCount + 1;
          
          logger.info(`Successfully completed ${actionId}`, {
            provider: providerConfig.provider,
            model: providerConfig.model,
            tokensUsed: response.usage?.totalTokens,
            duration: response.duration,
            fallbackUsed: retryCount > 0,
          });

          return {
            ...response,
            metadata: {
              ...response.metadata,
              fallbackUsed: retryCount > 0,
              retryCount,
              providerUsed: providerConfig.provider,
            },
          };
        }

        lastError = new Error(response.error || 'Unknown error');
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        logger.error(`Provider ${providerConfig.provider} failed for ${actionId}`, {
          error: lastError.message,
          model: providerConfig.model,
        });
      }

      retryCount++;

      // Add delay between retries
      if (retryCount < providerChain.length) {
        await this.delay(Math.min(1000 * retryCount, 5000));
      }
    }

    // All providers failed, return structured fallback
    // Phase 10A: Update metadata for failure case
    this.lastExecutionMetadata!.providerFinal = 'none';
    this.lastExecutionMetadata!.modelFinal = null;
    this.lastExecutionMetadata!.fallbackOccurred = true;
    this.lastExecutionMetadata!.attemptCount = retryCount;
    
    logger.error(`All providers failed for ${actionId}`, {
      attempts: retryCount,
      lastError: lastError?.message,
    });

    return {
      success: false,
      error: `All providers failed after ${retryCount} attempts: ${lastError?.message}`,
      model: 'unknown',
      provider: 'openai',
      metadata: {
        fallbackUsed: true,
        retryCount,
        allProvidersFailed: true,
      },
    };
  }

  private async callProvider(
    provider: any,
    prompt: string,
    config: Partial<LLMConfig>,
    systemPrompt?: string
  ): Promise<LLMResponse> {
    if (provider instanceof GoogleGeminiProvider) {
      const messages = [];
      if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
      }
      messages.push({ role: 'user', content: prompt });
      
      return await provider.chat(messages, config);
    } else if (provider instanceof BaseLLMProvider) {
      return await provider.call(prompt, systemPrompt);
    } else {
      throw new Error('Invalid provider type');
    }
  }

  private getProviderChain(actionId: string, template: PromptTemplate): ProviderConfig[] {
    // First check if action has specific provider config
    const actionConfig = this.providerConfigs.get(actionId);
    if (actionConfig) {
      return actionConfig
        .filter(config => this.providers.has(config.provider))
        .sort((a, b) => (a.priority || 999) - (b.priority || 999));
    }

    // Otherwise use template fallbacks
    const chain: ProviderConfig[] = [];
    
    // Primary provider from template
    if (template.model.provider && this.providers.has(template.model.provider)) {
      chain.push({
        provider: template.model.provider,
        model: template.model.name,
        priority: 1,
      });
    }

    // Add fallback providers from template
    if (template.model.fallbackProviders) {
      for (const fallback of template.model.fallbackProviders) {
        if (this.providers.has(fallback.provider)) {
          chain.push({
            provider: fallback.provider,
            model: fallback.name,
            priority: chain.length + 1,
          });
        }
      }
    }

    // If no providers configured, use any available
    if (chain.length === 0) {
      const availableProviders = Array.from(this.providers.keys());
      for (const provider of availableProviders) {
        chain.push({
          provider: provider as any,
          model: this.getDefaultModel(provider),
          priority: chain.length + 1,
        });
      }
    }

    return chain;
  }

  private getDefaultModel(provider: string): string {
    switch (provider) {
      case 'openai':
        return 'gpt-4-turbo-preview';
      case 'anthropic':
        return 'claude-3-sonnet-20240229';
      case 'google':
        return 'gemini-2.0-pro';
      case 'azure-openai':
        return process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4';
      default:
        return 'gpt-4-turbo-preview';
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getConfigForAction(actionId: string): ProviderConfig[] {
    return this.providerConfigs.get(actionId) || [];
  }

  isProviderAvailable(provider: string): boolean {
    return this.providers.has(provider);
  }

  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }
  
  // Phase 10A: Get last execution metadata
  getLastExecutionMetadata() {
    return this.lastExecutionMetadata;
  }
}

export const enhancedOrchestrator = new EnhancedLLMOrchestrator();