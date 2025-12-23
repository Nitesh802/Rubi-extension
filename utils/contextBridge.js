/**
 * Rubi Browser Extension - Context Bridge
 * PHASE 9C: Enhanced with identity management
 *
 * Internal orchestration layer that manages incoming normalized context payloads,
 * identity context, and routes them to background scripts and Rubi APIs.
 * 
 * This module maintains state and provides coordination between extraction and consumption.
 */

// Internal state
let latestContextPayload = null;
let contextListeners = [];
let currentIdentity = null; // PHASE 9C: Store identity context
let identityListeners = []; // PHASE 9C: Identity change listeners

/**
 * Set the latest context payload with identity enrichment
 * PHASE 9C: Enriches context with identity
 *
 * @param {Object} payload - Normalized context payload
 */
async function setLatestContext(payload) {
  console.log('[Rubi Bridge] Setting latest context');
  
  // PHASE 9C: Enrich payload with identity if available
  if (currentIdentity) {
    payload = { ...payload, identity: currentIdentity };
    console.log('[Rubi Bridge] Context enriched with identity:', {
      userId: currentIdentity.userId,
      orgName: currentIdentity.orgName,
      planTier: currentIdentity.planTier
    });
  } else {
    // Try to load identity if not yet available
    await loadIdentityIfAvailable();
    if (currentIdentity) {
      payload = { ...payload, identity: currentIdentity };
    }
  }
  
  latestContextPayload = payload;
  
  // Write to memory store if available
  try {
    if (window.RubiMemoryStore) {
      // Initialize if needed
      window.RubiMemoryStore.initMemoryStore().catch(err => {
        console.warn('[Rubi Bridge] Failed to init memory store:', err);
      });
      
      // Get entity key
      const entityKey = window.RubiMemoryStore.getEntityKey(payload);
      if (entityKey) {
        // Create summary for history entry
        let summary = `Context captured for ${payload.platform || 'unknown'}`;
        if (payload.pageType) {
          summary += `/${payload.pageType}`;
        }
        
        // Add key identifying info to summary
        const keyInfo = [];
        if (payload.opportunityName) keyInfo.push(payload.opportunityName);
        else if (payload.profileName) keyInfo.push(payload.profileName);
        else if (payload.name) keyInfo.push(payload.name);
        else if (payload.subject) keyInfo.push(payload.subject);
        else if (payload.email) keyInfo.push(payload.email);
        else if (payload.companyName) keyInfo.push(payload.companyName);
        
        if (keyInfo.length > 0) {
          summary += `: ${keyInfo[0]}`;
        }
        
        // Create history entry
        const historyEntry = {
          type: 'context',
          platform: payload.platform || 'unknown',
          pageType: payload.pageType || 'unknown',
          summary: summary,
          payload: payload
        };
        
        // Add to history (non-blocking)
        window.RubiMemoryStore.addHistoryEntry(entityKey, historyEntry).catch(err => {
          console.warn('[Rubi Bridge] Failed to add history entry:', err);
        });
        
        console.log('[Rubi Bridge] Added context to memory for entity:', entityKey);
      }
    } else {
      console.log('[Rubi Memory] Memory store not available, skipping history update');
    }
  } catch (error) {
    console.warn('[Rubi Bridge] Error writing to memory store:', error);
    // Continue without breaking context flow
  }
}

/**
 * Get the latest context payload
 *
 * @returns {Object|null} Latest context payload or null
 */
function getLatestContext() {
  console.log('[Rubi Bridge] Retrieving latest context');
  return latestContextPayload;
}

/**
 * Clear stored context
 */
function clearContext() {
  console.log('[Rubi Bridge] Clearing context');
  latestContextPayload = null;
}

/**
 * Register callback for new context events
 *
 * @param {Function} callback - Callback function to be called on new context
 */
function onNewContext(callback) {
  if (typeof callback === 'function') {
    contextListeners.push(callback);
    console.log('[Rubi Bridge] Registered new context listener');
  } else {
    console.warn('[Rubi Bridge] Invalid callback provided to onNewContext');
  }
}

/**
 * Notify all registered listeners of new context
 */
function notifyListeners() {
  console.log(`[Rubi Bridge] Notifying ${contextListeners.length} listeners of new context`);
  
  for (const callback of contextListeners) {
    try {
      callback(latestContextPayload);
    } catch (error) {
      console.error('[Rubi Bridge] Error in context listener callback:', error);
    }
  }
}

/**
 * Send current context to Rubi via background script
 *
 * @param {Object} options - Options for sending context
 * @returns {Promise} Promise resolving with background script response
 */
async function sendContextToRubi(options = {}) {
  console.log('[Rubi Bridge] Sending context to Rubi');
  
  if (!latestContextPayload) {
    console.warn('[Rubi Bridge] No context available to send to Rubi');
    return { success: false, error: 'No context available' };
  }

  try {
    const response = await chrome.runtime.sendMessage({
      type: "SEND_CONTEXT_TO_RUBI",
      payload: latestContextPayload,
      options
    });
    
    console.log('[Rubi Bridge] Response from Rubi:', response);
    return response;
  } catch (error) {
    console.error('[Rubi Bridge] Failed to send context to Rubi:', error);
    return { success: false, error: error.message };
  }
}

/**
 * PHASE 9C: Load identity from session bridge if available
 */
async function loadIdentityIfAvailable() {
  if (!window.RubiSessionBridge) {
    console.log('[Rubi Bridge] SessionBridge not available for identity');
    return null;
  }
  
  try {
    console.log('[Rubi Bridge] Loading identity from SessionBridge...');
    const identity = await window.RubiSessionBridge.getCurrentIdentity();
    
    if (identity) {
      setIdentity(identity);
      console.log('[Rubi Bridge] Identity loaded successfully:', {
        userId: identity.userId,
        userName: identity.userName,
        orgName: identity.orgName,
        planTier: identity.planTier
      });
      return identity;
    } else {
      console.log('[Rubi Bridge] No identity available from SessionBridge');
      return null;
    }
  } catch (error) {
    console.error('[Rubi Bridge] Error loading identity:', error);
    return null;
  }
}

/**
 * PHASE 9C: Set the current identity context
 * 
 * @param {Object} identity - Identity object from SessionBridge
 */
function setIdentity(identity) {
  const previousIdentity = currentIdentity;
  currentIdentity = identity;
  
  console.log('[Rubi Bridge] Identity context updated');
  
  // Notify listeners if identity changed
  if (JSON.stringify(previousIdentity) !== JSON.stringify(identity)) {
    notifyIdentityListeners(identity);
  }
  
  // Update latest context with new identity
  if (latestContextPayload) {
    latestContextPayload = { ...latestContextPayload, identity };
  }
}

/**
 * PHASE 9C: Get current identity context
 * 
 * @returns {Object|null} Current identity or null
 */
function getIdentity() {
  return currentIdentity;
}

/**
 * PHASE 9C: Register callback for identity changes
 * 
 * @param {Function} callback - Callback function to be called on identity change
 */
function onIdentityChange(callback) {
  if (typeof callback === 'function') {
    identityListeners.push(callback);
    console.log('[Rubi Bridge] Registered identity change listener');
  } else {
    console.warn('[Rubi Bridge] Invalid callback provided to onIdentityChange');
  }
}

/**
 * PHASE 9C: Notify all identity listeners
 * 
 * @param {Object} identity - New identity object
 */
function notifyIdentityListeners(identity) {
  console.log(`[Rubi Bridge] Notifying ${identityListeners.length} identity listeners`);
  
  for (const callback of identityListeners) {
    try {
      callback(identity);
    } catch (error) {
      console.error('[Rubi Bridge] Error in identity listener callback:', error);
    }
  }
}

/**
 * PHASE 9C: Initialize identity on module load
 */
function initializeIdentity() {
  // Attempt to load identity asynchronously
  loadIdentityIfAvailable().then((identity) => {
    if (identity) {
      console.log('[Rubi Bridge] Identity initialized on load');
    } else {
      console.log('[Rubi Bridge] No identity available on initialization');
      // Retry after a delay in case SessionBridge loads later
      setTimeout(() => {
        loadIdentityIfAvailable();
      }, 2000);
    }
  }).catch(error => {
    console.error('[Rubi Bridge] Error initializing identity:', error);
  });
}

/**
 * Request fresh context extraction from the page
 * Triggers the context extractor if available
 */
async function requestExtraction() {
  console.log('[Rubi Bridge] Requesting context extraction');

  if (window.RubiContextExtractor?.extractContext) {
    try {
      // Get platform details (getPlatformDetails returns {platform, pageType, metadata})
      const details = await window.RubiPlatformDetector?.getPlatformDetails?.() || { platform: 'unknown', pageType: 'unknown' };
      console.log('[Rubi Bridge] Platform detected:', details.platform, '/', details.pageType);
      const result = await window.RubiContextExtractor.extractContext(details.platform, details.pageType);
      console.log('[Rubi Bridge] Extraction completed');
      return result;
    } catch (error) {
      console.error('[Rubi Bridge] Extraction failed:', error);
      return null;
    }
  } else {
    console.warn('[Rubi Bridge] Context extractor not available');
    // Just notify listeners with existing context
    notifyListeners();
    return latestContext;
  }
}

// Export for use in content scripts
if (typeof window !== 'undefined') {
  window.RubiContextBridge = {
    // Context methods
    setLatestContext,
    getLatestContext,
    clearContext,
    onNewContext,
    notifyListeners,
    sendContextToRubi,
    requestExtraction,

    // PHASE 9C: Identity methods
    loadIdentityIfAvailable,
    setIdentity,
    getIdentity,
    onIdentityChange,
    initializeIdentity
  };
  
  // Initialize identity on load
  initializeIdentity();
}