/**
 * Rubi Browser Extension - Config Bridge
 * 
 * Phase 9D: Org Configuration Management
 * Manages organization configuration fetched from backend
 * Provides reactive updates to UI components
 */

(function() {
  'use strict';

  // Config state management
  const configState = {
    orgConfig: null,
    listeners: new Set(),
    isLoading: false,
    lastError: null,
    fetchedAt: null
  };

  // Default config for fallback
  const DEFAULT_CONFIG = {
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

  /**
   * Initialize the config bridge
   * Attempts to load org config from backend
   */
  async function initialize() {
    console.log('[Config Bridge] Initializing org config management...');
    
    // Check if backend client is available
    if (!window.RubiBackendClient) {
      console.warn('[Config Bridge] Backend client not available, using defaults');
      configState.orgConfig = DEFAULT_CONFIG;
      notifyListeners();
      return;
    }

    // Try to load cached config first
    const cached = await loadCachedConfig();
    if (cached) {
      console.log('[Config Bridge] Loaded cached org config');
      configState.orgConfig = cached;
      configState.fetchedAt = new Date().toISOString();
      notifyListeners();
    }

    // Fetch fresh config from backend
    await fetchOrgConfig();
  }

  /**
   * Load cached config from chrome storage
   */
  async function loadCachedConfig() {
    if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
      return null;
    }

    try {
      const result = await new Promise((resolve) => {
        chrome.storage.local.get(['rubiOrgConfig', 'rubiOrgConfigFetchedAt'], (data) => {
          resolve(data);
        });
      });

      if (result.rubiOrgConfig && result.rubiOrgConfigFetchedAt) {
        const age = Date.now() - new Date(result.rubiOrgConfigFetchedAt).getTime();
        const maxAge = 3600000; // 1 hour
        
        if (age < maxAge) {
          return result.rubiOrgConfig;
        }
      }
    } catch (error) {
      console.warn('[Config Bridge] Failed to load cached config:', error);
    }

    return null;
  }

  /**
   * Fetch org config from backend
   */
  async function fetchOrgConfig(force = false) {
    if (configState.isLoading) {
      console.log('[Config Bridge] Config fetch already in progress');
      return;
    }

    configState.isLoading = true;
    
    try {
      if (!window.RubiBackendClient) {
        throw new Error('Backend client not available');
      }

      console.log('[Config Bridge] Fetching org config from backend...');
      const config = await window.RubiBackendClient.fetchOrgConfig(force);
      
      if (config) {
        console.log('[Config Bridge] Org config fetched successfully:', {
          orgName: config.orgName,
          planTier: config.planTier,
          toneStyle: config.toneProfile?.style
        });
        
        configState.orgConfig = config;
        configState.fetchedAt = new Date().toISOString();
        configState.lastError = null;
        
        // Notify all listeners of the update
        notifyListeners();
      } else {
        console.log('[Config Bridge] No org config available, using defaults');
        configState.orgConfig = DEFAULT_CONFIG;
        notifyListeners();
      }
    } catch (error) {
      console.error('[Config Bridge] Failed to fetch org config:', error);
      configState.lastError = error.message;
      
      // Use default config as fallback
      if (!configState.orgConfig) {
        configState.orgConfig = DEFAULT_CONFIG;
        notifyListeners();
      }
    } finally {
      configState.isLoading = false;
    }
  }

  /**
   * Get current org config
   */
  function getOrgConfig() {
    return configState.orgConfig || DEFAULT_CONFIG;
  }

  /**
   * Check if an action is allowed by org config
   */
  function isActionAllowed(actionName) {
    const config = getOrgConfig();
    
    // Check blocked actions first
    if (config.blockedActions && config.blockedActions.includes(actionName)) {
      console.log(`[Config Bridge] Action ${actionName} is blocked by policy`);
      return false;
    }
    
    // Check allowed actions
    if (config.allowedActions && config.allowedActions.length > 0) {
      const allowed = config.allowedActions.includes(actionName);
      if (!allowed) {
        console.log(`[Config Bridge] Action ${actionName} is not in allowed list`);
      }
      return allowed;
    }
    
    // Default to allow if no restrictions
    return true;
  }

  /**
   * Get feature flag value
   */
  function getFeatureFlag(flagName) {
    const config = getOrgConfig();
    return config.featureFlags?.[flagName] ?? false;
  }

  /**
   * Check if a feature is enabled based on plan tier
   */
  function isPlanFeatureEnabled(feature) {
    const config = getOrgConfig();
    const tier = config.planTier || 'free';
    
    const tierFeatures = {
      enterprise: {
        deepAnalysis: true,
        riskAssessment: true,
        historicalInsights: true,
        advancedCoaching: true,
        customRecommendations: true,
        unlimitedActions: true
      },
      pilot: {
        deepAnalysis: false,
        riskAssessment: true,
        historicalInsights: true,
        advancedCoaching: false,
        customRecommendations: false,
        unlimitedActions: false
      },
      free: {
        deepAnalysis: false,
        riskAssessment: false,
        historicalInsights: false,
        advancedCoaching: false,
        customRecommendations: false,
        unlimitedActions: false
      },
      custom: {
        deepAnalysis: true,
        riskAssessment: true,
        historicalInsights: true,
        advancedCoaching: true,
        customRecommendations: true,
        unlimitedActions: true
      }
    };
    
    return tierFeatures[tier]?.[feature] ?? false;
  }

  /**
   * Get tone profile
   */
  function getToneProfile() {
    const config = getOrgConfig();
    return config.toneProfile || { id: 'default', style: 'consultative' };
  }

  /**
   * Get model preferences for an action
   */
  function getModelPreferences(actionName) {
    const config = getOrgConfig();
    const perAction = config.modelPreferences?.perAction?.[actionName];
    
    if (perAction) {
      return {
        provider: perAction.provider || config.modelPreferences?.defaultProvider || 'openai',
        model: perAction.model
      };
    }
    
    return {
      provider: config.modelPreferences?.defaultProvider || 'openai'
    };
  }

  /**
   * Get limits
   */
  function getLimits() {
    const config = getOrgConfig();
    return config.limits || {
      maxActionsPerPage: 10,
      maxActionsPerSession: 100,
      maxTokensPerAction: 4000
    };
  }

  /**
   * Register a listener for config changes
   */
  function onConfigChange(callback) {
    if (typeof callback === 'function') {
      configState.listeners.add(callback);
      
      // Immediately call with current config
      callback(getOrgConfig());
      
      // Return unsubscribe function
      return () => {
        configState.listeners.delete(callback);
      };
    }
  }

  /**
   * Notify all listeners of config changes
   */
  function notifyListeners() {
    const config = getOrgConfig();
    configState.listeners.forEach(callback => {
      try {
        callback(config);
      } catch (error) {
        console.error('[Config Bridge] Listener error:', error);
      }
    });
  }

  /**
   * Refresh org config
   */
  async function refreshConfig() {
    console.log('[Config Bridge] Refreshing org config...');
    await fetchOrgConfig(true);
  }

  /**
   * Get config state for debugging
   */
  function getConfigState() {
    return {
      hasConfig: !!configState.orgConfig,
      fetchedAt: configState.fetchedAt,
      isLoading: configState.isLoading,
      lastError: configState.lastError,
      listenerCount: configState.listeners.size
    };
  }

  /**
   * Apply org config to drawer options
   * Helper function for drawer initialization
   */
  function applyToDrawerOptions(options = {}) {
    const config = getOrgConfig();
    
    // Apply feature flags
    if (config.featureFlags) {
      options.enableDebugPanel = config.featureFlags.enableDebugPanel;
      options.enableHistory = config.featureFlags.enableHistory;
      options.enableExperimentalActions = config.featureFlags.enableExperimentalActions;
    }
    
    // Apply plan tier features
    options.planTier = config.planTier;
    options.enableDeepAnalysis = isPlanFeatureEnabled('deepAnalysis');
    options.enableRiskAssessment = isPlanFeatureEnabled('riskAssessment');
    options.enableHistoricalInsights = isPlanFeatureEnabled('historicalInsights');
    
    // Apply tone profile
    options.toneProfile = getToneProfile();
    
    // Apply limits
    const limits = getLimits();
    options.maxActionsPerPage = limits.maxActionsPerPage;
    
    return options;
  }

  /**
   * Filter actions based on org config
   */
  function filterAllowedActions(actions) {
    if (!Array.isArray(actions)) {
      return [];
    }
    
    return actions.filter(action => {
      const actionName = typeof action === 'string' ? action : action.name;
      return isActionAllowed(actionName);
    });
  }

  // Initialize on load if backend is available
  if (window.RubiBackendClient) {
    // Wait for backend to initialize first
    setTimeout(() => {
      initialize().catch(error => {
        console.error('[Config Bridge] Initialization failed:', error);
      });
    }, 100);
  }

  // Export the config bridge API
  window.RubiConfigBridge = {
    initialize,
    getOrgConfig,
    isActionAllowed,
    getFeatureFlag,
    isPlanFeatureEnabled,
    getToneProfile,
    getModelPreferences,
    getLimits,
    onConfigChange,
    refreshConfig,
    getConfigState,
    applyToDrawerOptions,
    filterAllowedActions
  };

  console.log('[Config Bridge] Org config management initialized (Phase 9D)');
})();