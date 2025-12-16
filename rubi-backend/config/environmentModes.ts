export interface EnvironmentMode {
  name: string;
  description: string;
  config: {
    moodleUrl: string;
    moodleApiToken: string;
    identityJwtSecret: string;
    extensionAuthToken: string;
    providers: {
      openai?: { apiKey: string; enabled: boolean };
      anthropic?: { apiKey: string; enabled: boolean };
      google?: { apiKey: string; enabled: boolean };
    };
    features: {
      identityValidation: boolean;
      orgConfigCache: boolean;
      providerFallback: boolean;
      debugMetadata: boolean;
    };
    cache: {
      enabled: boolean;
      redisUrl?: string;
    };
  };
}

export const ENVIRONMENT_MODES: Record<string, EnvironmentMode> = {
  local: {
    name: 'Local Development',
    description: 'Local development environment with mock data and debugging',
    config: {
      moodleUrl: 'http://localhost:8080',
      moodleApiToken: 'local-dev-token',
      identityJwtSecret: 'local-jwt-secret',
      extensionAuthToken: 'local-extension-token',
      providers: {
        openai: { apiKey: 'TOKEN_GOES_HERE', enabled: true },
        anthropic: { apiKey: 'TOKEN_GOES_HERE', enabled: false },
        google: { apiKey: 'TOKEN_GOES_HERE', enabled: false }
      },
      features: {
        identityValidation: false,
        orgConfigCache: false,
        providerFallback: true,
        debugMetadata: true
      },
      cache: {
        enabled: false
      }
    }
  },
  
  staging: {
    name: 'Staging',
    description: 'Staging environment for testing before production',
    config: {
      moodleUrl: 'https://staging-moodle.rubi.ai',
      moodleApiToken: 'TOKEN_GOES_HERE',
      identityJwtSecret: 'TOKEN_GOES_HERE',
      extensionAuthToken: 'TOKEN_GOES_HERE',
      providers: {
        openai: { apiKey: 'TOKEN_GOES_HERE', enabled: true },
        anthropic: { apiKey: 'TOKEN_GOES_HERE', enabled: true },
        google: { apiKey: 'TOKEN_GOES_HERE', enabled: false }
      },
      features: {
        identityValidation: true,
        orgConfigCache: true,
        providerFallback: true,
        debugMetadata: true
      },
      cache: {
        enabled: true,
        redisUrl: 'redis://staging-redis:6379'
      }
    }
  },
  
  production: {
    name: 'Production',
    description: 'Production environment with full security and caching',
    config: {
      moodleUrl: 'https://moodle.rubi.ai',
      moodleApiToken: 'TOKEN_GOES_HERE',
      identityJwtSecret: 'TOKEN_GOES_HERE',
      extensionAuthToken: 'TOKEN_GOES_HERE',
      providers: {
        openai: { apiKey: 'TOKEN_GOES_HERE', enabled: true },
        anthropic: { apiKey: 'TOKEN_GOES_HERE', enabled: true },
        google: { apiKey: 'TOKEN_GOES_HERE', enabled: true }
      },
      features: {
        identityValidation: true,
        orgConfigCache: true,
        providerFallback: true,
        debugMetadata: false
      },
      cache: {
        enabled: true,
        redisUrl: 'redis://prod-redis:6379'
      }
    }
  },
  
  offline: {
    name: 'Forced Offline',
    description: 'Offline mode for testing without external dependencies',
    config: {
      moodleUrl: '',
      moodleApiToken: '',
      identityJwtSecret: 'offline-jwt-secret',
      extensionAuthToken: 'offline-token',
      providers: {},
      features: {
        identityValidation: false,
        orgConfigCache: false,
        providerFallback: false,
        debugMetadata: true
      },
      cache: {
        enabled: false
      }
    }
  }
};

export class EnvironmentManager {
  private currentMode: string;
  private overrides: Partial<EnvironmentMode['config']>;

  constructor(mode: string = 'local') {
    this.currentMode = mode;
    this.overrides = {};
    this.loadFromEnv();
  }

  private loadFromEnv(): void {
    if (process.env.NODE_ENV) {
      const envMode = process.env.NODE_ENV.toLowerCase();
      if (ENVIRONMENT_MODES[envMode]) {
        this.currentMode = envMode;
      }
    }
    
    if (process.env.FORCE_OFFLINE === 'true') {
      this.currentMode = 'offline';
    }
  }

  getCurrentMode(): string {
    return this.currentMode;
  }

  getConfig(): EnvironmentMode['config'] {
    const baseConfig = ENVIRONMENT_MODES[this.currentMode]?.config;
    if (!baseConfig) {
      throw new Error(`Invalid environment mode: ${this.currentMode}`);
    }
    
    return {
      ...baseConfig,
      ...this.overrides,
      moodleUrl: process.env.MOODLE_BASE_URL || baseConfig.moodleUrl,
      moodleApiToken: process.env.MOODLE_API_TOKEN || baseConfig.moodleApiToken,
      identityJwtSecret: process.env.IDENTITY_JWT_SECRET || baseConfig.identityJwtSecret,
      extensionAuthToken: process.env.EXTENSION_AUTH_TOKEN || baseConfig.extensionAuthToken,
      providers: {
        openai: {
          apiKey: process.env.OPENAI_API_KEY || baseConfig.providers.openai?.apiKey || '',
          enabled: baseConfig.providers.openai?.enabled || false
        },
        anthropic: {
          apiKey: process.env.ANTHROPIC_API_KEY || baseConfig.providers.anthropic?.apiKey || '',
          enabled: baseConfig.providers.anthropic?.enabled || false
        },
        google: {
          apiKey: process.env.GOOGLE_API_KEY || baseConfig.providers.google?.apiKey || '',
          enabled: baseConfig.providers.google?.enabled || false
        }
      }
    };
  }

  setMode(mode: string): void {
    if (!ENVIRONMENT_MODES[mode]) {
      throw new Error(`Invalid environment mode: ${mode}`);
    }
    this.currentMode = mode;
  }

  setOverride(key: keyof EnvironmentMode['config'], value: any): void {
    this.overrides[key] = value;
  }

  clearOverrides(): void {
    this.overrides = {};
  }

  isOffline(): boolean {
    return this.currentMode === 'offline';
  }

  isProduction(): boolean {
    return this.currentMode === 'production';
  }

  isDevelopment(): boolean {
    return this.currentMode === 'local';
  }
}