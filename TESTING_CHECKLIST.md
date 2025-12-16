# Rubi Browser Extension - Testing Checklist

## ✅ Skeleton v0.1.0 Verification

Use this checklist to verify the extension is working correctly.

---

### 1. Extension Loading

- [ ] Open Chrome and go to `chrome://extensions/`
- [ ] Enable **Developer mode** (top-right toggle)
- [ ] Click **Load unpacked**
- [ ] Select the `Rubi_Browser_Extension` folder
- [ ] Extension appears in the list with "Rubi Browser Extension" name
- [ ] No errors shown in the extension card
- [ ] Extension icon appears in Chrome toolbar

---

### 2. Bubble Injection

- [ ] Navigate to any website (e.g., `https://google.com`)
- [ ] Purple gradient circle appears in **bottom-right corner** (24px from edges)
- [ ] Bubble is visible and clickable
- [ ] Bubble has hover effect (scales up slightly)
- [ ] Bubble contains white icon/logo

---

### 3. Drawer Functionality

**Opening:**
- [ ] Click the floating bubble
- [ ] Drawer slides in from the right (smooth 0.3s transition)
- [ ] Drawer is 400px wide
- [ ] Drawer header shows "Rubi Assistant"
- [ ] Close button (×) is visible in the header
- [ ] Content area shows placeholder message:
  - Icon (purple stacked layers)
  - "Rubi Extension Loaded"
  - "No analysis yet. DOM extraction and Rubi API integration coming soon."

**Closing:**
- [ ] Click the **×** button
- [ ] Drawer slides out to the right (smooth transition)
- [ ] Bubble remains visible

**Toggling:**
- [ ] Click bubble again to re-open drawer
- [ ] Click bubble while open to close drawer
- [ ] Drawer state toggles correctly

---

### 4. Extension Icon Click

- [ ] Click the extension icon in Chrome toolbar
- [ ] Drawer toggles open/closed
- [ ] Clicking icon while drawer is open closes it
- [ ] Clicking icon while drawer is closed opens it

---

### 5. Message Passing

**Console Logs:**
- [ ] Open Chrome DevTools (`Cmd+Option+I` or `F12`)
- [ ] Go to **Console** tab
- [ ] Look for these messages:
  - `[Rubi Content] Injector loaded`
  - `[Rubi Content] Initializing extension UI`
  - `[Rubi Content] Bubble injected successfully`
  - `[Rubi Content] Testing message passing...`
  - `[Rubi Content] Ping response: {success: true, ...}`

**Background Worker Logs:**
- [ ] Go to `chrome://extensions/`
- [ ] Find "Rubi Browser Extension"
- [ ] Click **"service worker"** link (opens DevTools for worker)
- [ ] Look for these messages:
  - `[Rubi Background] Service worker initialized`
  - `[Rubi Background] Received message: {type: "PING", ...}`
  - `[Rubi Background] Ping received from tab: <tabId>`

**Interaction Logs:**
- [ ] Click the bubble
- [ ] Check console for:
  - `[Rubi Content] Bubble clicked`
  - `[Rubi Content] Opening drawer`
- [ ] Check background worker logs for:
  - `[Rubi Background] Received message: {type: "OPEN_DRAWER"}`
  - `[Rubi Background] Opening drawer for tab: <tabId>`

---

### 6. Shadow DOM Isolation

**Inspect Bubble:**
- [ ] Right-click the bubble → Inspect
- [ ] DevTools shows `<div id="rubi-extension-root">`
- [ ] Inside, there's `#shadow-root (open)`
- [ ] Shadow root contains `<div id="rubi-bubble">` with styles

**Inspect Drawer:**
- [ ] Open drawer and right-click it → Inspect
- [ ] DevTools shows `<div id="rubi-drawer-root">`
- [ ] Inside, there's `#shadow-root (open)`
- [ ] Shadow root contains `<div id="rubi-drawer">` with styles

**Style Isolation:**
- [ ] Host page CSS does not affect bubble/drawer appearance
- [ ] Bubble/drawer CSS does not leak to host page
- [ ] Verify by checking computed styles in DevTools

---

### 7. Multi-Tab Behavior

- [ ] Open extension on Tab A (e.g., `google.com`)
- [ ] Open drawer on Tab A
- [ ] Switch to Tab B (e.g., `github.com`)
- [ ] Bubble appears on Tab B
- [ ] Drawer on Tab B is independent (not open yet)
- [ ] Open drawer on Tab B
- [ ] Switch back to Tab A
- [ ] Drawer state on Tab A is preserved (should be closed after switching)

---

### 8. Permissions Audit

- [ ] Go to `chrome://extensions/`
- [ ] Click **Details** on Rubi Browser Extension
- [ ] Under **Permissions**, verify:
  - "Read and change all your data on all websites" (due to `<all_urls>` - will be restricted later)
- [ ] No other excessive permissions

---

### 9. Error Handling

**Invalid Message Type:**
- [ ] Open console
- [ ] Run: `chrome.runtime.sendMessage({type: 'INVALID'}, console.log)`
- [ ] Check response: `{success: false, error: "Unknown message type"}`
- [ ] Check background logs for warning

**Extension Icon Click (No Active Tab):**
- [ ] Click extension icon on `chrome://extensions/` page
- [ ] Check for error in background logs (expected - can't inject on chrome:// pages)

---

### 10. Visual Quality

- [ ] Bubble has smooth gradient (purple to darker purple)
- [ ] Bubble shadow is subtle and appealing
- [ ] Drawer has clean, modern design
- [ ] Fonts are readable and consistent
- [ ] Close button (×) is properly aligned
- [ ] No visual glitches or overlapping elements
- [ ] Drawer scrollbar appears if content overflows (not yet, but container is ready)

---

## ✅ All Tests Passed?

If all items are checked, the skeleton is working correctly!

**Next Steps:**
1. Implement platform detection (Salesforce, Gmail, etc.)
2. Build DOM extraction with `selectorMaps.js`
3. Integrate Rubi API
4. Add session authentication
5. Implement deep linking

---

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| Extension won't load | Check `manifest.json` for syntax errors |
| Bubble not appearing | Refresh page; check console for errors |
| Drawer not opening | Check z-index; verify Shadow DOM is attached |
| Message passing fails | Check service worker is running; reload extension |
| Icons missing | Run `python3 create_icons.py` |

---

## 📝 Notes

- Current permissions use `<all_urls>` for testing; will be restricted to specific domains in production
- Shadow DOM provides style isolation but can be inspected in DevTools
- Message passing uses async `chrome.runtime.sendMessage` and `chrome.tabs.sendMessage`
- Drawer is injected on-demand (first click) to minimize performance impact

