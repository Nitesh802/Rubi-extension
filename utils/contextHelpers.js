/**
 * Rubi Browser Extension - Context Helper Utilities
 *
 * Robust DOM extraction helpers for platforms with dynamic/shadow DOM.
 * Primary use: Salesforce Lightning record pages.
 */

// Debug flag for context extraction logging
const DEBUG_CONTEXT = true; // we can toggle this later

/**
 * Extract field value by label text on Salesforce Lightning pages
 *
 * Strategy:
 * 1. Search entire DOM for element with matching label text (case-insensitive)
 * 2. Traverse upward to find field container (slds-form-element, lightning-layout-item, etc.)
 * 3. Within container, find value element (lightning-formatted-*, link, span)
 * 4. Return trimmed textContent
 *
 * @param {string} labelText - Field label to search for (e.g., "Stage", "Close Date")
 * @param {Document|Element} root - Root element to search (defaults to document)
 * @returns {string|null} Extracted field value or null if not found
 */
function extractByLabel(labelText, root = document) {
  console.log(`[Rubi Extractor] Label lookup: searching for "${labelText}"`);

  // Normalize label text for comparison
  const normalizedLabel = labelText.trim().toLowerCase();

  // Search all elements in the document
  const allElements = root.querySelectorAll('*');

  for (const element of allElements) {
    // Get element text content
    const elementText = element.textContent ? element.textContent.trim() : '';

    // Skip elements with too much text (likely not a label)
    if (elementText.length > 150) continue;

    // Check for case-insensitive match
    const normalizedElementText = elementText.toLowerCase();

    if (normalizedElementText === normalizedLabel ||
        normalizedElementText === normalizedLabel + ':' ||
        normalizedElementText.startsWith(normalizedLabel + '\n')) {

      console.log(`[Rubi Extractor] Label lookup: found label element for "${labelText}"`);

      // Find the field container by traversing upward
      const fieldContainer = findFieldContainer(element);

      if (fieldContainer) {
        console.log(`[Rubi Extractor] Label lookup: found field container for "${labelText}"`);

        // Extract value from container
        const value = extractValueFromContainer(fieldContainer, labelText);

        if (value) {
          console.log(`[Rubi Extractor] Label lookup: extracted value for "${labelText}": "${value}"`);
          return value;
        } else {
          console.log(`[Rubi Extractor] Label lookup: no value found in container for "${labelText}"`);
        }
      } else {
        console.log(`[Rubi Extractor] Label lookup: no field container found for "${labelText}"`);
      }
    }
  }

  console.log(`[Rubi Extractor] Label lookup: failed to find "${labelText}"`);
  return null;
}

/**
 * Find field container by traversing upward from label element
 * Looks for Lightning field containers (slds-form-element, lightning-layout-item, etc.)
 *
 * @param {Element} element - Label element
 * @returns {Element|null} Field container or null
 */
function findFieldContainer(element) {
  let current = element;
  let depth = 0;
  const maxDepth = 10; // Prevent infinite loops

  while (current && depth < maxDepth) {
    // Check if current element is a field container
    const classList = current.classList ? Array.from(current.classList) : [];
    const tagName = current.tagName ? current.tagName.toLowerCase() : '';

    // Lightning field container patterns
    if (classList.includes('slds-form-element') ||
        classList.includes('slds-form-element__row') ||
        tagName === 'lightning-layout-item' ||
        tagName === 'lightning-output-field' ||
        tagName === 'records-record-layout-item' ||
        tagName === 'force-highlights-details-item') {
      return current;
    }

    // Move up to parent
    current = current.parentElement;
    depth++;
  }

  return null;
}

/**
 * Extract value from field container
 * Searches for Lightning formatted elements and extracts their text content
 *
 * @param {Element} container - Field container element
 * @param {string} labelText - Label text (for logging)
 * @returns {string|null} Extracted value or null
 */
function extractValueFromContainer(container, labelText) {
  // Value element patterns (in priority order)
  const valueSelectors = [
    'lightning-formatted-text',
    'lightning-formatted-number',
    'lightning-formatted-rich-text',
    'lightning-formatted-url',
    'lightning-formatted-email',
    'lightning-formatted-phone',
    'lightning-formatted-address',
    'lightning-formatted-date-time',
    'lightning-formatted-lookup',
    '.slds-form-element__static',
    '.uiOutputText',
    '.uiOutputNumber',
    '.uiOutputCurrency',
    '.uiOutputDate',
    '.uiOutputURL',
    'a[data-refid="recordId"]',
    'a[href*="/Account/"]',
    'a[href*="/Contact/"]',
    'a[href*="/User/"]'
  ];

  // Try each selector
  for (const selector of valueSelectors) {
    try {
      const valueElement = container.querySelector(selector);

      if (valueElement) {
        // For link elements, try to get text from nested span first
        if (valueElement.tagName === 'A') {
          const span = valueElement.querySelector('span');
          if (span && span.textContent.trim()) {
            return span.textContent.trim();
          }
        }

        // Get text content
        let text = valueElement.textContent ? valueElement.textContent.trim() : '';

        // Filter out label text if it's included in the value
        const normalizedLabel = labelText.toLowerCase();
        const normalizedText = text.toLowerCase();

        if (normalizedText.startsWith(normalizedLabel)) {
          text = text.substring(labelText.length).trim();
          // Remove leading colon if present
          if (text.startsWith(':')) {
            text = text.substring(1).trim();
          }
        }

        if (text.length > 0) {
          return text;
        }
      }
    } catch (e) {
      // Invalid selector, continue
      continue;
    }
  }

  // Fallback: search for any span with non-empty text that's not the label
  const allSpans = container.querySelectorAll('span');
  for (const span of allSpans) {
    const text = span.textContent ? span.textContent.trim() : '';
    const normalizedText = text.toLowerCase();
    const normalizedLabel = labelText.toLowerCase();

    // Make sure it's not the label itself and has content
    if (text.length > 0 &&
        !normalizedText.startsWith(normalizedLabel) &&
        text !== labelText) {
      return text;
    }
  }

  return null;
}

/**
 * Extract field value by searching for label and finding nearby value
 * Alternative to extractByLabel with different traversal strategy
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

// Export for use in content scripts
if (typeof window !== 'undefined') {
  window.RubiContextHelpers = {
    extractByLabel,
    findValueByNearbyLabel,
    DEBUG_CONTEXT
  };
}
