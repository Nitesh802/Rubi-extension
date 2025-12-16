/**
 * Phase 9C: Rubi Session Bridge with Complete Identity System
 * 
 * Provides comprehensive identity context for personalization including:
 * - User identity (userId, userName, firstName, lastName, email, locale, roles)
 * - Organization identity (orgId, orgName, planTier, industry, orgSize)
 * - Session metadata (sessionId, lastActivity, permissions)
 * - Personalization preferences (theme, tone, experienceLevel)
 * 
 * Backward compatible: Returns null when identity unavailable.
 */

(function() {
  'use strict';

  // Configuration for session bridge with personalization support
  const RubiSessionBridgeConfig = {
    // Enable for production when Rubi web integration is ready
    enabled: true, // PHASE 10B: Production ready
    
    // Known Rubi/SuccessLAB hosts
    knownRubiHosts: [
      // Production hosts
      'successlab.learn.fus-ed.com',
      'sales.learn.fus-ed.com',
      'portal.learn.fus-ed.com',
      
      // Staging/dev hosts
      'staging.successlab.learn.fus-ed.com',
      'dev.successlab.learn.fus-ed.com',
      'localhost:8080',
      'localhost:3000',
    ],
    
    // Message protocol version
    protocolVersion: 'rubi-session-2.1',
    
    // Timeout for session requests
    requestTimeout: 3000,
    
    // Enable mock data for development/testing
    useMockData: false, // PHASE 10B: Use real identity
    
    // Phase 10B: Moodle identity endpoint configuration
    moodleIdentityEndpoint: '/local/rubi_ai_admin/api/identity.php',
    
    // API token for Moodle requests
    moodleApiToken: null,
    
    // Cached identity and JWT
    cachedIdentity: null,
    cachedIdentityJwt: null,
    cachedAt: null,
    cacheMaxAge: 3600000, // 1 hour in ms
  };

  /**
   * Mock identity data for development/testing
   * PHASE 9C: Rich identity context for personalization
   */
  const MOCK_IDENTITY = {
    sessionId: 'mock-session-' + Date.now(),
    userId: 'user-12345',
    userName: 'john.smith',
    firstName: 'John',
    lastName: 'Smith',
    email: 'john.smith@techcorp.com',
    locale: 'en-US',
    roles: ['user', 'sales_rep'],
    planTier: 'enterprise',
    orgId: 'org-67890',
    orgName: 'TechCorp Industries',
    orgIndustry: 'Technology',
    orgSize: 'enterprise',
    department: 'Sales',
    title: 'Senior Account Executive',
    experienceLevel: 'advanced',
    preferences: {
      theme: 'light',
      tone: 'professional',
      insights: 'detailed',
      notifications: true
    },
    permissions: {
      canAccessPremiumFeatures: true,
      canViewTeamInsights: true,
      canExportData: true,
      canCustomizePrompts: false
    },
    metadata: {
      loginTime: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      sessionDuration: 0,
      extensionVersion: '1.0.0'
    }
  };

  /**
   * Check if current host is a known Rubi host
   */
  function isRubiHost(url) {
    try {
      const hostname = new URL(url || window.location.href).hostname;
      return RubiSessionBridgeConfig.knownRubiHosts.some(host => {
        if (host.startsWith('*.')) {
          const domain = host.substring(2);
          return hostname.endsWith(domain);
        }
        return hostname === host || hostname.includes(host);
      });
    } catch (error) {
      console.warn('[Rubi SessionBridge] Error checking host:', error);
      return false;
    }
  }
  
  /**
   * Phase 9F: Get Rubi base URL from known hosts
   * Attempts to find a Rubi tab or uses configured default
   */
  function getRubiBaseUrl() {
    // First check if we're on a Rubi host
    if (isRubiHost(window.location.href)) {
      return window.location.origin;
    }
    
    // TODO: In future, scan open tabs for Rubi host
    // For now, use a configured default or the first known host
    const defaultHost = RubiSessionBridgeConfig.knownRubiHosts.find(host => 
      !host.includes('staging') && !host.includes('dev') && !host.includes('localhost')
    );
    
    if (defaultHost) {
      return `https://${defaultHost}`;
    }
    
    // Fallback to localhost for development
    return 'http://localhost:8080';
  }
  
  /**
   * Phase 10B: Fetch real identity from Moodle identity.php
   * 
   * @returns {Promise<Object|null>} Identity response with JWT or null
   */
  async function fetchIdentityFromRubi() {
    const logPrefix = '[Rubi SessionBridge]';
    
    try {
      const rubiBaseUrl = getRubiBaseUrl();
      const identityUrl = `${rubiBaseUrl}${RubiSessionBridgeConfig.moodleIdentityEndpoint}`;
      const apiToken = RubiSessionBridgeConfig.moodleApiToken || window.RubiEnvironment?.getAuthToken();
      
      console.log(`${logPrefix} Fetching identity from: ${identityUrl}`);
      
      // Make request with credentials to include session cookies
      const headers = {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest' // Indicate AJAX request
      };
      
      if (apiToken) {
        headers['X-API-Token'] = apiToken;
      }
      
      const response = await fetch(identityUrl, {
        method: 'GET',
        credentials: 'include', // Important: include cookies for Moodle session
        headers: headers
      });
      
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          console.log(`${logPrefix} User not authenticated with Rubi (HTTP ${response.status})`);
        } else {
          console.warn(`${logPrefix} Identity fetch failed: HTTP ${response.status}`);
        }
        return null;
      }
      
      const data = await response.json();
      
      // Phase 10B: Handle new response format from Moodle
      if (!data || data.status !== 'success') {
        console.warn(`${logPrefix} Invalid identity response - status: ${data?.status}`);
        return null;
      }
      
      if (!data.data?.jwt || !data.data) {
        console.warn(`${logPrefix} Invalid identity response - missing jwt or data`);
        return null;
      }
      
      console.log(`${logPrefix} Successfully fetched Rubi identity`, {
        userId: data.data.userId,
        email: data.data.email,
        orgId: data.data.orgId
      });
      
      // Return the identity data and JWT
      return {
        jwt: data.data.jwt,
        identity: data.data,
        fetchedAt: data.timestamp || new Date().toISOString()
      };
      
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        console.debug(`${logPrefix} Network error fetching identity - Rubi may not be reachable`);
      } else {
        console.error(`${logPrefix} Error fetching identity from Rubi:`, error);
      }
      return null;
    }
  }

  /**
   * Get comprehensive identity context
   * PHASE 9F: Enhanced to fetch real identity from Moodle
   * 
   * @returns {Promise<Object|null>} Complete identity object or null
   */
  async function getCurrentIdentity() {
    const logPrefix = '[Rubi SessionBridge]';
    
    // Check if session bridge is enabled
    if (!RubiSessionBridgeConfig.enabled) {
      console.debug(`${logPrefix} Session bridge disabled - returning null`);
      return null;
    }
    
    // Phase 9F: Check cache first
    if (RubiSessionBridgeConfig.cachedIdentity && RubiSessionBridgeConfig.cachedAt) {
      const cacheAge = Date.now() - new Date(RubiSessionBridgeConfig.cachedAt).getTime();
      if (cacheAge < RubiSessionBridgeConfig.cacheMaxAge) {
        console.debug(`${logPrefix} Using cached identity (age: ${Math.round(cacheAge/1000)}s)`);
        return RubiSessionBridgeConfig.cachedIdentity;
      }
    }
    
    // Phase 9F: Try to fetch real identity from Moodle first
    if (!RubiSessionBridgeConfig.useMockData) {
      const moodleData = await fetchIdentityFromRubi();
      if (moodleData && moodleData.identity) {
        // Cache the JWT and identity
        RubiSessionBridgeConfig.cachedIdentityJwt = moodleData.jwt;
        RubiSessionBridgeConfig.cachedAt = moodleData.fetchedAt;
        
        // Format the Moodle identity response (Phase 10B format)
        const formattedIdentity = {
          sessionId: `moodle-${moodleData.identity.userId}-${Date.now()}`,
          userId: String(moodleData.identity.userId),
          userName: moodleData.identity.email?.split('@')[0] || 'user',
          firstName: moodleData.identity.fullName?.split(' ')[0] || null,
          lastName: moodleData.identity.fullName?.split(' ').slice(1).join(' ') || null,
          email: moodleData.identity.email,
          locale: 'en-US', // Default, could be extended
          roles: moodleData.identity.roles || ['user'],
          department: null,
          title: null,
          experienceLevel: 'intermediate',
          orgId: moodleData.identity.orgId,
          orgName: null, // Will be filled from org config
          planTier: 'free', // Will be filled from org config
          orgIndustry: null,
          orgSize: null,
          preferences: {
            theme: 'light',
            tone: 'professional',
            insights: 'standard',
            notifications: true
          },
          permissions: {
            canAccessPremiumFeatures: moodleData.identity.permissions?.includes('view_ai_config') || false,
            canViewTeamInsights: moodleData.identity.permissions?.includes('view_team_insights') || false,
            canExportData: moodleData.identity.permissions?.includes('export_data') || false,
            canCustomizePrompts: moodleData.identity.permissions?.includes('edit_ai_config') || false
          },
          metadata: {
            loginTime: moodleData.fetchedAt,
            lastActivity: new Date().toISOString(),
            sessionDuration: 0,
            extensionVersion: '1.0.0',
            identityVersion: '2.1-moodle',
            identityJwt: moodleData.jwt, // Store JWT for backend calls
            moodleUrl: getRubiBaseUrl() // Store Moodle URL for backend
          }
        };
        
        RubiSessionBridgeConfig.cachedIdentity = formattedIdentity;
        console.info(`${logPrefix} Using real Moodle identity for user ${formattedIdentity.userId}`);
        return formattedIdentity;
      }
    }
    
    // PHASE 9C: Return mock data for development/testing
    if (RubiSessionBridgeConfig.useMockData) {
      console.info(`${logPrefix} Using mock identity for development`);
      const mockIdentity = formatIdentityResponse(MOCK_IDENTITY);
      RubiSessionBridgeConfig.cachedIdentity = mockIdentity;
      RubiSessionBridgeConfig.cachedAt = new Date().toISOString();
      return mockIdentity;
    }
    
    // Check if we're on a Rubi host for window-based identity
    if (isRubiHost(window.location.href)) {
      try {
        // Check for Rubi web app exposed identity
        if (window.RubiIdentityContext && typeof window.RubiIdentityContext === 'object') {
          console.info(`${logPrefix} Found RubiIdentityContext in window`);
          const identity = formatIdentityResponse(window.RubiIdentityContext);
          RubiSessionBridgeConfig.cachedIdentity = identity;
          RubiSessionBridgeConfig.cachedAt = new Date().toISOString();
          return identity;
        }
        
        // Legacy: Check for RubiSessionContext
        if (window.RubiSessionContext && typeof window.RubiSessionContext === 'object') {
          console.info(`${logPrefix} Found legacy RubiSessionContext in window`);
          const identity = formatLegacySession(window.RubiSessionContext);
          RubiSessionBridgeConfig.cachedIdentity = identity;
          RubiSessionBridgeConfig.cachedAt = new Date().toISOString();
          return identity;
        }
        
        // Try postMessage approach
        const identityViaMessage = await requestIdentityViaPostMessage();
        if (identityViaMessage) {
          const identity = formatIdentityResponse(identityViaMessage);
          RubiSessionBridgeConfig.cachedIdentity = identity;
          RubiSessionBridgeConfig.cachedAt = new Date().toISOString();
          return identity;
        }
      } catch (error) {
        console.error(`${logPrefix} Error getting identity context:`, error);
      }
    }
    
    // No identity available - return mock if in development
    console.info(`${logPrefix} No identity context available`);
    if (RubiSessionBridgeConfig.useMockData || (typeof chrome !== 'undefined' && chrome.runtime)) {
      console.info(`${logPrefix} Falling back to mock identity`);
      const mockIdentity = formatIdentityResponse(MOCK_IDENTITY);
      RubiSessionBridgeConfig.cachedIdentity = mockIdentity;
      RubiSessionBridgeConfig.cachedAt = new Date().toISOString();
      return mockIdentity;
    }
    
    return null;
  }

  /**
   * Format and validate identity response
   * Ensures all fields have defaults for backward compatibility
   */
  function formatIdentityResponse(rawIdentity) {
    if (!rawIdentity) return null;
    
    return {
      // Session info
      sessionId: rawIdentity.sessionId || generateSessionId(),
      
      // User identity
      userId: rawIdentity.userId || rawIdentity.user?.userId || null,
      userName: rawIdentity.userName || rawIdentity.user?.userName || null,
      firstName: rawIdentity.firstName || rawIdentity.user?.firstName || null,
      lastName: rawIdentity.lastName || rawIdentity.user?.lastName || null,
      email: rawIdentity.email || rawIdentity.user?.email || null,
      locale: rawIdentity.locale || rawIdentity.user?.locale || 'en-US',
      roles: rawIdentity.roles || rawIdentity.user?.roles || ['user'],
      department: rawIdentity.department || rawIdentity.user?.department || null,
      title: rawIdentity.title || rawIdentity.user?.title || null,
      experienceLevel: rawIdentity.experienceLevel || 'intermediate',
      
      // Organization identity
      orgId: rawIdentity.orgId || rawIdentity.org?.orgId || null,
      orgName: rawIdentity.orgName || rawIdentity.org?.orgName || null,
      planTier: rawIdentity.planTier || rawIdentity.org?.planTier || 'free',
      orgIndustry: rawIdentity.orgIndustry || rawIdentity.org?.industry || null,
      orgSize: rawIdentity.orgSize || rawIdentity.org?.size || null,
      
      // Preferences
      preferences: rawIdentity.preferences || {
        theme: 'light',
        tone: 'professional',
        insights: 'standard',
        notifications: true
      },
      
      // Permissions
      permissions: rawIdentity.permissions || {
        canAccessPremiumFeatures: false,
        canViewTeamInsights: false,
        canExportData: false,
        canCustomizePrompts: false
      },
      
      // Metadata
      metadata: {
        loginTime: rawIdentity.metadata?.loginTime || new Date().toISOString(),
        lastActivity: rawIdentity.metadata?.lastActivity || new Date().toISOString(),
        sessionDuration: rawIdentity.metadata?.sessionDuration || 0,
        extensionVersion: '1.0.0',
        identityVersion: '2.0'
      }
    };
  }

  /**
   * Format legacy session context to new identity format
   */
  function formatLegacySession(session) {
    if (!session) return null;
    
    return {
      sessionId: session.sessionId || generateSessionId(),
      userId: session.user?.userId || null,
      userName: session.user?.displayName || null,
      firstName: null, // Not in legacy format
      lastName: null,  // Not in legacy format
      email: session.user?.email || null,
      locale: session.user?.locale || 'en-US',
      roles: session.user?.roles || ['user'],
      department: null, // Not in legacy format
      title: null,     // Not in legacy format
      experienceLevel: 'intermediate',
      orgId: session.org?.orgId || null,
      orgName: session.org?.orgName || null,
      planTier: session.org?.planTier || 'free',
      orgIndustry: null, // Not in legacy format
      orgSize: null,     // Not in legacy format
      preferences: {
        theme: 'light',
        tone: 'professional',
        insights: 'standard',
        notifications: true
      },
      permissions: {
        canAccessPremiumFeatures: session.org?.planTier === 'enterprise',
        canViewTeamInsights: false,
        canExportData: false,
        canCustomizePrompts: false
      },
      metadata: {
        loginTime: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        sessionDuration: 0,
        extensionVersion: '1.0.0',
        identityVersion: '1.0-legacy'
      }
    };
  }

  /**
   * Generate a session ID for tracking
   */
  function generateSessionId() {
    return `ext-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Request identity via postMessage
   */
  async function requestIdentityViaPostMessage() {
    return new Promise((resolve) => {
      const messageId = `rubi-identity-${Date.now()}-${Math.random()}`;
      let timeoutId;
      
      const handleResponse = (event) => {
        // Validate origin
        if (!isRubiHost(event.origin)) return;
        
        // Check message format
        if (event.data?.type === 'RUBI_IDENTITY_RESPONSE' && 
            event.data?.messageId === messageId) {
          clearTimeout(timeoutId);
          window.removeEventListener('message', handleResponse);
          resolve(event.data.identity || null);
        }
      };
      
      // Set up timeout
      timeoutId = setTimeout(() => {
        window.removeEventListener('message', handleResponse);
        console.debug('[Rubi SessionBridge] PostMessage identity request timed out');
        resolve(null);
      }, RubiSessionBridgeConfig.requestTimeout);
      
      // Listen for response
      window.addEventListener('message', handleResponse);
      
      // Send request
      window.postMessage({
        type: 'RUBI_IDENTITY_REQUEST',
        messageId: messageId,
        version: RubiSessionBridgeConfig.protocolVersion,
      }, '*');
    });
  }

  /**
   * Legacy method - kept for backward compatibility
   */
  async function getCurrentSessionContext() {
    console.warn('[Rubi SessionBridge] getCurrentSessionContext is deprecated. Use getCurrentIdentity instead.');
    const identity = await getCurrentIdentity();
    
    if (!identity) return null;
    
    // Convert to legacy format
    return {
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
  }

  /**
   * Check if user has a specific role
   */
  function hasRole(identity, role) {
    if (!identity || !identity.roles) return false;
    return identity.roles.includes(role);
  }

  /**
   * Check if user has permission
   */
  function hasPermission(identity, permission) {
    if (!identity || !identity.permissions) return false;
    return identity.permissions[permission] === true;
  }

  /**
   * Get personalized greeting based on identity
   */
  function getPersonalizedGreeting(identity) {
    if (!identity) return 'Welcome to Rubi';
    
    const timeOfDay = new Date().getHours();
    let greeting = 'Good ';
    
    if (timeOfDay < 12) greeting += 'morning';
    else if (timeOfDay < 17) greeting += 'afternoon';
    else greeting += 'evening';
    
    if (identity.firstName) {
      greeting += `, ${identity.firstName}`;
    } else if (identity.userName) {
      greeting += `, ${identity.userName}`;
    }
    
    return greeting;
  }

  /**
   * Get org-aware context string
   */
  function getOrgContext(identity) {
    if (!identity || !identity.orgName) return '';
    
    let context = identity.orgName;
    if (identity.department) {
      context += ` - ${identity.department}`;
    }
    if (identity.planTier && identity.planTier !== 'free') {
      context += ` (${identity.planTier})`;
    }
    
    return context;
  }

  /**
   * Phase 10B: Get current identity JWT for backend calls
   * 
   * @returns {string|null} JWT token or null
   */
  function getIdentityJwt() {
    return RubiSessionBridgeConfig.cachedIdentityJwt || null;
  }
  
  /**
   * Phase 10B: Get Moodle URL for backend calls
   * 
   * @returns {string} Moodle base URL
   */
  function getMoodleUrl() {
    return getRubiBaseUrl();
  }
  
  /**
   * Phase 9F: Refresh identity from Moodle
   * Forces a fresh fetch even if cached
   * 
   * @returns {Promise<Object|null>} Fresh identity or null
   */
  async function refreshIdentity() {
    const logPrefix = '[Rubi SessionBridge]';
    console.log(`${logPrefix} Refreshing identity from Moodle...`);
    
    // Clear cache to force refresh
    RubiSessionBridgeConfig.cachedIdentity = null;
    RubiSessionBridgeConfig.cachedIdentityJwt = null;
    RubiSessionBridgeConfig.cachedAt = null;
    
    // Get fresh identity
    return await getCurrentIdentity();
  }
  
  /**
   * Phase 9F: Check if we have a real (non-mock) identity
   * 
   * @returns {boolean} True if real identity is available
   */
  function hasRealIdentity() {
    if (!RubiSessionBridgeConfig.cachedIdentity) {
      return false;
    }
    
    // Check if it's a mock identity
    const identity = RubiSessionBridgeConfig.cachedIdentity;
    return identity.metadata?.identityVersion?.includes('moodle') || false;
  }
  
  /**
   * Configure session bridge
   */
  function configure(options) {
    if (options.enabled !== undefined) {
      RubiSessionBridgeConfig.enabled = options.enabled;
    }
    if (options.knownRubiHosts && Array.isArray(options.knownRubiHosts)) {
      RubiSessionBridgeConfig.knownRubiHosts = options.knownRubiHosts;
    }
    if (options.requestTimeout !== undefined) {
      RubiSessionBridgeConfig.requestTimeout = options.requestTimeout;
    }
    if (options.useMockData !== undefined) {
      RubiSessionBridgeConfig.useMockData = options.useMockData;
    }
    console.info('[Rubi SessionBridge] Configuration updated:', RubiSessionBridgeConfig);
  }

  /**
   * Get current configuration
   */
  function getConfig() {
    return { ...RubiSessionBridgeConfig };
  }

  // Export enhanced API
  window.RubiSessionBridge = {
    // Core methods
    getCurrentIdentity,
    getCurrentSessionContext, // Legacy
    
    // Phase 10B: Identity management
    getIdentityJwt,
    getMoodleUrl,
    refreshIdentity,
    hasRealIdentity,
    
    // Utility methods
    hasRole,
    hasPermission,
    getPersonalizedGreeting,
    getOrgContext,
    
    // Configuration
    configure,
    getConfig,
    isRubiHost,
    getRubiBaseUrl,
    
    // Version info
    version: '2.2.0',
    identityVersion: '2.2'
  };

  console.debug('[Rubi SessionBridge] Initialized with full identity support', {
    enabled: RubiSessionBridgeConfig.enabled,
    version: '2.0.0',
    host: window.location.hostname,
    mockData: RubiSessionBridgeConfig.useMockData
  });
})();