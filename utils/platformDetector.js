/**
 * Rubi Browser Extension - Platform Detector
 *
 * Identifies the current platform based on URL patterns and minimal DOM cues.
 * Returns normalized platform identifiers for context extraction.
 */

/**
 * Platform identifiers
 */
const PLATFORMS = {
  SALESFORCE: 'salesforce',
  GMAIL: 'gmail',
  OUTLOOK_WEB: 'outlook_web',
  GOOGLE_CALENDAR: 'google_calendar',
  OUTLOOK_CALENDAR: 'outlook_calendar',
  LINKEDIN: 'linkedin',
  UNKNOWN: 'unknown'
};

/**
 * Detect the current platform
 * @returns {string} Platform identifier (e.g., 'salesforce', 'gmail', 'unknown')
 */
function detectPlatform() {
  const url = window.location.href;
  const hostname = window.location.hostname;
  const pathname = window.location.pathname;

  console.log(`[Rubi Platform Detector] Detecting platform for: ${url}`);

  // Salesforce Lightning detection
  if (isSalesforce(url, hostname, pathname)) {
    console.log(`[Rubi Platform Detector] Platform detected: ${PLATFORMS.SALESFORCE}`);
    return PLATFORMS.SALESFORCE;
  }

  // Gmail detection
  if (isGmail(url, hostname)) {
    console.log(`[Rubi Platform Detector] Platform detected: ${PLATFORMS.GMAIL}`);
    return PLATFORMS.GMAIL;
  }

  // Outlook Web (Mail) detection
  if (isOutlookWeb(url, hostname, pathname)) {
    console.log(`[Rubi Platform Detector] Platform detected: ${PLATFORMS.OUTLOOK_WEB}`);
    return PLATFORMS.OUTLOOK_WEB;
  }

  // Google Calendar detection
  if (isGoogleCalendar(url, hostname)) {
    console.log(`[Rubi Platform Detector] Platform detected: ${PLATFORMS.GOOGLE_CALENDAR}`);
    return PLATFORMS.GOOGLE_CALENDAR;
  }

  // Outlook Calendar detection
  if (isOutlookCalendar(url, hostname, pathname)) {
    console.log(`[Rubi Platform Detector] Platform detected: ${PLATFORMS.OUTLOOK_CALENDAR}`);
    return PLATFORMS.OUTLOOK_CALENDAR;
  }

  // LinkedIn detection
  if (isLinkedIn(url, hostname, pathname)) {
    console.log(`[Rubi Platform Detector] Platform detected: ${PLATFORMS.LINKEDIN}`);
    return PLATFORMS.LINKEDIN;
  }

  // Unknown platform
  console.log(`[Rubi Platform Detector] Platform detected: ${PLATFORMS.UNKNOWN}`);
  return PLATFORMS.UNKNOWN;
}

/**
 * Check if current page is Salesforce Lightning
 */
function isSalesforce(url, hostname, pathname) {
  console.log(`[Rubi Platform Detector] Checking Salesforce: ${hostname}${pathname}`);
  
  // URL pattern checks (primary indicators)
  const isSalesforceHostname =
    hostname.includes('lightning.force.com') ||
    hostname.includes('salesforce.com') ||
    hostname.includes('my.salesforce.com') ||
    hostname.endsWith('.force.com') ||
    hostname.includes('.lightning.force.com');

  const isSalesforcePath =
    pathname.includes('/lightning/r/') ||
    pathname.includes('/lightning/o/') ||
    pathname.includes('/lightning/page/') ||
    pathname.includes('/lightning/setup/') ||
    url.includes('/lightning/') ||
    url.includes('lightning.force.com');

  console.log(`[Rubi Platform Detector] SF hostname check: ${isSalesforceHostname}, path check: ${isSalesforcePath}`);

  // If URL clearly indicates Salesforce, return true immediately
  if (isSalesforceHostname || isSalesforcePath) {
    console.log(`[Rubi Platform Detector] Salesforce detected by URL pattern`);
    return true;
  }

  // DOM pattern checks for Salesforce Lightning (fallback)
  // Check for Aura framework elements
  const hasAuraElements =
    document.querySelector('[data-aura-rendered-by]') !== null ||
    document.querySelector('[data-aura-class]') !== null ||
    document.querySelector('.auraContainer') !== null;

  // Check for Salesforce Lightning Design System (SLDS) classes
  const hasSLDSClasses =
    document.querySelector('.slds-scope') !== null ||
    document.querySelector('.oneHeader') !== null ||
    document.querySelector('.slds-context-bar') !== null ||
    document.querySelector('.slds-template') !== null;

  // Check for Lightning-specific elements
  const hasLightningElements =
    document.querySelector('one-app-launcher-header') !== null ||
    document.querySelector('one-appnav') !== null ||
    document.querySelector('force-record-layout') !== null ||
    document.querySelector('records-record-layout-item') !== null;

  // Check for Lightning Web Components
  const hasLWC =
    document.querySelector('lightning-formatted-text') !== null ||
    document.querySelector('lightning-formatted-number') !== null ||
    document.querySelector('lightning-record-edit-form') !== null ||
    document.querySelector('lightning-record-view-form') !== null;

  const domDetected = hasAuraElements || hasSLDSClasses || hasLightningElements || hasLWC;
  
  console.log(`[Rubi Platform Detector] SF DOM patterns: aura=${hasAuraElements}, slds=${hasSLDSClasses}, lightning=${hasLightningElements}, lwc=${hasLWC}`);
  console.log(`[Rubi Platform Detector] Final Salesforce detection result: ${domDetected}`);

  return domDetected;
}

/**
 * Check if current page is Gmail
 */
function isGmail(url, hostname) {
  // URL pattern check
  if (!hostname.includes('mail.google.com')) {
    return false;
  }

  // DOM pattern checks for Gmail
  // Check for Gmail-specific elements
  const hasGmailContainer =
    document.querySelector('[role="main"]') !== null ||
    document.querySelector('.nH') !== null; // Gmail's main container class

  // Check for compose window (if in compose mode)
  const hasComposeWindow =
    document.querySelector('[aria-label*="Message Body"]') !== null ||
    document.querySelector('.editable[contenteditable="true"]') !== null ||
    document.querySelector('[g_editable="true"]') !== null;

  // Check for inbox/mail view
  const hasMailView =
    document.querySelector('[role="navigation"][aria-label*="Gmail"]') !== null ||
    document.querySelector('.aic') !== null; // Gmail header

  return hasGmailContainer || hasComposeWindow || hasMailView;
}

/**
 * Check if current page is Outlook Web (Mail)
 */
function isOutlookWeb(url, hostname, pathname) {
  // URL pattern checks
  const isOutlookHostname =
    hostname.includes('outlook.office.com') ||
    hostname.includes('outlook.office365.com') ||
    hostname.includes('outlook.live.com');

  const isMailPath =
    pathname.includes('/mail') ||
    url.includes('?path=/mail');

  if (!isOutlookHostname || !isMailPath) {
    return false;
  }

  // DOM pattern checks for Outlook Web
  // Check for Outlook-specific elements
  const hasOutlookElements =
    document.querySelector('[data-app-section="Mail"]') !== null ||
    document.querySelector('[aria-label*="Message body"]') !== null ||
    document.querySelector('[role="main"][aria-label*="Mail"]') !== null;

  // Check for compose pane
  const hasComposePane =
    document.querySelector('[aria-label*="Compose"]') !== null ||
    document.querySelector('[role="textbox"][aria-label*="message"]') !== null;

  return hasOutlookElements || hasComposePane;
}

/**
 * Check if current page is Google Calendar
 */
function isGoogleCalendar(url, hostname) {
  // URL pattern check
  if (!hostname.includes('calendar.google.com')) {
    return false;
  }

  // DOM pattern checks for Google Calendar
  // Check for calendar-specific elements
  const hasCalendarElements =
    document.querySelector('[data-view-heading]') !== null ||
    document.querySelector('[role="main"]') !== null;

  // Check for event detail modal/panel
  const hasEventDetail =
    document.querySelector('[role="dialog"][aria-label*="Event"]') !== null ||
    document.querySelector('[data-event-id]') !== null ||
    document.querySelector('[jsname]') !== null; // Google Calendar uses jsname attributes

  return hasCalendarElements || hasEventDetail;
}

/**
 * Check if current page is Outlook Calendar
 */
function isOutlookCalendar(url, hostname, pathname) {
  // URL pattern checks
  const isOutlookHostname =
    hostname.includes('outlook.office.com') ||
    hostname.includes('outlook.office365.com') ||
    hostname.includes('outlook.live.com');

  const isCalendarPath =
    pathname.includes('/calendar') ||
    url.includes('?path=/calendar');

  if (!isOutlookHostname || !isCalendarPath) {
    return false;
  }

  // DOM pattern checks for Outlook Calendar
  // Check for calendar-specific elements
  const hasCalendarElements =
    document.querySelector('[data-app-section="Calendar"]') !== null ||
    document.querySelector('[role="main"][aria-label*="Calendar"]') !== null;

  // Check for event detail pane
  const hasEventDetail =
    document.querySelector('[aria-label*="Event"]') !== null ||
    document.querySelector('[role="dialog"]') !== null;

  return hasCalendarElements || hasEventDetail;
}

/**
 * Check if current page is LinkedIn profile
 */
function isLinkedIn(url, hostname, pathname) {
  // URL pattern checks
  const isLinkedInHostname = hostname.includes('linkedin.com');
  const isProfilePath = pathname.includes('/in/');

  // For LinkedIn, we rely primarily on URL patterns since content loads dynamically
  // and DOM elements may not be available immediately
  if (!isLinkedInHostname) {
    return false;
  }

  // If it's a profile path, it's definitely LinkedIn profile
  if (isProfilePath) {
    return true;
  }

  // For non-profile LinkedIn pages, check for some basic LinkedIn indicators
  // These are more general and should exist even before full page load
  const hasLinkedInIndicators =
    document.querySelector('[data-test-app-aware-link]') !== null ||
    document.querySelector('.global-nav') !== null ||
    document.querySelector('[data-control-name]') !== null ||
    document.documentElement.getAttribute('lang') === 'en' && isLinkedInHostname;

  return hasLinkedInIndicators;
}

/**
 * Get detailed platform information including page type
 * This will be used in future phases for context extraction
 *
 * @returns {Promise<Object>} Platform details { platform: string, pageType: string, metadata: {} }
 */
async function getPlatformDetails() {
  const platform = detectPlatform();
  const details = {
    platform,
    pageType: 'unknown',
    metadata: {}
  };

  // Add page type detection for future phases
  switch (platform) {
    case PLATFORMS.SALESFORCE:
      details.pageType = await detectSalesforcePageType();
      break;
    case PLATFORMS.GMAIL:
      details.pageType = detectGmailPageType();
      break;
    case PLATFORMS.OUTLOOK_WEB:
      details.pageType = detectOutlookPageType();
      break;
    case PLATFORMS.GOOGLE_CALENDAR:
      details.pageType = 'calendar_event';
      break;
    case PLATFORMS.OUTLOOK_CALENDAR:
      details.pageType = 'calendar_event';
      break;
    case PLATFORMS.LINKEDIN:
      details.pageType = 'profile';
      break;
  }

  return details;
}

/**
 * Detect Salesforce page type (Opportunity, Account, Contact, etc.)
 * Uses multi-layer detection with Lightning hydration support
 */
async function detectSalesforcePageType() {
  const pathname = window.location.pathname;
  const url = window.location.href;

  // Strategy 1: Try URL-based detection first
  const urlMatch = pathname.match(/\/lightning\/r\/([^\/]+)\/([^\/]+)\//);
  if (urlMatch && urlMatch[1]) {
    const objectApiName = urlMatch[1];
    const pageType = inferSalesforcePageTypeFromApiName(objectApiName);
    if (pageType !== 'unknown') {
      console.log(`[Rubi SF Detector] Page type (URL): ${pageType}`);
      return pageType;
    }
  }

  // Strategy 2: Try Lightning runtime globals
  try {
    if (window.lwcRuntimeFlags && window.lwcRuntimeFlags.recordId) {
      const apiName = window.lwcRuntimeFlags.objectApiName;
      if (apiName) {
        const pageType = inferSalesforcePageTypeFromApiName(apiName);
        if (pageType !== 'unknown') {
          console.log(`[Rubi SF Detector] API Name detected (runtime): ${apiName} → ${pageType}`);
          return pageType;
        }
      }
    }
  } catch (e) {
    // Silent fail
  }

  // Strategy 3: Poll for Lightning hydration and DOM-based detection
  const MAX_POLLS = 20;
  const POLL_INTERVAL = 150;

  for (let attempt = 1; attempt <= MAX_POLLS; attempt++) {
    // Check if Lightning record header has hydrated
    const hasRecordHeader =
      document.querySelector('.slds-page-header') !== null ||
      document.querySelector('force-record-layout') !== null ||
      document.querySelector('records-lwc-detail-panel') !== null;

    if (hasRecordHeader || attempt > 1) {
      const apiName = detectSalesforceRecordApiName();
      if (apiName) {
        const pageType = inferSalesforcePageTypeFromApiName(apiName);
        if (pageType !== 'unknown') {
          console.log(`[Rubi SF Detector] API Name detected: ${apiName} → ${pageType}`);
          return pageType;
        }
      }
    }

    if (attempt < MAX_POLLS) {
      console.log(`[Rubi SF Detector] Waiting for Lightning hydration... (${attempt}/20)`);
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
    }
  }

  console.warn('[Rubi SF Detector] Salesforce page type unresolved after hydration.');
  console.log('[Rubi SF Detector] Page type: unknown');
  return 'unknown';
}

/**
 * Detect Salesforce record objectApiName from DOM
 * Searches Lightning record header metadata
 */
function detectSalesforceRecordApiName() {
  // Strategy 1: Look for lightning-record-edit-form
  try {
    const recordEditForm = document.querySelector('lightning-record-edit-form');
    if (recordEditForm && recordEditForm.objectApiName) {
      return recordEditForm.objectApiName;
    }
  } catch (e) {
    // Silent fail
  }

  // Strategy 2: Check for record-view-form
  try {
    const recordViewForm = document.querySelector('lightning-record-view-form');
    if (recordViewForm && recordViewForm.objectApiName) {
      return recordViewForm.objectApiName;
    }
  } catch (e) {
    // Silent fail
  }

  // Strategy 3: Check data attributes on force components
  try {
    const forceLayout = document.querySelector('[data-object-api-name]');
    if (forceLayout) {
      const apiName = forceLayout.getAttribute('data-object-api-name');
      if (apiName) {
        return apiName;
      }
    }
  } catch (e) {
    // Silent fail
  }

  // Strategy 4: Scan aria-labels on page headers
  try {
    const pageHeaders = document.querySelectorAll('.slds-page-header, [role="banner"]');
    for (const header of pageHeaders) {
      const ariaLabel = header.getAttribute('aria-label');
      if (ariaLabel) {
        const lowerLabel = ariaLabel.toLowerCase();
        if (lowerLabel.includes('opportunity')) return 'Opportunity';
        if (lowerLabel.includes('account')) return 'Account';
        if (lowerLabel.includes('contact')) return 'Contact';
        if (lowerLabel.includes('lead')) return 'Lead';
      }
    }
  } catch (e) {
    // Silent fail
  }

  // Strategy 5: Check header titles
  try {
    const headerTitles = document.querySelectorAll('h1, .slds-page-header__title');
    for (const title of headerTitles) {
      const parentHeader = title.closest('.slds-page-header');
      if (parentHeader) {
        const headerText = parentHeader.textContent || '';
        if (headerText.toLowerCase().includes('opportunity')) return 'Opportunity';
        if (headerText.toLowerCase().includes('account')) return 'Account';
        if (headerText.toLowerCase().includes('contact')) return 'Contact';
        if (headerText.toLowerCase().includes('lead')) return 'Lead';
      }
    }
  } catch (e) {
    // Silent fail
  }

  return null;
}

/**
 * Infer Salesforce page type from objectApiName
 * Maps standard Salesforce objects to page types
 */
function inferSalesforcePageTypeFromApiName(objectApiName) {
  if (!objectApiName) return 'unknown';

  const normalized = objectApiName.toLowerCase();

  if (normalized === 'opportunity') return 'opportunity';
  if (normalized === 'account') return 'account';
  if (normalized === 'contact') return 'contact';
  if (normalized === 'lead') return 'lead';

  return 'unknown';
}

/**
 * Detect Gmail page type (inbox, compose, etc.)
 * Placeholder for Phase 1B
 */
function detectGmailPageType() {
  const url = window.location.href;

  if (url.includes('?compose=') || url.includes('#compose')) {
    return 'compose';
  }

  return 'inbox';
}

/**
 * Detect Outlook page type (inbox, compose, etc.)
 * Placeholder for Phase 1B
 */
function detectOutlookPageType() {
  const url = window.location.href;

  if (url.includes('?path=/mail/compose') ||
      document.querySelector('[aria-label*="Compose"]')) {
    return 'compose';
  }

  return 'inbox';
}

// Export for use in content scripts
if (typeof window !== 'undefined') {
  window.RubiPlatformDetector = {
    detectPlatform,
    getPlatformDetails,
    PLATFORMS
  };
}
