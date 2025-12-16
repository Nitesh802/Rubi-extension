export interface OrgConfig {
  orgId: string;
  orgName: string;
  planTier: 'free' | 'pilot' | 'enterprise' | 'custom';
  
  allowedActions: string[];
  blockedActions?: string[];
  
  modelPreferences: {
    defaultProvider: 'openai' | 'anthropic' | 'google';
    perAction?: {
      [actionName: string]: {
        provider?: 'openai' | 'anthropic' | 'google';
        model?: string;
      };
    };
  };
  
  toneProfile: {
    id: string;
    style: 'formal' | 'casual' | 'consultative' | 'executive' | 'coach';
    localeOverride?: string;
  };
  
  featureFlags: {
    enableDebugPanel: boolean;
    enableHistory: boolean;
    enableExperimentalActions: boolean;
    enableSalesforceBeta: boolean;
    enableLinkedInDeepDive: boolean;
    enableEmailToneStrictMode: boolean;
  };
  
  limits: {
    maxActionsPerPage?: number;
    maxActionsPerSession?: number;
    maxTokensPerAction?: number;
  };
  
  enabled?: boolean;
  browser_extension_enabled?: boolean;
  max_daily_actions_per_org?: number;
  max_daily_actions_per_user?: number;
  allowed_domains?: string[];
}

export interface OrgConfigWithDefaults extends OrgConfig {
  createdAt: Date;
  updatedAt: Date;
  active: boolean;
}