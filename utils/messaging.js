/**
 * Rubi Browser Extension - Message Type Constants
 *
 * Centralized message type definitions for consistent communication
 * between content scripts, background worker, and drawer UI.
 */

const MESSAGE_TYPES = {
  // General
  PING: 'PING',
  PONG: 'PONG',

  // Drawer lifecycle
  OPEN_DRAWER: 'OPEN_DRAWER',
  CLOSE_DRAWER: 'CLOSE_DRAWER',
  TOGGLE_DRAWER: 'TOGGLE_DRAWER',
  DRAWER_OPEN: 'DRAWER_OPEN',
  DRAWER_CLOSE: 'DRAWER_CLOSE',

  // Context extraction
  EXTRACT_CONTEXT: 'EXTRACT_CONTEXT',
  CONTEXT_EXTRACTED: 'CONTEXT_EXTRACTED',
  CONTEXT_ERROR: 'CONTEXT_ERROR',

  // API communication
  ANALYZE_CONTEXT: 'ANALYZE_CONTEXT',
  ANALYSIS_COMPLETE: 'ANALYSIS_COMPLETE',
  ANALYSIS_ERROR: 'ANALYSIS_ERROR',

  // Session
  SESSION_CHECK: 'SESSION_CHECK',
  SESSION_VALID: 'SESSION_VALID',
  SESSION_EXPIRED: 'SESSION_EXPIRED',

  // Deep links
  OPEN_DEEP_LINK: 'OPEN_DEEP_LINK',

  // User actions
  REFRESH_CONTEXT: 'REFRESH_CONTEXT',
  MANUAL_ANALYZE: 'MANUAL_ANALYZE'
};

// Make available globally in content script context
if (typeof window !== 'undefined') {
  window.MESSAGE_TYPES = MESSAGE_TYPES;
}

// Make available in background worker context
if (typeof self !== 'undefined' && self.MESSAGE_TYPES === undefined) {
  self.MESSAGE_TYPES = MESSAGE_TYPES;
}
