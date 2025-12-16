/**
 * Rubi Browser Extension - Selector Maps
 *
 * Platform and page-type specific DOM selectors for context extraction.
 * This file imports and re-exports platform-specific selector maps.
 */

// Import platform-specific selector maps
// These will be available via their respective global objects:
// - window.RubiSalesforceSelectorMap
// - window.RubiLinkedInSelectorMap

/**
 * Gmail - Compose Window Selectors
 */
const GMAIL_COMPOSE_SELECTORS = {
  messageBody: {
    primary: [
      'div[aria-label*="Message Body"][contenteditable="true"]',
      'div[g_editable="true"][role="textbox"]',
      '.editable[contenteditable="true"]'
    ],
    secondary: [
      'div[contenteditable="true"].Am',
      'div[aria-label*="Message body"]'
    ],
    fallback: {
      strategy: 'scan-contenteditable',
      selector: '[contenteditable="true"]'
    }
  },

  subject: {
    primary: [
      'input[name="subjectbox"]',
      'input[placeholder*="Subject"]'
    ],
    secondary: [
      '.aoD input[type="text"]'
    ],
    fallback: null
  },

  recipients: {
    primary: [
      'input[aria-label*="To"]',
      'span[email] span[email]'
    ],
    secondary: [
      '.vR span[email]'
    ],
    fallback: null
  },

  recipientsCc: {
    primary: [
      'input[aria-label*="Cc"]',
      'textarea[name="cc"]'
    ],
    secondary: null,
    fallback: null
  }
};

/**
 * Outlook Web - Compose Window Selectors
 */
const OUTLOOK_COMPOSE_SELECTORS = {
  messageBody: {
    primary: [
      'div[aria-label*="Message body"][contenteditable="true"]',
      'div[role="textbox"][aria-label*="message"]',
      'div[contenteditable="true"][aria-label*="Message"]'
    ],
    secondary: [
      'div[contenteditable="true"][data-app-section="Mail"]'
    ],
    fallback: {
      strategy: 'scan-contenteditable',
      selector: '[contenteditable="true"]'
    }
  },

  subject: {
    primary: [
      'input[aria-label*="Subject"]',
      'input[placeholder*="Add a subject"]'
    ],
    secondary: [
      '.ms-TextField-field[aria-label*="Subject"]'
    ],
    fallback: null
  },

  recipients: {
    primary: [
      'input[aria-label*="To"]',
      'div[aria-label*="To"] .ms-BasePicker-text'
    ],
    secondary: [
      '.ms-BasePicker-text'
    ],
    fallback: null
  }
};

/**
 * Google Calendar - Event Selectors
 */
const GOOGLE_CALENDAR_EVENT_SELECTORS = {
  eventTitle: {
    primary: [
      'div[role="dialog"] input[aria-label*="title"]',
      'div[role="dialog"] span[data-is-tooltip-wrapper="true"]',
      'div[data-dragsource="true"] span[role="heading"]'
    ],
    secondary: [
      'div[role="dialog"] h2',
      'div[jsname] span[dir="auto"]'
    ],
    fallback: {
      strategy: 'scan-dialog-heading',
      selector: 'div[role="dialog"] h2, div[role="dialog"] [role="heading"]'
    }
  },

  dateTime: {
    primary: [
      'div[role="dialog"] span[data-start-time]',
      'span[aria-label*="From"]'
    ],
    secondary: [
      'div[jsname] span[dir="ltr"]',
      'time[datetime]'
    ],
    fallback: {
      strategy: 'scan-dates',
      pattern: /\w+ \d{1,2}, \d{4}/
    }
  },

  participants: {
    primary: [
      'div[role="dialog"] div[aria-label*="Guests"] div[data-chip-id]',
      'span[data-hovercard-id*="mailto:"]'
    ],
    secondary: [
      'div[jsname] div[role="button"][aria-label*="@"]'
    ],
    fallback: null
  },

  location: {
    primary: [
      'div[role="dialog"] input[aria-label*="location"]',
      'div[aria-label*="Where"] input'
    ],
    secondary: null,
    fallback: null
  },

  description: {
    primary: [
      'div[role="dialog"] div[aria-label*="description"]',
      'div[contenteditable="true"][aria-label*="Description"]'
    ],
    secondary: null,
    fallback: null
  }
};

/**
 * Outlook Calendar - Event Selectors
 */
const OUTLOOK_CALENDAR_EVENT_SELECTORS = {
  eventTitle: {
    primary: [
      'input[aria-label*="Add a title"]',
      'div[role="dialog"] h2[aria-label]',
      'input[aria-label*="Subject"]'
    ],
    secondary: [
      '.ms-TextField-field[aria-label*="Title"]'
    ],
    fallback: {
      strategy: 'scan-dialog-heading',
      selector: 'div[role="dialog"] h2'
    }
  },

  dateTime: {
    primary: [
      'div[aria-label*="Start time"]',
      'div[aria-label*="End time"]',
      'button[aria-label*="Start date"]'
    ],
    secondary: [
      'span[role="heading"]'
    ],
    fallback: {
      strategy: 'scan-dates',
      pattern: /\d{1,2}\/\d{1,2}\/\d{4}/
    }
  },

  participants: {
    primary: [
      'div[aria-label*="Required attendees"] .ms-BasePicker-text',
      'div[aria-label*="Optional attendees"] .ms-BasePicker-text'
    ],
    secondary: [
      '.ms-BasePicker-itemContent'
    ],
    fallback: null
  },

  location: {
    primary: [
      'input[aria-label*="Location"]',
      'div[aria-label*="Add location"] input'
    ],
    secondary: null,
    fallback: null
  },

  description: {
    primary: [
      'div[aria-label*="Description"][contenteditable="true"]',
      'div[role="textbox"][aria-label*="notes"]'
    ],
    secondary: null,
    fallback: null
  }
};

/**
 * Get selector map for a given platform and page type
 *
 * @param {string} platform - Platform identifier (e.g., 'salesforce', 'gmail', 'linkedin')
 * @param {string} pageType - Page type identifier (e.g., 'opportunity', 'compose', 'profile')
 * @returns {Object|null} Selector map or null if not found
 */
function getSelectorMap(platform, pageType) {
  // Route to platform-specific selector maps
  if (platform === 'salesforce' && window.RubiSalesforceSelectorMap) {
    return window.RubiSalesforceSelectorMap.getSalesforceSelectorMap(pageType);
  }

  if (platform === 'linkedin' && window.RubiLinkedInSelectorMap) {
    return window.RubiLinkedInSelectorMap.getLinkedInSelectorMap(pageType);
  }

  // Handle other platforms with local selector maps
  const key = `${platform}_${pageType}`.toUpperCase();

  const selectorMaps = {
    GMAIL_COMPOSE: GMAIL_COMPOSE_SELECTORS,
    OUTLOOK_WEB_COMPOSE: OUTLOOK_COMPOSE_SELECTORS,
    GOOGLE_CALENDAR_CALENDAR_EVENT: GOOGLE_CALENDAR_EVENT_SELECTORS,
    OUTLOOK_CALENDAR_CALENDAR_EVENT: OUTLOOK_CALENDAR_EVENT_SELECTORS
  };

  return selectorMaps[key] || null;
}

/**
 * Get list of required fields for a given platform and page type
 *
 * @param {string} platform - Platform identifier
 * @param {string} pageType - Page type identifier
 * @returns {Array<string>} Array of required field names
 */
function getRequiredFields(platform, pageType) {
  // Route to platform-specific required fields
  if (platform === 'salesforce' && window.RubiSalesforceSelectorMap) {
    return window.RubiSalesforceSelectorMap.getSalesforceRequiredFields(pageType);
  }

  if (platform === 'linkedin' && window.RubiLinkedInSelectorMap) {
    return window.RubiLinkedInSelectorMap.getLinkedInRequiredFields(pageType);
  }

  // Handle other platforms with local required fields
  const key = `${platform}_${pageType}`.toUpperCase();

  const requiredFields = {
    GMAIL_COMPOSE: ['messageBody'],
    OUTLOOK_WEB_COMPOSE: ['messageBody'],
    GOOGLE_CALENDAR_CALENDAR_EVENT: ['eventTitle', 'dateTime'],
    OUTLOOK_CALENDAR_CALENDAR_EVENT: ['eventTitle', 'dateTime']
  };

  return requiredFields[key] || [];
}

// Export for use in content scripts
if (typeof window !== 'undefined') {
  window.RubiSelectorMaps = {
    getSelectorMap,
    getRequiredFields
  };
}