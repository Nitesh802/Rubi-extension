# Rubi Browser Extension

In-the-flow-of-work intelligence assistant for sales teams.

## Project Status

**Current Phase:** Phase 1B Complete (DOM Extraction)

- ✅ Manifest V3 structure
- ✅ Floating bubble UI
- ✅ Right-side drawer with Shadow DOM
- ✅ Basic message passing (content ↔ background ↔ drawer)
- ✅ Platform detection (Salesforce, Gmail, Outlook, Calendar, LinkedIn)
- ✅ DOM extraction with 3-tier selector strategy (primary → secondary → fallback)
- ✅ Context extraction for Salesforce (Opportunity, Account, Contact)
- ✅ Context extraction for Gmail/Outlook compose windows
- ✅ Context extraction for Google/Outlook Calendar events
- ✅ Context extraction for LinkedIn profiles
- ⏳ Rubi API integration (not implemented)
- ⏳ Session authentication (not implemented)
- ⏳ Deep linking (not implemented)

---

## Architecture

### Components

- **Background Worker** (`background/worker.js`): Service worker for message routing and lifecycle management
- **Content Scripts** (`content/injector.js`): Injects bubble + drawer, handles UI events, detects platform
- **Platform Detector** (`utils/platformDetector.js`): Identifies current platform (Salesforce, Gmail, etc.)
- **Drawer UI** (`drawer/`): Right-side panel for displaying insights (Shadow DOM)
- **Floating Bubble** (`bubble/`): Always-visible activation button (currently inline in injector)
- **Utils** (`utils/`): Message type constants, platform detection, and shared utilities

### Message Flow

```
User clicks bubble
  ↓
content/injector.js sends OPEN_DRAWER
  ↓
background/worker.js routes message
  ↓
Drawer opens with placeholder content
```

---

## How to Test in Chrome

### 1. Load the Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **Load unpacked**
4. Select the `Rubi_Browser_Extension` folder
5. The extension should appear in your extensions list

### 2. Test the Floating Bubble

1. Navigate to any website (e.g., `https://google.com`)
2. You should see a purple gradient circle in the **bottom-right corner**
3. Click the bubble
4. The right-side drawer should slide in from the right

### 3. Test the Drawer

1. The drawer should display:
   - Header: "Rubi Assistant"
   - Close button (×)
   - Placeholder message: "Rubi Extension Loaded – No Analysis Yet"
2. Click the **×** button to close the drawer
3. The drawer should slide back out

### 4. Test Message Passing

1. Open Chrome DevTools (`Cmd+Option+I` or `F12`)
2. Go to the **Console** tab
3. You should see log messages like:
   - `[Rubi Content] Injector loaded`
   - `[Rubi Content] Bubble injected successfully`
   - `[Rubi Content] Testing message passing...`
   - `[Rubi Content] Ping response: {success: true, message: "Pong from background worker", ...}`
4. Click the extension icon in the Chrome toolbar
   - The drawer should toggle open/closed
5. Check the **Service Worker** logs:
   - Go to `chrome://extensions/`
   - Find "Rubi Browser Extension"
   - Click "service worker" link
   - You should see background worker logs

### 5. Verify Shadow DOM Isolation

1. Inspect the bubble or drawer with DevTools
2. You should see `#shadow-root (open)` containing the UI elements
3. Host page CSS should not affect bubble/drawer styles

---

## File Structure

```
/Rubi_Browser_Extension/
├── manifest.json                    # Manifest V3 configuration
├── README.md                        # This file
│
├── /background/
│   └── worker.js                    # Service worker
│
├── /content/
│   └── injector.js                  # Main content script
│
├── /utils/
│   └── messaging.js                 # Message type constants
│
└── /assets/
    └── /icons/
        ├── icon16.png
        ├── icon48.png
        └── icon128.png
```

---

## Next Steps

1. **Create placeholder icons** (16x16, 48x48, 128x128 PNG files)
2. **Implement platform detection** (Salesforce, Gmail, LinkedIn, etc.)
3. **Build DOM extraction logic** with `selectorMaps.js`
4. **Integrate Rubi API** (`/api/extension/analyze-context`)
5. **Add session authentication** (cookie-based)
6. **Implement deep linking** (`/api/extension/create-context`)
7. **Add real drawer content rendering**

---

## Development Notes

### Permissions

- `activeTab`: Interact with current tab content
- `scripting`: Inject content scripts programmatically (future use)
- `storage`: Persist user preferences
- `host_permissions: <all_urls>`: **Temporary for testing**; will be restricted to specific domains in production

### Shadow DOM

The bubble and drawer are injected using Shadow DOM to prevent style conflicts with host pages. All CSS is scoped within the shadow root.

### Message Types

See `utils/messaging.js` for all available message types. Current implementation uses:
- `PING` / `PONG`: Test message passing
- `OPEN_DRAWER` / `CLOSE_DRAWER`: Drawer lifecycle
- `TOGGLE_DRAWER`: Toggle drawer state

---

## Troubleshooting

### Extension won't load
- Check for syntax errors in `manifest.json`
- Ensure all file paths are correct
- Check Chrome DevTools console for errors

### Bubble not appearing
- Check browser console for errors
- Verify content script is injected: look for `[Rubi Content] Injector loaded`
- Try refreshing the page

### Drawer not opening
- Check console for click event logs
- Verify Shadow DOM is attached
- Check z-index conflicts with host page

### Message passing not working
- Check service worker logs in `chrome://extensions/`
- Verify `chrome.runtime` API is available
- Check for errors in background worker console

---

## License

Proprietary - Rubi Inc.
