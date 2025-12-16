export interface ModelConfiguration {
  provider: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  topK?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stopSequences?: string[];
  timeoutMs?: number;
}

export interface ActionModelConfig {
  primaryProvider: ModelConfiguration;
  fallbackProviders: ModelConfiguration[];
  retryPolicy: {
    maxRetries: number;
    retryDelay: number;
    backoffMultiplier: number;
  };
  validationPolicy: {
    strictMode: boolean;
    maxCorrectionAttempts: number;
    fallbackOnFailure: boolean;
  };
}

export class ModelConfigManager {
  private configs: Map<string, ActionModelConfig> = new Map();

  constructor() {
    this.initializeDefaultConfigs();
  }

  private initializeDefaultConfigs(): void {
    // LinkedIn Profile Summary - Anthropic optimized for nuanced understanding
    this.configs.set('summarize_linkedin_profile', {
      primaryProvider: {
        provider: 'anthropic',
        model: 'claude-3-sonnet-20240229',
        temperature: 0.7,
        maxTokens: 2000,
        topP: 0.95,
        timeoutMs: 30000,
      },
      fallbackProviders: [
        {
          provider: 'openai',
          model: 'gpt-4-turbo-preview',
          temperature: 0.7,
          maxTokens: 2000,
          topP: 0.95,
          timeoutMs: 30000,
        },
        {
          provider: 'google',
          model: 'gemini-2.0-pro',
          temperature: 0.7,
          maxTokens: 2000,
          topP: 0.95,
          topK: 40,
          timeoutMs: 30000,
        },
      ],
      retryPolicy: {
        maxRetries: 2,
        retryDelay: 1000,
        backoffMultiplier: 2,
      },
      validationPolicy: {
        strictMode: true,
        maxCorrectionAttempts: 2,
        fallbackOnFailure: true,
      },
    });

    // Salesforce Opportunity Risk - OpenAI for structured analysis
    this.configs.set('analyze_opportunity_risk', {
      primaryProvider: {
        provider: 'openai',
        model: 'gpt-4-turbo-preview',
        temperature: 0.5,
        maxTokens: 2500,
        topP: 0.9,
        frequencyPenalty: 0.3,
        timeoutMs: 35000,
      },
      fallbackProviders: [
        {
          provider: 'anthropic',
          model: 'claude-3-sonnet-20240229',
          temperature: 0.5,
          maxTokens: 2500,
          topP: 0.9,
          timeoutMs: 35000,
        },
        {
          provider: 'google',
          model: 'gemini-2.0-pro',
          temperature: 0.5,
          maxTokens: 2500,
          topP: 0.9,
          topK: 30,
          timeoutMs: 35000,
        },
      ],
      retryPolicy: {
        maxRetries: 3,
        retryDelay: 1500,
        backoffMultiplier: 1.5,
      },
      validationPolicy: {
        strictMode: true,
        maxCorrectionAttempts: 2,
        fallbackOnFailure: true,
      },
    });

    // Email Analysis - Gemini for fast processing
    this.configs.set('analyze_email_message', {
      primaryProvider: {
        provider: 'google',
        model: 'gemini-2.0-pro',
        temperature: 0.6,
        maxTokens: 2000,
        topP: 0.92,
        topK: 40,
        timeoutMs: 25000,
      },
      fallbackProviders: [
        {
          provider: 'openai',
          model: 'gpt-4-turbo-preview',
          temperature: 0.6,
          maxTokens: 2000,
          topP: 0.92,
          timeoutMs: 25000,
        },
        {
          provider: 'anthropic',
          model: 'claude-3-sonnet-20240229',
          temperature: 0.6,
          maxTokens: 2000,
          topP: 0.92,
          timeoutMs: 25000,
        },
      ],
      retryPolicy: {
        maxRetries: 2,
        retryDelay: 1000,
        backoffMultiplier: 2,
      },
      validationPolicy: {
        strictMode: true,
        maxCorrectionAttempts: 1,
        fallbackOnFailure: true,
      },
    });

    // Dashboard Insights - OpenAI for comprehensive analysis
    this.configs.set('get_dashboard_insights', {
      primaryProvider: {
        provider: 'openai',
        model: 'gpt-4-turbo-preview',
        temperature: 0.7,
        maxTokens: 2200,
        topP: 0.9,
        presencePenalty: 0.1,
        timeoutMs: 30000,
      },
      fallbackProviders: [
        {
          provider: 'google',
          model: 'gemini-2.0-pro',
          temperature: 0.7,
          maxTokens: 2200,
          topP: 0.9,
          topK: 40,
          timeoutMs: 30000,
        },
        {
          provider: 'anthropic',
          model: 'claude-3-sonnet-20240229',
          temperature: 0.7,
          maxTokens: 2200,
          topP: 0.9,
          timeoutMs: 30000,
        },
      ],
      retryPolicy: {
        maxRetries: 2,
        retryDelay: 1000,
        backoffMultiplier: 2,
      },
      validationPolicy: {
        strictMode: false,
        maxCorrectionAttempts: 2,
        fallbackOnFailure: true,
      },
    });

    // Raw Context Summary - Anthropic for understanding unstructured data
    this.configs.set('summarize_raw_context', {
      primaryProvider: {
        provider: 'anthropic',
        model: 'claude-3-sonnet-20240229',
        temperature: 0.5,
        maxTokens: 1500,
        topP: 0.9,
        timeoutMs: 25000,
      },
      fallbackProviders: [
        {
          provider: 'openai',
          model: 'gpt-4-turbo-preview',
          temperature: 0.5,
          maxTokens: 1500,
          topP: 0.9,
          timeoutMs: 25000,
        },
        {
          provider: 'google',
          model: 'gemini-2.0-pro',
          temperature: 0.5,
          maxTokens: 1500,
          topP: 0.9,
          topK: 35,
          timeoutMs: 25000,
        },
      ],
      retryPolicy: {
        maxRetries: 2,
        retryDelay: 1000,
        backoffMultiplier: 2,
      },
      validationPolicy: {
        strictMode: false,
        maxCorrectionAttempts: 1,
        fallbackOnFailure: true,
      },
    });

    // Entity Extraction - OpenAI for precise extraction
    this.configs.set('extract_key_entities', {
      primaryProvider: {
        provider: 'openai',
        model: 'gpt-4-turbo-preview',
        temperature: 0.3,
        maxTokens: 1800,
        topP: 0.85,
        frequencyPenalty: 0.2,
        timeoutMs: 25000,
      },
      fallbackProviders: [
        {
          provider: 'anthropic',
          model: 'claude-3-sonnet-20240229',
          temperature: 0.3,
          maxTokens: 1800,
          topP: 0.85,
          timeoutMs: 25000,
        },
        {
          provider: 'google',
          model: 'gemini-2.0-pro',
          temperature: 0.3,
          maxTokens: 1800,
          topP: 0.85,
          topK: 20,
          timeoutMs: 25000,
        },
      ],
      retryPolicy: {
        maxRetries: 2,
        retryDelay: 1000,
        backoffMultiplier: 2,
      },
      validationPolicy: {
        strictMode: true,
        maxCorrectionAttempts: 2,
        fallbackOnFailure: true,
      },
    });

    // Engagement Recommendations - Anthropic for creative suggestions
    this.configs.set('generate_engagement_recommendations', {
      primaryProvider: {
        provider: 'anthropic',
        model: 'claude-3-sonnet-20240229',
        temperature: 0.8,
        maxTokens: 2000,
        topP: 0.95,
        timeoutMs: 30000,
      },
      fallbackProviders: [
        {
          provider: 'google',
          model: 'gemini-2.0-pro',
          temperature: 0.8,
          maxTokens: 2000,
          topP: 0.95,
          topK: 50,
          timeoutMs: 30000,
        },
        {
          provider: 'openai',
          model: 'gpt-4-turbo-preview',
          temperature: 0.8,
          maxTokens: 2000,
          topP: 0.95,
          frequencyPenalty: 0.5,
          presencePenalty: 0.3,
          timeoutMs: 30000,
        },
      ],
      retryPolicy: {
        maxRetries: 2,
        retryDelay: 1000,
        backoffMultiplier: 2,
      },
      validationPolicy: {
        strictMode: false,
        maxCorrectionAttempts: 1,
        fallbackOnFailure: true,
      },
    });

    // Sales Email Coaching - Gemini for quick iterations
    this.configs.set('coach_sales_email', {
      primaryProvider: {
        provider: 'google',
        model: 'gemini-2.0-pro',
        temperature: 0.7,
        maxTokens: 2300,
        topP: 0.92,
        topK: 40,
        timeoutMs: 30000,
      },
      fallbackProviders: [
        {
          provider: 'openai',
          model: 'gpt-4-turbo-preview',
          temperature: 0.7,
          maxTokens: 2300,
          topP: 0.92,
          presencePenalty: 0.2,
          timeoutMs: 30000,
        },
        {
          provider: 'anthropic',
          model: 'claude-3-sonnet-20240229',
          temperature: 0.7,
          maxTokens: 2300,
          topP: 0.92,
          timeoutMs: 30000,
        },
      ],
      retryPolicy: {
        maxRetries: 2,
        retryDelay: 1000,
        backoffMultiplier: 2,
      },
      validationPolicy: {
        strictMode: false,
        maxCorrectionAttempts: 1,
        fallbackOnFailure: true,
      },
    });

    // Historical Interactions - Anthropic for pattern recognition
    this.configs.set('analyze_historical_interactions', {
      primaryProvider: {
        provider: 'anthropic',
        model: 'claude-3-sonnet-20240229',
        temperature: 0.6,
        maxTokens: 2000,
        topP: 0.9,
        timeoutMs: 30000,
      },
      fallbackProviders: [
        {
          provider: 'openai',
          model: 'gpt-4-turbo-preview',
          temperature: 0.6,
          maxTokens: 2000,
          topP: 0.9,
          frequencyPenalty: 0.2,
          timeoutMs: 30000,
        },
        {
          provider: 'google',
          model: 'gemini-2.0-pro',
          temperature: 0.6,
          maxTokens: 2000,
          topP: 0.9,
          topK: 35,
          timeoutMs: 30000,
        },
      ],
      retryPolicy: {
        maxRetries: 2,
        retryDelay: 1000,
        backoffMultiplier: 2,
      },
      validationPolicy: {
        strictMode: false,
        maxCorrectionAttempts: 1,
        fallbackOnFailure: true,
      },
    });
  }

  getConfig(actionId: string): ActionModelConfig | null {
    return this.configs.get(actionId) || null;
  }

  updateConfig(actionId: string, config: ActionModelConfig): void {
    this.configs.set(actionId, config);
  }

  getOptimalProvider(actionId: string, availableProviders: string[]): ModelConfiguration | null {
    const config = this.configs.get(actionId);
    if (!config) return null;

    // Check if primary provider is available
    if (availableProviders.includes(config.primaryProvider.provider)) {
      return config.primaryProvider;
    }

    // Check fallback providers
    for (const fallback of config.fallbackProviders) {
      if (availableProviders.includes(fallback.provider)) {
        return fallback;
      }
    }

    return null;
  }

  getAllConfigs(): Map<string, ActionModelConfig> {
    return new Map(this.configs);
  }

  exportConfig(): string {
    const config: Record<string, ActionModelConfig> = {};
    this.configs.forEach((value, key) => {
      config[key] = value;
    });
    return JSON.stringify(config, null, 2);
  }

  importConfig(jsonConfig: string): void {
    try {
      const config = JSON.parse(jsonConfig);
      for (const [key, value] of Object.entries(config)) {
        this.configs.set(key, value as ActionModelConfig);
      }
    } catch (error) {
      throw new Error(`Failed to import config: ${error}`);
    }
  }

  validateConfig(config: ActionModelConfig): boolean {
    // Validate primary provider
    if (!config.primaryProvider || !config.primaryProvider.provider || !config.primaryProvider.model) {
      return false;
    }

    // Validate temperature ranges
    if (config.primaryProvider.temperature !== undefined) {
      if (config.primaryProvider.temperature < 0 || config.primaryProvider.temperature > 2) {
        return false;
      }
    }

    // Validate maxTokens
    if (config.primaryProvider.maxTokens !== undefined) {
      if (config.primaryProvider.maxTokens < 1 || config.primaryProvider.maxTokens > 100000) {
        return false;
      }
    }

    // Validate retry policy
    if (config.retryPolicy) {
      if (config.retryPolicy.maxRetries < 0 || config.retryPolicy.maxRetries > 10) {
        return false;
      }
      if (config.retryPolicy.retryDelay < 0 || config.retryPolicy.retryDelay > 60000) {
        return false;
      }
    }

    return true;
  }

  getProviderStats(): Record<string, { primary: number; fallback: number }> {
    const stats: Record<string, { primary: number; fallback: number }> = {};

    this.configs.forEach(config => {
      const provider = config.primaryProvider.provider;
      if (!stats[provider]) {
        stats[provider] = { primary: 0, fallback: 0 };
      }
      stats[provider].primary++;

      config.fallbackProviders.forEach(fallback => {
        if (!stats[fallback.provider]) {
          stats[fallback.provider] = { primary: 0, fallback: 0 };
        }
        stats[fallback.provider].fallback++;
      });
    });

    return stats;
  }
}

export const modelConfigManager = new ModelConfigManager();