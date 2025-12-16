// Rubi Memory Store - Client-side memory system for entity timeline tracking
(function() {
    'use strict';

    // Check if already initialized
    if (window.RubiMemoryStore) {
        console.log('[Rubi Memory] Memory Store already initialized, skipping');
        return;
    }

    // In-memory cache for fast reads
    let memoryCache = {};
    let initialized = false;

    // Helper: Generate unique ID
    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }

    // Helper: Get from chrome storage with fallback
    async function getFromStorage(key) {
        try {
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                return new Promise((resolve) => {
                    chrome.storage.local.get([key], (result) => {
                        if (chrome.runtime.lastError) {
                            console.warn('[Rubi Memory] Chrome storage read error:', chrome.runtime.lastError);
                            resolve(null);
                        } else {
                            resolve(result[key] || {});
                        }
                    });
                });
            } else {
                console.log('[Rubi Memory] Chrome storage not available, using in-memory only');
                return memoryCache;
            }
        } catch (error) {
            console.error('[Rubi Memory] Error reading from storage:', error);
            return memoryCache;
        }
    }

    // Helper: Save to chrome storage with fallback
    async function saveToStorage(key, value) {
        try {
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                return new Promise((resolve) => {
                    chrome.storage.local.set({ [key]: value }, () => {
                        if (chrome.runtime.lastError) {
                            console.warn('[Rubi Memory] Chrome storage write error:', chrome.runtime.lastError);
                            resolve(false);
                        } else {
                            resolve(true);
                        }
                    });
                });
            } else {
                console.log('[Rubi Memory] Chrome storage not available, using in-memory only');
                memoryCache = value;
                return true;
            }
        } catch (error) {
            console.error('[Rubi Memory] Error saving to storage:', error);
            memoryCache = value;
            return false;
        }
    }

    // Helper: Extract key identifying information from payload
    function extractKeyInfo(payload) {
        if (!payload) return '';
        
        // Try to extract meaningful identifiers
        if (payload.opportunityName) return payload.opportunityName;
        if (payload.name) return payload.name;
        if (payload.profileName) return payload.profileName;
        if (payload.subject) return payload.subject;
        if (payload.title) return payload.title;
        if (payload.email) return payload.email;
        if (payload.companyName) return payload.companyName;
        
        return '';
    }

    // Helper: Create hash from string
    function simpleHash(str) {
        let hash = 0;
        if (!str || str.length === 0) return hash.toString();
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash).toString(36);
    }

    // Helper: Convert timestamp to relative time
    function getRelativeTime(timestamp) {
        const now = new Date();
        const then = new Date(timestamp);
        const diffMs = now - then;
        const diffSeconds = Math.floor(diffMs / 1000);
        const diffMinutes = Math.floor(diffSeconds / 60);
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffSeconds < 60) return 'Just now';
        if (diffMinutes === 1) return '1 minute ago';
        if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
        if (diffHours === 1) return '1 hour ago';
        if (diffHours < 24) return `${diffHours} hours ago`;
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
        return then.toLocaleDateString();
    }

    // Public API
    window.RubiMemoryStore = {
        // Initialize memory store
        initMemoryStore: async function() {
            if (initialized) {
                console.log('[Rubi Memory] Memory store already initialized');
                return;
            }

            try {
                const storedData = await getFromStorage('rubiMemoryData');
                memoryCache = storedData || {};
                initialized = true;
                console.log('[Rubi Memory] Initialized memory store');
            } catch (error) {
                console.error('[Rubi Memory] Failed to initialize:', error);
                memoryCache = {};
                initialized = true;
            }
        },

        // Get stable entity key from payload
        getEntityKey: function(payload) {
            if (!payload || typeof payload !== 'object') return null;

            try {
                const platform = payload.platform || '';
                const pageType = payload.pageType || '';

                // LinkedIn profile
                if (platform === 'linkedin' && pageType === 'profile') {
                    const profileUrl = payload.profileUrl || payload.url || '';
                    if (profileUrl) {
                        // Extract profile identifier from URL
                        const matches = profileUrl.match(/linkedin\.com\/in\/([^\/\?]+)/);
                        if (matches && matches[1]) {
                            return `linkedin:profile:${matches[1]}`;
                        }
                    }
                    // Fallback to name/location combo
                    const name = payload.profileName || payload.name || '';
                    const location = payload.location || '';
                    if (name) {
                        const nameHash = simpleHash(name + location);
                        return `linkedin:profile:${nameHash}`;
                    }
                }

                // Salesforce opportunity
                if (platform === 'salesforce' && (pageType === 'opportunity' || pageType === 'opportunity_detail')) {
                    const oppId = payload.opportunityId || payload.id || '';
                    if (oppId) return `salesforce:opportunity:${oppId}`;
                    const oppName = payload.opportunityName || payload.name || '';
                    if (oppName) return `salesforce:opportunity:${simpleHash(oppName)}`;
                }

                // Gmail message/thread
                if (platform === 'gmail' && (pageType === 'compose' || pageType === 'thread' || pageType === 'message')) {
                    const threadId = payload.threadId || '';
                    if (threadId) return `gmail:thread:${threadId}`;
                    // Fallback to to+subject hash
                    const to = payload.to || payload.recipient || '';
                    const subject = payload.subject || '';
                    if (to || subject) {
                        return `gmail:thread:${simpleHash(to + subject)}`;
                    }
                }

                // Generic fallback using hostname
                if (platform && pageType) {
                    const hostname = payload.hostname || window.location?.hostname || 'unknown';
                    return `generic:${hostname}:${platform}:${pageType}`;
                }

                return null;
            } catch (error) {
                console.error('[Rubi Memory] Error generating entity key:', error);
                return null;
            }
        },

        // Get history for an entity
        getHistory: async function(entityKey, options = {}) {
            const limit = options.limit || 10;
            
            if (!entityKey) return [];

            try {
                await this.initMemoryStore();
                const history = memoryCache[entityKey] || [];
                return history.slice(0, limit);
            } catch (error) {
                console.error('[Rubi Memory] Error getting history:', error);
                return [];
            }
        },

        // Add history entry
        addHistoryEntry: async function(entityKey, entry) {
            if (!entityKey || !entry) return;

            try {
                await this.initMemoryStore();

                // Ensure entry has required fields
                const fullEntry = {
                    id: entry.id || generateId(),
                    timestamp: entry.timestamp || new Date().toISOString(),
                    type: entry.type || 'context',
                    platform: entry.platform || 'unknown',
                    pageType: entry.pageType || 'unknown',
                    summary: entry.summary || 'Activity recorded',
                    payload: entry.payload || {},
                    ...entry
                };

                // Get existing history
                const history = memoryCache[entityKey] || [];
                
                // Add new entry at the beginning
                history.unshift(fullEntry);
                
                // Trim to max 20 entries
                if (history.length > 20) {
                    history.splice(20);
                }

                // Update cache
                memoryCache[entityKey] = history;

                // Save to storage
                await saveToStorage('rubiMemoryData', memoryCache);
                
                console.log('[Rubi Memory] Added history entry for', entityKey);
            } catch (error) {
                console.error('[Rubi Memory] Error adding history entry:', error);
            }
        },

        // Clear history for specific entity
        clearHistoryForEntity: async function(entityKey) {
            if (!entityKey) return;

            try {
                await this.initMemoryStore();
                delete memoryCache[entityKey];
                await saveToStorage('rubiMemoryData', memoryCache);
                console.log('[Rubi Memory] Cleared history for', entityKey);
            } catch (error) {
                console.error('[Rubi Memory] Error clearing entity history:', error);
            }
        },

        // Clear all history
        clearAllHistory: async function() {
            try {
                memoryCache = {};
                await saveToStorage('rubiMemoryData', memoryCache);
                console.log('[Rubi Memory] Cleared all history');
            } catch (error) {
                console.error('[Rubi Memory] Error clearing all history:', error);
            }
        },

        // Utility: Get relative time (exposed for UI use)
        getRelativeTime: getRelativeTime
    };

    console.log('[Rubi Memory] Memory Store module loaded');
})();