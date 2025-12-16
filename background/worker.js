/**
 * Rubi Browser Extension - Background Service Worker
 *
 * Responsibilities:
 * - Message routing between content scripts and drawer
 * - Extension lifecycle management
 * - API orchestration (future)
 */

console.log('[Rubi Background] Service worker initialized');

// Variable to store last payload for debugging
let lastContextPayload = null;

// Storage for last sent payload (debugging) - Bridge Router functionality
let lastSentPayload = null;

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Rubi Background] Received message:', message);

  switch (message.type) {
    case 'PING':
      handlePing(message, sender, sendResponse);
      break;

    case 'OPEN_DRAWER':
      handleOpenDrawer(message, sender, sendResponse);
      break;

    case 'CLOSE_DRAWER':
      handleCloseDrawer(message, sender, sendResponse);
      break;

    case 'EXTRACT_CONTEXT':
      handleExtractContext(message, sender, sendResponse);
      break;

    case 'RUBI_CONTEXT_EXTRACTED':
      handleRubiContextExtracted(message, sender, sendResponse);
      break;

    case 'SEND_CONTEXT_TO_RUBI':
      handleSendContextToRubi(message, sender, sendResponse);
      break;

    default:
      console.warn('[Rubi Background] Unknown message type:', message.type);
      sendResponse({ success: false, error: 'Unknown message type' });
  }

  // Return true to indicate we'll respond asynchronously
  return true;
});

/**
 * Handle ping messages (for testing message flow)
 */
function handlePing(message, sender, sendResponse) {
  console.log('[Rubi Background] Ping received from tab:', sender.tab?.id);

  sendResponse({
    success: true,
    message: 'Pong from background worker',
    timestamp: Date.now()
  });
}

/**
 * Handle drawer open request
 */
function handleOpenDrawer(message, sender, sendResponse) {
  console.log('[Rubi Background] Opening drawer for tab:', sender.tab?.id);

  // In the future, this might trigger context extraction or API calls
  // For now, just relay the message back to the content script
  if (sender.tab?.id) {
    chrome.tabs.sendMessage(sender.tab.id, {
      type: 'DRAWER_OPEN',
      payload: {
        title: 'Rubi Assistant',
        content: 'Extension loaded successfully. No analysis yet.'
      }
    }).catch(err => {
      console.error('[Rubi Background] Failed to send drawer open message:', err);
    });
  }

  sendResponse({ success: true });
}

/**
 * Handle drawer close request
 */
function handleCloseDrawer(message, sender, sendResponse) {
  console.log('[Rubi Background] Closing drawer for tab:', sender.tab?.id);

  if (sender.tab?.id) {
    chrome.tabs.sendMessage(sender.tab.id, {
      type: 'DRAWER_CLOSE'
    }).catch(err => {
      console.error('[Rubi Background] Failed to send drawer close message:', err);
    });
  }

  sendResponse({ success: true });
}

/**
 * Handle context extraction request (placeholder)
 */
function handleExtractContext(message, sender, sendResponse) {
  console.log('[Rubi Background] Context extraction requested (not implemented yet)');

  // TODO: In future, this will:
  // 1. Determine page type
  // 2. Call appropriate context extractor
  // 3. Send payload to Rubi API
  // 4. Return insights to drawer

  sendResponse({
    success: true,
    message: 'Context extraction not implemented yet'
  });
}

/**
 * Handle Rubi context extracted message
 */
function handleRubiContextExtracted(message, sender, sendResponse) {
  console.log('[Rubi Background] Received context payload:', message.payload);

  // Store last payload for debugging
  lastContextPayload = message.payload;

  // Bridge Router functionality - log extracted payload
  console.log('[Rubi Bridge] Background received extracted payload from tab:', sender.tab?.id);
  
  // Log minimal info unless debugging
  if (message.payload) {
    console.log('[Rubi Bridge] Payload platform:', message.payload.platform);
    console.log('[Rubi Bridge] Payload pageType:', message.payload.pageType);
  }

  // TODO: In future, this will:
  // 1. Validate payload
  // 2. Send to Rubi API for processing
  // 3. Return insights to content script/drawer

  sendResponse({
    success: true,
    message: 'Context payload received and stored'
  });
}

/**
 * Handle request to send context to Rubi - Bridge Router functionality
 */
function handleSendContextToRubi(message, sender, sendResponse) {
  console.log('[Rubi Bridge] Received request to send context to Rubi');
  
  const { payload, options } = message;
  
  // Store payload for debugging
  lastSentPayload = payload;
  
  // TODO: In future, this will make real API calls to Rubi
  // For now, return stub response
  const response = {
    success: true,
    message: "Stub Rubi API accepted payload"
  };
  
  console.log('[Rubi Bridge] Stub API response:', response);
  sendResponse(response);
}

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  console.log('[Rubi Background] Extension icon clicked for tab:', tab.id);

  // Send message to content script to toggle drawer
  chrome.tabs.sendMessage(tab.id, {
    type: 'TOGGLE_DRAWER'
  }).catch(err => {
    console.error('[Rubi Background] Failed to toggle drawer:', err);
  });
});

// Extension installed/updated
chrome.runtime.onInstalled.addListener((details) => {
  console.log('[Rubi Background] Extension installed/updated:', details.reason);

  // Initialize default settings
  chrome.storage.local.set({
    extensionEnabled: true,
    autoDetect: true
  });
});
