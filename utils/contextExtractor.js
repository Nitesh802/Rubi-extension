/**
 * Rubi Browser Extension - Context Extractor
 *
 * Extracts structured context from web pages using selector maps.
 * Executes primary → secondary → fallback selector strategies.
 * Returns structured context with extraction confidence and missing fields.
 */

// Navigation guard flag
let isNavigatingAway = false;

// Listen for navigation events to stop polling
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    isNavigatingAway = true;
  });
}

/**
 * Wait for Salesforce Lightning DOM to be ready
 * Polls for Lightning-specific elements before extraction
 *
 * @returns {Promise<boolean>} Resolves when DOM is ready or timeout reached
 */
async function waitForSalesforceDomReady() {
  const MAX_POLLS = 20; // 20 polls * 300ms = 6 seconds max
  const POLL_INTERVAL = 300; // 300ms between polls

  const salesforceSelectors = [
    'records-record-layout-item',
    '.slds-form-element',
    'force-record-layout',
    'force-record-layout-item',
    '[data-field-id]'
  ];

  for (let pollCount = 0; pollCount < MAX_POLLS; pollCount++) {
    // Check navigation guard
    if (isNavigatingAway) {
      console.log('[Rubi Extractor] Navigation detected, stopping Salesforce DOM polling');
      return false;
    }

    // Check if any Salesforce element is present
    for (const selector of salesforceSelectors) {
      try {
        if (document.querySelector(selector)) {
          console.log(`[Rubi Extractor] Salesforce DOM ready after ${pollCount + 1} poll(s)`);
          return true;
        }
      } catch (e) {
        // Invalid selector, continue
        continue;
      }
    }

    // Not ready yet, log and wait
    if (pollCount < MAX_POLLS - 1) {
      console.log(`[Rubi Extractor] Salesforce DOM not ready, polling... (attempt ${pollCount + 1}/${MAX_POLLS})`);
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
    }
  }

  console.warn(`[Rubi Extractor] Salesforce DOM not ready after ${MAX_POLLS} polls, proceeding with extraction anyway`);
  return false;
}

/**
 * Extract context from current page with org intelligence
 *
 * @param {string} platform - Platform identifier (e.g., 'salesforce')
 * @param {string} pageType - Page type identifier (e.g., 'opportunity')
 * @returns {Promise<Object>} Extracted context object
 */
async function extractContext(platform, pageType) {
  console.log(`[Rubi Context] Extracting context for ${platform}/${pageType}`);
  
  // Phase 11B: Load org intelligence
  let orgIntelligence = null;
  try {
    if (window.orgIntelligence) {
      orgIntelligence = await window.orgIntelligence.getIntelligence();
      console.log('[Rubi Context] Loaded org intelligence for context enrichment');
    }
  } catch (error) {
    console.warn('[Rubi Context] Failed to load org intelligence:', error);
  }

  let extractorResult = null;

  // Use Salesforce extractor for Salesforce pages
  if (platform === 'salesforce') {
    if (typeof window.RubiSalesforceExtractor !== 'undefined') {
      console.log(`[Rubi Context] Using Salesforce ${pageType} extractor`);
      try {
        extractorResult = await window.RubiSalesforceExtractor.extractSalesforceContext(pageType);
      } catch (error) {
        console.error('[Rubi Context] Salesforce extraction failed:', error);
        extractorResult = null;
      }
    } else {
      console.error('[Rubi Context] Salesforce extractor not available');
      extractorResult = null;
    }

    if (!extractorResult) {
      extractorResult = {
        platform,
        pageType,
        fields: {},
        visibleText: extractVisibleText(),
        extractionConfidence: 0,
        requiredMissing: ['opportunityName', 'stage', 'closeDate'],
        error: 'Salesforce extractor not loaded or failed'
      };
    }
  }
  // Use LinkedIn extractor for LinkedIn pages  
  else if (platform === 'linkedin') {
    if (typeof window.RubiLinkedInExtractor !== 'undefined') {
      console.log('[Rubi Context] Using LinkedIn extractor');
      try {
        extractorResult = await window.RubiLinkedInExtractor.extractLinkedInContext(pageType);
      } catch (error) {
        console.error('[Rubi Context] LinkedIn extraction failed:', error);
        extractorResult = null;
      }
    } else {
      console.error('[Rubi Context] LinkedIn extractor not available');
      extractorResult = null;
    }

    if (!extractorResult) {
      extractorResult = {
        platform,
        pageType,
        fields: {},
        visibleText: extractVisibleText(),
        extractionConfidence: 0,
        requiredMissing: ['fullName'],
        error: 'LinkedIn extractor not loaded or failed'
      };
    }
  }
  // For other platforms, use the legacy selector-based extraction
  else {
    // Get selector map
    const selectorMap = window.RubiSelectorMaps.getSelectorMap(platform, pageType);
    const requiredFields = window.RubiSelectorMaps.getRequiredFields(platform, pageType);

    if (!selectorMap) {
      console.warn(`[Rubi Context] No selector map found for ${platform}/${pageType}`);
      extractorResult = {
        platform,
        pageType,
        fields: {},
        visibleText: extractVisibleText(),
        extractionConfidence: 0,
        requiredMissing: requiredFields,
        error: 'No selector map available'
      };
    } else {
      // Extract all fields
      const extractedFields = {};
      const failedFields = [];
      let successfulExtractions = 0;
      let totalFields = 0;

      for (const [fieldName, selectors] of Object.entries(selectorMap)) {
        totalFields++;
        const value = extractField(fieldName, selectors);

        if (value !== null && value !== '') {
          extractedFields[fieldName] = value;
          successfulExtractions++;
          console.log(`[Rubi Context] ✓ ${fieldName}:`, value);
        } else {
          failedFields.push(fieldName);
          console.log(`[Rubi Context] ✗ ${fieldName}: not found`);
        }
      }

      // Calculate extraction confidence
      const confidence = totalFields > 0 ? (successfulExtractions / totalFields) * 100 : 0;

      // Identify missing required fields
      const requiredMissing = requiredFields.filter(
        field => !extractedFields[field] || extractedFields[field] === ''
      );

      // Extract visible text as fallback
      const visibleText = extractVisibleText();

      extractorResult = {
        platform,
        pageType,
        fields: extractedFields,
        visibleText,
        extractionConfidence: Math.round(confidence),
        requiredMissing: requiredMissing
      };

      console.log(`[Rubi Context] Extraction complete: ${successfulExtractions}/${totalFields} fields (${Math.round(confidence)}% confidence)`);
      if (requiredMissing.length > 0) {
        console.warn(`[Rubi Context] Missing required fields:`, requiredMissing);

        // Add user guidance for missing fields
        if (platform === 'salesforce' && (requiredMissing.includes('stage') || requiredMissing.includes('closeDate'))) {
          extractorResult.guidanceMessage = 'Navigate to the Details tab or scroll to load all required fields.';
          console.warn(`[Rubi Context] User guidance: Navigate to the appropriate tab or details view to see all required fields.`);
        }
      }
    }
  }

  // Check debug flag and log raw extractor result
  if (typeof window.RubiContextHelpers !== 'undefined' && window.RubiContextHelpers.DEBUG_CONTEXT) {
    console.log("[Rubi Context] Raw extractor result:", extractorResult);
  }

  // Build normalized payload using contextPayload helper
  if (typeof window.RubiContextPayload !== 'undefined' && window.RubiContextPayload.buildRubiContextPayload) {
    const payload = window.RubiContextPayload.buildRubiContextPayload(extractorResult);
    
    // Phase 11B: Enrich payload with org intelligence
    if (orgIntelligence) {
      payload.orgIntelligence = {
        companyName: orgIntelligence.companyIdentity?.companyName,
        valueProps: orgIntelligence.valuePropositions,
        icp: orgIntelligence.icp,
        messagingRules: orgIntelligence.messagingRules
      };
      console.log('[Rubi Context] Enriched context with org intelligence');
    }

    // Log payload if debug is enabled
    if (typeof window.RubiContextHelpers !== 'undefined' && window.RubiContextHelpers.DEBUG_CONTEXT) {
      console.log("[Rubi Context] Normalized payload:", payload);
    } else {
      console.log("[Rubi Context] Built payload");
    }

    // Send payload via chrome.runtime.sendMessage
    try {
      chrome.runtime.sendMessage({
        type: "RUBI_CONTEXT_EXTRACTED",
        payload
      });
      console.log("[Rubi Context] Built payload:", payload);
    } catch (error) {
      console.error("[Rubi Context] Failed to send message:", error);
    }

    // Store context in bridge and notify listeners
    if (typeof window.RubiContextBridge !== 'undefined') {
      window.RubiContextBridge.setLatestContext(payload);
      window.RubiContextBridge.notifyListeners();
      console.log("[Rubi Bridge] Context stored:", payload);
    } else {
      console.warn("[Rubi Context] Context bridge not available");
    }

    return payload;
  } else {
    console.error('[Rubi Context] Context payload builder not available');
    return extractorResult;
  }
}

/**
 * Extract a single field using type-based strategy
 *
 * @param {string} fieldName - Field name
 * @param {Object} selectors - Selector configuration
 * @returns {string|null} Extracted value or null
 */
function extractField(fieldName, selectors) {
  // Check if this is a label-based extraction (Salesforce)
  if (selectors.type === 'label') {
    return extractFieldByLabel(selectors.label, fieldName);
  }

  // Legacy selector-based extraction (Gmail, LinkedIn, etc.)
  // Try primary selectors
  if (selectors.primary && Array.isArray(selectors.primary)) {
    for (const selector of selectors.primary) {
      const value = extractBySelector(selector);
      if (value) {
        return value;
      }
    }
  }

  // Try secondary selectors
  if (selectors.secondary && Array.isArray(selectors.secondary)) {
    for (const selector of selectors.secondary) {
      const value = extractBySelector(selector);
      if (value) {
        return value;
      }
    }
  }

  // Try fallback strategy
  if (selectors.fallback) {
    const value = executeFallbackStrategy(selectors.fallback, fieldName);
    if (value) {
      return value;
    }
  }

  return null;
}

/**
 * Extract field value by label (Salesforce-specific)
 *
 * @param {string} labelText - Label text to search for
 * @param {string} fieldName - Field name (for logging)
 * @returns {string|null} Extracted value or null
 */
function extractFieldByLabel(labelText, fieldName) {
  // Check if context helpers are available
  if (typeof window.RubiContextHelpers === 'undefined') {
    console.warn(`[Rubi Extractor] Context helpers not available for label extraction: ${fieldName}`);
    return null;
  }

  // Use extractByLabel helper
  const value = window.RubiContextHelpers.extractByLabel(labelText);

  if (!value) {
    console.log(`[Rubi Extractor] Label-based extraction failed for "${labelText}" (${fieldName})`);
  }

  return value;
}

/**
 * Extract value using a CSS selector
 *
 * @param {string} selector - CSS selector
 * @returns {string|null} Extracted text or null
 */
function extractBySelector(selector) {
  try {
    const element = document.querySelector(selector);
    if (!element) {
      return null;
    }

    // Get text content, trimmed
    let text = element.textContent || element.innerText || '';
    text = text.trim();

    // If element is an input or textarea, get value instead
    if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
      text = element.value.trim();
    }

    // If element is contenteditable, get innerHTML
    if (element.contentEditable === 'true') {
      text = element.innerText.trim();
    }

    return text || null;
  } catch (error) {
    console.error(`[Rubi Extractor] Selector error: ${selector}`, error);
    return null;
  }
}

/**
 * Execute a fallback extraction strategy
 *
 * @param {Object} fallback - Fallback configuration
 * @param {string} fieldName - Field name for context
 * @returns {string|null} Extracted value or null
 */
function executeFallbackStrategy(fallback, fieldName) {
  switch (fallback.strategy) {
    case 'scan-headings':
      return scanHeadings(fallback.pattern);

    case 'scan-labels':
      return scanByLabel(fallback.label);

    case 'scan-nearby-label':
      return findValueByNearbyLabel(fallback.label);

    case 'scan-currency':
      return scanByPattern(fallback.pattern);

    case 'scan-dates':
      return scanByPattern(fallback.pattern);

    case 'scan-email':
      return scanByPattern(fallback.pattern);

    case 'scan-phone':
      return scanByPattern(fallback.pattern);

    case 'scan-contenteditable':
      return scanContentEditable(fallback.selector);

    case 'scan-dialog-heading':
      return scanDialogHeading(fallback.selector);

    case 'scan-known-stages':
      return scanKnownStages();

    case 'scan-percentage':
      return scanByPattern(fallback.pattern);

    default:
      console.warn(`[Rubi Extractor] Unknown fallback strategy: ${fallback.strategy}`);
      return null;
  }
}

/**
 * Scan page headings for matching pattern
 */
function scanHeadings(pattern) {
  const headings = document.querySelectorAll('h1, h2, h3');
  for (const heading of headings) {
    const text = heading.textContent.trim();
    if (pattern && pattern.test && pattern.test(text)) {
      return text;
    }
  }
  return null;
}

/**
 * Scan for field by label text
 */
function scanByLabel(labelText) {
  // Try to find label element
  const labels = document.querySelectorAll('label, .slds-form-element__label, [data-field-label]');
  for (const label of labels) {
    if (label.textContent.includes(labelText)) {
      // Try to find associated value
      const parent = label.closest('.slds-form-element, .uiInput, [class*="field"]');
      if (parent) {
        const value = parent.querySelector('.slds-form-element__static, .uiOutputText, output');
        if (value) {
          return value.textContent.trim();
        }
      }
    }
  }
  return null;
}

/**
 * Find value by nearby label text
 * Searches DOM for label elements and extracts adjacent/related values
 *
 * @param {string} labelText - Label text to search for
 * @returns {string|null} Extracted value or null
 */
function findValueByNearbyLabel(labelText) {
  // Search all potential label elements
  const allElements = document.querySelectorAll('*');

  for (const element of allElements) {
    const text = element.textContent.trim();

    // Skip if element has too much text (not a label)
    if (text.length > 100) continue;

    // Check if element text matches or starts with label text
    if (text === labelText || text.startsWith(labelText)) {
      // Strategy 1: Check next sibling
      let nextSibling = element.nextElementSibling;
      if (nextSibling) {
        const siblingText = nextSibling.textContent.trim();
        // Make sure sibling isn't another label
        if (siblingText && siblingText.length > 0 && siblingText !== labelText) {
          return siblingText;
        }
      }

      // Strategy 2: Check parent's next child
      const parent = element.parentElement;
      if (parent) {
        const children = Array.from(parent.children);
        const elementIndex = children.indexOf(element);

        if (elementIndex >= 0 && elementIndex < children.length - 1) {
          const nextChild = children[elementIndex + 1];
          const childText = nextChild.textContent.trim();

          if (childText && childText !== labelText && childText.length > 0) {
            return childText;
          }
        }

        // Strategy 3: Look for value class in parent
        const valueElement = parent.querySelector(
          '.slds-form-element__static, .uiOutputText, .test-id__field-value, output, [class*="value"]'
        );

        if (valueElement && valueElement !== element) {
          const valueText = valueElement.textContent.trim();
          if (valueText && valueText !== labelText) {
            return valueText;
          }
        }
      }

      // Strategy 4: Check immediate children
      if (element.children.length > 0) {
        for (const child of element.children) {
          const childText = child.textContent.trim();
          if (childText && childText !== labelText && childText !== text) {
            return childText;
          }
        }
      }
    }
  }

  return null;
}

/**
 * Scan page text for pattern match
 */
function scanByPattern(pattern) {
  const bodyText = document.body.innerText;
  const match = bodyText.match(pattern);
  return match ? match[0] : null;
}

/**
 * Scan for contenteditable elements
 */
function scanContentEditable(selector) {
  const elements = document.querySelectorAll(selector || '[contenteditable="true"]');
  for (const element of elements) {
    const text = element.innerText.trim();
    if (text.length > 0) {
      return text;
    }
  }
  return null;
}

/**
 * Scan dialog for heading
 */
function scanDialogHeading(selector) {
  const elements = document.querySelectorAll(selector);
  for (const element of elements) {
    const text = element.textContent.trim();
    if (text.length > 0) {
      return text;
    }
  }
  return null;
}

/**
 * Scan for known Salesforce opportunity stages
 */
function scanKnownStages() {
  const knownStages = [
    'prospecting', 'qualification', 'needs analysis', 'value proposition',
    'id. decision makers', 'perception analysis', 'proposal/price quote',
    'negotiation/review', 'closed won', 'closed lost'
  ];

  // First try to find the active stage in the stage pipeline (more accurate)
  const activeStageElements = document.querySelectorAll('div[title*="Current Stage"], .slds-is-current, .slds-is-active, [aria-current="true"]');
  for (const element of activeStageElements) {
    const text = element.textContent.trim();
    for (const stage of knownStages) {
      if (text.toLowerCase().includes(stage.toLowerCase())) {
        return stage.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
      }
    }
  }

  // Fallback to general text search
  const allText = document.body.innerText.toLowerCase();
  
  for (const stage of knownStages) {
    if (allText.includes(stage.toLowerCase())) {
      // Find the exact case version in the DOM
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );

      let node;
      while (node = walker.nextNode()) {
        const text = node.textContent.trim();
        if (text.toLowerCase().includes(stage.toLowerCase()) && text.length < 50) {
          // Return a properly formatted stage name
          return stage.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        }
      }
    }
  }
  
  return null;
}

/**
 * Extract visible text from page (fallback for missing fields)
 * Captures main content, excluding navigation and boilerplate
 *
 * @returns {string} Visible text content
 */
function extractVisibleText() {
  // For Salesforce, focus on record detail area
  let mainContent = document.querySelector(
    '.slds-page-header, .forcePageHeader, main, [role="main"], .record-body'
  );

  // For Gmail/Outlook, focus on compose/message area
  if (!mainContent) {
    mainContent = document.querySelector(
      '[role="main"], .nH, [data-app-section]'
    );
  }

  // Fallback to body
  if (!mainContent) {
    mainContent = document.body;
  }

  // Extract text, limiting to first 5000 characters
  let text = mainContent.innerText || mainContent.textContent || '';
  text = text.trim();

  // Clean up extra whitespace
  text = text.replace(/\s+/g, ' ');

  // Limit length
  if (text.length > 5000) {
    text = text.substring(0, 5000) + '...';
  }

  return text;
}

/**
 * Extract multiple elements (for lists like participants)
 *
 * @param {string} selector - CSS selector
 * @returns {Array<string>} Array of extracted values
 */
function extractMultiple(selector) {
  const elements = document.querySelectorAll(selector);
  const values = [];

  for (const element of elements) {
    const text = element.textContent.trim();
    if (text && !values.includes(text)) {
      values.push(text);
    }
  }

  return values;
}

/**
 * Generate extraction summary for logging/debugging
 *
 * @param {Object} context - Extracted context
 * @returns {string} Summary string
 */
function generateExtractionSummary(context) {
  const lines = [
    `Platform: ${context.platform}`,
    `Page Type: ${context.pageType}`,
    `Confidence: ${context.extractionConfidence}%`,
    `Fields Extracted: ${Object.keys(context.fields).length}`,
    `Missing Required: ${context.requiredMissing && context.requiredMissing.length > 0 ? context.requiredMissing.join(', ') : 'none'}`
  ];

  return lines.join('\n');
}

// Export for use in content scripts
if (typeof window !== 'undefined') {
  window.RubiContextExtractor = {
    extractContext,
    extractField,
    extractBySelector,
    extractVisibleText,
    generateExtractionSummary
  };
}
