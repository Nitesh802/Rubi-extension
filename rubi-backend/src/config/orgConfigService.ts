import { OrgConfig, OrgConfigWithDefaults } from '../types/orgConfig';
import { IdentityContext } from '../types/identity';
import { orgConfigPersistence } from './orgConfigPersistence';
import { config } from './index';
import fetch from 'node-fetch';

class OrgConfigService {
  private configs: Map<string, OrgConfig>;
  private defaultConfig: Partial<OrgConfig>;
  private initialized: boolean = false;

  constructor() {
    this.configs = new Map();
    this.defaultConfig = {
      planTier: 'free',
      allowedActions: [
        'summarize_linkedin_profile',
        'analyze_email_message',
        'review_salesforce_opportunity',
        'generate_dashboard_insights'
      ],
      modelPreferences: {
        defaultProvider: 'openai'
      },
      toneProfile: {
        id: 'default',
        style: 'consultative'
      },
      featureFlags: {
        enableDebugPanel: true,
        enableHistory: false,
        enableExperimentalActions: false,
        enableSalesforceBeta: false,
        enableLinkedInDeepDive: false,
        enableEmailToneStrictMode: false
      },
      limits: {
        maxActionsPerPage: 10,
        maxActionsPerSession: 100,
        maxTokensPerAction: 4000
      }
    };

    // Initialize with sample configs for backward compatibility
    this.initializeSampleConfigs();
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      try {
        // Try to load from persistent storage
        await orgConfigPersistence.initialize();
        const persistedConfigs = orgConfigPersistence.getConfigMap();
        
        // If we have persisted configs, use them
        if (persistedConfigs.size > 0) {
          this.configs.clear();
          persistedConfigs.forEach((config, orgId) => {
            // Convert OrgConfigWithDefaults to OrgConfig
            const { createdAt, updatedAt, active, ...orgConfig } = config;
            if (active) {
              this.configs.set(orgId, orgConfig as OrgConfig);
            }
          });
        } else {
          // If no persisted configs, save the sample configs
          for (const [orgId, config] of this.configs) {
            await orgConfigPersistence.createOrg(config);
          }
        }
        
        this.initialized = true;
      } catch (error) {
        console.error('Failed to initialize from persistent storage, using in-memory configs', error);
        // Fall back to in-memory configs
        this.initialized = true;
      }
    }
  }

  /**
   * Phase 9F: Fetch org configuration from Moodle plugin
   * 
   * @param orgId - Organization ID to fetch config for
   * @returns OrgConfig if found and valid, null otherwise
   */
  private async fetchOrgConfigFromMoodle(orgId: string): Promise<OrgConfig | null> {
    // Check if Moodle integration is enabled
    const moodleEnabled = config.get<boolean>('moodle.configEnabled', false);
    const moodleBaseUrl = config.get<string>('moodle.baseUrl');
    const moodleApiToken = config.get<string>('moodle.configApiToken');
    const moodleTimeout = config.get<number>('moodle.configTimeout', 5000);

    if (!moodleEnabled || !moodleBaseUrl) {
      console.debug('[OrgConfigService] Moodle config disabled or not configured');
      return null;
    }

    try {
      const url = `${moodleBaseUrl}/local/rubi_ai_admin/api/config.php?orgid=${encodeURIComponent(orgId)}`;
      
      console.log(`[OrgConfigService] Fetching org config from Moodle for org: ${orgId}`);
      console.debug(`[OrgConfigService] Moodle URL: ${url}`);

      // Prepare headers
      const headers: Record<string, string> = {
        'Accept': 'application/json'
      };

      // Add authentication if configured
      if (moodleApiToken) {
        headers['Authorization'] = `Bearer ${moodleApiToken}`;
        headers['X-API-Token'] = moodleApiToken; // Secondary method
      }

      // Create AbortController for timeout
      const AbortController = require('abort-controller');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), moodleTimeout);

      const response = await fetch(url, {
        method: 'GET',
        headers,
        signal: controller.signal as any
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(`[OrgConfigService] Moodle config fetch failed: HTTP ${response.status}`);
        return null;
      }

      const data = await response.json() as any;

      // Validate response structure
      if (!data || !data.success || !data.data) {
        console.warn('[OrgConfigService] Invalid Moodle config response structure');
        return null;
      }

      const moodleConfig = data.data;

      // Transform Moodle config to OrgConfig format
      const orgConfig: OrgConfig = {
        orgId: moodleConfig.orgid || orgId,
        orgName: moodleConfig.name || `Organization ${orgId}`,
        planTier: moodleConfig.plan_tier || 'free',
        allowedActions: moodleConfig.allowed_actions || this.defaultConfig.allowedActions || [],
        modelPreferences: {
          defaultProvider: moodleConfig.model_preferences?.default || this.defaultConfig.modelPreferences?.defaultProvider || 'openai',
          perAction: moodleConfig.model_preferences?.per_action || {}
        },
        toneProfile: {
          id: moodleConfig.tone_profile?.id || 'default',
          style: moodleConfig.tone_profile?.style || this.defaultConfig.toneProfile?.style || 'consultative',
          localeOverride: moodleConfig.tone_profile?.locale
        },
        featureFlags: moodleConfig.feature_flags || this.defaultConfig.featureFlags || {},
        limits: {
          maxActionsPerPage: moodleConfig.limits?.actions_per_page || this.defaultConfig.limits?.maxActionsPerPage || 10,
          maxActionsPerSession: moodleConfig.limits?.actions_per_session || this.defaultConfig.limits?.maxActionsPerSession || 100,
          maxTokensPerAction: moodleConfig.limits?.tokens || this.defaultConfig.limits?.maxTokensPerAction || 4000
        },
        enabled: moodleConfig.enabled !== false,
        browser_extension_enabled: moodleConfig.browser_extension_enabled !== false,
        max_daily_actions_per_org: moodleConfig.max_daily_actions_per_org || undefined,
        max_daily_actions_per_user: moodleConfig.max_daily_actions_per_user || undefined,
        allowed_domains: moodleConfig.allowed_domains || undefined
      };

      // Add optional fields if present
      if (moodleConfig.blocked_actions) {
        orgConfig.blockedActions = moodleConfig.blocked_actions;
      }

      console.log(`[OrgConfigService] Using Moodle config for org ${orgId}`);
      console.debug('[OrgConfigService] Moodle config:', {
        orgName: orgConfig.orgName,
        planTier: orgConfig.planTier,
        allowedActions: orgConfig.allowedActions.length,
        featureFlags: Object.keys(orgConfig.featureFlags).filter(k => orgConfig.featureFlags[k])
      });

      return orgConfig;

    } catch (error) {
      if (error.name === 'AbortError') {
        console.warn(`[OrgConfigService] Moodle config fetch timeout for org ${orgId}`);
      } else {
        console.warn(`[OrgConfigService] Moodle config fetch error for org ${orgId}:`, error.message);
      }
      return null;
    }
  }

  private initializeSampleConfigs(): void {
    this.configs.set('techcorp', {
      orgId: 'techcorp',
      orgName: 'TechCorp Industries',
      planTier: 'enterprise',
      allowedActions: [
        'summarize_linkedin_profile',
        'analyze_email_message',
        'review_salesforce_opportunity',
        'generate_dashboard_insights',
        'deep_linkedin_analysis',
        'email_tone_coaching',
        'opportunity_risk_assessment'
      ],
      modelPreferences: {
        defaultProvider: 'anthropic',
        perAction: {
          'summarize_linkedin_profile': {
            provider: 'openai',
            model: 'gpt-4-turbo-preview'
          },
          'opportunity_risk_assessment': {
            provider: 'anthropic',
            model: 'claude-3-opus-20240229'
          }
        }
      },
      toneProfile: {
        id: 'tech-enterprise',
        style: 'executive',
        localeOverride: 'en-US'
      },
      featureFlags: {
        enableDebugPanel: true,
        enableHistory: true,
        enableExperimentalActions: true,
        enableSalesforceBeta: true,
        enableLinkedInDeepDive: true,
        enableEmailToneStrictMode: true
      },
      limits: {
        maxActionsPerPage: 50,
        maxActionsPerSession: 500,
        maxTokensPerAction: 8000
      }
    });

    this.configs.set('pilot-startup', {
      orgId: 'pilot-startup',
      orgName: 'Pilot Startup Inc',
      planTier: 'pilot',
      allowedActions: [
        'summarize_linkedin_profile',
        'analyze_email_message',
        'review_salesforce_opportunity',
        'generate_dashboard_insights',
        'email_tone_coaching'
      ],
      modelPreferences: {
        defaultProvider: 'openai',
        perAction: {}
      },
      toneProfile: {
        id: 'startup-casual',
        style: 'casual',
        localeOverride: 'en-US'
      },
      featureFlags: {
        enableDebugPanel: true,
        enableHistory: true,
        enableExperimentalActions: false,
        enableSalesforceBeta: true,
        enableLinkedInDeepDive: false,
        enableEmailToneStrictMode: false
      },
      limits: {
        maxActionsPerPage: 20,
        maxActionsPerSession: 200,
        maxTokensPerAction: 4000
      }
    });
  }

  async getOrgConfig(orgId: string): Promise<{ config: OrgConfig | null; source: 'moodle' | 'json' | 'default' | 'none' }> {
    await this.ensureInitialized();

    if (!orgId) {
      console.warn('OrgConfigService: No orgId provided');
      return { config: null, source: 'none' };
    }

    // Phase 9F: Try Moodle first if enabled
    const moodleEnabled = config.get<boolean>('moodle.configEnabled', false);
    if (moodleEnabled) {
      const moodleConfig = await this.fetchOrgConfigFromMoodle(orgId);
      if (moodleConfig) {
        // Cache the Moodle config in memory for performance
        this.configs.set(orgId, moodleConfig);
        return { config: moodleConfig, source: 'moodle' };
      }
      console.log(`[OrgConfigService] Moodle config unavailable for org ${orgId}, falling back to JSON`);
    }

    // Try persistent storage (JSON file)
    try {
      const persistedConfig = await orgConfigPersistence.getOrgById(orgId);
      if (persistedConfig) {
        const { createdAt, updatedAt, active, ...orgConfig } = persistedConfig;
        console.log(`OrgConfigService: Found config for org ${orgId} from persistent storage`);
        return { config: orgConfig as OrgConfig, source: 'json' };
      }
    } catch (error) {
      console.error('Failed to get org config from persistence', error);
    }

    // Fall back to in-memory configs
    const memoryConfig = this.configs.get(orgId);
    if (memoryConfig) {
      console.log(`OrgConfigService: Found config for org ${orgId} from in-memory storage`);
      return { config: memoryConfig, source: 'json' };
    }

    console.log(`OrgConfigService: No config found for org ${orgId}, using defaults`);
    return { config: null, source: 'none' };
  }

  async getEffectiveOrgConfig(identityContext: IdentityContext | null): Promise<{ config: OrgConfig | null; source: 'moodle' | 'json' | 'default' | 'none' }> {
    if (!identityContext?.orgId) {
      console.log('OrgConfigService: No identity context or orgId, returning null');
      return { config: null, source: 'none' };
    }

    return this.getOrgConfig(identityContext.orgId);
  }

  validateOrgConfig(config: any): boolean {
    if (!config) return false;
    
    const requiredFields = ['orgId', 'orgName', 'planTier', 'allowedActions', 'modelPreferences', 'toneProfile', 'featureFlags'];
    for (const field of requiredFields) {
      if (!(field in config)) {
        console.error(`OrgConfigService: Missing required field ${field}`);
        return false;
      }
    }

    if (!Array.isArray(config.allowedActions)) {
      console.error('OrgConfigService: allowedActions must be an array');
      return false;
    }

    if (!['free', 'pilot', 'enterprise', 'custom'].includes(config.planTier)) {
      console.error('OrgConfigService: Invalid planTier');
      return false;
    }

    return true;
  }

  async updateOrgConfig(orgId: string, config: OrgConfig): Promise<boolean> {
    await this.ensureInitialized();

    if (!this.validateOrgConfig(config)) {
      console.error('OrgConfigService: Invalid config update');
      return false;
    }

    // Update in persistent storage
    try {
      await orgConfigPersistence.updateOrg(orgId, config);
      // Update in-memory cache
      this.configs.set(orgId, config);
      console.log(`OrgConfigService: Updated config for org ${orgId}`);
      return true;
    } catch (error) {
      console.error('Failed to update org config in persistence', error);
      // Fall back to in-memory update
      this.configs.set(orgId, config);
      return true;
    }
  }

  getDefaultConfig(): Partial<OrgConfig> {
    return { ...this.defaultConfig };
  }

  isActionAllowed(config: OrgConfig | null, actionName: string): boolean {
    if (!config) {
      return this.defaultConfig.allowedActions?.includes(actionName) || false;
    }

    if (config.blockedActions?.includes(actionName)) {
      return false;
    }

    if (config.allowedActions.length > 0) {
      return config.allowedActions.includes(actionName);
    }

    return true;
  }

  getEffectiveModelPreferences(config: OrgConfig | null, actionName?: string): { provider: string; model?: string } {
    const defaultProvider = config?.modelPreferences?.defaultProvider || this.defaultConfig.modelPreferences?.defaultProvider || 'openai';
    
    if (!actionName) {
      return { provider: defaultProvider };
    }

    const actionPreference = config?.modelPreferences?.perAction?.[actionName];
    if (actionPreference) {
      return {
        provider: actionPreference.provider || defaultProvider,
        model: actionPreference.model
      };
    }

    return { provider: defaultProvider };
  }
}

export const orgConfigService = new OrgConfigService();