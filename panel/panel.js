/**
 * Rubi Browser Extension - Debug Panel
 *
 * Minimal debug panel for viewing extracted context payloads.
 * Provides visual interface for debugging and testing context extraction.
 */

// Panel state
let currentPayload = null;
let isFieldsExpanded = false;

/**
 * Initialize the debug panel
 */
function initDebugPanel() {
    console.log('[Rubi Panel] Initializing debug panel');
    
    // Register hotkey listener
    registerHotkeyListener();
    
    // Set up UI event listeners
    setupUIEventListeners();
    
    // Listen for new context payloads
    listenForContextUpdates();
    
    // Initial panel update
    updatePanel(null);
}

/**
 * Register hotkey listener for Cmd+Shift+K / Ctrl+Shift+K
 */
function registerHotkeyListener() {
    document.addEventListener('keydown', (event) => {
        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        const isHotkey = isMac ? 
            (event.metaKey && event.shiftKey && event.key === 'K') :
            (event.ctrlKey && event.shiftKey && event.key === 'K');
            
        if (isHotkey) {
            event.preventDefault();
            togglePanel();
        }
    });
    
    console.log('[Rubi Panel] Hotkey listener registered (Cmd/Ctrl+Shift+K)');
}

/**
 * Set up UI event listeners
 */
function setupUIEventListeners() {
    // Close button
    const closeButton = document.getElementById('close-panel');
    if (closeButton) {
        closeButton.addEventListener('click', () => {
            hidePanel();
        });
    }
    
    // Toggle fields button
    const toggleButton = document.getElementById('toggle-fields');
    if (toggleButton) {
        toggleButton.addEventListener('click', () => {
            toggleFields();
        });
    }
    
    // Copy payload button
    const copyButton = document.getElementById('copy-payload');
    if (copyButton) {
        copyButton.addEventListener('click', () => {
            copyPayloadToClipboard();
        });
    }
    
    // Send to Rubi button
    const sendButton = document.getElementById('send-to-rubi');
    if (sendButton) {
        sendButton.addEventListener('click', () => {
            sendToRubi();
        });
    }
    
    // Clear result button
    const clearResultButton = document.getElementById('clear-result');
    if (clearResultButton) {
        clearResultButton.addEventListener('click', () => {
            clearActionResult();
        });
    }
    
    console.log('[Rubi Panel] UI event listeners set up');
}

/**
 * Listen for context updates from the bridge
 */
function listenForContextUpdates() {
    if (typeof window.RubiContextBridge !== 'undefined') {
        window.RubiContextBridge.onNewContext((payload) => {
            console.log('[Rubi Panel] Received new context payload');
            updatePanel(payload);
            renderActionsMenu(payload);
        });
        
        // Also check for existing context
        const existingPayload = window.RubiContextBridge.getLatestContext();
        if (existingPayload) {
            console.log('[Rubi Panel] Found existing context payload');
            updatePanel(existingPayload);
            renderActionsMenu(existingPayload);
        }
    } else {
        console.warn('[Rubi Panel] Context bridge not available');
    }
}

/**
 * Toggle panel visibility
 */
function togglePanel() {
    const panel = document.getElementById('rubi-debug-panel');
    if (panel) {
        const isVisible = panel.style.display !== 'none';
        if (isVisible) {
            hidePanel();
        } else {
            showPanel();
        }
    }
}

/**
 * Show the panel
 */
function showPanel() {
    const panel = document.getElementById('rubi-debug-panel');
    if (panel) {
        panel.style.display = 'block';
        console.log('[Rubi Panel] Panel shown');
    }
}

/**
 * Hide the panel
 */
function hidePanel() {
    const panel = document.getElementById('rubi-debug-panel');
    if (panel) {
        panel.style.display = 'none';
        console.log('[Rubi Panel] Panel hidden');
    }
}

/**
 * Update panel with new payload data
 */
function updatePanel(payload) {
    console.log('[Rubi Panel] Updating panel with payload');
    currentPayload = payload;
    
    // Update basic info
    updateBasicInfo(payload);
    
    // Update fields display
    updateFieldsDisplay(payload);
    
    // Update button states
    updateButtonStates(payload);
}

/**
 * Update basic information display
 */
function updateBasicInfo(payload) {
    const platformEl = document.getElementById('platform-value');
    const pageTypeEl = document.getElementById('pagetype-value');
    const confidenceEl = document.getElementById('confidence-value');
    const missingFieldsEl = document.getElementById('missing-fields-value');
    
    if (!payload) {
        if (platformEl) platformEl.textContent = 'No context yet extracted';
        if (pageTypeEl) pageTypeEl.textContent = '--';
        if (confidenceEl) confidenceEl.textContent = '--';
        if (missingFieldsEl) missingFieldsEl.textContent = '--';
        return;
    }
    
    if (platformEl) {
        platformEl.textContent = payload.platform || 'unknown';
    }
    
    if (pageTypeEl) {
        pageTypeEl.textContent = payload.pageType || 'unknown';
    }
    
    if (confidenceEl) {
        const confidence = payload.extractionConfidence;
        confidenceEl.textContent = confidence !== null && confidence !== undefined ? 
            `${confidence}%` : '--';
    }
    
    if (missingFieldsEl) {
        const missing = payload.requiredMissing;
        if (missing && Array.isArray(missing) && missing.length > 0) {
            missingFieldsEl.textContent = missing.join(', ');
        } else {
            missingFieldsEl.textContent = 'none';
        }
    }
}

/**
 * Update fields display
 */
function updateFieldsDisplay(payload) {
    const fieldsJson = document.getElementById('fields-json');
    
    if (!fieldsJson) return;
    
    if (!payload || !payload.fields || Object.keys(payload.fields).length === 0) {
        fieldsJson.textContent = 'No fields available';
        return;
    }
    
    try {
        const formatted = renderJSON(payload.fields);
        fieldsJson.textContent = formatted;
    } catch (error) {
        console.error('[Rubi Panel] Error rendering fields JSON:', error);
        fieldsJson.textContent = 'Error rendering fields data';
    }
}

/**
 * Render JSON with formatting
 */
function renderJSON(obj) {
    return JSON.stringify(obj, null, 2);
}

/**
 * Update button states
 */
function updateButtonStates(payload) {
    const copyButton = document.getElementById('copy-payload');
    const sendButton = document.getElementById('send-to-rubi');
    
    const hasPayload = payload !== null && payload !== undefined;
    
    if (copyButton) {
        copyButton.disabled = !hasPayload;
    }
    
    if (sendButton) {
        sendButton.disabled = !hasPayload;
    }
}

/**
 * Toggle fields section visibility
 */
function toggleFields() {
    const fieldsContent = document.getElementById('fields-content');
    const toggleButton = document.getElementById('toggle-fields');
    
    if (!fieldsContent || !toggleButton) return;
    
    isFieldsExpanded = !isFieldsExpanded;
    
    if (isFieldsExpanded) {
        fieldsContent.style.display = 'block';
        toggleButton.textContent = 'Hide';
    } else {
        fieldsContent.style.display = 'none';
        toggleButton.textContent = 'Show';
    }
}

/**
 * Copy current payload to clipboard
 */
async function copyPayloadToClipboard() {
    if (!currentPayload) {
        showStatusMessage('No payload to copy', 'error');
        return;
    }
    
    try {
        const jsonString = JSON.stringify(currentPayload, null, 2);
        await navigator.clipboard.writeText(jsonString);
        showStatusMessage('Payload copied to clipboard', 'success');
        console.log('[Rubi Panel] Payload copied to clipboard');
    } catch (error) {
        console.error('[Rubi Panel] Failed to copy payload:', error);
        showStatusMessage('Failed to copy payload', 'error');
    }
}

/**
 * Send current payload to Rubi
 */
async function sendToRubi() {
    if (!currentPayload) {
        showStatusMessage('No payload to send', 'error');
        return;
    }
    
    if (typeof window.RubiContextBridge === 'undefined') {
        showStatusMessage('Context bridge not available', 'error');
        return;
    }
    
    try {
        showStatusMessage('Sending to Rubi...', 'info');
        console.log('[Rubi Panel] Sending payload to Rubi');
        
        const response = await window.RubiContextBridge.sendContextToRubi();
        
        if (response && response.success) {
            showStatusMessage('Successfully sent to Rubi', 'success');
            console.log('[Rubi Panel] Payload sent successfully:', response);
        } else {
            showStatusMessage('Failed to send to Rubi', 'error');
            console.error('[Rubi Panel] Send failed:', response);
        }
    } catch (error) {
        console.error('[Rubi Panel] Error sending to Rubi:', error);
        showStatusMessage('Error sending to Rubi', 'error');
    }
}

/**
 * Show status message
 */
function showStatusMessage(message, type = 'info') {
    const statusEl = document.getElementById('status-message');
    if (!statusEl) return;
    
    statusEl.textContent = message;
    statusEl.className = `status-message ${type}`;
    statusEl.style.display = 'block';
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
        statusEl.style.display = 'none';
    }, 3000);
}

/**
 * Render available actions menu for the current payload
 */
function renderActionsMenu(payload) {
    console.log('[Rubi Panel] Rendering actions menu');
    
    const actionsMenuEl = document.getElementById('actions-menu');
    if (!actionsMenuEl) {
        console.warn('[Rubi Panel] Actions menu element not found');
        return;
    }
    
    // Clear existing menu
    actionsMenuEl.innerHTML = '';
    
    // Check if actions router is available
    if (typeof window.RubiActionsRouter === 'undefined') {
        console.warn('[Rubi Panel] Actions router not available');
        actionsMenuEl.innerHTML = '<p class="no-actions">Actions system not available</p>';
        return;
    }
    
    // Get available actions for this context
    let availableActions = [];
    try {
        availableActions = window.RubiActionsRouter.getMenuForContext(payload);
    } catch (error) {
        console.error('[Rubi Panel] Error getting actions menu:', error);
        actionsMenuEl.innerHTML = '<p class="no-actions">Error loading actions</p>';
        return;
    }
    
    // Render actions or no actions message
    if (!availableActions || availableActions.length === 0) {
        actionsMenuEl.innerHTML = '<p class="no-actions">No actions available</p>';
        return;
    }
    
    // Create action buttons
    availableActions.forEach(action => {
        const button = document.createElement('button');
        button.className = 'action-button';
        button.textContent = action.label;
        button.title = action.description || '';
        button.onclick = () => executeAction(action.id, payload);
        actionsMenuEl.appendChild(button);
    });
    
    console.log(`[Rubi Panel] Rendered ${availableActions.length} action buttons`);
}

/**
 * Execute a specific action with the current payload
 */
async function executeAction(actionId, payload) {
    console.log(`[Rubi Panel] Executing action: ${actionId}`);
    
    if (!payload) {
        showStatusMessage('No payload available for action', 'error');
        return;
    }
    
    if (typeof window.RubiActionsRouter === 'undefined') {
        showStatusMessage('Actions router not available', 'error');
        return;
    }
    
    // Disable all action buttons during execution
    const actionButtons = document.querySelectorAll('.action-button');
    actionButtons.forEach(button => {
        button.disabled = true;
    });
    
    try {
        showStatusMessage('Executing action...', 'info');
        
        const result = await window.RubiActionsRouter.runAction(actionId, payload);
        
        // Display result in JSON viewer
        displayActionResult(result);
        
        showStatusMessage('Action completed successfully', 'success');
        console.log(`[Rubi Panel] Action ${actionId} completed:`, result);
        
    } catch (error) {
        console.error(`[Rubi Panel] Action ${actionId} failed:`, error);
        showStatusMessage(`Action failed: ${error.message}`, 'error');
        
        // Show error in result area
        displayActionResult({
            error: true,
            message: error.message,
            actionId: actionId
        });
    } finally {
        // Re-enable action buttons
        actionButtons.forEach(button => {
            button.disabled = false;
        });
    }
}

/**
 * Display action result in the result area
 */
function displayActionResult(result) {
    const resultEl = document.getElementById('action-result');
    const contentEl = document.getElementById('result-content');
    
    if (!resultEl || !contentEl) return;
    
    try {
        const formattedResult = JSON.stringify(result, null, 2);
        contentEl.textContent = formattedResult;
        resultEl.style.display = 'block';
        
        // Phase 10A/10C: Update resolution/diagnostics if metadata is present
        if (result && result.executionMetadata) {
            updateResolutionInfo(result.executionMetadata);
        }
        
        // Phase 10C: Show policy block info if present
        if (result && result.policyBlock) {
            displayPolicyBlockInfo(result);
        }
        
        console.log('[Rubi Panel] Action result displayed');
    } catch (error) {
        console.error('[Rubi Panel] Error formatting result:', error);
        contentEl.textContent = 'Error formatting result';
        resultEl.style.display = 'block';
    }
}

/**
 * Phase 10A/10C: Update resolution/diagnostics info with policy data
 */
function updateResolutionInfo(metadata) {
    if (!metadata) {
        // Clear resolution info
        document.getElementById('resolution-backend').textContent = '--';
        document.getElementById('resolution-provider').textContent = '--';
        document.getElementById('resolution-model').textContent = '--';
        document.getElementById('resolution-orgconfig').textContent = '--';
        document.getElementById('resolution-identity').textContent = '--';
        document.getElementById('resolution-warnings-row').style.display = 'none';
        document.getElementById('resolution-policy-row').style.display = 'none';
        return;
    }
    
    // Update backend status
    const backendEl = document.getElementById('resolution-backend');
    if (backendEl) {
        backendEl.textContent = metadata.backendUsed ? 'Yes' : 'Stub';
        backendEl.style.color = metadata.backendUsed ? '#28a745' : '#ffc107';
    }
    
    // Update provider info
    const providerEl = document.getElementById('resolution-provider');
    if (providerEl) {
        const provider = metadata.providerFinal || metadata.providerPrimary || 'Unknown';
        providerEl.textContent = provider.charAt(0).toUpperCase() + provider.slice(1);
        if (metadata.providerFallbackOccurred) {
            providerEl.textContent += ' (fallback)';
            providerEl.style.color = '#ff6b35';
        } else {
            providerEl.style.color = '#333';
        }
    }
    
    // Update model info
    const modelEl = document.getElementById('resolution-model');
    if (modelEl) {
        modelEl.textContent = metadata.modelFinal || metadata.modelPrimary || '--';
    }
    
    // Update org config source
    const orgConfigEl = document.getElementById('resolution-orgconfig');
    if (orgConfigEl) {
        const source = metadata.orgConfigSource || 'unknown';
        orgConfigEl.textContent = source.charAt(0).toUpperCase() + source.slice(1);
        orgConfigEl.style.color = source === 'moodle' ? '#28a745' : 
                                 source === 'json' ? '#6c757d' : 
                                 source === 'default' ? '#ffc107' : '#dc3545';
    }
    
    // Update identity source
    const identityEl = document.getElementById('resolution-identity');
    if (identityEl) {
        const source = metadata.identitySource || 'unknown';
        identityEl.textContent = source.charAt(0).toUpperCase() + source.slice(1);
        identityEl.style.color = source === 'moodle' ? '#28a745' : 
                                source === 'extension' ? '#007bff' :
                                source === 'mock' ? '#ffc107' : '#dc3545';
    }
    
    // Update warnings if present
    const warningsRow = document.getElementById('resolution-warnings-row');
    const warningsEl = document.getElementById('resolution-warnings');
    if (metadata.warnings && metadata.warnings.length > 0) {
        if (warningsRow) warningsRow.style.display = 'flex';
        if (warningsEl) {
            const warningMessages = metadata.warnings.map(w => {
                switch(w) {
                    case 'orgConfigMissing': return 'Org config missing';
                    case 'identityMissing': return 'Identity missing';
                    case 'usingDefaultConfig': return 'Using defaults';
                    case 'usingMockIdentity': return 'Mock identity';
                    case 'moodleUnavailable': return 'Moodle unreachable';
                    case 'providerFallbackUsed': return 'Provider fallback';
                    default: return w;
                }
            });
            warningsEl.textContent = warningMessages.join(', ');
        }
    } else {
        if (warningsRow) warningsRow.style.display = 'none';
    }
    
    // Phase 10C: Update policy info if present
    const policyRow = document.getElementById('resolution-policy-row');
    const policyEl = document.getElementById('resolution-policy');
    if (metadata.policy) {
        if (policyRow) policyRow.style.display = 'flex';
        if (policyEl) {
            let policyText = metadata.policy.enabled === false ? 'BLOCKED' : 'ALLOWED';
            
            if (metadata.policy.reason) {
                const reasonMap = {
                    'org_disabled': 'Org Disabled',
                    'extension_disabled': 'Extension Disabled',
                    'org_daily_limit_exceeded': 'Org Limit',
                    'user_daily_limit_exceeded': 'User Limit',
                    'domain_not_allowed': 'Domain Blocked',
                    'action_not_allowed': 'Action Blocked'
                };
                policyText += ` (${reasonMap[metadata.policy.reason] || metadata.policy.reason})`;
            }
            
            if (metadata.policy.limitsApplied) {
                const limits = [];
                if (metadata.policy.limitsApplied.maxDailyOrg) {
                    limits.push(`Org: ${metadata.policy.limitsApplied.maxDailyOrg}/day`);
                }
                if (metadata.policy.limitsApplied.maxDailyUser) {
                    limits.push(`User: ${metadata.policy.limitsApplied.maxDailyUser}/day`);
                }
                if (limits.length > 0) {
                    policyText += ` [${limits.join(', ')}]`;
                }
            }
            
            policyEl.textContent = policyText;
            policyEl.style.color = metadata.policy.enabled === false ? '#dc3545' : '#28a745';
        }
    } else {
        if (policyRow) policyRow.style.display = 'none';
    }
    
    console.log('[Rubi Panel] Resolution info updated', metadata);
}

/**
 * Clear the action result display
 */
function clearActionResult() {
    const resultEl = document.getElementById('action-result');
    const contentEl = document.getElementById('result-content');
    
    if (resultEl) {
        resultEl.style.display = 'none';
    }
    
    if (contentEl) {
        contentEl.textContent = '';
    }
    
    // Phase 10A/10C: Also clear resolution info
    updateResolutionInfo(null);
    
    // Clear policy block info
    const policyBlockEl = document.getElementById('policy-block-info');
    if (policyBlockEl) {
        policyBlockEl.style.display = 'none';
    }
    
    console.log('[Rubi Panel] Action result cleared');
}

/**
 * Phase 10C: Display policy block information prominently
 */
function displayPolicyBlockInfo(result) {
    let policyBlockEl = document.getElementById('policy-block-info');
    
    if (!policyBlockEl) {
        // Create policy block element if it doesn't exist
        policyBlockEl = document.createElement('div');
        policyBlockEl.id = 'policy-block-info';
        policyBlockEl.style.cssText = `
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            color: white;
            padding: 12px;
            margin: 10px 0;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 600;
        `;
        
        const resultSection = document.getElementById('action-result');
        if (resultSection) {
            resultSection.insertBefore(policyBlockEl, resultSection.firstChild);
        }
    }
    
    policyBlockEl.innerHTML = `
        <div style="margin-bottom: 8px;">⚠️ Action Blocked by Policy</div>
        <div style="font-size: 12px; font-weight: normal;">${result.error || 'This action is restricted'}</div>
        ${result.policyReason ? `<div style="font-size: 11px; margin-top: 4px; opacity: 0.9;">Reason: ${result.policyReason}</div>` : ''}
    `;
    policyBlockEl.style.display = 'block';
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDebugPanel);
} else {
    initDebugPanel();
}