/**
 * Drawer initialization wrapper
 * Ensures drawer can initialize even if some optional components are missing
 */

(function() {
    'use strict';

    // Store original showError function
    let originalShowError = null;
    
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
    
    // Wait for drawer.js to be loaded
    function waitForDrawer() {
        if (typeof initializeDrawer !== 'undefined') {
            // Store original showError if it exists
            if (typeof showError !== 'undefined') {
                originalShowError = showError;
                window.showError = safeShowError;
            }
            
            // Try to initialize drawer
            try {
                initializeDrawer();
            } catch (error) {
                console.error('[Rubi Drawer Init] Failed to initialize drawer:', error);
                // Set up basic drawer API even if initialization fails
                setupBasicDrawerAPI();
            }
        } else {
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
    
    // Start waiting for drawer
    waitForDrawer();
    
    // Also set up basic API immediately as backup
    setTimeout(setupBasicDrawerAPI, 500);
})();