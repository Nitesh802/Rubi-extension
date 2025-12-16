/**
 * Rubi Browser Extension - Drawer UI
 *
 * Production-ready drawer interface for Rubi Assistant.
 * Uses component-based rendering system for flexible UI generation.
 * Integrates with Context Bridge and Actions API.
 */

// Drawer state management
let drawerState = {
    isOpen: false,
    isMinimized: false,
    isLoading: false,
    currentContext: null,
    currentLayout: null,
    currentExperience: null,
    availableActions: [],
    actionHistory: [],
    activeActionId: null,
    activeActionPromises: [],
    error: null,
    latestPayload: null,
    lastActionResults: null,
    // Phase 10B/10C: Track system status with full metadata
    systemStatus: {
        orgConfigSource: null,
        identitySource: null,
        providerFinal: null,
        isFullMode: false,
        backendConnected: false,
        moodleConnected: false,
        policy: null  // Phase 10C: Policy enforcement data
    }
};

// DOM element references
let drawerElement = null;
let elementsCache = {};

// Dependency checking state
let dependencyCheckCount = 0;
const maxDependencyChecks = 30; // 3 seconds total
const dependencyCheckDelay = 100; // 100ms between checks

/**
 * Initialize the Rubi Drawer with dependency checking
 */
function initializeDrawer() {
    console.log('[Rubi Drawer] Starting initialization...');
    
    // Start dependency check loop
    checkDependenciesAndInit();
}

/**
 * Check for dependencies and initialize when ready
 */
function checkDependenciesAndInit() {
    dependencyCheckCount++;
    
    console.log(`[Rubi Drawer] Checking dependencies (attempt ${dependencyCheckCount}/${maxDependencyChecks})...`);
    
    // Check for required component dependencies
    const componentDeps = [
        'RubiComponentRegistry',
        'RubiComponentRenderer',
        'RubiDrawerTemplates',
        'RubiExperienceConfigs',
        'RubiActionComponentMapper'
    ];
    
    // Check for API dependencies (these can be optional)
    const apiDeps = [
        'RubiContextBridge',
        'RubiActionsRegistry',
        'RubiActionsRouter'
    ];
    
    const missingComponentDeps = componentDeps.filter(dep => !window[dep]);
    const missingApiDeps = apiDeps.filter(dep => !window[dep]);
    
    // Component dependencies are required
    if (missingComponentDeps.length > 0) {
        if (dependencyCheckCount < maxDependencyChecks) {
            console.log('[Rubi Drawer] Waiting for component dependencies:', missingComponentDeps.join(', '));
            setTimeout(checkDependenciesAndInit, dependencyCheckDelay);
            return;
        } else {
            console.error('[Rubi Drawer] Timeout waiting for component dependencies:', missingComponentDeps);
            // Initialize with minimal functionality
            initializeMinimalDrawer();
            return;
        }
    }
    
    // API dependencies are optional - warn but continue
    if (missingApiDeps.length > 0) {
        console.warn('[Rubi Drawer] Some APIs not available yet:', missingApiDeps.join(', '));
        console.log('[Rubi Drawer] Will retry API connections in background...');
        
        // Start background retry for APIs
        retryApiConnections(missingApiDeps);
    }
    
    console.log('[Rubi Drawer] All required dependencies loaded!');
    
    // Proceed with full initialization
    initializeFullDrawer();
}

/**
 * Retry connecting to missing APIs in background
 */
function retryApiConnections(missingApis) {
    let retryCount = 0;
    const maxRetries = 20;
    const retryDelay = 500;
    
    const retryInterval = setInterval(() => {
        retryCount++;
        
        const stillMissing = missingApis.filter(dep => !window[dep]);
        
        if (stillMissing.length === 0) {
            console.log('[Rubi Drawer] All APIs now available!');
            clearInterval(retryInterval);
            
            // Re-initialize integrations
            initializeContextBridge();
            initializeActionsIntegration();
            
            // Update UI to show APIs are ready
            hideError();
            loadInitialState();
        } else if (retryCount >= maxRetries) {
            console.warn('[Rubi Drawer] Some APIs still not available after retries:', stillMissing);
            clearInterval(retryInterval);
            
            // Show appropriate warnings
            if (stillMissing.includes('RubiContextBridge')) {
                console.log('[Rubi Drawer] Context bridge unavailable - context updates disabled');
            }
            if (stillMissing.includes('RubiActionsRegistry') || stillMissing.includes('RubiActionsRouter')) {
                console.log('[Rubi Drawer] Actions API unavailable - actions disabled');
                showError('Actions system not available');
            }
        }
    }, retryDelay);
}

/**
 * Initialize minimal drawer when dependencies fail
 */
function initializeMinimalDrawer() {
    console.log('[Rubi Drawer] Initializing minimal drawer...');
    
    // Cache DOM elements
    drawerElement = document.getElementById('rubi-drawer');
    
    if (!drawerElement) {
        console.error('[Rubi Drawer] Drawer element not found!');
        return;
    }
    
    // Create minimal content container
    const contentEl = drawerElement.querySelector('.drawer-content') || drawerElement.querySelector('#drawer-content');
    if (!contentEl) {
        const newContentEl = document.createElement('div');
        newContentEl.id = 'drawer-content';
        newContentEl.className = 'drawer-content';
        newContentEl.innerHTML = `
            <div style="padding: 20px; text-align: center;">
                <h3 style="color: #667eea;">Rubi Assistant</h3>
                <p style="color: #6b7280; margin-top: 10px;">
                    Components are loading...
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
        drawerElement.appendChild(newContentEl);
    }
    
    elementsCache.drawerContent = contentEl;
    
    // Set up basic event listeners
    setupBasicEventListeners();
    
    // Export minimal drawer API
    exportDrawerAPI();
    
    console.log('[Rubi Drawer] Minimal drawer initialized');
}

/**
 * Initialize full drawer with all features
 */
function initializeFullDrawer() {
    console.log('[Rubi Drawer] Initializing full drawer UI');
    
    // Initialize memory store if available
    initializeMemoryStore();
    
    // Cache DOM elements
    cacheElements();
    
    // Set up event listeners
    setupEventListeners();
    
    // Initialize context bridge integration
    initializeContextBridge();
    
    // Initialize actions integration
    initializeActionsIntegration();
    
    // Load initial state
    loadInitialState();
    
    // Export drawer API
    exportDrawerAPI();
    
    // Set drawer as initialized
    if (drawerElement) {
        drawerElement.classList.add('initialized');
    }
    
    console.log('[Rubi Drawer] Full drawer initialized successfully');
}

/**
 * Initialize memory store for history tracking
 */
function initializeMemoryStore() {
    try {
        if (window.RubiMemoryStore) {
            console.log('[Rubi Drawer] Initializing memory store...');
            window.RubiMemoryStore.initMemoryStore().then(() => {
                console.log('[Rubi Drawer] Memory store initialized successfully');
            }).catch(err => {
                console.warn('[Rubi Drawer] Failed to initialize memory store:', err);
            });
        } else {
            console.log('[Rubi Memory] Memory store not available, skipping history initialization');
        }
    } catch (error) {
        console.error('[Rubi Drawer] Error initializing memory store:', error);
    }
}

/**
 * Cache DOM element references for performance
 */
function cacheElements() {
    drawerElement = document.getElementById('rubi-drawer');
    
    elementsCache = {
        // Main content container for component rendering
        drawerContent: document.getElementById('drawer-content') || document.querySelector('.drawer-content'),
        
        // Legacy elements for compatibility
        closeButton: document.getElementById('drawer-close'),
        minimizeButton: document.getElementById('drawer-minimize')
    };
    
    // Create content container if it doesn't exist
    if (!elementsCache.drawerContent && drawerElement) {
        elementsCache.drawerContent = document.createElement('div');
        elementsCache.drawerContent.id = 'drawer-content';
        elementsCache.drawerContent.className = 'drawer-content';
        drawerElement.appendChild(elementsCache.drawerContent);
    }
}

/**
 * Set up basic event listeners (for minimal mode)
 */
function setupBasicEventListeners() {
    // Close button
    const closeBtn = drawerElement?.querySelector('#drawer-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeDrawer);
    }
}

/**
 * Set up all event listeners
 */
function setupEventListeners() {
    // Header actions
    if (elementsCache.closeButton) {
        elementsCache.closeButton.addEventListener('click', closeDrawer);
    }
    
    if (elementsCache.minimizeButton) {
        elementsCache.minimizeButton.addEventListener('click', toggleMinimize);
    }
    
    // Action controls
    if (elementsCache.refreshActions) {
        elementsCache.refreshActions.addEventListener('click', refreshActions);
    }
    
    // Results controls
    if (elementsCache.clearResults) {
        elementsCache.clearResults.addEventListener('click', clearResults);
    }
    
    // History controls
    if (elementsCache.historyToggle) {
        elementsCache.historyToggle.addEventListener('click', toggleHistory);
    }
    
    if (elementsCache.clearHistory) {
        elementsCache.clearHistory.addEventListener('click', clearHistory);
    }
    
    if (elementsCache.exportHistory) {
        elementsCache.exportHistory.addEventListener('click', exportHistory);
    }
    
    // Error retry
    if (elementsCache.errorRetry) {
        elementsCache.errorRetry.addEventListener('click', retryInitialization);
    }
    
    // Cancel action
    if (elementsCache.cancelAction) {
        elementsCache.cancelAction.addEventListener('click', cancelActiveAction);
    }
}

/**
 * Initialize context bridge integration
 */
function initializeContextBridge() {
    if (typeof window.RubiContextBridge === 'undefined') {
        console.warn('[Rubi Drawer] Context bridge not available yet');
        return;
    }
    
    console.log('[Rubi Drawer] Initializing context bridge integration');
    
    // Register for context updates
    window.RubiContextBridge.onNewContext((payload) => {
        console.log('[Rubi Drawer] Received new context update');
        handleContextUpdate(payload);
    });
    
    // Get existing context if available
    const existingContext = window.RubiContextBridge.getLatestContext();
    if (existingContext) {
        console.log('[Rubi Drawer] Found existing context');
        handleContextUpdate(existingContext);
    }
}

/**
 * Initialize actions integration
 */
function initializeActionsIntegration() {
    if (typeof window.RubiActionsRegistry === 'undefined' || typeof window.RubiActionsRouter === 'undefined') {
        console.warn('[Rubi Drawer] Actions API not available yet');
        return;
    }
    
    console.log('[Rubi Drawer] Actions API integration ready');
    
    // Clear any error about missing actions
    const errorNotification = document.getElementById('error-notification');
    if (errorNotification && errorNotification.textContent.includes('Actions')) {
        errorNotification.remove();
    }
}

/**
 * Load initial drawer state
 */
function loadInitialState() {
    // Check for actions API availability
    if (typeof window.RubiActionsRegistry === 'undefined' || typeof window.RubiActionsRouter === 'undefined') {
        console.warn('[Rubi Drawer] Actions API not available for initial state');
        // Don't show error - it may load later
        renderDefaultContent();
        return;
    }
    
    // Load any persisted state (future enhancement)
    // For now, just update UI with defaults
    updateUI();
}

/**
 * Handle context update from bridge
 */
async function handleContextUpdate(payload) {
    console.log('[Rubi Drawer] Processing context update');
    
    // Update state
    drawerState.currentContext = payload;
    drawerState.latestPayload = payload;
    
    // Check for experience-based rendering
    if (window.RubiExperienceConfigs) {
        await renderExperienceBasedContent(payload);
    } else {
        // Fallback to basic rendering
        renderDrawerContent(payload);
    }
    
    // Clear any errors
    hideError();
}

/**
 * Render experience-based content with action integration
 */
async function renderExperienceBasedContent(payload) {
    if (!payload) {
        renderDefaultContent();
        return;
    }
    
    const platform = payload.platform || 'generic';
    const pageType = payload.pageType || 'default';
    
    console.log(`[Rubi Experience] Looking up experience for ${platform}.${pageType}`);
    
    // Get experience configuration
    const experience = window.RubiExperienceConfigs.getExperienceFor(platform, pageType);
    drawerState.currentExperience = experience;
    
    if (!experience) {
        console.warn('[Rubi Experience] No experience found, using basic rendering');
        renderDrawerContent(payload);
        return;
    }
    
    console.log(`[Rubi Experience] Found experience: ${experience.id}`);
    
    // Show loading state
    showLoading('Loading insights...');
    
    try {
        // Execute default actions for this experience
        const actionResults = await executeDefaultActions(experience, payload);
        drawerState.lastActionResults = actionResults;
        
        // Transform data for components (now async to load history)
        const viewModel = await window.RubiActionComponentMapper.transformExperienceDataForComponents(
            experience,
            payload,
            actionResults
        );
        
        // Validate and enhance view model
        const validatedViewModel = window.RubiActionComponentMapper.validateViewModel(
            viewModel,
            experience
        );
        
        // Render using experience layout
        renderExperienceLayout(experience, validatedViewModel, payload);
        
    } catch (error) {
        console.error('[Rubi Experience] Error rendering experience:', error);
        
        // Fall back to basic rendering
        renderDrawerContent(payload);
    } finally {
        hideLoading();
    }
}

/**
 * Execute default actions for an experience
 */
async function executeDefaultActions(experience, payload) {
    if (!experience.defaultActions || experience.defaultActions.length === 0) {
        console.log('[Rubi Experience] No default actions for this experience');
        return [];
    }
    
    // Check if actions API is available
    if (!window.RubiActionsRouter) {
        console.warn('[Rubi Experience] Actions router not available - skipping default actions');
        return [];
    }
    
    console.log('[Rubi Experience] Executing default actions:', experience.defaultActions);
    
    // Cancel any pending actions
    if (drawerState.activeActionPromises.length > 0) {
        console.log('[Rubi Experience] Cancelling previous actions');
        drawerState.activeActionPromises = [];
    }
    
    const actionPromises = experience.defaultActions.map(actionId => {
        return executeActionById(actionId, payload);
    });
    
    drawerState.activeActionPromises = actionPromises;
    
    try {
        const results = await Promise.all(actionPromises);
        console.log('[Rubi Experience] All actions completed successfully');
        return results;
    } catch (error) {
        console.error('[Rubi Experience] Error executing actions:', error);
        // Return partial results
        return actionPromises.map(p => p.value || null).filter(r => r !== null);
    }
}

/**
 * Execute a single action by ID
 */
async function executeActionById(actionId, payload) {
    try {
        if (!window.RubiActionsRouter) {
            console.error('[Rubi Experience] Actions router not available');
            return null;
        }
        
        console.log(`[Rubi Experience] Executing action: ${actionId}`);
        const result = await window.RubiActionsRouter.runAction(actionId, payload);
        
        // Phase 10B/10C: Update system status from action metadata
        if (result && result.metadata) {
            updateSystemStatus(result.metadata);
        }
        // Phase 10C: Update policy status from execution metadata
        if (result && result.executionMetadata) {
            updateSystemStatus(result.executionMetadata);
        }
        
        console.log(`[Rubi Experience] Action ${actionId} completed`);
        return result;
        
    } catch (error) {
        console.error(`[Rubi Experience] Action ${actionId} failed:`, error);
        return null;
    }
}

/**
 * Render experience layout with component data
 */
function renderExperienceLayout(experience, viewModel, payload) {
    console.log('[Rubi Experience] Rendering experience layout');
    
    // Get layout template
    const layoutTemplate = window.RubiDrawerTemplates.templates[experience.layoutId];
    if (!layoutTemplate) {
        console.error('[Rubi Experience] Layout template not found:', experience.layoutId);
        renderDrawerContent(payload);
        return;
    }
    
    // Clear existing content
    window.RubiComponentRenderer.clearContainer(elementsCache.drawerContent);
    
    // Create layout container
    const container = document.createElement('div');
    container.className = 'rubi-experience-container';
    container.setAttribute('data-experience', experience.id);
    
    // Render each section from the layout
    layoutTemplate.sections.forEach((section, index) => {
        const componentName = section.component;
        const componentData = viewModel[componentName] || {};
        
        // Merge with static data from layout
        const mergedData = Object.assign({}, section.staticData, componentData);
        
        // Render component
        const element = window.RubiComponentRenderer.renderSection(componentName, mergedData);
        
        if (element) {
            // Add animation delay
            element.style.animationDelay = `${index * 50}ms`;
            container.appendChild(element);
        }
    });
    
    // Append to drawer
    elementsCache.drawerContent.appendChild(container);
    
    // Setup event handlers
    setupComponentEventHandlers();
    
    console.log('[Rubi Experience] Experience rendering complete');
}

/**
 * Render drawer content using component system (fallback)
 */
function renderDrawerContent(payload) {
    if (!payload) {
        renderDefaultContent();
        return;
    }
    
    const platform = payload.platform || 'generic';
    const pageType = payload.pageType || 'default';
    
    console.log(`[Rubi Drawer] Rendering basic layout for ${platform}.${pageType}`);
    
    // Get appropriate layout template
    const layoutTemplate = window.RubiDrawerTemplates.getLayoutFor(platform, pageType);
    drawerState.currentLayout = layoutTemplate;
    
    // Transform payload for component consumption
    const transformedPayload = transformPayloadForComponents(payload);
    
    // Clear existing content
    window.RubiComponentRenderer.clearContainer(elementsCache.drawerContent);
    
    // Apply layout template
    const renderedContent = window.RubiComponentRenderer.applyLayoutTemplate(
        layoutTemplate,
        transformedPayload
    );
    
    // Append to drawer
    elementsCache.drawerContent.appendChild(renderedContent);
    
    // Setup component event handlers
    setupComponentEventHandlers();
}

/**
 * Transform payload for component consumption
 */
function transformPayloadForComponents(payload) {
    const transformed = {
        // Core context data
        platform: payload.platform,
        pageType: payload.pageType,
        url: payload.url,
        extractionConfidence: payload.extractionConfidence,
        
        // Email context
        emailContext: {
            subject: payload.fields?.subject || payload.fields?.emailSubject,
            sender: payload.fields?.sender || payload.fields?.fromEmail,
            recipients: payload.fields?.recipients || payload.fields?.toEmail,
            timestamp: payload.extractedAt ? new Date(payload.extractedAt).toLocaleString() : null
        },
        
        // Profile data (LinkedIn)
        profile: {
            title: payload.fields?.profileName || payload.fields?.name,
            rows: []
        },
        
        // Opportunity data (Salesforce)
        opportunity: {
            title: payload.fields?.opportunityName,
            stage: payload.fields?.stage,
            rows: []
        },
        
        // Account data (Salesforce)
        account: {
            title: payload.fields?.accountName,
            rows: []
        },
        
        // Draft message
        draft: {
            content: payload.fields?.draftMessage || payload.fields?.messageBody,
            placeholder: 'Start typing your message...'
        },
        
        // Analysis data
        analysis: {
            items: [],
            scores: []
        },
        
        // Suggestions
        suggestions: {
            suggestions: [],
            count: 0
        },
        
        // Actions from router
        actions: null,
        
        // Raw fields for fallback
        fields: payload.fields || {}
    };
    
    // Build rows for cards
    if (payload.fields) {
        // Profile rows
        if (payload.platform === 'linkedin') {
            if (payload.fields.title) {
                transformed.profile.rows.push({ label: 'Title', value: payload.fields.title });
            }
            if (payload.fields.company) {
                transformed.profile.rows.push({ label: 'Company', value: payload.fields.company });
            }
            if (payload.fields.location) {
                transformed.profile.rows.push({ label: 'Location', value: payload.fields.location });
            }
        }
        
        // Opportunity rows
        if (payload.platform === 'salesforce' && payload.pageType === 'opportunity') {
            if (payload.fields.amount) {
                transformed.opportunity.rows.push({ 
                    label: 'Amount', 
                    value: formatCurrency(payload.fields.amount),
                    highlight: true 
                });
            }
            if (payload.fields.closeDate) {
                transformed.opportunity.rows.push({ label: 'Close Date', value: payload.fields.closeDate });
            }
            if (payload.fields.probability) {
                transformed.opportunity.rows.push({ label: 'Probability', value: `${payload.fields.probability}%` });
            }
        }
        
        // Account rows
        if (payload.platform === 'salesforce' && payload.pageType === 'account') {
            if (payload.fields.industry) {
                transformed.account.rows.push({ label: 'Industry', value: payload.fields.industry });
            }
            if (payload.fields.employees) {
                transformed.account.rows.push({ label: 'Employees', value: payload.fields.employees });
            }
            if (payload.fields.revenue) {
                transformed.account.rows.push({ label: 'Annual Revenue', value: formatCurrency(payload.fields.revenue) });
            }
        }
    }
    
    // Get available actions if router is available
    if (window.RubiActionsRouter) {
        try {
            const actions = window.RubiActionsRouter.getMenuForContext(payload);
            transformed.actions = actions;
            transformed.quickActions = {
                columns: 2,
                actions: actions.slice(0, 4).map(action => ({
                    label: action.label,
                    icon: '▶',
                    action: () => executeAction(action.id)
                }))
            };
        } catch (error) {
            console.warn('[Rubi Drawer] Could not fetch actions:', error);
        }
    }
    
    // Add confidence-based analysis
    const confidence = payload.extractionConfidence || 0;
    transformed.analysis.scores.push({
        label: 'Extraction Confidence',
        score: confidence,
        maxScore: 100,
        color: confidence > 66 ? '#4CAF50' : confidence > 33 ? '#FFC107' : '#F44336'
    });
    
    return transformed;
}

/**
 * Render default content when no context available
 */
function renderDefaultContent() {
    const defaultPayload = {
        platform: 'generic',
        pageType: 'default'
    };
    
    // Check if component renderer is available
    if (window.RubiComponentRenderer) {
        renderDrawerContent(defaultPayload);
    } else {
        // Fallback to simple HTML
        if (elementsCache.drawerContent) {
            elementsCache.drawerContent.innerHTML = `
                <div style="padding: 20px; text-align: center;">
                    <h3 style="color: #667eea;">Welcome to Rubi</h3>
                    <p style="color: #6b7280; margin-top: 10px;">
                        Navigate to a supported platform to see context-aware assistance.
                    </p>
                </div>
            `;
        }
    }
}

/**
 * Setup event handlers for rendered components
 */
function setupComponentEventHandlers() {
    // Refresh button
    const refreshBtn = elementsCache.drawerContent.querySelector('.rubi-refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            refreshContext();
        });
    }
    
    // Footer action button
    const footerBtn = elementsCache.drawerContent.querySelector('.rubi-footer-btn');
    if (footerBtn) {
        footerBtn.addEventListener('click', () => {
            handlePrimaryAction();
        });
    }
    
    // Close button (if rendered by components)
    const closeBtn = elementsCache.drawerContent.querySelector('[data-action="close"]');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeDrawer);
    }
    
    // Minimize button (if rendered by components)
    const minimizeBtn = elementsCache.drawerContent.querySelector('[data-action="minimize"]');
    if (minimizeBtn) {
        minimizeBtn.addEventListener('click', toggleMinimize);
    }
}

/**
 * Refresh context and re-render
 */
function refreshContext() {
    console.log('[Rubi Drawer] Refreshing context');
    
    if (window.RubiContextBridge) {
        // Request fresh extraction
        window.RubiContextBridge.requestExtraction();
    }
    
    // Re-render with current payload
    if (drawerState.latestPayload) {
        if (drawerState.currentExperience) {
            renderExperienceBasedContent(drawerState.latestPayload);
        } else {
            renderDrawerContent(drawerState.latestPayload);
        }
    }
}

/**
 * Handle primary action button click
 */
function handlePrimaryAction() {
    console.log('[Rubi Drawer] Primary action triggered');
    
    // Platform-specific primary actions
    const platform = drawerState.currentContext?.platform;
    const pageType = drawerState.currentContext?.pageType;
    
    if (platform === 'gmail' && pageType === 'compose') {
        // Enhance email
        executeAction('enhance_email');
    } else if (platform === 'linkedin' && pageType === 'profile') {
        // Generate outreach
        executeAction('generate_outreach');
    } else if (platform === 'salesforce' && pageType === 'opportunity') {
        // Update opportunity
        executeAction('update_opportunity');
    } else {
        console.log('[Rubi Drawer] No primary action defined for this context');
    }
}

/**
 * Format currency for display
 */
function formatCurrency(value) {
    if (typeof value === 'number') {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(value);
    }
    return value;
}

/**
 * Execute an action
 */
async function executeAction(actionId) {
    console.log(`[Rubi Drawer] Executing action: ${actionId}`);
    
    if (!window.RubiActionsRouter) {
        console.error('[Rubi Drawer] Actions router not available');
        showError('Actions system not available');
        return;
    }
    
    if (!drawerState.currentContext) {
        console.error('[Rubi Drawer] No context available for action execution');
        return;
    }
    
    if (drawerState.isLoading) {
        console.warn('[Rubi Drawer] Another action is already running');
        return;
    }
    
    // Set loading state
    drawerState.isLoading = true;
    drawerState.activeActionId = actionId;
    showLoading(`Executing ${getActionLabel(actionId)}...`);
    
    // Disable action buttons
    disableActionButtons();
    
    try {
        // Execute action via router
        const result = await window.RubiActionsRouter.runAction(actionId, drawerState.currentContext);
        
        // Phase 10C: Check for policy blocks
        if (result && result.policyBlock) {
            console.log(`[Rubi Drawer] Action blocked by policy: ${result.policyReason}`);
            displayPolicyBlock(actionId, result);
            
            // Update system status with policy info
            if (result.executionMetadata?.policy) {
                drawerState.systemStatus.policy = result.executionMetadata.policy;
            }
            return;
        }
        
        console.log(`[Rubi Drawer] Action ${actionId} completed successfully`);
        
        // Display result
        displayActionResult(actionId, result);
        
        // Add to history
        addToHistory(actionId, result);
        
        // Show results section
        if (elementsCache.resultsDisplay) {
            elementsCache.resultsDisplay.style.display = 'block';
        }
        
    } catch (error) {
        console.error(`[Rubi Drawer] Action ${actionId} failed:`, error);
        displayErrorResult(actionId, error);
    } finally {
        // Clear loading state
        drawerState.isLoading = false;
        drawerState.activeActionId = null;
        hideLoading();
        
        // Re-enable action buttons
        enableActionButtons();
    }
}

/**
 * Display action result using component system
 */
function displayActionResult(actionId, result) {
    const actionLabel = getActionLabel(actionId);
    
    // Create result data for component
    const resultData = {
        title: 'Action Result',
        summary: `${actionLabel} completed successfully`,
        items: [],
        scores: []
    };
    
    // Process result data
    if (result.stubData) {
        if (result.stubData.summary) {
            resultData.summary = result.stubData.summary;
        }
        
        if (result.stubData.keyPoints) {
            result.stubData.keyPoints.forEach(point => {
                resultData.items.push({ label: 'Key Point', value: point });
            });
        }
        
        if (result.stubData.riskScore) {
            resultData.scores.push({
                label: 'Risk Score',
                score: result.stubData.riskScore,
                maxScore: 100,
                color: result.stubData.riskScore > 70 ? '#F44336' : '#4CAF50'
            });
        }
    }
    
    // Update the results section using component renderer
    if (window.RubiComponentRenderer) {
        const resultsSection = elementsCache.drawerContent.querySelector('[data-component="MessageAnalysisCard"]');
        if (resultsSection) {
            window.RubiComponentRenderer.updateSection(
                resultsSection.parentElement,
                'MessageAnalysisCard',
                resultData
            );
        } else {
            // Create a new results card
            const resultsCard = window.RubiComponentRenderer.renderSection('MessageAnalysisCard', resultData);
            elementsCache.drawerContent.appendChild(resultsCard);
        }
    }
    
    
    // Add to history
    addToHistory(actionId, result);
}

/**
 * Display error result using component system
 */
function displayErrorResult(actionId, error) {
    const actionLabel = getActionLabel(actionId);
    
    // Create error notification
    const errorData = {
        title: 'Action Failed',
        notifications: [{
            message: `${actionLabel}: ${error.message || 'Unknown error occurred'}`,
            timestamp: new Date().toLocaleTimeString(),
            type: 'error',
            read: false
        }]
    };
    
    // Display using NotificationsCard component if available
    if (window.RubiComponentRenderer) {
        const notificationCard = window.RubiComponentRenderer.renderSection('NotificationsCard', errorData);
        elementsCache.drawerContent.insertBefore(notificationCard, elementsCache.drawerContent.firstChild);
    }
}

/**
 * Phase 10C: Display policy block message
 */
function displayPolicyBlock(actionId, result) {
    const actionLabel = getActionLabel(actionId);
    
    // Create policy notification with appropriate styling
    const policyData = {
        title: 'Action Restricted',
        notifications: [{
            message: result.error || 'This action is currently restricted.',
            timestamp: new Date().toLocaleTimeString(),
            type: 'warning',  // Use warning instead of error for policy blocks
            read: false
        }]
    };
    
    // Add additional context if available
    if (result.executionMetadata?.policy?.limitsApplied) {
        const limits = result.executionMetadata.policy.limitsApplied;
        if (limits.maxDailyOrg) {
            policyData.notifications.push({
                message: `Organization daily limit: ${limits.maxDailyOrg} actions`,
                timestamp: new Date().toLocaleTimeString(),
                type: 'info',
                read: false
            });
        }
        if (limits.maxDailyUser) {
            policyData.notifications.push({
                message: `Your daily limit: ${limits.maxDailyUser} actions`,
                timestamp: new Date().toLocaleTimeString(),
                type: 'info',
                read: false
            });
        }
    }
    
    // Display using NotificationsCard component if available
    if (window.RubiComponentRenderer) {
        const notificationCard = window.RubiComponentRenderer.renderSection('NotificationsCard', policyData);
        elementsCache.drawerContent.insertBefore(notificationCard, elementsCache.drawerContent.firstChild);
    }
    
    // Update status display if available
    updateStatusDisplay();
}

/**
 * Add action result to history
 */
function addToHistory(actionId, result) {
    const historyItem = {
        actionId,
        label: getActionLabel(actionId),
        result,
        timestamp: new Date()
    };
    
    drawerState.actionHistory.unshift(historyItem);
    
    // Keep only last 20 items
    if (drawerState.actionHistory.length > 20) {
        drawerState.actionHistory = drawerState.actionHistory.slice(0, 20);
    }
    
    updateHistoryDisplay();
}

/**
 * Update history display using component system
 */
function updateHistoryDisplay() {
    const count = drawerState.actionHistory.length;
    
    if (count === 0) {
        return;
    }
    
    // Transform history into activity items
    const activities = drawerState.actionHistory.slice(0, 10).map(item => ({
        activity: item.label,
        timestamp: formatTime(item.timestamp),
        details: item.result?.stubData?.summary || 'Completed'
    }));
    
    // Check if RecentActivityCard exists in current layout
    if (window.RubiComponentRenderer) {
        const activityCard = elementsCache.drawerContent.querySelector('[data-component="RecentActivityCard"]');
        if (activityCard) {
            // Update existing card
            const activityData = {
                title: 'Action History',
                timeRange: `${count} total`,
                activities: activities
            };
            
            window.RubiComponentRenderer.updateSection(
                activityCard.parentElement,
                'RecentActivityCard',
                activityData
            );
        }
    }
}

/**
 * Show a history item
 */
function showHistoryItem(index) {
    const item = drawerState.actionHistory[index];
    if (!item) return;
    
    // Re-display the result
    displayActionResult(item.actionId, item.result);
    
    // Scroll to results if available
    if (elementsCache.resultsDisplay) {
        elementsCache.resultsDisplay.scrollIntoView({ behavior: 'smooth' });
    }
}

/**
 * Clear results display
 */
function clearResults() {
    // Remove all MessageAnalysisCard components
    const analysisCards = elementsCache.drawerContent.querySelectorAll('[data-component="MessageAnalysisCard"]');
    analysisCards.forEach(card => card.remove());
}

/**
 * Clear history
 */
function clearHistory() {
    drawerState.actionHistory = [];
    updateHistoryDisplay();
}

/**
 * Export history
 */
function exportHistory() {
    if (drawerState.actionHistory.length === 0) {
        console.log('[Rubi Drawer] No history to export');
        return;
    }
    
    const exportData = {
        timestamp: new Date().toISOString(),
        platform: drawerState.currentContext?.platform,
        pageType: drawerState.currentContext?.pageType,
        url: drawerState.currentContext?.url,
        history: drawerState.actionHistory
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `rubi-history-${Date.now()}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    console.log('[Rubi Drawer] History exported');
}

/**
 * Toggle history panel
 */
function toggleHistory() {
    // History now handled through component system
    const activityCard = elementsCache.drawerContent.querySelector('[data-component="RecentActivityCard"]');
    if (activityCard) {
        activityCard.scrollIntoView({ behavior: 'smooth' });
    }
}

/**
 * Toggle drawer minimize state
 */
function toggleMinimize() {
    drawerState.isMinimized = !drawerState.isMinimized;
    
    if (drawerState.isMinimized) {
        drawerElement.classList.add('minimized');
    } else {
        drawerElement.classList.remove('minimized');
    }
}

/**
 * Open drawer
 */
function openDrawer() {
    drawerState.isOpen = true;
    if (drawerElement) {
        drawerElement.classList.add('open');
    }
    console.log('[Rubi Drawer] Drawer opened');
}

/**
 * Close drawer
 */
function closeDrawer() {
    drawerState.isOpen = false;
    if (drawerElement) {
        drawerElement.classList.remove('open');
        drawerElement.classList.remove('minimized');
    }
    drawerState.isMinimized = false;
    console.log('[Rubi Drawer] Drawer closed');
}

/**
 * Show loading state
 */
function showLoading(message = 'Loading...') {
    // Create loading indicator using InsightCard if available
    if (window.RubiComponentRenderer) {
        const loadingData = {
            title: 'Processing',
            content: message,
            icon: '⏳'
        };
        
        const loadingCard = window.RubiComponentRenderer.renderSection('InsightCard', loadingData);
        loadingCard.id = 'loading-indicator';
        elementsCache.drawerContent.insertBefore(loadingCard, elementsCache.drawerContent.firstChild);
    }
}

/**
 * Hide loading state
 */
function hideLoading() {
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
        loadingIndicator.remove();
    }
}

/**
 * Cancel active action
 */
function cancelActiveAction() {
    console.log('[Rubi Drawer] Cancelling active action');
    // In real implementation, this would cancel the Promise
    // For now, just hide loading
    hideLoading();
    drawerState.isLoading = false;
    drawerState.activeActionId = null;
    enableActionButtons();
}

/**
 * Show error state
 */
function showError(message) {
    if (window.RubiComponentRenderer) {
        const errorData = {
            title: 'Error',
            notifications: [{
                message: message,
                timestamp: 'Just now',
                type: 'error',
                read: false
            }]
        };
        
        const errorCard = window.RubiComponentRenderer.renderSection('NotificationsCard', errorData);
        errorCard.id = 'error-notification';
        elementsCache.drawerContent.insertBefore(errorCard, elementsCache.drawerContent.firstChild);
    } else {
        // Fallback to simple error display
        if (elementsCache.drawerContent) {
            const errorDiv = document.createElement('div');
            errorDiv.id = 'error-notification';
            errorDiv.style.cssText = 'padding: 10px; background: #FEE; color: #900; margin: 10px; border-radius: 4px;';
            errorDiv.textContent = message;
            elementsCache.drawerContent.insertBefore(errorDiv, elementsCache.drawerContent.firstChild);
        }
    }
}

/**
 * Hide error state
 */
function hideError() {
    const errorNotification = document.getElementById('error-notification');
    if (errorNotification) {
        errorNotification.remove();
    }
}

/**
 * Retry initialization
 */
function retryInitialization() {
    hideError();
    dependencyCheckCount = 0; // Reset counter
    checkDependenciesAndInit();
}

/**
 * Phase 10B/10C: Update system status indicator with production signals and policy info
 */
function updateSystemStatus(metadata) {
    const statusEl = document.getElementById('system-status') || createStatusElement();
    const statusTextEl = statusEl?.querySelector('.status-text');
    
    if (!statusEl || !statusTextEl) return;
    
    // Store status in state
    if (metadata) {
        drawerState.systemStatus.orgConfigSource = metadata.orgConfigSource;
        drawerState.systemStatus.identitySource = metadata.identitySource;
        drawerState.systemStatus.provider = metadata.provider;
        drawerState.systemStatus.model = metadata.model;
        drawerState.systemStatus.backendConnected = metadata.status === 'success';
        drawerState.systemStatus.moodleConnected = metadata.identitySource === 'moodle';
        
        // Phase 10C: Store policy info if present
        if (metadata.policy) {
            drawerState.systemStatus.policy = metadata.policy;
        }
    }
    
    // Determine if we're in full mode or demo/fallback mode
    const isFullMode = 
        metadata && 
        metadata.orgConfigSource === 'moodle' && 
        metadata.identitySource === 'moodle' &&
        metadata.status === 'success';
    
    drawerState.systemStatus.isFullMode = isFullMode;
    
    // Update display
    // Phase 10C: Check for policy restrictions first
    if (metadata?.policy && metadata.policy.enabled === false) {
        statusEl.className = 'system-status restricted-mode';
        statusTextEl.textContent = 'Rubi Disabled';
        statusEl.title = metadata.policy.reason || 'AI features disabled by organization';
        statusEl.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
    } else if (metadata?.policy?.reason === 'domain_not_allowed') {
        statusEl.className = 'system-status restricted-mode';
        statusTextEl.textContent = 'Site Not Allowed';
        statusEl.title = 'Rubi is not enabled for this website';
        statusEl.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
    } else if (isFullMode) {
        statusEl.className = 'system-status full-mode';
        statusTextEl.textContent = 'Rubi Connected';
        statusEl.title = `Using ${metadata.provider}/${metadata.model} via Moodle`;
        
        // Add green indicator
        statusEl.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
    } else if (metadata) {
        statusEl.className = 'system-status demo-mode';
        
        // Build status message
        let statusText = 'Limited Mode';
        let reasons = [];
        
        if (metadata.orgConfigSource === 'fallback') {
            reasons.push('default config');
        } else if (metadata.orgConfigSource === 'cache') {
            reasons.push('cached config');
        }
        
        if (metadata.identitySource === 'fallback') {
            reasons.push('no identity');
        } else if (metadata.identitySource === 'cache') {
            reasons.push('cached identity');
        }
        
        if (metadata.status !== 'success') {
            reasons.push('offline');
        }
        
        if (reasons.length > 0) {
            statusText += ` (${reasons.join(', ')})`;
        }
        
        statusTextEl.textContent = statusText;
        statusEl.title = 'Running with limited features';
        
        // Add yellow indicator
        statusEl.style.background = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
    } else {
        // No metadata yet
        statusEl.className = 'system-status';
        statusTextEl.textContent = 'Initializing...';
        statusEl.style.background = 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)';
    }
    
    // Show the status element
    statusEl.style.display = 'flex';
}

/**
 * Disable action buttons
 */
function disableActionButtons() {
    const buttons = elementsCache.drawerContent?.querySelectorAll('.rubi-quick-action-btn, .rubi-footer-btn');
    buttons?.forEach(button => button.disabled = true);
}

/**
 * Enable action buttons
 */
function enableActionButtons() {
    const buttons = elementsCache.drawerContent?.querySelectorAll('.rubi-quick-action-btn, .rubi-footer-btn');
    buttons?.forEach(button => button.disabled = false);
}

/**
 * Update UI
 */
function updateUI() {
    if (drawerState.currentContext) {
        renderDrawerContent(drawerState.currentContext);
    } else {
        renderDefaultContent();
    }
    updateHistoryDisplay();
}

/**
 * Get action label by ID
 */
function getActionLabel(actionId) {
    const action = drawerState.availableActions.find(a => a.id === actionId);
    return action ? action.label : actionId;
}

/**
 * Format platform name for display
 */
function formatPlatformName(platform) {
    const names = {
        'salesforce': 'Salesforce',
        'linkedin': 'LinkedIn',
        'gmail': 'Gmail',
        'outlook': 'Outlook',
        'unknown': 'Unknown'
    };
    return names[platform.toLowerCase()] || platform;
}

/**
 * Format page type for display
 */
function formatPageType(pageType) {
    return pageType.charAt(0).toUpperCase() + pageType.slice(1).replace(/_/g, ' ');
}

/**
 * Format field name for display
 */
function formatFieldName(fieldName) {
    return fieldName
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .replace(/_/g, ' ');
}

/**
 * Truncate text to specified length
 */
function truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

/**
 * Format timestamp for display
 */
function formatTime(date) {
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hr ago`;
    return date.toLocaleDateString();
}

/**
 * Copy result to clipboard
 */
window.copyResult = async function(actionId) {
    const resultCard = document.querySelector(`.result-card[data-action-id="${actionId}"] .result-content`);
    if (!resultCard) return;
    
    try {
        await navigator.clipboard.writeText(resultCard.innerText);
        console.log('[Rubi Drawer] Result copied to clipboard');
    } catch (error) {
        console.error('[Rubi Drawer] Failed to copy result:', error);
    }
};

/**
 * Share result
 */
window.shareResult = function(actionId) {
    console.log(`[Rubi Drawer] Share result for action: ${actionId}`);
    // Future implementation for sharing via email/Slack/etc
};

/**
 * Create status element if it doesn't exist
 */
function createStatusElement() {
    const statusEl = document.createElement('div');
    statusEl.id = 'system-status';
    statusEl.className = 'system-status';
    statusEl.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        padding: 8px 16px;
        border-radius: 20px;
        color: white;
        font-size: 12px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 8px;
        z-index: 10001;
        cursor: pointer;
        transition: all 0.3s ease;
    `;
    
    const statusIcon = document.createElement('span');
    statusIcon.className = 'status-icon';
    statusIcon.style.cssText = `
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: white;
        opacity: 0.9;
    `;
    
    const statusText = document.createElement('span');
    statusText.className = 'status-text';
    statusText.textContent = 'Initializing...';
    
    statusEl.appendChild(statusIcon);
    statusEl.appendChild(statusText);
    
    document.body.appendChild(statusEl);
    return statusEl;
}

/**
 * Export drawer API for external control
 */
function exportDrawerAPI() {
    window.RubiDrawer = {
        open: openDrawer,
        close: closeDrawer,
        toggle: () => drawerState.isOpen ? closeDrawer() : openDrawer(),
        getState: () => drawerState,
        getSystemStatus: () => drawerState.systemStatus,
        refreshContext: refreshContext,
        renderContent: (payload) => {
            if (window.RubiComponentRenderer) {
                renderDrawerContent(payload);
            }
        },
        updateLayout: (layoutName) => {
            if (window.RubiDrawerTemplates) {
                const [platform, pageType] = layoutName.split('.');
                const template = window.RubiDrawerTemplates.getLayoutFor(platform, pageType);
                drawerState.currentLayout = template;
                renderDrawerContent(drawerState.latestPayload);
            }
        }
    };
    
    console.log('[Rubi Drawer] Drawer API exported to window.RubiDrawer');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeDrawer);
} else {
    initializeDrawer();
}