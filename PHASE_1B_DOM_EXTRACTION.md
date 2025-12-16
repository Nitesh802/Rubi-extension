# Phase 1B: DOM Extraction - Implementation Guide

## Overview

Phase 1B implements robust DOM extraction logic that extracts structured context from supported platforms using a three-tier selector strategy: primary (stable) → secondary (fallback) → tertiary (pattern-based).

---

## Files Created

### 1. `utils/selectorMaps.js` (850+ lines)

Platform and page-type specific DOM selector configurations with three-tier fallback strategy.

**Supported Extractions:**
- Salesforce Opportunity (9 fields)
- Salesforce Account (6 fields)
- Salesforce Contact (5 fields)
- Gmail Compose (4 fields)
- Outlook Web Compose (3 fields)
- Google Calendar Event (5 fields)
- Outlook Calendar Event (5 fields)
- LinkedIn Profile (6 fields)

**Selector Tiers:**
1. **Primary**: Stable selectors using data attributes, aria labels, or Lightning components
2. **Secondary**: Class-based or structure-based fallbacks
3. **Fallback**: Pattern matching or generic strategies (scan-headings, scan-labels, scan-currency, etc.)

**API:**
```javascript
window.RubiSelectorMaps.getSelectorMap(platform, pageType)
window.RubiSelectorMaps.getRequiredFields(platform, pageType)
```

---

### 2. `utils/contextExtractor.js` (400+ lines)

Executes extraction logic using selector maps and returns structured context objects.

**Extraction Strategy:**
1. Load selector map for platform/pageType
2. For each field, try primary selectors → secondary → fallback
3. Calculate extraction confidence (% of fields successfully extracted)
4. Identify missing required fields
5. Extract visible text as fallback
6. Return structured context object

**Context Object Structure:**
```javascript
{
  platform: 'salesforce',
  pageType: 'opportunity',
  fields: {
    opportunityName: 'Acme Corp - Q1 Renewal',
    stage: 'Proposal/Price Quote',
    amount: '$150,000',
    closeDate: '3/15/2024',
    accountName: 'Acme Corporation',
    // ... more fields
  },
  visibleText: 'Acme Corp - Q1 Renewal Opportunity Owner: John...',
  extractionConfidence: 85,
  missingFields: ['probability'],
  timestamp: '2024-01-15T10:30:00.000Z',
  url: 'https://yourorg.lightning.force.com/lightning/r/Opportunity/...'
}
```

**API:**
```javascript
window.RubiContextExtractor.extractContext(platform, pageType)
window.RubiContextExtractor.generateExtractionSummary(context)
window.RubiContextExtractor.extractVisibleText()
```

---

### 3. `content/injector.js` (MODIFIED)

**Changes:**
- Added `extractedContext` state variable
- Added `extractContextIfSupported()` function
- Calls context extraction after platform detection
- Logs extracted context and summary to console
- Warns if required fields are missing

**Console Output:**
```
[Rubi] Detected platform: salesforce
[Rubi] Page type: opportunity
[Rubi Extractor] Extracting context for salesforce/opportunity
[Rubi Extractor] ✓ opportunityName: Acme Corp - Q1 Renewal
[Rubi Extractor] ✓ stage: Proposal/Price Quote
[Rubi Extractor] ✓ amount: $150,000
[Rubi Extractor] ✓ closeDate: 3/15/2024
[Rubi Extractor] ✓ accountName: Acme Corporation
[Rubi Extractor] ✗ probability: not found
[Rubi Extractor] Extraction complete: 8/9 fields (88% confidence)
[Rubi] Extracted context: {platform: 'salesforce', pageType: 'opportunity', ...}
[Rubi] Extraction Summary:
Platform: salesforce
Page Type: opportunity
Confidence: 88%
Fields Extracted: 8
Missing Required: none
```

---

### 4. `manifest.json` (MODIFIED)

Updated content_scripts to include new modules in correct load order:
```json
"js": [
  "utils/messaging.js",
  "utils/platformDetector.js",
  "utils/selectorMaps.js",
  "utils/contextExtractor.js",
  "content/injector.js"
]
```

---

## Extraction Details by Platform

### Salesforce Opportunity

**Required Fields:**
- `opportunityName` (Critical)
- `stage` (Critical)
- `closeDate` (Critical)

**Optional Fields:**
- `amount`
- `accountName`
- `probability`
- `description`
- `nextStep`
- `ownerName`

**Primary Selectors Example:**
```javascript
opportunityName: {
  primary: [
    'records-record-layout-item[field-label="Opportunity Name"] lightning-formatted-text',
    '[data-field-label="Opportunity Name"] .uiOutputText'
  ],
  secondary: [
    '.slds-page-header__title'
  ],
  fallback: {
    strategy: 'scan-headings',
    pattern: /^(?!Home|Lightning|Sales).{3,}/
  }
}
```

**Fallback Strategies:**
- `scan-headings`: Scan h1/h2/h3 for pattern match
- `scan-labels`: Find label text and extract adjacent value
- `scan-currency`: Pattern match for currency values
- `scan-dates`: Pattern match for date formats

---

### Gmail Compose

**Required Fields:**
- `messageBody` (Critical)

**Optional Fields:**
- `subject`
- `recipients`
- `recipientsCc`

**Primary Selectors Example:**
```javascript
messageBody: {
  primary: [
    'div[aria-label*="Message Body"][contenteditable="true"]',
    'div[g_editable="true"][role="textbox"]'
  ],
  secondary: [
    'div[contenteditable="true"].Am'
  ],
  fallback: {
    strategy: 'scan-contenteditable',
    selector: '[contenteditable="true"]'
  }
}
```

---

### Google Calendar Event

**Required Fields:**
- `eventTitle` (Critical)
- `dateTime` (Critical)

**Optional Fields:**
- `participants`
- `location`
- `description`

**Primary Selectors Example:**
```javascript
eventTitle: {
  primary: [
    'div[role="dialog"] input[aria-label*="title"]',
    'div[role="dialog"] span[data-is-tooltip-wrapper="true"]'
  ],
  secondary: [
    'div[role="dialog"] h2'
  ],
  fallback: {
    strategy: 'scan-dialog-heading',
    selector: 'div[role="dialog"] h2, div[role="dialog"] [role="heading"]'
  }
}
```

---

### LinkedIn Profile

**Required Fields:**
- `profileName` (Critical)

**Optional Fields:**
- `headline`
- `company`
- `location`
- `about`
- `experience`

**Primary Selectors Example:**
```javascript
profileName: {
  primary: [
    'h1.text-heading-xlarge',
    '.pv-text-details__left-panel h1'
  ],
  secondary: [
    '.pv-top-card--list h1'
  ],
  fallback: {
    strategy: 'scan-headings',
    selector: 'main h1'
  }
}
```

---

## Testing Guide

### Prerequisites

1. **Reload Extension:**
   - Go to `chrome://extensions/`
   - Find "Rubi Browser Extension"
   - Click **Reload** icon

2. **Open DevTools:**
   - Press `F12` or `Cmd+Option+I`
   - Go to **Console** tab
   - Clear console for clean output

---

### Test 1: Salesforce Opportunity Extraction

**Setup:**
1. Log into Salesforce Lightning
2. Navigate to an Opportunity record:
   ```
   https://yourorg.lightning.force.com/lightning/r/Opportunity/[OPPORTUNITY_ID]/view
   ```
3. Ensure you're on the "Details" tab (not Related, etc.)

**Expected Console Output:**
```
[Rubi] Detected platform: salesforce
[Rubi] Page type: opportunity
[Rubi Extractor] Extracting context for salesforce/opportunity
[Rubi Extractor] ✓ opportunityName: [Your Opportunity Name]
[Rubi Extractor] ✓ stage: [Stage Name]
[Rubi Extractor] ✓ amount: $[Amount]
[Rubi Extractor] ✓ closeDate: [Date]
[Rubi Extractor] ✓ accountName: [Account Name]
[Rubi Extractor] Extraction complete: X/9 fields (XX% confidence)
[Rubi] Extracted context: {platform: 'salesforce', pageType: 'opportunity', ...}
```

**Verification:**
- Expand the `[Rubi] Extracted context:` object in console
- Verify `fields` object contains extracted data
- Check `extractionConfidence` (should be > 50%)
- Check `missingFields` array

**Missing Fields Test:**
1. Navigate away from the Details tab (e.g., to Related tab)
2. Refresh the page
3. Should see warning:
   ```
   [Rubi] Missing required fields: ['opportunityName', 'stage', 'closeDate']
   User guidance: Navigate to the appropriate tab or view to see full details.
   ```

---

### Test 2: Salesforce Account Extraction

**Setup:**
1. Navigate to an Account record:
   ```
   https://yourorg.lightning.force.com/lightning/r/Account/[ACCOUNT_ID]/view
   ```

**Expected Fields:**
- `accountName` (required)
- `industry`
- `annualRevenue`
- `employees`
- `website`
- `billingAddress`

**Expected Console Output:**
```
[Rubi] Detected platform: salesforce
[Rubi] Page type: account
[Rubi Extractor] ✓ accountName: [Account Name]
[Rubi Extractor] ✓ industry: [Industry]
[Rubi Extractor] Extraction complete: X/6 fields
```

---

### Test 3: Gmail Compose Extraction

**Setup:**
1. Navigate to Gmail: `https://mail.google.com`
2. Click **Compose** button
3. Type some text in the message body
4. Add a subject line

**Expected Console Output:**
```
[Rubi] Detected platform: gmail
[Rubi] Page type: compose
[Rubi Extractor] Extracting context for gmail/compose
[Rubi Extractor] ✓ messageBody: [Your typed text]
[Rubi Extractor] ✓ subject: [Your subject]
[Rubi Extractor] Extraction complete: X/4 fields
```

**Verification:**
- `fields.messageBody` should contain your typed text
- `fields.subject` should contain subject line
- `visibleText` should contain page content as fallback

---

### Test 4: Google Calendar Event Extraction

**Setup:**
1. Navigate to Google Calendar: `https://calendar.google.com`
2. Click on an existing event to open event details
3. Or create a new event

**Expected Console Output:**
```
[Rubi] Detected platform: google_calendar
[Rubi] Page type: calendar_event
[Rubi Extractor] Extracting context for google_calendar/calendar_event
[Rubi Extractor] ✓ eventTitle: [Event Title]
[Rubi Extractor] ✓ dateTime: [Date/Time]
[Rubi Extractor] ✓ participants: [Attendee List]
[Rubi Extractor] Extraction complete: X/5 fields
```

---

### Test 5: LinkedIn Profile Extraction

**Setup:**
1. Navigate to any LinkedIn profile:
   ```
   https://www.linkedin.com/in/[username]/
   ```

**Expected Console Output:**
```
[Rubi] Detected platform: linkedin
[Rubi] Page type: profile
[Rubi Extractor] Extracting context for linkedin/profile
[Rubi Extractor] ✓ profileName: [Full Name]
[Rubi Extractor] ✓ headline: [Professional Headline]
[Rubi Extractor] ✓ company: [Current Company]
[Rubi Extractor] Extraction complete: X/6 fields
```

---

### Test 6: Outlook Web Compose Extraction

**Setup:**
1. Navigate to Outlook Web: `https://outlook.office.com/mail`
2. Click **New message**
3. Type some text in the message body

**Expected Console Output:**
```
[Rubi] Detected platform: outlook_web
[Rubi] Page type: compose
[Rubi Extractor] Extracting context for outlook_web/compose
[Rubi Extractor] ✓ messageBody: [Your typed text]
[Rubi Extractor] Extraction complete: X/3 fields
```

---

### Test 7: Unknown Platform (No Extraction)

**Setup:**
1. Navigate to any unsupported site (e.g., `https://github.com`)

**Expected Console Output:**
```
[Rubi] Detected platform: unknown
[Rubi] Skipping context extraction for unknown platform
```

---

## Extraction Confidence Levels

| Confidence | Meaning | Action |
|------------|---------|--------|
| **90-100%** | Excellent extraction | Proceed with full context |
| **70-89%** | Good extraction | Usable, minor fields missing |
| **50-69%** | Partial extraction | Review missing fields, may need fallback |
| **< 50%** | Poor extraction | Prompt user to navigate or provide info |

---

## Missing Fields Handling

When required fields cannot be extracted, the extension:

1. **Logs warning** with missing field names
2. **Provides user guidance** in console:
   ```
   User guidance: Navigate to the appropriate tab or view to see full details.
   ```
3. **Populates `missingFields` array** in context object
4. **Falls back to `visibleText`** extraction (full page text)

**Future Phase (1C):** Missing fields will trigger drawer UI prompts:
- "Navigate to the Opportunity Details tab"
- "Please provide the stage and close date"

---

## Visible Text Fallback

When field-level extraction fails, the extractor captures visible page text:

**Strategy:**
1. Focus on main content area (avoid nav, footer, etc.)
2. For Salesforce: `.slds-page-header, main, .record-body`
3. For Gmail/Outlook: `[role="main"], .nH, [data-app-section]`
4. Limit to first 5000 characters
5. Clean extra whitespace

**Usage:**
- Provides context when selectors fail
- Enables LLM-based extraction as fallback (future phase)
- Useful for ambiguous page types

---

## Troubleshooting

### No extraction output

**Check:**
1. Platform detected correctly?
   - Look for `[Rubi] Detected platform: X`
2. Selector maps loaded?
   - Check: `typeof window.RubiSelectorMaps !== 'undefined'`
3. Context extractor loaded?
   - Check: `typeof window.RubiContextExtractor !== 'undefined'`
4. On a supported page type?
   - Unknown page types skip extraction

---

### Low extraction confidence (< 50%)

**Possible causes:**
1. **Salesforce UI changed** - Selectors may be outdated
2. **Not on correct tab** - Navigate to Details/Overview tab
3. **Page still loading** - Wait for DOM to fully render
4. **Custom Salesforce layout** - May use different selectors

**Debug:**
```javascript
// Manually test a selector
document.querySelector('records-record-layout-item[field-label="Opportunity Name"]')
```

---

### Extracted wrong data

**Possible causes:**
1. **Selector too generic** - Matches wrong element
2. **Multiple elements match** - Returns first match only
3. **Dynamic content** - Page updated after extraction

**Debug:**
```javascript
// Check all matching elements
document.querySelectorAll('[data-field-label="Stage"]')
```

---

## Data Privacy & Security

**Phase 1B Compliance:**

✅ **No customer data stored locally**
- All extraction is in-memory only
- No `chrome.storage.local` writes of extracted data
- No persistence of fields or visibleText

✅ **No API calls in this phase**
- Extraction is purely diagnostic
- Logs to console only (dev environment)
- No transmission to Rubi backend yet

✅ **Console logging only**
- All extracted context logged for verification
- Production build will remove console logs

✅ **Minimal permissions**
- No new permissions required for Phase 1B
- Uses existing `activeTab` scope

---

## Next Steps: Phase 1C

Phase 1B provides the extraction foundation. Phase 1C will add:

1. **API Integration** (`utils/apiClient.js`)
   - POST extracted context to `/api/extension/analyze-context`
   - Handle authentication and session validation
   - Error handling and retries

2. **Drawer Content Rendering**
   - Display extracted fields in drawer UI
   - Show missing field prompts
   - Render insights from Rubi API

3. **Deep Linking**
   - Store context server-side
   - Generate contextId
   - Open Rubi with context parameter

4. **User Guidance**
   - Show "Navigate to Details tab" prompts in drawer
   - Provide field completion guidance
   - Handle ambiguous contexts

---

## Summary

✅ **Phase 1B Complete:**
- ✅ Selector maps for 8 platform/page-type combinations
- ✅ Three-tier extraction strategy (primary → secondary → fallback)
- ✅ Structured context objects with confidence scores
- ✅ Missing field detection and warnings
- ✅ Visible text fallback extraction
- ✅ Salesforce Opportunity fully functional
- ✅ Calendar event extraction for Google and Outlook
- ✅ Gmail/Outlook compose extraction
- ✅ LinkedIn profile extraction
- ✅ Console diagnostic logging
- ✅ Zero local data storage
- ✅ No API calls (diagnostic phase only)

**Ready for testing and Phase 1C integration!**
