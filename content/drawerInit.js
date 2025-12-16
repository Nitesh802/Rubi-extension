/**
 * Drawer initialization wrapper
 * Ensures drawer can initialize even if some optional components are missing
 */

(function() {
    'use strict';

    // Store original showError function
    let originalShowError = null;
    let retryCount = 0;
    const maxRetries = 30; // 3 seconds total
    const retryDelay = 100; // 100ms between retries
    
    // Override showError during initialization to prevent crashes
    const safeShowError = function(message) {
        console.error('[Rubi Drawer Error]', message);
        // Try to show error using components if available
        if (originalShowError && window.RubiComponentRenderer && window.RubiComponentRegistry) {
            try {
                originalShowError(message);
            } catch (e) {
                console.error('[Rubi Drawer] Failed to show error UI:', e);
            }
        }
    };
    
    // Phase 9A: Initialize backend authentication
    async function initializeBackendAuth() {
        console.log('[Rubi Drawer Init] Initializing backend authentication...');
        
        if (typeof window.RubiBackendClient === 'undefined') {
            console.warn('[Rubi Drawer Init] Backend client not available, skipping auth');
            return;
        }
        
        try {
            const authInitialized = await window.RubiBackendClient.initializeBackendAuth();
            
            if (authInitialized) {
                console.log('[Rubi Drawer Init] Backend authentication initialized successfully');
                
                // Get auth status for debugging
                const authStatus = window.RubiBackendClient.getAuthStatus();
                console.log('[Rubi Drawer Init] Auth status:', {
                    hasToken: authStatus.hasToken,
                    isDevMode: authStatus.isDevMode,
                    expiresAt: authStatus.expiresAt
                });
            } else {
                console.warn('[Rubi Drawer Init] Backend authentication failed to initialize');
                console.warn('[Rubi Drawer Init] Extension will use fallback stubs for actions');
            }
        } catch (error) {
            console.error('[Rubi Drawer Init] Backend auth initialization error:', error);
            console.warn('[Rubi Drawer Init] Extension will use fallback stubs for actions');
        }
    }
    
    // Wait for all required dependencies to be loaded
    function waitForDependencies() {
        console.log('[Rubi Drawer Init] Checking dependencies...');
        
        const requiredDeps = {
            'RubiActionsRegistry': 'Actions Registry',
            'RubiActionsRouter': 'Actions Router',
            'RubiContextBridge': 'Context Bridge',
            'RubiDrawer': 'Drawer API',
            'RubiBackendClient': 'Backend Client' // Phase 9A: Added backend client
        };
        
        const missingDeps = [];
        
        for (const [key, name] of Object.entries(requiredDeps)) {
            if (typeof window[key] === 'undefined') {
                missingDeps.push(name);
            }
        }
        
        if (missingDeps.length > 0) {
            retryCount++;
            
            if (retryCount <= maxRetries) {
                console.log(`[Rubi Drawer Init] Waiting for: ${missingDeps.join(', ')} (attempt ${retryCount}/${maxRetries})`);
                setTimeout(waitForDependencies, retryDelay);
            } else {
                console.error('[Rubi Drawer Init] Timeout waiting for dependencies:', missingDeps);
                // Initialize with fallback mode
                setupFallbackDrawer();
            }
            return;
        }
        
        console.log('[Rubi Drawer Init] All dependencies loaded!');
        
        // Phase 9A: Initialize backend authentication
        initializeBackendAuth();
        
        // All dependencies are ready, now wait for drawer.js's initializeDrawer function
        waitForDrawer();
    }
    
    // Wait for drawer.js to be loaded and initializeDrawer to be available
    function waitForDrawer() {
        if (typeof initializeDrawer !== 'undefined') {
            console.log('[Rubi Drawer Init] Found initializeDrawer function');
            
            // Store original showError if it exists
            if (typeof showError !== 'undefined') {
                originalShowError = showError;
                window.showError = safeShowError;
            }
            
            // Try to initialize drawer
            try {
                console.log('[Rubi Drawer Init] Initializing drawer...');
                initializeDrawer();
                console.log('[Rubi Drawer Init] Drawer initialized successfully');
            } catch (error) {
                console.error('[Rubi Drawer Init] Failed to initialize drawer:', error);
                // Set up basic drawer API even if initialization fails
                setupBasicDrawerAPI();
            }
        } else {
            console.log('[Rubi Drawer Init] Waiting for initializeDrawer function...');
            setTimeout(waitForDrawer, 100);
        }
    }
    
    // Setup basic drawer API as fallback
    function setupBasicDrawerAPI() {
        if (typeof window.RubiDrawer === 'undefined') {
            const drawerElement = document.getElementById('rubi-drawer');
            
            window.RubiDrawer = {
                open: function() {
                    console.log('[Rubi Drawer] Opening drawer (fallback)');
                    if (drawerElement) {
                        drawerElement.classList.add('open');
                        drawerElement.style.right = '0';
                    }
                },
                close: function() {
                    console.log('[Rubi Drawer] Closing drawer (fallback)');
                    if (drawerElement) {
                        drawerElement.classList.remove('open');
                        drawerElement.style.right = '-400px';
                    }
                },
                toggle: function() {
                    if (drawerElement && drawerElement.classList.contains('open')) {
                        this.close();
                    } else {
                        this.open();
                    }
                },
                getState: function() {
                    return {
                        isOpen: drawerElement ? drawerElement.classList.contains('open') : false
                    };
                }
            };
            
            console.log('[Rubi Drawer Init] Basic drawer API setup complete');
        }
    }
    
    // Setup a completely fallback drawer when dependencies fail to load
    function setupFallbackDrawer() {
        console.warn('[Rubi Drawer Init] Setting up fallback drawer without dependencies');
        
        // Ensure basic drawer API is available
        setupBasicDrawerAPI();
        
        // Create minimal UI if drawer content is empty
        const drawerElement = document.getElementById('rubi-drawer');
        if (drawerElement) {
            const contentEl = drawerElement.querySelector('.drawer-content') || drawerElement.querySelector('#drawer-content');
            if (contentEl && !contentEl.hasChildNodes()) {
                contentEl.innerHTML = `
                    <div style="padding: 20px; text-align: center;">
                        <h3 style="color: #667eea;">Rubi Assistant</h3>
                        <p style="color: #6b7280; margin-top: 10px;">
                            Some components are still loading...
                        </p>
                        <p style="color: #6b7280; margin-top: 10px; font-size: 12px;">
                            Missing: Actions API, Context Bridge
                        </p>
                        <button onclick="location.reload()" style="
                            margin-top: 20px;
                            padding: 8px 16px;
                            background: #667eea;
                            color: white;
                            border: none;
                            border-radius: 4px;
                            cursor: pointer;
                        ">Refresh Page</button>
                    </div>
                `;
            }
        }
    }
    
    // Start the initialization process
    console.log('[Rubi Drawer Init] Starting initialization sequence...');
    
    // First check if we're in a content script context
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
        console.log('[Rubi Drawer Init] Running in extension context');
        
        // Start waiting for dependencies immediately
        waitForDependencies();
        
        // Also set up basic API as a safety net after a delay
        setTimeout(() => {
            if (typeof window.RubiDrawer === 'undefined') {
                console.log('[Rubi Drawer Init] Setting up safety net API');
                setupBasicDrawerAPI();
            }
        }, 2000);
    } else {
        console.warn('[Rubi Drawer Init] Not running in extension context');
    }
})();