import * as dotenv from 'dotenv';
import * as path from 'path';

export class Config {
  private static instance: Config;
  private config: Record<string, any> = {};

  private constructor() {
    this.loadEnvironment();
    this.validateConfiguration();
  }

  static getInstance(): Config {
    if (!Config.instance) {
      Config.instance = new Config();
    }
    return Config.instance;
  }

  private loadEnvironment(): void {
    const envPath = path.resolve(process.cwd(), '.env');
    const result = dotenv.config({ path: envPath });

    if (result.error && process.env.NODE_ENV !== 'production') {
      console.warn('Warning: .env file not found, using default configuration');
    }

    this.config = {
      app: {
        name: 'Rubi Backend',
        version: '1.0.0',
        env: process.env.NODE_ENV || 'development',
        port: parseInt(process.env.PORT || '3000'),
        host: process.env.HOST || '0.0.0.0',
      },
      llm: {
        providers: {
          openai: {
            enabled: !!process.env.OPENAI_API_KEY,
            apiKey: process.env.OPENAI_API_KEY,
            defaultModel: process.env.OPENAI_DEFAULT_MODEL || 'gpt-4-turbo-preview',
          },
          anthropic: {
            enabled: !!process.env.ANTHROPIC_API_KEY,
            apiKey: process.env.ANTHROPIC_API_KEY,
            defaultModel: 'claude-3-sonnet-20240229',
          },
          azure: {
            enabled: !!process.env.AZURE_OPENAI_API_KEY,
            apiKey: process.env.AZURE_OPENAI_API_KEY,
            endpoint: process.env.AZURE_OPENAI_ENDPOINT,
            apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2023-12-01-preview',
            deploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
          },
        },
        defaults: {
          provider: process.env.DEFAULT_PROVIDER || 'openai',
          model: process.env.DEFAULT_MODEL || 'gpt-4-turbo-preview',
          temperature: parseFloat(process.env.DEFAULT_TEMPERATURE || '0.7'),
          maxTokens: parseInt(process.env.DEFAULT_MAX_TOKENS || '2000'),
        },
      },
      security: {
        jwt: {
          secret: process.env.JWT_SECRET || 'default-secret-change-in-production',
          expiresIn: process.env.JWT_EXPIRES_IN || '24h',
          // Phase 9A: Extension-specific JWT settings
          issuer: process.env.JWT_ISSUER || 'rubi-backend',
          audience: process.env.JWT_AUDIENCE || 'rubi-extension',
        },
        // Phase 9A: Browser Extension Authentication
        extensionAuth: {
          sharedSecret: process.env.RUBI_EXTENSION_SHARED_SECRET || 'dev-extension-secret',
          tokenTTL: parseInt(process.env.EXTENSION_TOKEN_TTL || '1800000'), // 30 minutes in ms
          devBypassEnabled: process.env.DEV_BYPASS_ENABLED !== 'false', // Default true unless explicitly disabled
          allowedOrigins: (process.env.EXTENSION_ALLOWED_ORIGINS || 'chrome-extension://*,moz-extension://*').split(','),
        },
        session: {
          secret: process.env.SESSION_SECRET || 'default-session-secret',
        },
        cors: {
          origins: (process.env.ALLOWED_ORIGINS || 'http://localhost:3001').split(','),
        },
        rateLimit: {
          windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
          maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
        },
      },
      logging: {
        level: process.env.LOG_LEVEL || 'info',
        dir: process.env.LOG_DIR || './logs',
      },
      paths: {
        prompts: path.join(process.cwd(), 'prompts'),
        schemas: path.join(process.cwd(), 'schemas'),
        logs: path.join(process.cwd(), 'logs'),
      },
      // Phase 9F: Moodle integration
      moodle: {
        baseUrl: process.env.MOODLE_BASE_URL,
        configApiToken: process.env.MOODLE_CONFIG_API_TOKEN,
        configEnabled: process.env.MOODLE_CONFIG_ENABLED === 'true',
        identityJwtSecret: process.env.MOODLE_IDENTITY_JWT_SECRET,
        configTimeout: parseInt(process.env.MOODLE_CONFIG_TIMEOUT || '5000'), // 5 seconds default
      },
    };
  }

  private validateConfiguration(): void {
    const errors: string[] = [];

    if (this.config.security.jwt.secret === 'default-secret-change-in-production' && 
        this.config.app.env === 'production') {
      errors.push('JWT_SECRET must be set in production');
    }

    if (!this.config.llm.providers.openai.enabled && 
        !this.config.llm.providers.anthropic.enabled && 
        !this.config.llm.providers.azure.enabled) {
      errors.push('At least one LLM provider must be configured');
    }

    if (this.config.llm.providers.azure.enabled && !this.config.llm.providers.azure.endpoint) {
      errors.push('AZURE_OPENAI_ENDPOINT is required when using Azure OpenAI');
    }

    if (errors.length > 0) {
      console.error('Configuration validation failed:');
      errors.forEach(error => console.error(`  - ${error}`));
      if (this.config.app.env === 'production') {
        process.exit(1);
      }
    }
  }

  get<T = any>(path: string, defaultValue?: T): T {
    const keys = path.split('.');
    let value = this.config;

    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return defaultValue as T;
      }
    }

    return value as T;
  }

  set(path: string, value: any): void {
    const keys = path.split('.');
    let obj = this.config;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in obj) || typeof obj[key] !== 'object') {
        obj[key] = {};
      }
      obj = obj[key];
    }

    obj[keys[keys.length - 1]] = value;
  }

  getAll(): Record<string, any> {
    return { ...this.config };
  }

  isProduction(): boolean {
    return this.config.app.env === 'production';
  }

  isDevelopment(): boolean {
    return this.config.app.env === 'development';
  }
}

export const config = Config.getInstance();