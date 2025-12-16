# Phase 1A: Platform Detection - Implementation Summary

## Overview

Phase 1A implements robust platform detection logic that identifies which supported platform the user is currently viewing, using URL patterns and minimal DOM cues.

---

## Implementation Details

### Files Created/Modified

1. **`utils/platformDetector.js`** (NEW)
   - Core platform detection logic
   - Returns normalized platform identifiers
   - Exports global `window.RubiPlatformDetector` object

2. **`manifest.json`** (MODIFIED)
   - Added `utils/platformDetector.js` to content_scripts array
   - Load order: `messaging.js` → `platformDetector.js` → `injector.js`

3. **`content/injector.js`** (MODIFIED)
   - Added `currentPlatform` and `platformDetails` state variables
   - Added `detectCurrentPlatform()` function
   - Calls platform detection during `init()`
   - Logs detected platform to console
   - Stores platform info in `chrome.storage.local`

---

## Platform Identifiers

The platform detector returns one of the following normalized identifiers:

| Platform | Identifier | URL Pattern | DOM Cues |
|----------|-----------|-------------|----------|
| **Salesforce Lightning** | `salesforce` | `lightning.force.com`, `/lightning/r/` | Aura elements, SLDS classes, Lightning components |
| **Gmail** | `gmail` | `mail.google.com` | `[role="main"]`, `.nH`, compose elements |
| **Outlook Web** | `outlook_web` | `outlook.office.com/mail` | `[data-app-section="Mail"]`, compose pane |
| **Google Calendar** | `google_calendar` | `calendar.google.com` | Calendar elements, event dialogs |
| **Outlook Calendar** | `outlook_calendar` | `outlook.office.com/calendar` | `[data-app-section="Calendar"]` |
| **LinkedIn** | `linkedin` | `linkedin.com/in/` | Profile card, profile header |
| **Unknown** | `unknown` | Any other URL | No matching patterns |

---

## Detection Logic

### Salesforce Lightning
```javascript
// URL checks
hostname.includes('lightning.force.com') || hostname.includes('salesforce.com')
pathname.includes('/lightning/r/') || pathname.includes('/lightning/o/')

// DOM checks
document.querySelector('[data-aura-rendered-by]') !== null
document.querySelector('.slds-scope') !== null
document.querySelector('one-app-launcher-header') !== null
```

### Gmail
```javascript
// URL checks
hostname.includes('mail.google.com')

// DOM checks
document.querySelector('[role="main"]') !== null
document.querySelector('[aria-label*="Message Body"]') !== null
document.querySelector('.editable[contenteditable="true"]') !== null
```

### Outlook Web
```javascript
// URL checks
hostname.includes('outlook.office.com') && pathname.includes('/mail')

// DOM checks
document.querySelector('[data-app-section="Mail"]') !== null
document.querySelector('[aria-label*="Compose"]') !== null
```

### Google Calendar
```javascript
// URL checks
hostname.includes('calendar.google.com')

// DOM checks
document.querySelector('[data-view-heading]') !== null
document.querySelector('[role="dialog"][aria-label*="Event"]') !== null
```

### Outlook Calendar
```javascript
// URL checks
hostname.includes('outlook.office.com') && pathname.includes('/calendar')

// DOM checks
document.querySelector('[data-app-section="Calendar"]') !== null
```

### LinkedIn
```javascript
// URL checks
hostname.includes('linkedin.com') && pathname.includes('/in/')

// DOM checks
document.querySelector('.pv-top-card') !== null
document.querySelector('h1.text-heading-xlarge') !== null
document.querySelector('[data-view-name="profile-view"]') !== null
```

---

## Page Type Detection (Preliminary)

In addition to platform detection, the detector includes preliminary page type detection:

### Salesforce Page Types
- `opportunity` - `/lightning/r/Opportunity/`
- `account` - `/lightning/r/Account/`
- `contact` - `/lightning/r/Contact/`
- `unknown` - Other Salesforce pages

### Gmail Page Types
- `compose` - URL includes `?compose=` or has compose window
- `inbox` - Default Gmail view

### Outlook Web Page Types
- `compose` - URL includes `/mail/compose` or has compose pane
- `inbox` - Default Outlook view

### Calendar Page Types
- `calendar_event` - Both Google and Outlook calendars

### LinkedIn Page Types
- `profile` - LinkedIn profile pages

---

## API Reference

### `detectPlatform()`
Returns a platform identifier string.

```javascript
const platform = window.RubiPlatformDetector.detectPlatform();
// Returns: 'salesforce' | 'gmail' | 'outlook_web' | 'google_calendar' | 'outlook_calendar' | 'linkedin' | 'unknown'
```

### `getPlatformDetails()`
Returns detailed platform information including page type.

```javascript
const details = window.RubiPlatformDetector.getPlatformDetails();
// Returns: { platform: string, pageType: string, metadata: {} }
```

### `PLATFORMS`
Platform identifier constants.

```javascript
window.RubiPlatformDetector.PLATFORMS.SALESFORCE // 'salesforce'
window.RubiPlatformDetector.PLATFORMS.GMAIL // 'gmail'
// etc.
```

---

## Testing Guide

### 1. Reload Extension

1. Go to `chrome://extensions/`
2. Find "Rubi Browser Extension"
3. Click the **refresh** icon
4. Verify no errors appear

### 2. Test Salesforce Detection

1. Navigate to a Salesforce Lightning instance (e.g., `https://yourorg.lightning.force.com`)
2. Open DevTools → Console
3. Look for: `[Rubi] Detected platform: salesforce`
4. If on an Opportunity page, should also see: `[Rubi] Page type: opportunity`

**Test URLs:**
- `https://*.lightning.force.com/lightning/r/Opportunity/[ID]/view`
- `https://*.lightning.force.com/lightning/r/Account/[ID]/view`
- `https://*.salesforce.com/lightning/page/home`

### 3. Test Gmail Detection

1. Navigate to Gmail: `https://mail.google.com`
2. Open DevTools → Console
3. Look for: `[Rubi] Detected platform: gmail`
4. Click "Compose" button
5. Refresh page or navigate
6. Should still detect as Gmail, page type: `compose`

**Test URLs:**
- `https://mail.google.com/mail/u/0/#inbox`
- `https://mail.google.com/mail/u/0/?compose=new`

### 4. Test Outlook Web Detection

1. Navigate to Outlook Web: `https://outlook.office.com/mail`
2. Open DevTools → Console
3. Look for: `[Rubi] Detected platform: outlook_web`
4. Click "New message"
5. Should detect page type: `compose`

**Test URLs:**
- `https://outlook.office.com/mail/inbox`
- `https://outlook.office365.com/mail`

### 5. Test Google Calendar Detection

1. Navigate to Google Calendar: `https://calendar.google.com`
2. Open DevTools → Console
3. Look for: `[Rubi] Detected platform: google_calendar`
4. Click on an event
5. Should detect page type: `calendar_event`

**Test URLs:**
- `https://calendar.google.com/calendar/u/0/r`

### 6. Test Outlook Calendar Detection

1. Navigate to Outlook Calendar: `https://outlook.office.com/calendar`
2. Open DevTools → Console
3. Look for: `[Rubi] Detected platform: outlook_calendar`

**Test URLs:**
- `https://outlook.office.com/calendar/view/month`

### 7. Test LinkedIn Detection

1. Navigate to any LinkedIn profile: `https://www.linkedin.com/in/[username]`
2. Open DevTools → Console
3. Look for: `[Rubi] Detected platform: linkedin`
4. Should detect page type: `profile`

**Test URLs:**
- `https://www.linkedin.com/in/williamhgates/` (example)

### 8. Test Unknown Platform

1. Navigate to any non-supported site (e.g., `https://github.com`)
2. Open DevTools → Console
3. Look for: `[Rubi] Detected platform: unknown`

---

## Console Output Examples

### Successful Detection (Salesforce Opportunity)
```
[Rubi Content] Injector loaded
[Rubi Content] Initializing extension UI
[Rubi] Detected platform: salesforce
[Rubi] Page type: opportunity
[Rubi Content] Bubble injected successfully
[Rubi Content] Testing message passing...
```

### Successful Detection (Gmail Compose)
```
[Rubi Content] Injector loaded
[Rubi Content] Initializing extension UI
[Rubi] Detected platform: gmail
[Rubi] Page type: compose
[Rubi Content] Bubble injected successfully
```

### Unknown Platform
```
[Rubi Content] Injector loaded
[Rubi Content] Initializing extension UI
[Rubi] Detected platform: unknown
[Rubi Content] Bubble injected successfully
```

---

## Stored Data

Platform detection results are stored in `chrome.storage.local`:

```javascript
{
  lastDetectedPlatform: 'salesforce',
  lastDetectedPageType: 'opportunity'
}
```

This data will be used in future phases for context extraction and analytics.

---

## Future Enhancements (Phase 1B)

The platform detector includes placeholder logic for more detailed page type detection that will be expanded in Phase 1B when we implement DOM extraction:

- **Salesforce**: Detect specific object types (Opportunity, Account, Contact, Lead, Case, etc.)
- **Gmail**: Detect inbox views, thread views, compose modes
- **Outlook**: Detect different mail views and compose modes
- **Calendars**: Detect event detail views, week/month views
- **LinkedIn**: Detect profile sections, company pages, etc.

---

## Troubleshooting

### Platform not detected
- Check that the URL matches expected patterns
- Verify DOM elements are loaded (try waiting a few seconds)
- Check console for `[Rubi] Platform detector not available` warning
- Verify `platformDetector.js` is loaded before `injector.js` in manifest

### Wrong platform detected
- Review detection logic in `platformDetector.js`
- Check for conflicting DOM elements
- Verify URL patterns are correct

### Extension won't load
- Check for syntax errors in `platformDetector.js`
- Verify manifest.json is valid JSON
- Check for errors in Chrome extension console

---

## Next Steps: Phase 1B

With platform detection complete, the next phase will implement:

1. **DOM Extraction** - Extract structured data from each platform
2. **Selector Maps** - Create `utils/selectorMaps.js` with platform-specific selectors
3. **Context Extraction** - Build `utils/contextExtractor.js` to extract and structure context
4. **Missing Field Detection** - Identify when required fields are unavailable

---

## Summary

✅ Platform detection implemented and working
✅ All 6 supported platforms detected via URL + DOM patterns
✅ Page type detection (preliminary) for Salesforce, Gmail, Outlook
✅ Console logging for verification
✅ Platform info stored in chrome.storage.local
✅ Ready for Phase 1B: DOM Extraction

**Status: Phase 1A Complete**
