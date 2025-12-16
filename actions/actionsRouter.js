/**
 * Rubi Browser Extension - Actions Router
 *
 * Routes and executes Rubi actions with validation and error handling.
 * Provides the main interface for running actions and getting context menus.
 * Integrates with backend API and falls back to local stubs when needed.
 */

/**
 * Run a specific action with the provided context payload
 * Attempts to use backend first, falls back to stubs on failure
 *
 * @param {string} actionId - ID of the action to run
 * @param {Object} contextPayload - Context data to pass to the action
 * @returns {Promise} Promise that resolves with action result
 */
async function runAction(actionId, contextPayload) {
  console.log(`[Rubi Actions Router] Running action: ${actionId}`);
  
  // Validate action exists
  if (typeof window.RubiActionsRegistry === 'undefined') {
    const error = 'Actions registry not available';
    console.error(`[Rubi Actions Router] ${error}`);
    throw new Error(error);
  }
  
  const action = window.RubiActionsRegistry.getAction(actionId);
  if (!action) {
    const error = `Action ${actionId} not found in registry`;
    console.error(`[Rubi Actions Router] ${error}`);
    throw new Error(error);
  }
  
  // Validate context payload
  if (typeof window.RubiActionsUtils !== 'undefined') {
    const validation = window.RubiActionsUtils.validateContextPayload(contextPayload);
    if (!validation.valid) {
      const error = `Invalid context payload: ${validation.errors.join(', ')}`;
      console.error(`[Rubi Actions Router] ${error}`);
      throw new Error(error);
    }
  }
  
  // Add defensive checks for missing fields
  if (!contextPayload) {
    const error = 'Context payload is empty';
    console.error(`[Rubi Actions Router] ${error}`);
    return { success: false, error };
  }
  
  const platform = contextPayload?.platform || 'unknown';
  const pageType = contextPayload?.pageType || 'unknown';
  
  // Log warning if platform or pageType is missing but continue
  if (platform === 'unknown' || pageType === 'unknown') {
    console.warn(`[Rubi Actions Router] Missing platform or pageType in context payload`);
  }
  
  // Validate platform/pageType match
  const platformMatch = action.platforms.includes('any') || action.platforms.includes(platform);
  const pageTypeMatch = action.pageTypes.includes('any') || action.pageTypes.includes(pageType);
  
  if (!platformMatch || !pageTypeMatch) {
    const error = `Action ${actionId} not compatible with ${platform}/${pageType}`;
    console.error(`[Rubi Actions Router] ${error}`);
    throw new Error(error);
  }
  
  console.log(`[Rubi Actions Router] Executing action ${actionId} for ${platform}/${pageType}`);
  
  let result;
  let backendSuccess = false;
  
  // Check if this action should use backend
  const useBackend = action.useBackend !== false; // Default to true unless explicitly false
  const fallbackStrategy = action.fallbackStrategy || 'backend-then-stub';
  
  // Try backend first if enabled and available
  if (useBackend && typeof window.RubiBackendClient !== 'undefined') {
    console.log(`[Rubi Actions Router] Attempting backend execution for ${actionId}`);
    
    try {
      // Check if backend is available
      const backendAvailable = await window.RubiBackendClient.isBackendAvailable();
      
      if (backendAvailable) {
        // PHASE 9C: Load identity for backend request
        let identity = null;
        if (window.RubiContextBridge?.getIdentity) {
          identity = window.RubiContextBridge.getIdentity();
        }
        if (!identity && window.RubiSessionBridge?.getCurrentIdentity) {
          try {
            identity = await window.RubiSessionBridge.getCurrentIdentity();
          } catch (error) {
            console.warn('[Rubi Actions Router] Could not load identity:', error);
          }
        }
        
        // Phase 11B: Load org intelligence if available
        let orgIntelligence = null;
        if (window.orgIntelligence) {
          try {
            orgIntelligence = await window.orgIntelligence.getIntelligence();
            console.log('[Rubi Actions Router] Loaded org intelligence for action');
          } catch (error) {
            console.warn('[Rubi Actions Router] Failed to load org intelligence:', error);
          }
        }
        
        // Prepare payload for backend with identity and org intelligence
        const backendPayload = {
          source: contextPayload.source || 'browser-extension',
          platform: contextPayload.platform || 'unknown',
          pageType: contextPayload.pageType || 'unknown',
          fields: contextPayload.fields || {},
          // PHASE 9C: Include identity in payload
          identity: identity || contextPayload.identity || null,
          // Phase 11B: Include org intelligence
          orgIntelligence: orgIntelligence ? {
            companyName: orgIntelligence.companyIdentity?.companyName,
            valueProps: orgIntelligence.valuePropositions,
            icp: orgIntelligence.icp,
            messagingRules: orgIntelligence.messagingRules,
            differentiators: orgIntelligence.differentiators,
            buyerPersonas: orgIntelligence.buyerPersonas
          } : contextPayload.orgIntelligence || null,
          extractionConfidence: contextPayload.extractionConfidence || 0,
          requiredMissing: contextPayload.requiredMissing || [],
          visibleText: contextPayload.visibleText || '',
          url: contextPayload.url || window.location?.href || '',
          title: contextPayload.title || document?.title || '',
          timestamp: contextPayload.timestamp || new Date().toISOString()
        };
        
        // Log identity inclusion
        if (backendPayload.identity) {
          console.log('[Rubi Actions Router] Including identity in backend call:', {
            userId: backendPayload.identity.userId,
            orgName: backendPayload.identity.orgName,
            planTier: backendPayload.identity.planTier,
            roles: backendPayload.identity.roles
          });
        } else {
          console.log('[Rubi Actions Router] No identity available for backend call');
        }
        
        // Call backend
        const backendResponse = await window.RubiBackendClient.executeAction(actionId, backendPayload);
        
        if (backendResponse.success) {
          console.log(`[Rubi Actions Router] Backend execution successful for ${actionId}`);
          result = backendResponse.data;
          backendSuccess = true;
        } else {
          console.warn(`[Rubi Actions Router] Backend execution failed for ${actionId}: ${backendResponse.error}`);
          
          // Phase 10C: Check if this is a policy block
          if (backendResponse.executionMetadata?.policy?.reason) {
            const reason = backendResponse.executionMetadata.policy.reason;
            const policyMessages = {
              'org_disabled': 'Rubi AI is currently disabled for your organization.',
              'extension_disabled': 'The Rubi browser extension is not enabled for your organization.',
              'org_daily_limit_exceeded': 'Your organization has reached today\'s Rubi AI usage limit.',
              'user_daily_limit_exceeded': 'You\'ve reached today\'s Rubi AI usage limit.',
              'domain_not_allowed': 'Rubi AI isn\'t enabled for this site.',
              'action_not_allowed': 'This action has been disabled by your organization administrator.'
            };
            
            const message = policyMessages[reason] || backendResponse.error || 'This action is disabled for your organization.';
            console.log(`[Rubi Actions Router] Policy block detected: ${reason}`);
            
            return {
              success: false,
              error: message,
              policyBlock: true,
              policyReason: reason,
              executionMetadata: backendResponse.executionMetadata
            };
          }
          
          // Check fallback strategy
          if (fallbackStrategy === 'backend-only') {
            throw new Error(`Backend failed: ${backendResponse.error}`);
          }
          // Otherwise, we'll fall back to stub
        }
      } else {
        console.warn(`[Rubi Actions Router] Backend not available for ${actionId}`);
      }
    } catch (backendError) {
      console.error(`[Rubi Actions Router] Backend error for ${actionId}:`, backendError);
      
      // Check fallback strategy
      if (fallbackStrategy === 'backend-only') {
        throw backendError;
      }
      // Otherwise, continue to stub fallback
    }
  }
  
  // Fall back to stub if backend didn't succeed
  if (!backendSuccess) {
    console.log(`[Rubi Actions Router] Using stub implementation for ${actionId}`);
    
    try {
      if (typeof window.RubiActionsUtils !== 'undefined') {
        result = await window.RubiActionsUtils.safeRunHandler(action.handler, contextPayload);
      } else {
        result = await action.handler(contextPayload);
      }
      
      console.log(`[Rubi Actions Router] Stub execution successful for ${actionId}`);
    } catch (stubError) {
      console.error(`[Rubi Actions Router] Both backend and stub failed for ${actionId}:`, stubError);
      
      // If both backend and stub fail, return a user-friendly error
      return {
        success: false,
        error: "We couldn't reach SuccessLAB Intelligence right now. Try again in a few minutes.",
        details: stubError.message
      };
    }
  }
  
  console.log(`[Rubi Actions Router] Action ${actionId} completed successfully`);
  
  // Write action result to memory store if available
  try {
    if (window.RubiMemoryStore) {
      // Initialize if needed
      await window.RubiMemoryStore.initMemoryStore();
      
      // Get entity key from context payload
      const entityKey = window.RubiMemoryStore.getEntityKey(contextPayload);
      if (entityKey) {
        // Create summary from result
        let summary = `Ran ${action.label || actionId}`;
        
        // Try to extract key metrics from result for summary
        if (result && typeof result === 'object') {
          const summaryParts = [];
          
          // Common result patterns
          if (result.clarity !== undefined) summaryParts.push(`Clarity ${result.clarity}/10`);
          if (result.relevance !== undefined) summaryParts.push(`Relevance ${result.relevance}/10`);
          if (result.risk !== undefined) summaryParts.push(`Risk: ${result.risk}`);
          if (result.score !== undefined) summaryParts.push(`Score: ${result.score}`);
          if (result.recommendation) summaryParts.push(result.recommendation.substring(0, 50));
          if (result.summary) summaryParts.push(result.summary.substring(0, 50));
          
          if (summaryParts.length > 0) {
            summary += ` (${summaryParts.slice(0, 2).join(', ')})`;
          }
        }
        
        // Create history entry
        const historyEntry = {
          type: 'action',
          platform: contextPayload.platform || 'unknown',
          pageType: contextPayload.pageType || 'unknown',
          summary: summary,
          payload: result,
          actionName: actionId,
          source: backendSuccess ? 'backend' : 'stub'
        };
        
        // Add to history (non-blocking)
        window.RubiMemoryStore.addHistoryEntry(entityKey, historyEntry).catch(err => {
          console.warn('[Rubi Actions Router] Failed to add history entry:', err);
        });
        
        console.log('[Rubi Actions Router] Added action result to memory for entity:', entityKey);
      }
    } else {
      console.log('[Rubi Memory] Memory store not available, skipping history update');
    }
  } catch (error) {
    console.warn('[Rubi Actions Router] Error writing to memory store:', error);
    // Continue without breaking action flow
  }
  
  return result;
}

/**
 * Get menu of available actions for the given context
 *
 * @param {Object} contextPayload - Context data to filter actions against
 * @returns {Array} Array of action objects suitable for menu display
 */
function getMenuForContext(contextPayload) {
  console.log(`[Rubi Actions Router] Getting menu for context`);
  
  if (typeof window.RubiActionsRegistry === 'undefined') {
    console.error(`[Rubi Actions Router] Actions registry not available`);
    return [];
  }
  
  const availableActions = window.RubiActionsRegistry.getActionsForContext(contextPayload);
  
  // Transform actions into menu format
  const menuItems = availableActions.map(action => ({
    id: action.id,
    label: action.label,
    description: action.description,
    platforms: action.platforms,
    pageTypes: action.pageTypes,
    useBackend: action.useBackend !== false,
    fallbackStrategy: action.fallbackStrategy || 'backend-then-stub'
  }));
  
  console.log(`[Rubi Actions Router] Generated menu with ${menuItems.length} actions`);
  return menuItems;
}

/**
 * Check if an action is available for the given context
 *
 * @param {string} actionId - Action to check
 * @param {Object} contextPayload - Context to check against
 * @returns {boolean} True if action is available
 */
function isActionAvailable(actionId, contextPayload) {
  if (typeof window.RubiActionsRegistry === 'undefined') {
    return false;
  }
  
  const action = window.RubiActionsRegistry.getAction(actionId);
  if (!action) {
    return false;
  }
  
  const platform = contextPayload?.platform || 'unknown';
  const pageType = contextPayload?.pageType || 'unknown';
  
  const platformMatch = action.platforms.includes('any') || action.platforms.includes(platform);
  const pageTypeMatch = action.pageTypes.includes('any') || action.pageTypes.includes(pageType);
  
  return platformMatch && pageTypeMatch;
}

// Export for use in content scripts
if (typeof window !== 'undefined') {
  window.RubiActionsRouter = {
    runAction,
    getMenuForContext,
    isActionAvailable
  };
}