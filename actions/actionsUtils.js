/**
 * Rubi Browser Extension - Actions Utilities
 *
 * Utility functions for action validation, execution, and filtering.
 * Provides common helpers used throughout the actions system.
 */

/**
 * Validate context payload structure and content
 *
 * @param {Object} payload - Context payload to validate
 * @returns {Object} Validation result with valid boolean and errors array
 */
function validateContextPayload(payload) {
  const errors = [];
  
  if (!payload) {
    errors.push('Payload is null or undefined');
    return { valid: false, errors };
  }
  
  if (typeof payload !== 'object') {
    errors.push('Payload must be an object');
    return { valid: false, errors };
  }
  
  // Check required fields
  if (!payload.source) {
    errors.push('Missing required field: source');
  }
  
  if (!payload.platform) {
    errors.push('Missing required field: platform');
  }
  
  if (!payload.pageType) {
    errors.push('Missing required field: pageType');
  }
  
  if (!payload.timestamp) {
    errors.push('Missing required field: timestamp');
  }
  
  // Check optional but expected fields
  if (payload.fields && typeof payload.fields !== 'object') {
    errors.push('Field "fields" must be an object');
  }
  
  if (payload.extractionConfidence !== null && 
      payload.extractionConfidence !== undefined && 
      typeof payload.extractionConfidence !== 'number') {
    errors.push('Field "extractionConfidence" must be a number');
  }
  
  if (payload.requiredMissing && !Array.isArray(payload.requiredMissing)) {
    errors.push('Field "requiredMissing" must be an array');
  }
  
  const isValid = errors.length === 0;
  return { valid: isValid, errors };
}

/**
 * Safely execute an action handler with error handling
 *
 * @param {Function} handler - Action handler function to execute
 * @param {Object} contextPayload - Context data to pass to handler
 * @returns {Promise<Object>} Result object with success, data, and error
 */
async function safeRunHandler(handler, contextPayload) {
  try {
    if (typeof handler !== 'function') {
      throw new Error('Handler is not a function');
    }
    
    const result = await handler(contextPayload);
    
    return {
      success: true,
      data: result,
      error: null
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      error: error.message || 'Unknown error occurred'
    };
  }
}

/**
 * Filter actions by platform
 *
 * @param {Array} actions - Array of actions to filter
 * @param {string} platform - Platform to filter by
 * @returns {Array} Filtered actions
 */
function filterByPlatform(actions, platform) {
  if (!Array.isArray(actions)) {
    return [];
  }
  
  return actions.filter(action => {
    if (!action.platforms || !Array.isArray(action.platforms)) {
      return false;
    }
    
    return action.platforms.includes('any') || action.platforms.includes(platform);
  });
}

/**
 * Filter actions by page type
 *
 * @param {Array} actions - Array of actions to filter
 * @param {string} pageType - Page type to filter by
 * @returns {Array} Filtered actions
 */
function filterByPageType(actions, pageType) {
  if (!Array.isArray(actions)) {
    return [];
  }
  
  return actions.filter(action => {
    if (!action.pageTypes || !Array.isArray(action.pageTypes)) {
      return false;
    }
    
    return action.pageTypes.includes('any') || action.pageTypes.includes(pageType);
  });
}

/**
 * Filter actions by both platform and page type
 *
 * @param {Array} actions - Array of actions to filter
 * @param {string} platform - Platform to filter by
 * @param {string} pageType - Page type to filter by
 * @returns {Array} Filtered actions
 */
function filterByContext(actions, platform, pageType) {
  let filtered = filterByPlatform(actions, platform);
  filtered = filterByPageType(filtered, pageType);
  return filtered;
}

/**
 * Check if a payload has minimum required data for actions
 *
 * @param {Object} payload - Context payload to check
 * @returns {boolean} True if payload has sufficient data
 */
function hasMinimumData(payload) {
  if (!payload) return false;
  
  // Must have basic platform/page info
  if (!payload.platform || !payload.pageType) return false;
  
  // Must have some content (fields or visible text)
  const hasFields = payload.fields && Object.keys(payload.fields).length > 0;
  const hasVisibleText = payload.visibleText && payload.visibleText.length > 0;
  
  return hasFields || hasVisibleText;
}

/**
 * Extract a snippet of text from context payload for display
 *
 * @param {Object} payload - Context payload
 * @param {number} maxLength - Maximum length of snippet (default 500)
 * @returns {string} Text snippet
 */
function extractSnippet(payload, maxLength = 500) {
  if (!payload) return 'No context available';
  
  let text = '';
  
  // Try to get text from fields first
  if (payload.fields && Object.keys(payload.fields).length > 0) {
    const fieldValues = Object.values(payload.fields).filter(v => typeof v === 'string');
    text = fieldValues.join(' ');
  }
  
  // Fall back to visible text
  if (!text && payload.visibleText) {
    text = payload.visibleText;
  }
  
  // Fallback message
  if (!text) {
    text = `${payload.platform || 'unknown'} page (${payload.pageType || 'unknown'})`;
  }
  
  // Truncate if needed
  if (text.length > maxLength) {
    text = text.substring(0, maxLength).trim();
  }
  
  return text;
}

// Export for use in content scripts
if (typeof window !== 'undefined') {
  window.RubiActionsUtils = {
    validateContextPayload,
    safeRunHandler,
    filterByPlatform,
    filterByPageType,
    filterByContext,
    hasMinimumData,
    extractSnippet
  };
}