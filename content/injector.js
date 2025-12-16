/**
 * Rubi Browser Extension - Content Script Injector
 *
 * Responsibilities:
 * - Inject floating bubble into page
 * - Inject drawer container into page
 * - Wire up message passing between bubble, drawer, and background worker
 * - Handle drawer open/close state
 */

console.log('[Rubi Content] Injector loaded');

// State
let drawerInjected = false;
let bubbleInjected = false;
let panelInjected = false;
let drawerOpen = false;
let currentPlatform = 'unknown';
let platformDetails = null;
let extractedContext = null;
let drawerApiReady = false;
let drawerApiRetryCount = 0;
const drawerApiMaxRetries = 20; // 2 seconds total
const drawerApiRetryDelay = 100; // 100ms between retries

// References to injected elements
let bubbleContainer = null;
let drawerContainer = null;
let panelContainer = null;

/**
 * Initialize the extension UI
 */
async function init() {
  console.log('[Rubi Content] Initializing extension UI');

  // Check if already injected (prevent duplicate injection on dynamic pages)
  if (document.getElementById('rubi-extension-root')) {
    console.log('[Rubi Content] Already injected, skipping');
    return;
  }

  // Detect platform
  await detectCurrentPlatform();

  injectBubble();
  await injectPanel();
  
  // Check if Rubi APIs are loaded
  verifyAPIsLoaded();
  
  setupMessageListeners();
}

/**
 * Verify that all required APIs are loaded
 */
function verifyAPIsLoaded() {
  console.log('[Rubi Content] Verifying APIs...');
  
  const apis = {
    'RubiActionsRegistry': 'Actions Registry',
    'RubiActionsRouter': 'Actions Router',
    'RubiContextBridge': 'Context Bridge',
    'RubiDrawer': 'Drawer API'
  };
  
  const loadedApis = [];
  const missingApis = [];
  
  for (const [key, name] of Object.entries(apis)) {
    if (typeof window[key] !== 'undefined') {
      loadedApis.push(name);
    } else {
      missingApis.push(name);
    }
  }
  
  if (loadedApis.length > 0) {
    console.log('[Rubi Content] Loaded APIs:', loadedApis.join(', '));
  }
  
  if (missingApis.length > 0) {
    console.warn('[Rubi Content] Missing APIs:', missingApis.join(', '));
    console.log('[Rubi Content] APIs will be checked again when drawer opens');
  }
  
  // Mark drawer API as ready if it's available
  if (window.RubiDrawer) {
    drawerApiReady = true;
  }
}

/**
 * Wait for drawer API to be available
 */
async function waitForDrawerAPI() {
  return new Promise((resolve) => {
    if (window.RubiDrawer) {
      console.log('[Rubi Content] RubiDrawer API is already available');
      drawerApiReady = true;
      resolve(true);
      return;
    }
    
    drawerApiRetryCount = 0;
    
    const checkInterval = setInterval(() => {
      drawerApiRetryCount++;
      
      if (window.RubiDrawer) {
        console.log('[Rubi Content] RubiDrawer API is now available');
        drawerApiReady = true;
        clearInterval(checkInterval);
        resolve(true);
      } else if (drawerApiRetryCount >= drawerApiMaxRetries) {
        console.warn('[Rubi Content] Timeout waiting for RubiDrawer API');
        clearInterval(checkInterval);
        resolve(false);
      } else if (drawerApiRetryCount % 5 === 0) {
        console.log(`[Rubi Content] Still waiting for RubiDrawer API... (${drawerApiRetryCount}/${drawerApiMaxRetries})`);
      }
    }, drawerApiRetryDelay);
  });
}

/**
 * Detect current platform and extract context
 */
async function detectCurrentPlatform() {
  // Use the global RubiPlatformDetector injected by platformDetector.js
  if (typeof window.RubiPlatformDetector !== 'undefined') {
    currentPlatform = window.RubiPlatformDetector.detectPlatform();
    platformDetails = await window.RubiPlatformDetector.getPlatformDetails();

    console.log('[Rubi] Detected platform:', currentPlatform);

    if (platformDetails.pageType !== 'unknown') {
      console.log('[Rubi] Page type:', platformDetails.pageType);
    }

    // Store platform info for future use
    chrome.storage.local.set({
      lastDetectedPlatform: currentPlatform,
      lastDetectedPageType: platformDetails.pageType
    });

    // Extract context if on a supported platform
    await extractContextIfSupported();
  } else {
    console.warn('[Rubi] Platform detector not available');
  }
}

/**
 * Extract context if platform and page type are supported
 */
async function extractContextIfSupported() {
  // Only extract context for known platforms (not 'unknown')
  if (currentPlatform === 'unknown') {
    console.log('[Rubi] Skipping context extraction for unknown platform');
    return;
  }

  // Check if context extractor is available
  if (typeof window.RubiContextExtractor === 'undefined') {
    console.warn('[Rubi] Context extractor not available');
    return;
  }

  // Extract context (now async due to Salesforce DOM polling)
  try {
    extractedContext = await window.RubiContextExtractor.extractContext(
      currentPlatform,
      platformDetails.pageType
    );

    // Log extracted context
    console.log('[Rubi] Extracted context:', extractedContext);

    // Log extraction summary
    const summary = window.RubiContextExtractor.generateExtractionSummary(extractedContext);
    console.log('[Rubi] Extraction Summary:\n' + summary);

    // Warn if missing required fields
    if (extractedContext.missingFields && extractedContext.missingFields.length > 0) {
      console.warn(
        '[Rubi] Missing required fields:',
        extractedContext.missingFields,
        '\nUser guidance: Navigate to the appropriate tab or view to see full details.'
      );
    }
  } catch (error) {
    console.error('[Rubi] Context extraction failed:', error);
    extractedContext = null;
  }
}

/**
 * Inject the floating bubble
 */
function injectBubble() {
  if (bubbleInjected) return;

  console.log('[Rubi Content] Injecting bubble');

  // Create container for bubble
  bubbleContainer = document.createElement('div');
  bubbleContainer.id = 'rubi-extension-root';
  bubbleContainer.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 2147483647;
    pointer-events: none;
  `;

  // Create shadow DOM for style isolation
  const shadowRoot = bubbleContainer.attachShadow({ mode: 'open' });

  // Create bubble element
  const bubble = document.createElement('div');
  bubble.id = 'rubi-bubble';
  bubble.innerHTML = `
    <div class="rubi-bubble-inner">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white"/>
        <path d="M2 17L12 22L22 17L12 12L2 17Z" fill="white"/>
        <path d="M2 12L12 17L22 12" stroke="white" stroke-width="2"/>
      </svg>
    </div>
  `;

  // Add styles
  const style = document.createElement('style');
  style.textContent = `
    #rubi-bubble {
      pointer-events: auto;
      cursor: pointer;
    }

    .rubi-bubble-inner {
      width: 56px;
      height: 56px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .rubi-bubble-inner:hover {
      transform: scale(1.05);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
    }

    .rubi-bubble-inner:active {
      transform: scale(0.95);
    }
  `;

  shadowRoot.appendChild(style);
  shadowRoot.appendChild(bubble);

  // Add click handler
  bubble.addEventListener('click', handleBubbleClick);

  // Inject into page
  document.body.appendChild(bubbleContainer);
  bubbleInjected = true;

  console.log('[Rubi Content] Bubble injected successfully');
}

/**
 * Inject the production drawer UI
 */
async function injectDrawer() {
  if (drawerInjected) return;

  console.log('[Rubi Content] Injecting production drawer');

  try {
    // Fetch drawer HTML
    const drawerHtmlUrl = chrome.runtime.getURL('drawer/drawer.html');
    const response = await fetch(drawerHtmlUrl);
    const htmlContent = await response.text();

    // Create drawer container
    drawerContainer = document.createElement('div');
    drawerContainer.id = 'rubi-drawer-root';
    
    // Parse HTML and extract body content
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    const drawerElement = doc.getElementById('rubi-drawer');
    
    if (!drawerElement) {
      throw new Error('Drawer element not found in HTML');
    }
    
    // Apply drawer HTML
    drawerContainer.appendChild(drawerElement);

    // Load drawer CSS
    const drawerCssUrl = chrome.runtime.getURL('drawer/drawer.css');
    const cssLink = document.createElement('link');
    cssLink.rel = 'stylesheet';
    cssLink.href = drawerCssUrl;
    document.head.appendChild(cssLink);

    // Inject drawer into page
    document.body.appendChild(drawerContainer);

    drawerInjected = true;
    console.log('[Rubi Content] Production drawer injected successfully');
    
    // Drawer initialization is now handled by content script loading order
    // The drawer.js and drawerInit.js are loaded as content scripts
    // Wait for drawer API to be available
    const apiAvailable = await waitForDrawerAPI();
    
    if (!apiAvailable) {
      console.warn('[Rubi Content] Drawer API not available after timeout');
      console.log('[Rubi Content] Using direct DOM manipulation as fallback');
    }

  } catch (error) {
    console.error('[Rubi Content] Failed to inject drawer:', error);
    // Fall back to basic drawer if production drawer fails
    injectBasicDrawer();
  }
}

/**
 * Inject basic fallback drawer
 */
function injectBasicDrawer() {
  if (drawerInjected) return;

  console.log('[Rubi Content] Injecting basic fallback drawer');

  // Create container for drawer
  drawerContainer = document.createElement('div');
  drawerContainer.id = 'rubi-drawer-root';
  drawerContainer.style.cssText = `
    position: fixed;
    top: 0;
    right: -400px;
    width: 400px;
    height: 100vh;
    z-index: 2147483646;
    transition: right 0.3s ease;
    pointer-events: none;
  `;

  // Create shadow DOM for style isolation
  const shadowRoot = drawerContainer.attachShadow({ mode: 'open' });

  // Create drawer element
  const drawer = document.createElement('div');
  drawer.id = 'rubi-drawer';
  drawer.innerHTML = `
    <div class="rubi-drawer-header">
      <h2>Rubi Assistant</h2>
      <button id="rubi-drawer-close" aria-label="Close drawer">×</button>
    </div>
    <div class="rubi-drawer-content">
      <div class="rubi-placeholder">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#667eea"/>
          <path d="M2 17L12 22L22 17L12 12L2 17Z" fill="#667eea"/>
          <path d="M2 12L12 17L22 12" stroke="#667eea" stroke-width="2"/>
        </svg>
        <h3>Rubi Extension Loaded</h3>
        <p>Production drawer failed to load. Using fallback UI.</p>
      </div>
    </div>
  `;

  // Add styles
  const style = document.createElement('style');
  style.textContent = `
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    #rubi-drawer {
      width: 100%;
      height: 100%;
      background: #ffffff;
      box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
      display: flex;
      flex-direction: column;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      pointer-events: auto;
    }

    .rubi-drawer-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      border-bottom: 1px solid #e5e7eb;
      background: #f9fafb;
    }

    .rubi-drawer-header h2 {
      font-size: 18px;
      font-weight: 600;
      color: #111827;
    }

    #rubi-drawer-close {
      background: none;
      border: none;
      font-size: 28px;
      color: #6b7280;
      cursor: pointer;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: background 0.2s ease;
    }

    #rubi-drawer-close:hover {
      background: #e5e7eb;
      color: #111827;
    }

    .rubi-drawer-content {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
    }

    .rubi-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 40px 20px;
    }

    .rubi-placeholder svg {
      margin-bottom: 16px;
      opacity: 0.6;
    }

    .rubi-placeholder h3 {
      font-size: 16px;
      font-weight: 600;
      color: #111827;
      margin-bottom: 8px;
    }

    .rubi-placeholder p {
      font-size: 14px;
      color: #6b7280;
      line-height: 1.5;
    }
  `;

  shadowRoot.appendChild(style);
  shadowRoot.appendChild(drawer);

  // Add close button handler
  const closeButton = shadowRoot.getElementById('rubi-drawer-close');
  closeButton.addEventListener('click', handleDrawerClose);

  // Inject into page
  document.body.appendChild(drawerContainer);
  drawerInjected = true;

  console.log('[Rubi Content] Basic drawer injected successfully');
}

/**
 * Inject the debug panel
 */
async function injectPanel() {
  if (panelInjected) return;

  console.log('[Rubi Content] Injecting debug panel');

  try {
    // Fetch panel HTML
    const panelHtmlUrl = chrome.runtime.getURL('panel/panel.html');
    const response = await fetch(panelHtmlUrl);
    const htmlContent = await response.text();

    // Create panel container
    panelContainer = document.createElement('div');
    panelContainer.id = 'rubi-debug-panel-root';
    panelContainer.innerHTML = htmlContent;

    // Load panel CSS
    const panelCssUrl = chrome.runtime.getURL('panel/panel.css');
    const cssLink = document.createElement('link');
    cssLink.rel = 'stylesheet';
    cssLink.href = panelCssUrl;
    document.head.appendChild(cssLink);

    // Inject panel into page
    document.body.appendChild(panelContainer);

    // Panel JS is now loaded as a content script
    panelInjected = true;
    console.log('[Rubi Content] Panel injected');

  } catch (error) {
    console.error('[Rubi Content] Failed to inject debug panel:', error);
  }
}

/**
 * Handle bubble click
 */
async function handleBubbleClick() {
  console.log('[Rubi Content] Bubble clicked');

  // Inject drawer if not already injected
  if (!drawerInjected) {
    await injectDrawer();
    // Wait for drawer to initialize
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  // Re-check if drawer API is available
  if (!drawerApiReady) {
    const apiAvailable = await waitForDrawerAPI();
    if (!apiAvailable) {
      console.warn('[Rubi Content] Drawer API still not available');
    }
  }

  // Toggle drawer using RubiDrawer API if available
  if (window.RubiDrawer) {
    console.log('[Rubi Content] Using RubiDrawer API');
    try {
      // Get current state BEFORE toggle
      const currentState = window.RubiDrawer.getState().isOpen;
      console.log('[Rubi Content] Drawer state before toggle:', currentState);
      
      // Toggle based on current state
      if (currentState) {
        window.RubiDrawer.close();
        drawerOpen = false;
      } else {
        window.RubiDrawer.open();
        drawerOpen = true;
      }
      
      console.log('[Rubi Content] Drawer state after toggle:', drawerOpen);
    } catch (error) {
      console.error('[Rubi Content] Error using RubiDrawer API:', error);
      // Fall back to DOM manipulation
      toggleDrawerDirect();
    }
  } else {
    console.log('[Rubi Content] RubiDrawer API not available, using direct DOM manipulation');
    toggleDrawerDirect();
  }

  // Notify background worker with correct state
  chrome.runtime.sendMessage({
    type: drawerOpen ? MESSAGE_TYPES.OPEN_DRAWER : MESSAGE_TYPES.CLOSE_DRAWER
  });
}

/**
 * Toggle drawer using direct DOM manipulation
 */
function toggleDrawerDirect() {
  const drawerEl = document.getElementById('rubi-drawer');
  if (drawerEl) {
    if (!drawerOpen) {
      drawerEl.classList.add('open');
      if (drawerContainer) {
        drawerContainer.style.right = '0px';
        drawerContainer.style.pointerEvents = 'auto';
      }
      drawerOpen = true;
      console.log('[Rubi Content] Drawer opened via DOM manipulation');
    } else {
      drawerEl.classList.remove('open');
      drawerEl.classList.remove('minimized');
      if (drawerContainer) {
        drawerContainer.style.right = '-400px';
        drawerContainer.style.pointerEvents = 'none';
      }
      drawerOpen = false;
      console.log('[Rubi Content] Drawer closed via DOM manipulation');
    }
  } else {
    console.error('[Rubi Content] Drawer element not found');
    // Try basic fallback
    toggleDrawer();
  }
}

/**
 * Toggle drawer open/close (fallback)
 */
function toggleDrawer() {
  if (drawerOpen) {
    closeDrawer();
  } else {
    openDrawer();
  }
}

/**
 * Open drawer (fallback)
 */
function openDrawer() {
  if (!drawerContainer) return;

  console.log('[Rubi Content] Opening drawer (fallback)');
  
  // Check if using production drawer
  if (window.RubiDrawer) {
    try {
      window.RubiDrawer.open();
    } catch (error) {
      console.error('[Rubi Content] Error opening drawer:', error);
      // Fallback to direct manipulation
      drawerContainer.style.right = '0px';
      drawerContainer.style.pointerEvents = 'auto';
    }
  } else {
    // Fallback for basic drawer
    drawerContainer.style.right = '0px';
    drawerContainer.style.pointerEvents = 'auto';
  }
  
  drawerOpen = true;
}

/**
 * Close drawer (fallback)
 */
function closeDrawer() {
  if (!drawerContainer) return;

  console.log('[Rubi Content] Closing drawer (fallback)');
  
  // Check if using production drawer
  if (window.RubiDrawer) {
    try {
      window.RubiDrawer.close();
    } catch (error) {
      console.error('[Rubi Content] Error closing drawer:', error);
      // Fallback to direct manipulation
      drawerContainer.style.right = '-400px';
      drawerContainer.style.pointerEvents = 'none';
    }
  } else {
    // Fallback for basic drawer
    drawerContainer.style.right = '-400px';
    drawerContainer.style.pointerEvents = 'none';
  }
  
  drawerOpen = false;
}

/**
 * Handle drawer close button click (fallback)
 */
function handleDrawerClose() {
  closeDrawer();

  // Notify background worker
  chrome.runtime.sendMessage({
    type: MESSAGE_TYPES.CLOSE_DRAWER
  });
}

/**
 * Setup message listeners from background worker
 */
function setupMessageListeners() {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('[Rubi Content] Received message:', message);

    switch (message.type) {
      case MESSAGE_TYPES.TOGGLE_DRAWER:
        handleBubbleClick();
        sendResponse({ success: true });
        break;

      case MESSAGE_TYPES.DRAWER_OPEN:
        if (!drawerInjected) injectDrawer();
        openDrawer();
        sendResponse({ success: true });
        break;

      case MESSAGE_TYPES.DRAWER_CLOSE:
        closeDrawer();
        sendResponse({ success: true });
        break;

      default:
        console.warn('[Rubi Content] Unknown message type:', message.type);
        sendResponse({ success: false, error: 'Unknown message type' });
    }

    return true;
  });
}

/**
 * Test message passing (send ping to background)
 */
function testMessagePassing() {
  console.log('[Rubi Content] Testing message passing...');

  chrome.runtime.sendMessage(
    { type: MESSAGE_TYPES.PING, payload: { test: true } },
    (response) => {
      console.log('[Rubi Content] Ping response:', response);
    }
  );
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Test message passing after 1 second
setTimeout(testMessagePassing, 1000);

// Re-verify APIs after 2 seconds
setTimeout(() => {
  console.log('[Rubi Content] Re-verifying APIs...');
  verifyAPIsLoaded();
}, 2000);