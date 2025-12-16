/**
 * Rubi Browser Extension - Bridge Router
 *
 * Background script component that handles context bridge routing.
 * Manages communication between content scripts and Rubi APIs.
 */

console.log('[Rubi Bridge] Bridge router initialized');

// Storage for last sent payload (debugging)
let lastSentPayload = null;

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Handle context bridge messages
  if (message.type === "SEND_CONTEXT_TO_RUBI") {
    handleSendContextToRubi(message, sender, sendResponse);
    return true; // Indicate async response
  }

  // Handle context extracted messages (for logging/debugging)
  if (message.type === "RUBI_CONTEXT_EXTRACTED") {
    handleContextExtracted(message, sender, sendResponse);
    return true; // Indicate async response
  }

  // Let other handlers process other message types
  return false;
});

/**
 * Handle request to send context to Rubi
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

/**
 * Handle context extracted message for logging
 */
function handleContextExtracted(message, sender, sendResponse) {
  console.log('[Rubi Bridge] Background received extracted payload from tab:', sender.tab?.id);
  
  // Log minimal info unless debugging
  if (message.payload) {
    console.log('[Rubi Bridge] Payload platform:', message.payload.platform);
    console.log('[Rubi Bridge] Payload pageType:', message.payload.pageType);
  }
  
  sendResponse({ success: true });
}