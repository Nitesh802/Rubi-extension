/**
 * Rubi Browser Extension - Backend Client
 * 
 * Phase 9A: JWT-based authentication with token management
 * Phase 9D: Org config fetching and caching
 * Provides a robust HTTP client for communicating with the Rubi backend API.
 * Handles authentication, token refresh, retries, timeouts, and graceful fallbacks.
 */

// Phase 10B: Configuration with environment support
const BACKEND_CONFIG = {
  // Base URL for the backend API (will be overridden by environment config)
  baseUrl: window.RubiEnvironment?.getBackendUrl() || 'https://ai.fus-ed.com',
  // Moodle URL (will be overridden by environment config)
  moodleUrl: window.RubiEnvironment?.getMoodleUrl() || 'http://localhost:8080',

  // Request timeout in milliseconds
  timeoutMs: 120000, // 2 minutes

  // Phase 10B: Extension authentication token
  extensionAuthToken: window.RubiEnvironment?.getAuthToken() || 'TOKEN_GOES_HERE',

  // Phase 9A: Extension shared secret for handshake authentication
  extensionSharedSecret: '13896cf86cf6162a0bf81571c5de290f69bd4c76d8bef4746f1fa4a50a193b04',

  // Phase 9A: Development fallback settings
  allowDevFallback: true, // Allow fallback to dev mode if auth fails
  devToken: 'DEV_STATIC_TOKEN_REPLACE_ME', // Legacy dev token for backwards compatibility
  
  // Phase 9A: Token refresh settings
  tokenRefreshLeeway: 300000, // Refresh token 5 minutes before expiry (in ms)
  
  // Phase 9B: Rubi session binding settings
  useRubiSessionBinding: false, // Set to true to enable Rubi session binding
  rubiSessionBindingEndpoint: '/api/auth/extension-session/bind',
  
  // Phase 9D: Org config settings
  orgConfigEndpoint: '/api/actions/org-config',
  orgConfigCacheTTL: 3600000, // 1 hour in ms
  
  // Retry configuration
  maxRetries: 2,
  retryDelayMs: 1000
};

// Phase 9C: Authentication state management with identity
const authState = {
  currentToken: null,
  expiresAt: null,
  isFetchingToken: false,
  lastFetchError: null,
  isDevMode: false,
  currentIdentity: null, // PHASE 9C: Store current identity
  currentOrgConfig: null, // PHASE 9D: Store current org config
  orgConfigFetchedAt: null // PHASE 9D: Track when org config was last fetched
};

/**
 * Phase 9A: Initialize backend authentication
 * Attempts to load cached token or perform handshake
 * 
 * @returns {Promise<boolean>} Success status
 */
async function initializeBackendAuth() {
  console.log('[Rubi Backend] Initializing authentication...');
  
  try {
    // Check if we already have a valid token in memory
    if (authState.currentToken && authState.expiresAt) {
      const now = Date.now();
      const expiresAt = new Date(authState.expiresAt).getTime();
      
      if (expiresAt > now + 60000) { // Valid for at least 1 more minute
        console.log('[Rubi Backend] Using existing valid token');
        return true;
      }
    }
    
    // Try to load cached token from chrome.storage
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      try {
        const stored = await new Promise((resolve) => {
          chrome.storage.local.get(['rubiAuthToken', 'rubiAuthExpiry', 'rubiSessionContext', 'rubiOrgConfig', 'rubiOrgConfigFetchedAt'], (result) => {
            resolve(result);
          });
        });
        
        if (stored.rubiAuthToken && stored.rubiAuthExpiry) {
          const now = Date.now();
          const expiresAt = new Date(stored.rubiAuthExpiry).getTime();
          
          if (expiresAt > now + 60000) { // Valid for at least 1 more minute
            authState.currentToken = stored.rubiAuthToken;
            authState.expiresAt = stored.rubiAuthExpiry;
            
            // Phase 9D: Load cached org config if fresh
            if (stored.rubiOrgConfig && stored.rubiOrgConfigFetchedAt) {
              const configAge = now - new Date(stored.rubiOrgConfigFetchedAt).getTime();
              if (configAge < BACKEND_CONFIG.orgConfigCacheTTL) {
                authState.currentOrgConfig = stored.rubiOrgConfig;
                authState.orgConfigFetchedAt = stored.rubiOrgConfigFetchedAt;
                console.log('[Rubi Backend] Loaded cached org config');
              }
            }
            
            console.log('[Rubi Backend] Loaded valid token from cache');
            return true;
          } else {
            console.log('[Rubi Backend] Cached token expired, fetching new token');
          }
        }
      } catch (error) {
        console.warn('[Rubi Backend] Failed to load cached token:', error);
      }
    }
    
    // Fetch new token
    return await fetchExtensionToken();
  } catch (error) {
    console.error('[Rubi Backend] Authentication initialization failed:', error);
    
    // Fall back to dev mode if allowed
    if (BACKEND_CONFIG.allowDevFallback) {
      console.warn('[Rubi Backend] Falling back to development mode');
      authState.isDevMode = true;
      return true;
    }
    
    return false;
  }
}

/**
 * Phase 9D: Fetch org configuration from backend
 * 
 * @param {boolean} force - Force refresh even if cached
 * @returns {Promise<Object|null>} Org config or null
 */
async function fetchOrgConfig(force = false) {
  try {
    // Check cache first if not forcing refresh
    if (!force && authState.currentOrgConfig && authState.orgConfigFetchedAt) {
      const age = Date.now() - new Date(authState.orgConfigFetchedAt).getTime();
      if (age < BACKEND_CONFIG.orgConfigCacheTTL) {
        console.log('[Rubi Backend] Using cached org config');
        return authState.currentOrgConfig;
      }
    }
    
    // Ensure we have authentication
    const hasAuth = await initializeBackendAuth();
    if (!hasAuth && !BACKEND_CONFIG.allowDevFallback) {
      console.warn('[Rubi Backend] Cannot fetch org config without authentication');
      return null;
    }
    
    console.log('[Rubi Backend] Fetching org config from backend...');
    
    const headers = await getAuthHeaders();
    const url = `${BACKEND_CONFIG.baseUrl}${BACKEND_CONFIG.orgConfigEndpoint}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        console.log('[Rubi Backend] No org config found for current org');
        return null;
      }
      throw new Error(`Failed to fetch org config: HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success && data.data) {
      authState.currentOrgConfig = data.data;
      authState.orgConfigFetchedAt = new Date().toISOString();
      
      console.log('[Rubi Backend] Org config fetched successfully:', {
        orgName: data.data.orgName,
        planTier: data.data.planTier,
        toneStyle: data.data.toneProfile?.style,
        featureFlags: Object.keys(data.data.featureFlags || {}).filter(k => data.data.featureFlags[k])
      });
      
      // Cache in chrome.storage
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        try {
          await new Promise((resolve, reject) => {
            chrome.storage.local.set({
              rubiOrgConfig: data.data,
              rubiOrgConfigFetchedAt: authState.orgConfigFetchedAt
            }, () => {
              if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
              } else {
                resolve();
              }
            });
          });
          console.log('[Rubi Backend] Org config cached in chrome.storage');
        } catch (error) {
          console.warn('[Rubi Backend] Failed to cache org config:', error);
        }
      }
      
      return data.data;
    }
    
    return null;
  } catch (error) {
    console.error('[Rubi Backend] Failed to fetch org config:', error);
    return null;
  }
}

/**
 * Phase 9C: Attempt to bind with Rubi session with full identity
 * 
 * @returns {Promise<Object|null>} Session binding result with identity or null
 */
async function attemptRubiSessionBinding() {
  if (!BACKEND_CONFIG.useRubiSessionBinding) {
    console.log('[Rubi Backend] Rubi session binding disabled in config');
    return null;
  }
  
  if (typeof window === 'undefined' || !window.RubiSessionBridge) {
    console.log('[Rubi Backend] RubiSessionBridge not available');
    return null;
  }
  
  try {
    // PHASE 9C: Get full identity context
    console.log('[Rubi Backend] Attempting to get Rubi identity context...');
    const identity = await window.RubiSessionBridge.getCurrentIdentity();
    
    if (!identity) {
      console.log('[Rubi Backend] No Rubi identity available');
      return null;
    }
    
    console.log('[Rubi Backend] Got Rubi identity:', {
      sessionId: identity.sessionId,
      userId: identity.userId,
      userName: identity.userName,
      orgId: identity.orgId,
      orgName: identity.orgName,
      planTier: identity.planTier,
      roles: identity.roles
    });
    
    // Store identity for later use
    authState.currentIdentity = identity;
    
    // Call the session binding endpoint with full identity
    const url = `${BACKEND_CONFIG.baseUrl}${BACKEND_CONFIG.rubiSessionBindingEndpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'X-Rubi-Client': 'browser-extension',
      'X-Rubi-Version': '0.1.0',
      'X-Rubi-Locale': identity.locale || 'en-US'
    };
    
    // Generate extension instance ID if not already present
    const extensionInstanceId = window.rubiExtensionInstanceId || 
      (window.rubiExtensionInstanceId = `ext-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
    
    const payload = {
      // Full identity context
      identity: identity,
      extensionInstanceId,
      // Legacy format for backward compatibility
      sessionId: identity.sessionId,
      user: {
        userId: identity.userId,
        email: identity.email,
        displayName: identity.userName || `${identity.firstName} ${identity.lastName}`.trim(),
        roles: identity.roles,
        locale: identity.locale
      },
      org: {
        orgId: identity.orgId,
        orgName: identity.orgName,
        planTier: identity.planTier
      }
    };
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'No error details');
      throw new Error(`Session binding failed: HTTP ${response.status} - ${errorBody}`);
    }
    
    const data = await response.json();
    
    if (!data.success || !data.token || !data.expiresIn) {
      throw new Error('Invalid session binding response');
    }
    
    console.log('[Rubi Backend] Obtained identity-bound JWT via Rubi session binding');
    console.log('[Rubi Backend] Identity context will be included in all requests');
    
    return {
      token: data.token,
      expiresAt: new Date(Date.now() + data.expiresIn * 1000).toISOString(),
      session: data.session,
      identity: identity
    };
    
  } catch (error) {
    console.warn('[Rubi Backend] Rubi session binding failed:', error);
    console.log('[Rubi Backend] Falling back to dev handshake');
    return null;
  }
}

/**
 * Phase 9A: Fetch a new authentication token from the backend
 * 
 * @param {boolean} force - Force token refresh even if current token is valid
 * @returns {Promise<boolean>} Success status
 */
async function fetchExtensionToken(force = false) {
  // Check if token is still valid and force is false
  if (!force && authState.currentToken && authState.expiresAt) {
    const now = Date.now();
    const expiresAt = new Date(authState.expiresAt).getTime();
    
    if (expiresAt > now + 60000) { // Valid for at least 1 more minute
      return true;
    }
  }
  
  // Prevent concurrent token fetches
  if (authState.isFetchingToken) {
    console.log('[Rubi Backend] Token fetch already in progress, waiting...');
    
    // Wait for the current fetch to complete
    let attempts = 0;
    while (authState.isFetchingToken && attempts < 50) { // Max 5 seconds
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    
    return authState.currentToken !== null;
  }
  
  authState.isFetchingToken = true;
  
  try {
    // Phase 9B: Try Rubi session binding first
    const sessionBinding = await attemptRubiSessionBinding();
    if (sessionBinding) {
      // Update auth state with session-bound token
      authState.currentToken = sessionBinding.token;
      authState.expiresAt = sessionBinding.expiresAt;
      authState.lastFetchError = null;
      authState.isDevMode = false;
      
      console.log('[Rubi Backend] Using Rubi session-bound token');
      console.log('[Rubi Backend] Session user:', sessionBinding.session?.user?.userId);
      console.log('[Rubi Backend] Session org:', sessionBinding.session?.org?.orgId);
      console.log('[Rubi Backend] Token expires at:', sessionBinding.expiresAt);
      
      // Cache token in chrome.storage if available
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        try {
          await new Promise((resolve, reject) => {
            chrome.storage.local.set({
              rubiAuthToken: sessionBinding.token,
              rubiAuthExpiry: sessionBinding.expiresAt,
              rubiSessionContext: sessionBinding.session
            }, () => {
              if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
              } else {
                resolve();
              }
            });
          });
          console.log('[Rubi Backend] Session-bound token cached in chrome.storage');
        } catch (error) {
          console.warn('[Rubi Backend] Failed to cache session-bound token:', error);
        }
      }
      
      // Phase 9D: Fetch org config after successful auth
      await fetchOrgConfig(true);
      
      // Schedule token refresh before expiry
      scheduleTokenRefresh();
      
      return true;
    }
    
    // Phase 9A: Fall back to standard extension handshake
    console.log('[Rubi Backend] Fetching new authentication token via handshake...');
    
    const url = `${BACKEND_CONFIG.baseUrl}/api/auth/extension/handshake`;
    const headers = {
      'Content-Type': 'application/json',
      'X-Rubi-Extension-Key': BACKEND_CONFIG.extensionSharedSecret,
      'X-Rubi-Client': 'browser-extension',
      'X-Rubi-Version': '0.1.0'
    };
    
    // Prepare handshake payload with optional hints
    const payload = {
      extensionVersion: '0.1.0',
      // TODO: Add userHint and orgHint when available from extension context
    };
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'No error details');
      throw new Error(`Handshake failed: HTTP ${response.status} - ${errorBody}`);
    }
    
    const data = await response.json();
    
    if (!data.success || !data.token || !data.expiresAt) {
      throw new Error('Invalid handshake response');
    }
    
    // Update auth state
    authState.currentToken = data.token;
    authState.expiresAt = data.expiresAt;
    authState.lastFetchError = null;
    authState.isDevMode = false;
    
    console.log('[Rubi Backend] Authentication token obtained successfully');
    console.log('[Rubi Backend] Token expires at:', data.expiresAt);
    
    // Cache token in chrome.storage if available
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      try {
        await new Promise((resolve, reject) => {
          chrome.storage.local.set({
            rubiAuthToken: data.token,
            rubiAuthExpiry: data.expiresAt
          }, () => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve();
            }
          });
        });
        console.log('[Rubi Backend] Token cached in chrome.storage');
      } catch (error) {
        console.warn('[Rubi Backend] Failed to cache token:', error);
      }
    }
    
    // Phase 9D: Fetch org config after successful auth
    await fetchOrgConfig(true);
    
    // Schedule token refresh before expiry
    scheduleTokenRefresh();
    
    return true;
  } catch (error) {
    console.error('[Rubi Backend] Token fetch failed:', error);
    authState.lastFetchError = error.message;
    
    // Fall back to dev mode if allowed
    if (BACKEND_CONFIG.allowDevFallback) {
      console.warn('[Rubi Backend] Auth failed, falling back to development mode');
      authState.isDevMode = true;
      
      // Phase 9D: Try to fetch org config even in dev mode
      await fetchOrgConfig(true);
      
      return true;
    }
    
    return false;
  } finally {
    authState.isFetchingToken = false;
  }
}

/**
 * Phase 9A: Schedule automatic token refresh before expiry
 */
function scheduleTokenRefresh() {
  if (!authState.expiresAt) {
    return;
  }
  
  const now = Date.now();
  const expiresAt = new Date(authState.expiresAt).getTime();
  const refreshAt = expiresAt - BACKEND_CONFIG.tokenRefreshLeeway;
  const delay = Math.max(refreshAt - now, 0);
  
  if (delay > 0) {
    console.log(`[Rubi Backend] Scheduling token refresh in ${Math.round(delay / 1000)} seconds`);
    
    setTimeout(async () => {
      console.log('[Rubi Backend] Auto-refreshing token...');
      await fetchExtensionToken(true);
    }, delay);
  }
}

/**
 * Phase 10B: Get authorization headers with full identity support
 * 
 * @returns {Object} Headers object with auth token and identity metadata
 */
async function getAuthHeaders() {
  const headers = {
    'Content-Type': 'application/json',
    'X-Rubi-Client': 'browser-extension',
    'X-Rubi-Version': '1.0.0',
    'X-Extension-Token': BACKEND_CONFIG.extensionAuthToken
  };

  // Add JWT token from handshake if available
  if (authState.currentToken) {
    headers['Authorization'] = `Bearer ${authState.currentToken}`;
  }

  // Phase 10B: Add Moodle identity JWT if available
  if (window.RubiSessionBridge) {
    try {
      // Get current identity (may trigger fetch from Moodle)
      const identity = await window.RubiSessionBridge.getCurrentIdentity();
      if (identity) {
        // Update cached identity
        authState.currentIdentity = identity;
        
        // Add Moodle JWT if available
        const identityJwt = window.RubiSessionBridge.getIdentityJwt();
        if (identityJwt) {
          headers['X-Identity-Token'] = identityJwt;
          console.debug('[Rubi Backend] Including Moodle identity JWT in request');
        }
        
        // Add Moodle URL for backend to verify
        const moodleUrl = window.RubiSessionBridge.getMoodleUrl();
        if (moodleUrl) {
          headers['X-Moodle-URL'] = moodleUrl;
        }
      }
    } catch (error) {
      console.warn('[Rubi Backend] Failed to get identity from SessionBridge:', error);
    }
  }
  
  // Phase 10B: Simplified auth - extension token is primary auth
  if (!headers['X-Extension-Token']) {
    console.error('[Rubi Backend] Extension token not configured');
  }
  
  return headers;
}

/**
 * Execute an action on the backend with identity context
 * PHASE 9C: Enhanced to include full identity in requests
 * 
 * @param {string} actionName - Name of the action to execute
 * @param {Object} payload - Normalized Rubi context payload
 * @param {Object} options - Optional configuration overrides
 * @returns {Promise<{success: boolean, data?: any, error?: string, statusCode?: number, source: string}>}
 */
async function executeAction(actionName, payload, options = {}) {
  const startTime = Date.now();
  const config = { ...BACKEND_CONFIG, ...options };
  
  console.log(`[Rubi Backend] Executing action: ${actionName}`);
  console.log(`[Rubi Backend] Backend URL: ${config.baseUrl}`);
  
  // Validate inputs
  if (!actionName || typeof actionName !== 'string') {
    const error = 'Invalid action name';
    console.error(`[Rubi Backend] ${error}`);
    return { success: false, error, source: 'backend' };
  }
  
  if (!payload || typeof payload !== 'object') {
    const error = 'Invalid payload';
    console.error(`[Rubi Backend] ${error}`);
    return { success: false, error, source: 'backend' };
  }
  
  try {
    // Get auth headers (will handle token fetch/refresh if needed)
    const headers = await getAuthHeaders();
    
    if (!headers['Authorization'] && !headers['X-Rubi-Dev-Bypass']) {
      const error = 'Authentication required but not available';
      console.error(`[Rubi Backend] ${error}`);
      return { success: false, error, source: 'backend' };
    }
    
    // PHASE 9C: Enhance payload with identity context
    const enhancedPayload = { ...payload };
    
    // Try to get current identity if not already loaded
    if (!authState.currentIdentity && window.RubiSessionBridge) {
      try {
        authState.currentIdentity = await window.RubiSessionBridge.getCurrentIdentity();
        if (authState.currentIdentity) {
          console.log('[Rubi Backend] Loaded identity for request:', {
            userId: authState.currentIdentity.userId,
            orgName: authState.currentIdentity.orgName,
            planTier: authState.currentIdentity.planTier
          });
        }
      } catch (error) {
        console.warn('[Rubi Backend] Could not load identity:', error);
      }
    }
    
    // Add identity to payload if available
    if (authState.currentIdentity) {
      enhancedPayload.identity = authState.currentIdentity;
      console.log('[Rubi Backend] Including identity context in action request');
    } else {
      console.log('[Rubi Backend] No identity available - proceeding without personalization');
    }
    
    // Phase 10B: Use new action endpoint
    const url = `${config.baseUrl}/api/actions/execute`;
    // Phase 10B: Include action name and context in body
    const body = JSON.stringify({ 
      action: actionName,
      context: enhancedPayload,
      identityToken: window.RubiSessionBridge?.getIdentityJwt() || null
    });
    
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, config.timeoutMs);
    
    let attempt = 0;
    let lastError = null;
    
    // Retry loop
    while (attempt <= config.maxRetries) {
      if (attempt > 0) {
        console.log(`[Rubi Backend] Retry attempt ${attempt} for action: ${actionName}`);
        await new Promise(resolve => setTimeout(resolve, config.retryDelayMs * attempt));
      }
      
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers,
          body,
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        const elapsedMs = Date.now() - startTime;
        
        // Phase 10B: Handle auth errors
        if (response.status === 401 && attempt === 0) {
          console.log('[Rubi Backend] Authentication failed');
          // Try to refresh identity
          if (window.RubiSessionBridge) {
            await window.RubiSessionBridge.refreshIdentity();
            attempt++;
            continue;
          }
        }
        
        // Phase 9D: Handle action disabled by policy
        if (response.status === 403) {
          const errorBody = await response.json().catch(() => ({ error: 'Action disabled' }));
          if (errorBody.code === 'ACTION_DISABLED_BY_POLICY') {
            console.warn(`[Rubi Backend] Action ${actionName} is disabled by org policy`);
            return {
              success: false,
              error: errorBody.error || 'This action has been disabled by your organization',
              code: 'ACTION_DISABLED_BY_POLICY',
              statusCode: 403,
              source: 'backend'
            };
          }
        }
        
        // Handle HTTP errors
        if (!response.ok) {
          const errorBody = await response.text().catch(() => 'No error details');
          const error = `HTTP ${response.status}: ${errorBody}`;
          
          console.error(`[Rubi Backend] Action failed: ${actionName}`);
          console.error(`[Rubi Backend] Status: ${response.status}`);
          console.error(`[Rubi Backend] Error: ${error}`);
          console.error(`[Rubi Backend] Elapsed: ${elapsedMs}ms`);
          
          // Don't retry on client errors (4xx) except 401
          if (response.status >= 400 && response.status < 500 && response.status !== 401) {
            return {
              success: false,
              error,
              statusCode: response.status,
              source: 'backend'
            };
          }
          
          // Retry on server errors (5xx)
          lastError = error;
          attempt++;
          continue;
        }
        
        // Parse successful response
        let data;
        try {
          data = await response.json();
        } catch (parseError) {
          const error = 'Invalid JSON response from backend';
          console.error(`[Rubi Backend] ${error}:`, parseError);
          return { success: false, error, source: 'backend' };
        }
        
        console.log(`[Rubi Backend] Action succeeded: ${actionName}`);
        console.log(`[Rubi Backend] Status: ${response.status}`);
        console.log(`[Rubi Backend] Elapsed: ${elapsedMs}ms`);
        
        return {
          success: true,
          data,
          statusCode: response.status,
          source: 'backend'
        };
        
      } catch (error) {
        clearTimeout(timeoutId);
        
        const elapsedMs = Date.now() - startTime;
        
        // Handle abort/timeout
        if (error.name === 'AbortError') {
          const timeoutError = `Request timeout after ${config.timeoutMs}ms`;
          console.error(`[Rubi Backend] ${timeoutError} for action: ${actionName}`);
          return { success: false, error: timeoutError, source: 'backend' };
        }
        
        // Handle network errors
        console.error(`[Rubi Backend] Network error for action: ${actionName}`);
        console.error(`[Rubi Backend] Error:`, error.message);
        console.error(`[Rubi Backend] Elapsed: ${elapsedMs}ms`);
        
        lastError = error.message || 'Network error';
        attempt++;
      }
    }
    
    // All retries failed
    const elapsedMs = Date.now() - startTime;
    console.error(`[Rubi Backend] All retries exhausted for action: ${actionName}`);
    console.error(`[Rubi Backend] Last error: ${lastError}`);
    console.error(`[Rubi Backend] Total elapsed: ${elapsedMs}ms`);
    
    return {
      success: false,
      error: lastError || 'Request failed after retries',
      source: 'backend'
    };
  } catch (error) {
    console.error(`[Rubi Backend] Unexpected error:`, error);
    return {
      success: false,
      error: error.message || 'Unexpected error',
      source: 'backend'
    };
  }
}

/**
 * Check if backend is configured and reachable
 * 
 * @returns {Promise<boolean>}
 */
async function isBackendAvailable() {
  try {
    // Try to initialize auth
    const hasAuth = await initializeBackendAuth();
    
    if (!hasAuth && !BACKEND_CONFIG.allowDevFallback) {
      console.warn('[Rubi Backend] Backend not available - authentication failed');
      return false;
    }
    
    // TODO: Optionally call health endpoint to verify backend is up
    console.log('[Rubi Backend] Backend is available');
    return true;
  } catch (error) {
    console.error('[Rubi Backend] Backend availability check failed:', error);
    return false;
  }
}

/**
 * Phase 10B: Update backend configuration with environment support
 * 
 * @param {Object} newConfig - Configuration updates
 */
function updateConfig(newConfig) {
  // Update from environment if available
  if (window.RubiEnvironment) {
    const envConfig = window.RubiEnvironment.getConfig();
    BACKEND_CONFIG.baseUrl = envConfig.backendUrl || BACKEND_CONFIG.baseUrl;
    BACKEND_CONFIG.moodleUrl = envConfig.moodleUrl || BACKEND_CONFIG.moodleUrl;
    BACKEND_CONFIG.extensionAuthToken = envConfig.extensionAuthToken || BACKEND_CONFIG.extensionAuthToken;
  }
  
  Object.assign(BACKEND_CONFIG, newConfig);
  console.log('[Rubi Backend] Configuration updated');
  
  // Reset auth state if config changes significantly
  if (newConfig.baseUrl || newConfig.extensionAuthToken) {
    console.log('[Rubi Backend] Resetting auth state due to config change');
    authState.currentToken = null;
    authState.expiresAt = null;
    authState.isDevMode = false;
    authState.currentOrgConfig = null;
    authState.orgConfigFetchedAt = null;
  }
}

/**
 * Get current backend configuration (for debugging)
 * 
 * @returns {Object} Current configuration
 */
function getConfig() {
  // Return a copy to prevent external modifications
  return { ...BACKEND_CONFIG };
}

/**
 * PHASE 9C: Get current identity context
 * 
 * @returns {Object|null} Current identity or null
 */
function getCurrentIdentity() {
  return authState.currentIdentity;
}

/**
 * PHASE 9C: Manually set identity (for testing)
 * 
 * @param {Object} identity - Identity object to set
 */
function setIdentity(identity) {
  authState.currentIdentity = identity;
  console.log('[Rubi Backend] Identity manually set:', identity);
}

/**
 * PHASE 9D: Get current org config
 * 
 * @returns {Object|null} Current org config or null
 */
function getCurrentOrgConfig() {
  return authState.currentOrgConfig;
}

/**
 * Phase 9A: Get current auth status (for debugging)
 * 
 * @returns {Object} Auth status
 */
function getAuthStatus() {
  return {
    hasToken: !!authState.currentToken,
    expiresAt: authState.expiresAt,
    isDevMode: authState.isDevMode,
    lastError: authState.lastFetchError
  };
}

/**
 * Phase 9A: Clear authentication state
 * Useful for logout or debugging
 */
async function clearAuth() {
  console.log('[Rubi Backend] Clearing authentication state');
  
  authState.currentToken = null;
  authState.expiresAt = null;
  authState.isDevMode = false;
  authState.lastFetchError = null;
  authState.currentOrgConfig = null;
  authState.orgConfigFetchedAt = null;
  
  // Clear cached token from chrome.storage
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    try {
      await new Promise((resolve, reject) => {
        chrome.storage.local.remove(['rubiAuthToken', 'rubiAuthExpiry', 'rubiSessionContext', 'rubiOrgConfig', 'rubiOrgConfigFetchedAt'], () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve();
          }
        });
      });
      console.log('[Rubi Backend] Cleared cached token from chrome.storage');
    } catch (error) {
      console.warn('[Rubi Backend] Failed to clear cached token:', error);
    }
  }
}

// Export for use in content scripts
if (typeof window !== 'undefined') {
  window.RubiBackendClient = {
    executeAction,
    isBackendAvailable,
    updateConfig,
    getConfig,
    // Phase 9A: Auth methods
    initializeBackendAuth,
    fetchExtensionToken,
    getAuthStatus,
    clearAuth,
    // Phase 9C: Identity methods
    getCurrentIdentity,
    setIdentity,
    // Phase 9D: Org config methods
    fetchOrgConfig,
    getCurrentOrgConfig,
    // Phase 11B: Org intelligence methods
    fetchOrgIntelligence: async () => {
      const hasAuth = await initializeBackendAuth();
      if (!hasAuth && !BACKEND_CONFIG.allowDevFallback) {
        throw new Error('Authentication required');
      }
      
      const headers = await getAuthHeaders();
      const url = `${BACKEND_CONFIG.baseUrl}/api/org-intelligence`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          // Return default intelligence if none configured
          const { defaultOrgIntelligence } = await import('./orgIntelligence.js');
          return defaultOrgIntelligence;
        }
        throw new Error(`Failed to fetch org intelligence: HTTP ${response.status}`);
      }
      
      return await response.json();
    }
  };
  
  // Phase 10B: Initialize with environment config
  if (window.RubiEnvironment) {
    window.RubiEnvironment.init().then(() => {
      updateConfig({});
      console.log('[Rubi Backend] Client initialized with environment config (Phase 10B)');
    });
  } else {
    console.log('[Rubi Backend] Client initialized (Phase 10B)');
  }
}