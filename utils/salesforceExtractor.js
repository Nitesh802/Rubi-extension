/**
 * Rubi Browser Extension - Salesforce Extractor
 *
 * Salesforce-specific context extraction using DOM heuristics and polling.
 * Follows the LinkedIn extractor architecture pattern.
 */

/**
 * Extract Salesforce context based on page type
 *
 * @param {string} pageType - Salesforce page type (opportunity, account, contact)
 * @returns {Promise<Object>} Extracted context object
 */
async function extractSalesforceContext(pageType) {
  console.log(`[Rubi SF Extractor] Starting extraction for page type: ${pageType}`);

  // Wait for Salesforce Lightning DOM to be ready
  await waitForSalesforceDOMReady(pageType);

  // Route to page-specific extractor
  switch (pageType) {
    case 'opportunity':
      return await extractSalesforceOpportunity();
    case 'account':
      return await extractSalesforceAccount();
    case 'contact':
      return await extractSalesforceContact();
    default:
      return extractSalesforceUnknown();
  }
}

/**
 * Wait for Salesforce Lightning DOM to hydrate
 *
 * @param {string} pageType - Salesforce page type
 * @returns {Promise<boolean>} True if ready, false if timeout
 */
async function waitForSalesforceDOMReady(pageType) {
  const MAX_POLLS = 15;
  const POLL_INTERVAL = 200;

  const selectors = {
    opportunity: 'records-record-layout-item, force-record-layout-item, .slds-page-header__title',
    account: 'records-record-layout-item, force-record-layout-item, .slds-page-header__title',
    contact: 'records-record-layout-item, force-record-layout-item, .slds-page-header__title'
  };

  const targetSelector = selectors[pageType] || 'records-record-layout-item';

  for (let attempt = 1; attempt <= MAX_POLLS; attempt++) {
    const element = document.querySelector(targetSelector);
    if (element) {
      console.log(`[Rubi SF Extractor] DOM ready after ${attempt} poll(s)`);
      
      // Wait a bit more for Lightning components to fully hydrate
      await new Promise(resolve => setTimeout(resolve, 300));
      return true;
    }

    if (attempt < MAX_POLLS) {
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
    }
  }

  console.warn('[Rubi SF Extractor] DOM not ready after polling');
  return false;
}

/**
 * Trigger Salesforce sections to load by scrolling
 * Salesforce Lightning lazy-loads sections as you scroll
 */
async function scrollToBottom() {
  console.log('[Rubi SF Extractor] Triggering lazy section loading by scrolling');
  
  // Get initial scroll position and page height
  const initialScrollY = window.scrollY;
  const initialHeight = document.body.scrollHeight;
  
  // Scroll to bottom to trigger lazy loading
  window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  
  // Wait for potential content to load
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Check if new content was loaded
  const newHeight = document.body.scrollHeight;
  if (newHeight > initialHeight) {
    console.log('[Rubi SF Extractor] New content loaded after scrolling');
  }
  
  // Scroll back to original position
  window.scrollTo({ top: initialScrollY, behavior: 'smooth' });
  
  // Wait for scroll to complete
  await new Promise(resolve => setTimeout(resolve, 300));
}

/**
 * Extract Salesforce Opportunity context
 *
 * @returns {Promise<Object>} Extracted opportunity context
 */
async function extractSalesforceOpportunity() {
  console.log('[Rubi SF Extractor] Extracting opportunity data');
  
  // Trigger section loading by scrolling
  await scrollToBottom();

  const fields = {
    opportunityName: null,
    stage: null,
    amount: null,
    closeDate: null,
    accountName: null,
    probability: null,
    description: null,
    nextStep: null,
    ownerName: null
  };

  // Get selector map for opportunity page
  const selectorMap = window.RubiSalesforceSelectorMap?.getSalesforceSelectorMap('opportunity');
  if (!selectorMap) {
    console.warn('[Rubi SF Extractor] Opportunity selector map not available');
    return buildErrorResponse('opportunity', 'Selector map not available');
  }

  // Extract each field using multi-layer selector resolution
  for (const [fieldName, selectors] of Object.entries(selectorMap)) {
    const value = extractFieldWithSelectors(fieldName, selectors);
    fields[fieldName] = value;

    if (value) {
      console.log(`[Rubi SF Extractor] ✓ ${fieldName}: ${value}`);
    } else {
      console.log(`[Rubi SF Extractor] ✗ ${fieldName}: not found`);
    }
  }

  // Calculate confidence and build context
  return buildContextResponse('opportunity', fields);
}

/**
 * Extract Salesforce Account context
 *
 * @returns {Promise<Object>} Extracted account context
 */
async function extractSalesforceAccount() {
  console.log('[Rubi SF Extractor] Extracting account data');
  
  // Trigger section loading by scrolling
  await scrollToBottom();

  const fields = {
    accountName: null,
    industry: null,
    annualRevenue: null,
    employees: null,
    website: null,
    billingAddress: null
  };

  // Get selector map for account page
  const selectorMap = window.RubiSalesforceSelectorMap?.getSalesforceSelectorMap('account');
  if (!selectorMap) {
    console.warn('[Rubi SF Extractor] Account selector map not available');
    return buildErrorResponse('account', 'Selector map not available');
  }

  // Extract each field using multi-layer selector resolution
  for (const [fieldName, selectors] of Object.entries(selectorMap)) {
    const value = extractFieldWithSelectors(fieldName, selectors);
    fields[fieldName] = value;

    if (value) {
      console.log(`[Rubi SF Extractor] ✓ ${fieldName}: ${value}`);
    } else {
      console.log(`[Rubi SF Extractor] ✗ ${fieldName}: not found`);
    }
  }

  // Calculate confidence and build context
  return buildContextResponse('account', fields);
}

/**
 * Extract Salesforce Contact context
 *
 * @returns {Promise<Object>} Extracted contact context
 */
async function extractSalesforceContact() {
  console.log('[Rubi SF Extractor] Extracting contact data');
  
  // Trigger section loading by scrolling
  await scrollToBottom();

  const fields = {
    contactName: null,
    title: null,
    accountName: null,
    email: null,
    phone: null
  };

  // Get selector map for contact page
  const selectorMap = window.RubiSalesforceSelectorMap?.getSalesforceSelectorMap('contact');
  if (!selectorMap) {
    console.warn('[Rubi SF Extractor] Contact selector map not available');
    return buildErrorResponse('contact', 'Selector map not available');
  }

  // Extract each field using multi-layer selector resolution
  for (const [fieldName, selectors] of Object.entries(selectorMap)) {
    const value = extractFieldWithSelectors(fieldName, selectors);
    fields[fieldName] = value;

    if (value) {
      console.log(`[Rubi SF Extractor] ✓ ${fieldName}: ${value}`);
    } else {
      console.log(`[Rubi SF Extractor] ✗ ${fieldName}: not found`);
    }
  }

  // Calculate confidence and build context
  return buildContextResponse('contact', fields);
}

/**
 * Extract Salesforce unknown page context
 *
 * @returns {Object} Empty context
 */
function extractSalesforceUnknown() {
  console.log('[Rubi SF Extractor] Unknown Salesforce page type');

  const visibleText = extractVisibleText();

  return {
    platform: 'salesforce',
    pageType: 'unknown',
    fields: {},
    visibleText,
    extractionConfidence: 0,
    requiredMissing: [],
    missingFields: [], // Backwards compatibility
    guidanceMessage: 'This Salesforce page type does not support structured extraction.',
    timestamp: new Date().toISOString(),
    url: window.location.href
  };
}

/**
 * Extract field value using multi-layer selector resolution
 * Primary → Secondary → Fallback
 *
 * @param {string} fieldName - Field name
 * @param {Object} selectors - Selector configuration
 * @returns {string|null} Extracted value or null
 */
function extractFieldWithSelectors(fieldName, selectors) {
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
    const value = executeSalesforceFallbackStrategy(selectors.fallback, fieldName);
    if (value) {
      return value;
    }
  }

  return null;
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
    let text = '';
    
    // For links, prefer nested span text
    if (element.tagName === 'A') {
      const spans = element.querySelectorAll('span');
      // Get the first span that doesn't contain icon classes
      for (const span of spans) {
        const spanText = span.textContent.trim();
        if (spanText && !span.className.includes('icon') && !span.className.includes('assistant')) {
          text = spanText;
          break;
        }
      }
      if (!text) {
        text = element.textContent.trim();
      }
    } else if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
      // If element is an input or textarea, get value instead
      text = element.value.trim();
    } else if (element.contentEditable === 'true') {
      // If element is contenteditable, get innerHTML
      text = element.innerText.trim();
    } else {
      text = element.textContent.trim();
    }
    
    // Clean up extracted text by removing unwanted trailing text
    if (text) {
      // Remove common Salesforce UI suffixes and elements
      text = text.replace(/\s*(Change Owner|Open [\w\s]+ Preview|View All|Close Date|Amount|Stage|Probability).*$/gi, '');
      text = text.replace(/\s*(Edit|Delete|Clone|Follow|View|Change|Open|Preview)\s*$/gi, '');
      // Remove currency symbols and dates that might have been concatenated
      text = text.replace(/\$[\d,]+\.?\d*\s*/g, '');
      text = text.replace(/\d{1,2}\/\d{1,2}\/\d{4}\s*/g, '');
      // Remove multiple consecutive whitespace
      text = text.replace(/\s+/g, ' ').trim();
      
      // If the text seems to contain multiple field values concatenated, take just the first part
      const parts = text.split(/\s+/);
      if (parts.length > 3 && text.length > 50) {
        // If it's a long string with many parts, likely concatenated UI text
        // Try to find a reasonable break point
        const firstTwoWords = parts.slice(0, 2).join(' ');
        if (firstTwoWords.length > 3) {
          text = firstTwoWords;
        }
      }
    }

    return text || null;
  } catch (error) {
    console.error(`[Rubi SF Extractor] Selector error: ${selector}`, error);
    return null;
  }
}

/**
 * Execute a Salesforce-specific fallback extraction strategy
 *
 * @param {Object} fallback - Fallback configuration
 * @param {string} fieldName - Field name for context
 * @returns {string|null} Extracted value or null
 */
function executeSalesforceFallbackStrategy(fallback, fieldName) {
  switch (fallback.strategy) {
    case 'scan-headings':
      return scanHeadings(fallback.pattern);

    case 'scan-known-stages':
      return scanKnownStages();

    case 'scan-currency':
      return scanByPattern(fallback.pattern);

    case 'scan-dates':
      return scanByPattern(fallback.pattern);

    case 'scan-percentage':
      return scanByPattern(fallback.pattern);

    case 'scan-nearby-label':
      return scanNearbyLabel(fallback.label);

    case 'scan-email':
      return scanByPattern(fallback.pattern);

    case 'scan-phone':
      return scanByPattern(fallback.pattern);

    default:
      console.warn(`[Rubi SF Extractor] Unknown fallback strategy: ${fallback.strategy}`);
      return null;
  }
}

/**
 * Scan page headings for matching pattern
 */
function scanHeadings(pattern) {
  const headings = document.querySelectorAll('h1, h2, h3, .slds-page-header__title');
  for (const heading of headings) {
    const text = heading.textContent.trim();
    if (pattern && pattern.test && pattern.test(text)) {
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
 * Scan page text for pattern match
 */
function scanByPattern(pattern) {
  const bodyText = document.body.innerText;
  const matches = bodyText.match(new RegExp(pattern.source, 'g'));
  
  if (matches) {
    // For percentage patterns, try to find one that looks like a probability
    if (pattern.source.includes('%')) {
      for (const match of matches) {
        const num = parseInt(match.replace('%', ''));
        if (num >= 0 && num <= 100) {
          return match;
        }
      }
    }
    
    return matches[0];
  }
  
  return null;
}

/**
 * Scan for field by nearby label text
 */
function scanNearbyLabel(labelText) {
  // Search all potential label elements
  const allElements = document.querySelectorAll('*');

  for (const element of allElements) {
    const text = element.textContent.trim();

    // Skip if element has too much text (not a label)
    if (text.length > 100) continue;

    // Check if element text matches or contains label text
    if (text.toLowerCase().includes(labelText.toLowerCase())) {
      // Strategy 1: Check next sibling
      let nextSibling = element.nextElementSibling;
      if (nextSibling) {
        const siblingText = nextSibling.textContent.trim();
        // Make sure sibling isn't another label
        if (siblingText && siblingText.length > 0 && !siblingText.toLowerCase().includes(labelText.toLowerCase())) {
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

          if (childText && !childText.toLowerCase().includes(labelText.toLowerCase()) && childText.length > 0) {
            return childText;
          }
        }

        // Strategy 3: Look for Lightning formatted components in parent
        const valueElement = parent.querySelector(
          'lightning-formatted-text, lightning-formatted-number, lightning-formatted-email, lightning-formatted-url, lightning-formatted-phone, .slds-form-element__static, .uiOutputText'
        );

        if (valueElement && valueElement !== element) {
          const valueText = valueElement.textContent.trim();
          if (valueText && !valueText.toLowerCase().includes(labelText.toLowerCase())) {
            return valueText;
          }
        }
      }
    }
  }

  return null;
}

/**
 * Build context response with confidence calculation
 *
 * @param {string} pageType - Page type
 * @param {Object} fields - Extracted fields
 * @returns {Object} Context response
 */
function buildContextResponse(pageType, fields) {
  const requiredFields = window.RubiSalesforceSelectorMap?.getSalesforceRequiredFields(pageType) || [];
  
  // Calculate confidence
  const totalFields = Object.keys(fields).length;
  const extractedCount = Object.values(fields).filter(v => v !== null && v !== '').length;
  const confidence = totalFields > 0 ? Math.round((extractedCount / totalFields) * 100) : 0;

  // Identify missing required fields
  const requiredMissing = requiredFields.filter(
    field => !fields[field] || fields[field] === ''
  );

  const visibleText = extractVisibleText();

  const context = {
    platform: 'salesforce',
    pageType,
    fields,
    visibleText,
    extractionConfidence: confidence,
    requiredMissing,
    missingFields: requiredMissing, // Backwards compatibility
    timestamp: new Date().toISOString(),
    url: window.location.href
  };

  // Add guidance message if required fields are missing
  if (requiredMissing.length > 0) {
    context.guidanceMessage = 'Some required fields are missing. Try navigating to the Details tab or scrolling to load all sections.';
    console.warn(`[Rubi SF Extractor] Missing required fields:`, requiredMissing);
  }

  console.log(`[Rubi SF Extractor] ${pageType} extraction complete: ${extractedCount}/${totalFields} fields (${confidence}% confidence)`);

  return context;
}

/**
 * Build error response
 *
 * @param {string} pageType - Page type
 * @param {string} error - Error message
 * @returns {Object} Error context response
 */
function buildErrorResponse(pageType, error) {
  const visibleText = extractVisibleText();

  return {
    platform: 'salesforce',
    pageType,
    fields: {},
    visibleText,
    extractionConfidence: 0,
    requiredMissing: [],
    missingFields: [], // Backwards compatibility
    error,
    timestamp: new Date().toISOString(),
    url: window.location.href
  };
}

/**
 * Extract visible text from the page for LLM context
 *
 * @returns {string} Visible text content
 */
function extractVisibleText() {
  const textNodes = [];
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function(node) {
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;

        const style = window.getComputedStyle(parent);
        if (style.display === 'none' || style.visibility === 'hidden') {
          return NodeFilter.FILTER_REJECT;
        }

        const text = node.textContent.trim();
        if (text.length === 0) {
          return NodeFilter.FILTER_REJECT;
        }

        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );

  let node;
  while (node = walker.nextNode()) {
    textNodes.push(node.textContent.trim());
  }

  let text = textNodes.join(' ');

  if (text.length > 5000) {
    text = text.substring(0, 5000) + '...';
  }

  return text;
}

// Export for use in content scripts
if (typeof window !== 'undefined') {
  window.RubiSalesforceExtractor = {
    extractSalesforceContext,
    extractSalesforceOpportunity
  };
}