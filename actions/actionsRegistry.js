/**
 * Rubi Browser Extension - Actions Registry
 *
 * Complete capability registry system for managing Rubi actions.
 * Provides registration, discovery, and filtering of available actions.
 * Includes backend configuration flags for each action.
 */

// Internal registry storage
let actionsRegistry = new Map();

/**
 * Register a new action in the registry
 *
 * @param {string} actionId - Unique identifier for the action
 * @param {Object} config - Action configuration object
 */
function registerAction(actionId, config) {
  console.log(`[Rubi Actions Registry] Registering action: ${actionId}`);
  
  // Validate config
  if (!config.label || !config.handler) {
    console.error(`[Rubi Actions Registry] Invalid config for action ${actionId}`);
    return false;
  }
  
  // Set defaults
  const actionConfig = {
    id: actionId,
    label: config.label,
    description: config.description || '',
    platforms: config.platforms || ['any'],
    pageTypes: config.pageTypes || ['any'],
    handler: config.handler,
    // Backend configuration flags
    useBackend: config.useBackend !== undefined ? config.useBackend : true, // Default to true
    fallbackStrategy: config.fallbackStrategy || 'backend-then-stub' // Options: 'backend-then-stub', 'backend-only', 'stub-only'
  };
  
  actionsRegistry.set(actionId, actionConfig);
  console.log(`[Rubi Actions Registry] Action ${actionId} registered successfully with backend: ${actionConfig.useBackend}`);
  return true;
}

/**
 * Get a specific action by ID
 *
 * @param {string} actionId - Action identifier
 * @returns {Object|null} Action configuration or null if not found
 */
function getAction(actionId) {
  const action = actionsRegistry.get(actionId);
  if (!action) {
    console.warn(`[Rubi Actions Registry] Action ${actionId} not found`);
    return null;
  }
  return action;
}

/**
 * Get actions that are applicable for given context payload
 *
 * @param {Object} contextPayload - Context payload to filter against
 * @returns {Array} Array of matching actions
 */
function getActionsForContext(contextPayload) {
  console.log(`[Rubi Actions Registry] Finding actions for context`);
  
  if (!contextPayload) {
    console.warn(`[Rubi Actions Registry] No context payload provided`);
    return [];
  }
  
  const platform = contextPayload.platform || 'unknown';
  const pageType = contextPayload.pageType || 'unknown';
  
  const matchingActions = [];
  
  for (const [actionId, action] of actionsRegistry) {
    // Check platform match
    const platformMatch = action.platforms.includes('any') || 
                         action.platforms.includes(platform);
    
    // Check page type match
    const pageTypeMatch = action.pageTypes.includes('any') || 
                         action.pageTypes.includes(pageType);
    
    if (platformMatch && pageTypeMatch) {
      matchingActions.push(action);
    }
  }
  
  console.log(`[Rubi Actions Registry] Found ${matchingActions.length} matching actions for ${platform}/${pageType}`);
  return matchingActions;
}

/**
 * List all registered actions
 *
 * @returns {Array} Array of all registered actions
 */
function listAllActions() {
  console.log(`[Rubi Actions Registry] Listing all actions (${actionsRegistry.size} total)`);
  return Array.from(actionsRegistry.values());
}

/**
 * Initialize the registry with starter actions
 * 
 * Configuration notes:
 * - useBackend: true for main experiences, false for experimental/secondary actions
 * - fallbackStrategy: 'backend-then-stub' for graceful degradation
 * 
 * To add a new backend-powered action:
 * 1. Set useBackend: true
 * 2. Choose fallbackStrategy: 'backend-then-stub' or 'backend-only'
 * 3. Ensure backend has corresponding action handler
 * 4. Keep stub implementation for fallback/dev usage
 */
function initializeRegistry() {
  console.log(`[Rubi Actions Registry] Initializing with starter actions`);
  
  // 1. Analyze Opportunity Risk - MAIN EXPERIENCE
  registerAction('analyze_opportunity_risk', {
    label: 'Opportunity Risk Snapshot',
    description: 'Analyze risk factors for this Salesforce opportunity',
    platforms: ['salesforce'],
    pageTypes: ['opportunity'],
    useBackend: true, // Use backend for this main experience
    fallbackStrategy: 'backend-then-stub', // Graceful fallback
    handler: (contextPayload) => {
      if (typeof window.RubiActionsStubs !== 'undefined') {
        return window.RubiActionsStubs.stubOpportunityRisk(contextPayload);
      }
      throw new Error('Actions stubs not available');
    }
  });
  
  // 2. Summarize LinkedIn Profile - MAIN EXPERIENCE
  registerAction('summarize_linkedin_profile', {
    label: 'Summarize Profile',
    description: 'Generate a summary of this LinkedIn profile',
    platforms: ['linkedin'],
    pageTypes: ['profile'],
    useBackend: true, // Use backend for this main experience
    fallbackStrategy: 'backend-then-stub', // Graceful fallback
    handler: (contextPayload) => {
      if (typeof window.RubiActionsStubs !== 'undefined') {
        return window.RubiActionsStubs.stubLinkedInSummary(contextPayload);
      }
      throw new Error('Actions stubs not available');
    }
  });
  
  // 3. Summarize Raw Context - SECONDARY
  registerAction('summarize_raw_context', {
    label: 'Summarize This Page',
    description: 'Generate a general summary of the current page',
    platforms: ['any'],
    pageTypes: ['any'],
    useBackend: false, // Keep as stub-only for now (experimental)
    fallbackStrategy: 'stub-only',
    handler: (contextPayload) => {
      if (typeof window.RubiActionsStubs !== 'undefined') {
        return window.RubiActionsStubs.stubGenericSummary(contextPayload);
      }
      throw new Error('Actions stubs not available');
    }
  });
  
  // 4. Analyze Email Message - MAIN EXPERIENCE
  registerAction('analyze_email_message', {
    label: 'Analyze Email',
    description: 'Provide coaching and analysis for email draft',
    platforms: ['gmail', 'outlook'],
    pageTypes: ['compose'],
    useBackend: true, // Use backend for this main experience
    fallbackStrategy: 'backend-then-stub', // Graceful fallback
    handler: (contextPayload) => {
      if (typeof window.RubiActionsStubs !== 'undefined') {
        return window.RubiActionsStubs.stubEmailAnalysis(contextPayload);
      }
      throw new Error('Actions stubs not available');
    }
  });
  
  // 5. Get Dashboard Insights - MAIN EXPERIENCE
  registerAction('get_dashboard_insights', {
    label: 'Dashboard Insights',
    description: 'Get overview and recommendations for dashboard',
    platforms: ['any'],
    pageTypes: ['any'],
    useBackend: true, // Use backend for this main experience
    fallbackStrategy: 'backend-then-stub', // Graceful fallback
    handler: (contextPayload) => {
      if (typeof window.RubiActionsStubs !== 'undefined') {
        return window.RubiActionsStubs.stubDashboardInsights(contextPayload);
      }
      throw new Error('Actions stubs not available');
    }
  });
  
  console.log(`[Rubi Actions Registry] Registry initialized with ${actionsRegistry.size} actions`);
  
  // Log backend configuration summary
  const backendActions = Array.from(actionsRegistry.values()).filter(a => a.useBackend);
  console.log(`[Rubi Actions Registry] ${backendActions.length} actions configured for backend:`, 
    backendActions.map(a => a.id));
}

// Export for use in content scripts
if (typeof window !== 'undefined') {
  window.RubiActionsRegistry = {
    registerAction,
    getAction,
    getActionsForContext,
    listAllActions
  };
  
  // Initialize on load
  initializeRegistry();
}