/**
 * Rubi Component Registry
 * Central registry for all UI components
 * Manifest V3 Compatible - Global Namespace Pattern
 */

(function() {
    'use strict';

    // Component registry storage
    const components = {};
    const componentStyles = {};
    const componentHandlers = {};

    /**
     * Register a component with its renderer and styles
     */
    function registerComponent(name, options = {}) {
        components[name] = {
            name: name,
            renderer: options.renderer || defaultRenderer,
            styles: options.styles || {},
            handlers: options.handlers || {},
            template: options.template || null,
            props: options.props || []
        };
        
        console.log(`[RubiComponentRegistry] Registered component: ${name}`);
    }

    /**
     * Get component by name
     */
    function getComponent(name) {
        return components[name];
    }

    /**
     * Check if component exists
     */
    function hasComponent(name) {
        return name in components;
    }

    /**
     * Get all registered components
     */
    function getAllComponents() {
        return Object.keys(components);
    }

    /**
     * Default renderer for components
     */
    function defaultRenderer(data) {
        const div = document.createElement('div');
        div.className = 'rubi-component';
        
        if (data.content) {
            div.innerHTML = data.content;
        }
        
        return div;
    }

    /**
     * Initialize default components
     */
    function initializeDefaultComponents() {
        // Register default card components
        registerComponent('DrawerHeader', {
            renderer: createHeaderRenderer()
        });
        
        registerComponent('EmailContextCard', {
            renderer: createCardRenderer('email-context')
        });
        
        registerComponent('ProfileSummaryCard', {
            renderer: createCardRenderer('profile-summary')
        });
        
        registerComponent('OpportunitySummaryCard', {
            renderer: createCardRenderer('opportunity-summary')
        });
        
        registerComponent('AccountSummaryCard', {
            renderer: createCardRenderer('account-summary')
        });
        
        registerComponent('MessageAnalysisCard', {
            renderer: createAnalysisRenderer()
        });
        
        registerComponent('AISuggestionsCard', {
            renderer: createSuggestionsRenderer()
        });
        
        registerComponent('RecentActivityCard', {
            renderer: createActivityRenderer()
        });
        
        registerComponent('NextBestActionsCard', {
            renderer: createActionsRenderer()
        });
        
        registerComponent('QuickActionsGrid', {
            renderer: createQuickActionsRenderer()
        });
        
        registerComponent('DraftMessageArea', {
            renderer: createDraftRenderer()
        });
        
        registerComponent('NotificationsCard', {
            renderer: createNotificationsRenderer()
        });
        
        registerComponent('InsightCard', {
            renderer: createInsightRenderer()
        });
        
        registerComponent('DealHealthCard', {
            renderer: createDealHealthRenderer()
        });
        
        registerComponent('DrawerFooter', {
            renderer: createFooterRenderer()
        });
        
        // Register NotificationRow component (was missing)
        registerComponent('NotificationRow', {
            renderer: createNotificationRowRenderer()
        });
    }

    /**
     * Create a generic card renderer
     */
    function createCardRenderer(cardType) {
        return function(data) {
            const card = document.createElement('div');
            card.className = `rubi-card rubi-${cardType}-card`;
            card.setAttribute('data-component', this.name);
            
            // Card header
            if (data.title) {
                const header = document.createElement('div');
                header.className = 'rubi-card-header';
                
                const title = document.createElement('h3');
                title.className = 'rubi-card-title';
                title.textContent = data.title;
                header.appendChild(title);
                
                if (data.badge) {
                    const badge = document.createElement('span');
                    badge.className = 'rubi-badge';
                    badge.textContent = data.badge;
                    header.appendChild(badge);
                }
                
                card.appendChild(header);
            }
            
            // Card content
            const content = document.createElement('div');
            content.className = 'rubi-card-content';
            
            if (data.rows && data.rows.length > 0) {
                const list = document.createElement('div');
                list.className = 'rubi-info-list';
                
                data.rows.forEach(row => {
                    const item = document.createElement('div');
                    item.className = 'rubi-info-row';
                    if (row.highlight) {
                        item.classList.add('highlight');
                    }
                    
                    const label = document.createElement('span');
                    label.className = 'rubi-info-label';
                    label.textContent = row.label + ':';
                    
                    const value = document.createElement('span');
                    value.className = 'rubi-info-value';
                    value.textContent = row.value;
                    
                    item.appendChild(label);
                    item.appendChild(value);
                    list.appendChild(item);
                });
                
                content.appendChild(list);
            } else if (data.content) {
                content.innerHTML = data.content;
            }
            
            card.appendChild(content);
            
            return card;
        };
    }

    /**
     * Create header renderer
     */
    function createHeaderRenderer() {
        return function(data) {
            const header = document.createElement('div');
            header.className = 'rubi-drawer-header';
            header.setAttribute('data-component', 'DrawerHeader');
            
            const title = document.createElement('h2');
            title.className = 'rubi-drawer-title';
            title.textContent = data.title || 'Rubi Assistant';
            
            const controls = document.createElement('div');
            controls.className = 'rubi-header-controls';
            
            if (data.showMinimize !== false) {
                const minimizeBtn = document.createElement('button');
                minimizeBtn.className = 'rubi-header-btn';
                minimizeBtn.setAttribute('data-action', 'minimize');
                minimizeBtn.innerHTML = '−';
                controls.appendChild(minimizeBtn);
            }
            
            if (data.showClose !== false) {
                const closeBtn = document.createElement('button');
                closeBtn.className = 'rubi-header-btn';
                closeBtn.setAttribute('data-action', 'close');
                closeBtn.innerHTML = '×';
                controls.appendChild(closeBtn);
            }
            
            header.appendChild(title);
            header.appendChild(controls);
            
            return header;
        };
    }

    /**
     * Create analysis renderer
     */
    function createAnalysisRenderer() {
        return function(data) {
            const card = createCardRenderer('analysis').call(this, data);
            
            // Add analysis-specific content
            if (data.scores && data.scores.length > 0) {
                const scoresContainer = document.createElement('div');
                scoresContainer.className = 'rubi-scores-container';
                
                data.scores.forEach(scoreData => {
                    const scoreItem = document.createElement('div');
                    scoreItem.className = 'rubi-score-item';
                    
                    const label = document.createElement('div');
                    label.className = 'rubi-score-label';
                    label.textContent = scoreData.label;
                    
                    const bar = document.createElement('div');
                    bar.className = 'rubi-score-bar';
                    
                    const fill = document.createElement('div');
                    fill.className = 'rubi-score-fill';
                    fill.style.width = `${(scoreData.score / scoreData.maxScore) * 100}%`;
                    fill.style.backgroundColor = scoreData.color || '#4CAF50';
                    
                    const value = document.createElement('span');
                    value.className = 'rubi-score-value';
                    value.textContent = `${scoreData.score}/${scoreData.maxScore}`;
                    
                    bar.appendChild(fill);
                    scoreItem.appendChild(label);
                    scoreItem.appendChild(bar);
                    scoreItem.appendChild(value);
                    
                    scoresContainer.appendChild(scoreItem);
                });
                
                card.querySelector('.rubi-card-content').appendChild(scoresContainer);
            }
            
            return card;
        };
    }

    /**
     * Create suggestions renderer
     */
    function createSuggestionsRenderer() {
        return function(data) {
            const card = createCardRenderer('suggestions').call(this, data);
            const content = card.querySelector('.rubi-card-content');
            
            if (data.suggestions && data.suggestions.length > 0) {
                const list = document.createElement('ul');
                list.className = 'rubi-suggestions-list';
                
                data.suggestions.forEach(suggestion => {
                    const item = document.createElement('li');
                    item.className = 'rubi-suggestion-item';
                    
                    const icon = document.createElement('span');
                    icon.className = 'rubi-suggestion-icon';
                    icon.textContent = suggestion.icon || '💡';
                    
                    const text = document.createElement('span');
                    text.className = 'rubi-suggestion-text';
                    text.textContent = suggestion.text;
                    
                    item.appendChild(icon);
                    item.appendChild(text);
                    list.appendChild(item);
                });
                
                content.appendChild(list);
            }
            
            return card;
        };
    }

    /**
     * Create activity renderer
     */
    function createActivityRenderer() {
        return function(data) {
            const card = createCardRenderer('activity').call(this, data);
            const content = card.querySelector('.rubi-card-content');
            
            if (data.activities && data.activities.length > 0) {
                const timeline = document.createElement('div');
                timeline.className = 'rubi-activity-timeline';
                
                data.activities.forEach(activity => {
                    const item = document.createElement('div');
                    item.className = 'rubi-activity-item';
                    
                    const dot = document.createElement('div');
                    dot.className = 'rubi-activity-dot';
                    
                    const details = document.createElement('div');
                    details.className = 'rubi-activity-details';
                    
                    const title = document.createElement('div');
                    title.className = 'rubi-activity-title';
                    title.textContent = activity.activity;
                    
                    const time = document.createElement('div');
                    time.className = 'rubi-activity-time';
                    time.textContent = activity.timestamp;
                    
                    details.appendChild(title);
                    details.appendChild(time);
                    
                    item.appendChild(dot);
                    item.appendChild(details);
                    timeline.appendChild(item);
                });
                
                content.appendChild(timeline);
            }
            
            return card;
        };
    }

    /**
     * Create actions renderer
     */
    function createActionsRenderer() {
        return function(data) {
            const card = createCardRenderer('actions').call(this, data);
            const content = card.querySelector('.rubi-card-content');
            
            if (data.actions && data.actions.length > 0) {
                const actions = document.createElement('div');
                actions.className = 'rubi-actions-list';
                
                data.actions.forEach((action, index) => {
                    const button = document.createElement('button');
                    button.className = 'rubi-action-button';
                    button.setAttribute('data-action-id', action.id || index);
                    
                    const icon = document.createElement('span');
                    icon.className = 'rubi-action-icon';
                    icon.textContent = action.icon || '→';
                    
                    const label = document.createElement('span');
                    label.className = 'rubi-action-label';
                    label.textContent = action.label;
                    
                    button.appendChild(icon);
                    button.appendChild(label);
                    
                    if (action.priority === 'high') {
                        button.classList.add('priority-high');
                    }
                    
                    if (action.disabled) {
                        button.disabled = true;
                    }
                    
                    actions.appendChild(button);
                });
                
                content.appendChild(actions);
            }
            
            return card;
        };
    }

    /**
     * Create quick actions renderer
     */
    function createQuickActionsRenderer() {
        return function(data) {
            const container = document.createElement('div');
            container.className = 'rubi-quick-actions';
            container.setAttribute('data-component', 'QuickActionsGrid');
            
            if (data.title) {
                const title = document.createElement('h3');
                title.className = 'rubi-section-title';
                title.textContent = data.title;
                container.appendChild(title);
            }
            
            const grid = document.createElement('div');
            grid.className = 'rubi-quick-actions-grid';
            
            if (data.columns) {
                grid.style.gridTemplateColumns = `repeat(${data.columns}, 1fr)`;
            }
            
            if (data.actions && data.actions.length > 0) {
                data.actions.forEach((action, index) => {
                    const button = document.createElement('button');
                    button.className = 'rubi-quick-action-btn';
                    button.setAttribute('data-action-index', index);
                    
                    const icon = document.createElement('div');
                    icon.className = 'rubi-quick-action-icon';
                    icon.textContent = action.icon || '•';
                    
                    const label = document.createElement('div');
                    label.className = 'rubi-quick-action-label';
                    label.textContent = action.label;
                    
                    button.appendChild(icon);
                    button.appendChild(label);
                    grid.appendChild(button);
                });
            }
            
            container.appendChild(grid);
            return container;
        };
    }

    /**
     * Create draft renderer
     */
    function createDraftRenderer() {
        return function(data) {
            const container = document.createElement('div');
            container.className = 'rubi-draft-area';
            container.setAttribute('data-component', 'DraftMessageArea');
            
            if (data.title) {
                const title = document.createElement('h3');
                title.className = 'rubi-section-title';
                title.textContent = data.title;
                container.appendChild(title);
            }
            
            const textarea = document.createElement('textarea');
            textarea.className = 'rubi-draft-textarea';
            textarea.placeholder = data.placeholder || 'Type your message...';
            
            if (data.content) {
                textarea.value = data.content;
            }
            
            container.appendChild(textarea);
            
            const controls = document.createElement('div');
            controls.className = 'rubi-draft-controls';
            
            const charCount = document.createElement('span');
            charCount.className = 'rubi-char-count';
            charCount.textContent = `${textarea.value.length} characters`;
            
            const buttons = document.createElement('div');
            buttons.className = 'rubi-draft-buttons';
            
            const enhanceBtn = document.createElement('button');
            enhanceBtn.className = 'rubi-draft-btn';
            enhanceBtn.textContent = 'Enhance';
            
            const clearBtn = document.createElement('button');
            clearBtn.className = 'rubi-draft-btn secondary';
            clearBtn.textContent = 'Clear';
            
            buttons.appendChild(clearBtn);
            buttons.appendChild(enhanceBtn);
            
            controls.appendChild(charCount);
            controls.appendChild(buttons);
            
            container.appendChild(controls);
            
            // Update char count on input
            textarea.addEventListener('input', () => {
                charCount.textContent = `${textarea.value.length} characters`;
            });
            
            return container;
        };
    }

    /**
     * Create notifications renderer
     */
    function createNotificationsRenderer() {
        return function(data) {
            const card = createCardRenderer('notifications').call(this, data);
            const content = card.querySelector('.rubi-card-content');
            
            if (data.notifications && data.notifications.length > 0) {
                const list = document.createElement('div');
                list.className = 'rubi-notifications-list';
                
                data.notifications.forEach(notification => {
                    const item = document.createElement('div');
                    item.className = `rubi-notification-item ${notification.type || 'info'}`;
                    
                    if (!notification.read) {
                        item.classList.add('unread');
                    }
                    
                    const icon = document.createElement('div');
                    icon.className = 'rubi-notification-icon';
                    
                    switch(notification.type) {
                        case 'error':
                            icon.textContent = '⚠️';
                            break;
                        case 'success':
                            icon.textContent = '✅';
                            break;
                        case 'warning':
                            icon.textContent = '⚡';
                            break;
                        default:
                            icon.textContent = 'ℹ️';
                    }
                    
                    const content = document.createElement('div');
                    content.className = 'rubi-notification-content';
                    
                    const message = document.createElement('div');
                    message.className = 'rubi-notification-message';
                    message.textContent = notification.message;
                    
                    const time = document.createElement('div');
                    time.className = 'rubi-notification-time';
                    time.textContent = notification.timestamp;
                    
                    content.appendChild(message);
                    content.appendChild(time);
                    
                    item.appendChild(icon);
                    item.appendChild(content);
                    list.appendChild(item);
                });
                
                content.appendChild(list);
            }
            
            return card;
        };
    }

    /**
     * Create insight renderer
     */
    function createInsightRenderer() {
        return function(data) {
            const card = document.createElement('div');
            card.className = 'rubi-insight-card';
            card.setAttribute('data-component', 'InsightCard');
            
            if (data.icon) {
                const icon = document.createElement('div');
                icon.className = 'rubi-insight-icon';
                icon.textContent = data.icon;
                card.appendChild(icon);
            }
            
            if (data.title) {
                const title = document.createElement('h4');
                title.className = 'rubi-insight-title';
                title.textContent = data.title;
                card.appendChild(title);
            }
            
            if (data.content) {
                const content = document.createElement('div');
                content.className = 'rubi-insight-content';
                content.textContent = data.content;
                card.appendChild(content);
            }
            
            if (data.actionLabel) {
                const action = document.createElement('button');
                action.className = 'rubi-insight-action';
                action.textContent = data.actionLabel;
                card.appendChild(action);
            }
            
            return card;
        };
    }

    /**
     * Create deal health renderer
     */
    function createDealHealthRenderer() {
        return function(data) {
            const card = createCardRenderer('deal-health').call(this, data);
            const content = card.querySelector('.rubi-card-content');
            
            // Health score
            if (data.score !== undefined) {
                const scoreContainer = document.createElement('div');
                scoreContainer.className = 'rubi-health-score';
                
                const scoreValue = document.createElement('div');
                scoreValue.className = 'rubi-health-score-value';
                scoreValue.textContent = data.score + '%';
                
                let scoreClass = 'good';
                if (data.score < 40) scoreClass = 'poor';
                else if (data.score < 70) scoreClass = 'fair';
                scoreValue.classList.add(scoreClass);
                
                const scoreLabel = document.createElement('div');
                scoreLabel.className = 'rubi-health-score-label';
                scoreLabel.textContent = 'Health Score';
                
                scoreContainer.appendChild(scoreValue);
                scoreContainer.appendChild(scoreLabel);
                content.appendChild(scoreContainer);
            }
            
            // Risk factors
            if (data.risks && data.risks.length > 0) {
                const risksContainer = document.createElement('div');
                risksContainer.className = 'rubi-risks-container';
                
                const risksTitle = document.createElement('h4');
                risksTitle.textContent = 'Risk Factors';
                risksContainer.appendChild(risksTitle);
                
                const risksList = document.createElement('ul');
                risksList.className = 'rubi-risks-list';
                
                data.risks.forEach(risk => {
                    const item = document.createElement('li');
                    item.className = `rubi-risk-item ${risk.severity || 'medium'}`;
                    item.textContent = risk.text;
                    risksList.appendChild(item);
                });
                
                risksContainer.appendChild(risksList);
                content.appendChild(risksContainer);
            }
            
            return card;
        };
    }

    /**
     * Create footer renderer
     */
    function createFooterRenderer() {
        return function(data) {
            const footer = document.createElement('div');
            footer.className = 'rubi-drawer-footer';
            footer.setAttribute('data-component', 'DrawerFooter');
            
            if (data.primaryAction) {
                const primaryBtn = document.createElement('button');
                primaryBtn.className = 'rubi-footer-btn primary';
                primaryBtn.textContent = data.primaryAction;
                footer.appendChild(primaryBtn);
            }
            
            if (data.secondaryAction) {
                const secondaryBtn = document.createElement('button');
                secondaryBtn.className = 'rubi-footer-btn secondary';
                secondaryBtn.textContent = data.secondaryAction;
                footer.appendChild(secondaryBtn);
            }
            
            if (data.text) {
                const text = document.createElement('div');
                text.className = 'rubi-footer-text';
                text.textContent = data.text;
                footer.appendChild(text);
            }
            
            return footer;
        };
    }
    
    /**
     * Create notification row renderer
     */
    function createNotificationRowRenderer() {
        return function(data) {
            const row = document.createElement('div');
            row.className = 'rubi-notification-row';
            row.setAttribute('data-component', 'NotificationRow');
            
            // Icon
            const icon = document.createElement('div');
            icon.className = 'rubi-notification-row-icon';
            icon.textContent = data.icon || 'ℹ️';
            
            // Content
            const content = document.createElement('div');
            content.className = 'rubi-notification-row-content';
            
            const title = document.createElement('div');
            title.className = 'rubi-notification-row-title';
            title.textContent = data.title || 'Notification';
            
            const message = document.createElement('div');
            message.className = 'rubi-notification-row-message';
            message.textContent = data.message || '';
            
            content.appendChild(title);
            if (data.message) {
                content.appendChild(message);
            }
            
            // Time
            const time = document.createElement('div');
            time.className = 'rubi-notification-row-time';
            time.textContent = data.timestamp || 'Just now';
            
            row.appendChild(icon);
            row.appendChild(content);
            row.appendChild(time);
            
            return row;
        };
    }

    // Initialize on load
    initializeDefaultComponents();

    /**
     * Validate props for a component
     */
    function validateProps(componentName, props) {
        const component = components[componentName];
        if (!component) {
            console.warn(`[RubiComponentRegistry] Component ${componentName} not found`);
            return false;
        }
        
        // Basic validation - check if props is an object
        if (props && typeof props !== 'object') {
            console.warn(`[RubiComponentRegistry] Invalid props for ${componentName}: props must be an object`);
            return false;
        }
        
        // If component has required props defined, validate them
        if (component.props && Array.isArray(component.props)) {
            for (const requiredProp of component.props) {
                if (typeof requiredProp === 'string' && !props?.[requiredProp]) {
                    console.warn(`[RubiComponentRegistry] Missing required prop "${requiredProp}" for ${componentName}`);
                    return false;
                }
            }
        }
        
        return true;
    }

    // Export API
    window.RubiComponentRegistry = {
        register: registerComponent,
        get: getComponent,
        getComponent: getComponent,  // Add this alias for compatibility
        has: hasComponent,
        hasComponent: hasComponent,  // Add this alias for compatibility
        getAll: getAllComponents,
        getAllComponents: getAllComponents,  // Add this alias for compatibility
        validateComponent: hasComponent,  // Add for validation checks
        validateProps: validateProps,  // Add missing validateProps method
        initializeDefaultComponents: initializeDefaultComponents
    };

})();