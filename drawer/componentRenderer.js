// Rubi Component Renderer with Microcopy Integration
// Programmatic DOM rendering system with semantic text management
// Manifest V3 Compatible - Global Namespace Pattern

(function() {
    'use strict';

    // Apply microcopy to component data before rendering
    function applyMicrocopyToComponentData(componentName, data) {
        const enhanced = {...data};
        
        // Apply microcopy based on component type
        switch(componentName) {
            case 'DrawerHeader':
                if (!enhanced.title) {
                    enhanced.title = window.RubiMicrocopy.getLabel('SECTION_OPPORTUNITY_OVERVIEW');
                }
                break;
                
            case 'EmailContextCard':
                if (!enhanced.title) {
                    enhanced.title = window.RubiMicrocopy.getLabel('SECTION_EMAIL_INSIGHTS');
                }
                break;
                
            case 'OpportunitySummaryCard':
                if (!enhanced.title) {
                    enhanced.title = window.RubiMicrocopy.getLabel('SECTION_OPPORTUNITY_OVERVIEW');
                }
                break;
                
            case 'DealHealthCard':
                if (!enhanced.title) {
                    enhanced.title = window.RubiMicrocopy.getLabel('SECTION_DEAL_HEALTH');
                }
                break;
                
            case 'NextBestActionsCard':
                if (!enhanced.title) {
                    enhanced.title = window.RubiMicrocopy.getLabel('SECTION_RECOMMENDED_ACTIONS');
                }
                break;
                
            case 'AISuggestionsCard':
                if (!enhanced.title) {
                    enhanced.title = window.RubiMicrocopy.getLabel('SECTION_COACHING_TIPS');
                }
                break;
                
            case 'RecentActivityCard':
                if (!enhanced.title) {
                    enhanced.title = window.RubiMicrocopy.getLabel('SECTION_RECENT_ACTIVITY', 'Recent Activity');
                }
                break;
                
            case 'NotificationsCard':
                if (!enhanced.title) {
                    enhanced.title = window.RubiMicrocopy.getLabel('NOTIFY_INSIGHT_AVAILABLE');
                }
                break;
        }
        
        // Apply empty state microcopy
        if (!enhanced.emptyMessage) {
            const emptyKey = 'EMPTY_NO_' + (componentName.replace('Card', '').replace(/([A-Z])/g, '_$1')).toUpperCase();
            if (window.RubiMicrocopy && window.RubiMicrocopy.STRINGS[emptyKey]) {
                enhanced.emptyMessage = window.RubiMicrocopy.getLabel(emptyKey);
            }
        }
        
        return enhanced;
    }

    // Component rendering functions for each component type
    const componentRenderers = {
        // Header Components
        DrawerHeader: function(data) {
            const header = document.createElement('div');
            header.className = 'rubi-drawer-header';
            header.setAttribute('data-component', 'DrawerHeader');
            
            if (data.title) {
                const titleData = { text: data.title, icon: data.icon };
                header.appendChild(renderSection('DrawerHeaderTitle', titleData));
            }
            
            if (data.subtitle) {
                const subtextData = { text: data.subtitle };
                header.appendChild(renderSection('DrawerHeaderSubtext', subtextData));
            }
            
            if (data.showRefresh) {
                header.appendChild(renderSection('DrawerHeaderRefreshButton', {}));
            }
            
            // Add tooltip if available
            if (data.tooltip) {
                header.setAttribute('title', data.tooltip);
            }
            
            return header;
        },

        DrawerHeaderTitle: function(data) {
            const title = document.createElement('h2');
            title.className = 'rubi-header-title';
            
            if (data.icon) {
                const icon = document.createElement('span');
                icon.className = 'rubi-icon';
                icon.textContent = data.icon;
                title.appendChild(icon);
            }
            
            const text = document.createElement('span');
            text.textContent = data.text || window.RubiMicrocopy.getLabel('GENERIC_LOADING');
            title.appendChild(text);
            
            return title;
        },

        DrawerHeaderSubtext: function(data) {
            const subtext = document.createElement('p');
            subtext.className = 'rubi-header-subtext';
            subtext.textContent = data.text || '';
            return subtext;
        },

        DrawerHeaderRefreshButton: function(data) {
            const button = document.createElement('button');
            button.className = 'rubi-refresh-btn';
            button.innerHTML = '↻';
            button.title = window.RubiMicrocopy.getLabel('BTN_REFRESH');
            
            if (data.onClick) {
                button.addEventListener('click', data.onClick);
            } else {
                button.addEventListener('click', function() {
                    window.RubiDrawer?.refreshContext();
                });
            }
            
            return button;
        },

        // Email Context Components
        EmailContextCard: function(data) {
            const card = document.createElement('div');
            card.className = 'rubi-context-card';
            card.setAttribute('data-component', 'EmailContextCard');
            
            // Add title if provided
            if (data.title) {
                const title = document.createElement('h3');
                title.textContent = data.title;
                card.appendChild(title);
            }
            
            const rows = [];
            if (data.subject) {
                rows.push({ 
                    label: window.RubiMicrocopy.getLabel('FIELD_SUBJECT', 'Subject'), 
                    value: data.subject 
                });
            }
            if (data.sender) {
                rows.push({ 
                    label: window.RubiMicrocopy.getLabel('FIELD_SENDER', 'From'), 
                    value: data.sender 
                });
            }
            if (data.recipients) {
                rows.push({ 
                    label: window.RubiMicrocopy.getLabel('FIELD_RECIPIENTS', 'To'), 
                    value: data.recipients 
                });
            }
            if (data.timestamp) {
                rows.push({ 
                    label: window.RubiMicrocopy.getLabel('FIELD_TIMESTAMP', 'Time'), 
                    value: data.timestamp 
                });
            }
            
            // Add insights if provided
            if (data.insights && data.insights.length > 0) {
                data.insights.forEach(insight => {
                    rows.push({ 
                        label: window.RubiMicrocopy.getLabel('AI_SUGGESTS'), 
                        value: insight.text,
                        highlight: true
                    });
                });
            }
            
            // Add coaching tips if provided
            if (data.coachingTips && data.coachingTips.length > 0) {
                data.coachingTips.forEach(tip => {
                    rows.push({ 
                        label: window.RubiMicrocopy.getLabel('COACH_TIP', 'Tip'), 
                        value: tip.text,
                        severity: tip.severity
                    });
                });
            }
            
            if (rows.length === 0) {
                const emptyState = document.createElement('p');
                emptyState.className = 'rubi-empty-state';
                emptyState.textContent = data.emptyMessage || window.RubiMicrocopy.getLabel('EMPTY_NO_EMAILS');
                card.appendChild(emptyState);
            } else {
                rows.forEach(rowData => {
                    card.appendChild(renderSection('EmailContextRow', rowData));
                });
            }
            
            return card;
        },

        EmailContextRow: function(data) {
            const row = document.createElement('div');
            row.className = 'rubi-context-row';
            
            if (data.highlight) {
                row.classList.add('highlighted');
            }
            
            if (data.severity) {
                row.classList.add('severity-' + data.severity);
            }
            
            const label = document.createElement('span');
            label.className = 'rubi-label';
            label.textContent = data.label + ':';
            
            const value = document.createElement('span');
            value.className = 'rubi-value';
            value.textContent = data.value;
            
            row.appendChild(label);
            row.appendChild(value);
            
            return row;
        },

        // User Message Components
        UserMessageCard: function(data) {
            const card = document.createElement('div');
            card.className = 'rubi-message-card';
            card.setAttribute('data-component', 'UserMessageCard');
            
            if (data.title) {
                const title = document.createElement('h3');
                title.textContent = data.title;
                card.appendChild(title);
            }
            
            if (data.content || data.placeholder) {
                const fieldData = {
                    content: data.content,
                    placeholder: data.placeholder || window.RubiMicrocopy.getLabel('GENERIC_NOT_AVAILABLE'),
                    maxLength: data.maxLength
                };
                card.appendChild(renderSection('UserMessageField', fieldData));
            }
            
            return card;
        },

        UserMessageField: function(data) {
            const field = document.createElement('div');
            field.className = 'rubi-message-field';
            
            const content = document.createElement('p');
            content.textContent = data.content || data.placeholder || window.RubiMicrocopy.getLabel('EMPTY_NO_NOTES');
            
            if (!data.content && data.placeholder) {
                content.style.opacity = '0.6';
                content.style.fontStyle = 'italic';
            }
            
            field.appendChild(content);
            
            if (data.maxLength && data.content) {
                const counter = document.createElement('span');
                counter.className = 'rubi-char-counter';
                counter.textContent = data.content.length + '/' + data.maxLength;
                field.appendChild(counter);
            }
            
            return field;
        },

        // Message Analysis Components
        MessageAnalysisCard: function(data) {
            const card = document.createElement('div');
            card.className = 'rubi-analysis-card';
            card.setAttribute('data-component', 'MessageAnalysisCard');
            
            if (data.title) {
                const title = document.createElement('h3');
                title.textContent = data.title;
                card.appendChild(title);
            }
            
            if (data.summary) {
                const summary = document.createElement('p');
                summary.className = 'rubi-analysis-summary';
                summary.textContent = data.summary;
                card.appendChild(summary);
            }
            
            if (data.items) {
                data.items.forEach(item => {
                    card.appendChild(renderSection('MessageAnalysisItem', item));
                });
            }
            
            if (data.scores) {
                data.scores.forEach(score => {
                    card.appendChild(renderSection('MessageAnalysisScoreRow', score));
                });
            }
            
            // Add enrichments if available
            if (data.insights && data.insights.length > 0) {
                const insightsSection = document.createElement('div');
                insightsSection.className = 'rubi-insights-section';
                
                const insightsTitle = document.createElement('h4');
                insightsTitle.textContent = window.RubiMicrocopy.getLabel('SECTION_ENGAGEMENT_INSIGHTS');
                insightsSection.appendChild(insightsTitle);
                
                data.insights.forEach(insight => {
                    const item = document.createElement('div');
                    item.className = 'rubi-insight-item';
                    item.textContent = insight.text;
                    insightsSection.appendChild(item);
                });
                
                card.appendChild(insightsSection);
            }
            
            return card;
        },

        MessageAnalysisItem: function(data) {
            const item = document.createElement('div');
            item.className = 'rubi-analysis-item';
            
            if (data.severity) {
                item.classList.add('severity-' + data.severity);
            }
            
            if (data.icon) {
                const icon = document.createElement('span');
                icon.className = 'rubi-icon';
                icon.textContent = data.icon;
                item.appendChild(icon);
            }
            
            const label = document.createElement('span');
            label.className = 'rubi-label';
            label.textContent = data.label;
            
            const value = document.createElement('span');
            value.className = 'rubi-value';
            value.textContent = data.value;
            
            item.appendChild(label);
            item.appendChild(value);
            
            return item;
        },

        MessageAnalysisScoreRow: function(data) {
            const row = document.createElement('div');
            row.className = 'rubi-score-row';
            
            const label = document.createElement('span');
            label.className = 'rubi-label';
            label.textContent = data.label;
            
            const scoreContainer = document.createElement('div');
            scoreContainer.className = 'rubi-score-container';
            
            const scoreBar = document.createElement('div');
            scoreBar.className = 'rubi-score-bar';
            const percentage = data.maxScore ? (data.score / data.maxScore * 100) : data.score;
            scoreBar.style.width = percentage + '%';
            
            if (data.color) {
                scoreBar.style.backgroundColor = data.color;
            }
            
            const scoreText = document.createElement('span');
            scoreText.className = 'rubi-score-text';
            scoreText.textContent = data.maxScore ? data.score + '/' + data.maxScore : data.score + '%';
            
            scoreContainer.appendChild(scoreBar);
            row.appendChild(label);
            row.appendChild(scoreContainer);
            row.appendChild(scoreText);
            
            return row;
        },

        // AI Suggestions Components
        AISuggestionsCard: function(data) {
            const card = document.createElement('div');
            card.className = 'rubi-suggestions-card';
            card.setAttribute('data-component', 'AISuggestionsCard');
            
            if (data.title) {
                const header = document.createElement('div');
                header.className = 'rubi-card-header';
                
                const title = document.createElement('h3');
                title.textContent = data.title;
                header.appendChild(title);
                
                if (data.count) {
                    const badge = document.createElement('span');
                    badge.className = 'rubi-badge';
                    badge.textContent = data.count;
                    header.appendChild(badge);
                }
                
                card.appendChild(header);
            }
            
            if (data.suggestions && data.suggestions.length > 0) {
                const container = document.createElement('div');
                container.className = 'rubi-suggestions-container';
                
                data.suggestions.forEach(suggestion => {
                    container.appendChild(renderSection('AISuggestionPreview', suggestion));
                });
                
                card.appendChild(container);
            } else if (data.coachingTips && data.coachingTips.length > 0) {
                // Handle coaching tips as suggestions
                const container = document.createElement('div');
                container.className = 'rubi-suggestions-container';
                
                data.coachingTips.forEach(tip => {
                    const suggestion = {
                        text: tip.text,
                        type: 'coaching',
                        confidence: window.RubiMicrocopy.getLabel('AI_CONFIDENCE_HIGH')
                    };
                    container.appendChild(renderSection('AISuggestionPreview', suggestion));
                });
                
                card.appendChild(container);
            } else {
                const emptyState = document.createElement('p');
                emptyState.className = 'rubi-empty-state';
                emptyState.textContent = data.emptyMessage || window.RubiMicrocopy.getLabel('EMPTY_NO_RECOMMENDATIONS');
                card.appendChild(emptyState);
            }
            
            if (data.footerButton) {
                card.appendChild(renderSection('AISuggestionFooterButton', data.footerButton));
            }
            
            return card;
        },

        AISuggestionPreview: function(data) {
            const preview = document.createElement('div');
            preview.className = 'rubi-suggestion-preview';
            
            if (data.type) {
                preview.classList.add('suggestion-type-' + data.type);
            }
            
            const text = document.createElement('p');
            text.textContent = data.text;
            preview.appendChild(text);
            
            if (data.confidence) {
                const confidence = document.createElement('span');
                confidence.className = 'rubi-confidence';
                const confidenceText = typeof data.confidence === 'string' 
                    ? data.confidence 
                    : data.confidence + '% ' + window.RubiMicrocopy.getLabel('AI_CONFIDENCE', 'confidence');
                confidence.textContent = confidenceText;
                preview.appendChild(confidence);
            }
            
            if (data.onClick) {
                preview.style.cursor = 'pointer';
                preview.addEventListener('click', data.onClick);
            }
            
            return preview;
        },

        AISuggestionFooterButton: function(data) {
            const button = document.createElement('button');
            button.className = 'rubi-suggestion-footer-btn';
            
            if (data.icon) {
                const icon = document.createElement('span');
                icon.className = 'rubi-icon';
                icon.textContent = data.icon;
                button.appendChild(icon);
            }
            
            const label = document.createElement('span');
            label.textContent = data.label || window.RubiMicrocopy.getLabel('BTN_SEE_MORE', 'See More');
            button.appendChild(label);
            
            if (data.action) {
                button.addEventListener('click', data.action);
            }
            
            return button;
        },

        // Footer Components
        DrawerFooterButton: function(data) {
            const button = document.createElement('button');
            button.className = 'rubi-footer-btn';
            
            if (data.variant) {
                button.classList.add('btn-' + data.variant);
            }
            
            if (data.icon) {
                const icon = document.createElement('span');
                icon.className = 'rubi-icon';
                icon.textContent = data.icon;
                button.appendChild(icon);
            }
            
            const label = document.createElement('span');
            label.textContent = data.label || window.RubiMicrocopy.getLabel('BTN_SUBMIT', 'Submit');
            button.appendChild(label);
            
            if (data.disabled) {
                button.disabled = true;
            }
            
            if (data.action) {
                button.addEventListener('click', data.action);
            }
            
            return button;
        },

        // Opportunity Components
        OpportunitySummaryCard: function(data) {
            const card = document.createElement('div');
            card.className = 'rubi-opp-summary-card';
            card.setAttribute('data-component', 'OpportunitySummaryCard');
            
            if (data.title || data.dealName) {
                const title = document.createElement('h3');
                title.textContent = data.title || data.dealName;
                card.appendChild(title);
            }
            
            if (data.stage) {
                const stage = document.createElement('div');
                stage.className = 'rubi-stage-badge';
                stage.textContent = data.stage;
                card.appendChild(stage);
            }
            
            if (data.rows && data.rows.length > 0) {
                data.rows.forEach(row => {
                    card.appendChild(renderSection('OpportunitySummaryRow', row));
                });
            } else if (!data.rows || data.rows.length === 0) {
                const emptyState = document.createElement('p');
                emptyState.className = 'rubi-empty-state';
                emptyState.textContent = data.emptyMessage || window.RubiMicrocopy.getLabel('EMPTY_NO_OPPORTUNITIES');
                card.appendChild(emptyState);
            }
            
            return card;
        },

        OpportunitySummaryRow: function(data) {
            const row = document.createElement('div');
            row.className = 'rubi-opp-summary-row';
            
            if (data.highlight) {
                row.classList.add('highlighted');
            }
            
            const label = document.createElement('span');
            label.className = 'rubi-label';
            label.textContent = data.label;
            
            const value = document.createElement('span');
            value.className = 'rubi-value';
            value.textContent = data.value;
            
            row.appendChild(label);
            row.appendChild(value);
            
            return row;
        },

        // Deal Health Components
        DealHealthCard: function(data) {
            const card = document.createElement('div');
            card.className = 'rubi-deal-health-card';
            card.setAttribute('data-component', 'DealHealthCard');
            
            if (data.title) {
                const title = document.createElement('h3');
                title.textContent = data.title;
                card.appendChild(title);
            }
            
            if (data.overallScore) {
                const scoreContainer = document.createElement('div');
                scoreContainer.className = 'rubi-overall-score';
                
                const scoreValue = document.createElement('span');
                scoreValue.className = 'score-value';
                scoreValue.textContent = data.overallScore;
                
                const scoreLabel = document.createElement('span');
                scoreLabel.className = 'score-label';
                scoreLabel.textContent = window.RubiMicrocopy.getLabel('FIELD_DEAL_HEALTH', 'Overall Health');
                
                scoreContainer.appendChild(scoreValue);
                scoreContainer.appendChild(scoreLabel);
                card.appendChild(scoreContainer);
            }
            
            // Add risks if available
            if (data.risks && data.risks.length > 0) {
                const risksSection = document.createElement('div');
                risksSection.className = 'rubi-risks-section';
                
                const risksTitle = document.createElement('h4');
                risksTitle.textContent = window.RubiMicrocopy.getLabel('SECTION_RISK_ANALYSIS');
                risksSection.appendChild(risksTitle);
                
                data.risks.forEach(risk => {
                    const riskItem = document.createElement('div');
                    riskItem.className = 'rubi-risk-item severity-' + (risk.severity || 'medium');
                    riskItem.textContent = risk.text;
                    risksSection.appendChild(riskItem);
                });
                
                card.appendChild(risksSection);
            }
            
            if (data.metrics && data.metrics.length > 0) {
                data.metrics.forEach(metric => {
                    card.appendChild(renderSection('DealHealthItem', metric));
                });
            } else if (!data.risks) {
                const emptyState = document.createElement('p');
                emptyState.className = 'rubi-empty-state';
                emptyState.textContent = data.emptyMessage || window.RubiMicrocopy.getLabel('EMPTY_NO_RISKS');
                card.appendChild(emptyState);
            }
            
            return card;
        },

        DealHealthItem: function(data) {
            const item = document.createElement('div');
            item.className = 'rubi-deal-health-item';
            
            if (data.status) {
                item.classList.add('status-' + data.status);
            }
            
            const metric = document.createElement('span');
            metric.className = 'rubi-metric';
            metric.textContent = data.metric;
            
            const value = document.createElement('span');
            value.className = 'rubi-value';
            value.textContent = data.value;
            
            item.appendChild(metric);
            item.appendChild(value);
            
            if (data.trend) {
                const trend = document.createElement('span');
                trend.className = 'rubi-trend';
                const trendSymbol = data.trend === 'up' ? '↑' : data.trend === 'down' ? '↓' : '→';
                trend.textContent = trendSymbol;
                trend.setAttribute('title', window.RubiMicrocopy.getLabel('DATA_TRENDING_' + data.trend.toUpperCase()));
                item.appendChild(trend);
            }
            
            return item;
        },

        // Next Best Actions Components
        NextBestActionsCard: function(data) {
            const card = document.createElement('div');
            card.className = 'rubi-actions-card';
            card.setAttribute('data-component', 'NextBestActionsCard');
            
            if (data.title) {
                const title = document.createElement('h3');
                title.textContent = data.title;
                card.appendChild(title);
            }
            
            if (data.actions && data.actions.length > 0) {
                const list = document.createElement('ul');
                list.className = 'rubi-actions-list';
                
                data.actions.forEach(action => {
                    const listItem = document.createElement('li');
                    listItem.appendChild(renderSection('NextBestActionsItem', action));
                    list.appendChild(listItem);
                });
                
                card.appendChild(list);
            } else if (data.recommendedActions && data.recommendedActions.length > 0) {
                // Handle recommendedActions from enrichments
                const list = document.createElement('ul');
                list.className = 'rubi-actions-list';
                
                data.recommendedActions.forEach(action => {
                    const listItem = document.createElement('li');
                    const actionData = {
                        action: action.text,
                        reason: action.context || window.RubiMicrocopy.getLabel('AI_RECOMMENDS'),
                        priority: action.priority || 'medium'
                    };
                    listItem.appendChild(renderSection('NextBestActionsItem', actionData));
                    list.appendChild(listItem);
                });
                
                card.appendChild(list);
            } else {
                const emptyState = document.createElement('p');
                emptyState.className = 'rubi-empty-state';
                emptyState.textContent = data.emptyMessage || window.RubiMicrocopy.getLabel('EMPTY_NO_RECOMMENDATIONS');
                card.appendChild(emptyState);
            }
            
            return card;
        },

        NextBestActionsItem: function(data) {
            const item = document.createElement('div');
            item.className = 'rubi-action-item';
            
            if (data.priority) {
                item.classList.add('priority-' + data.priority);
            }
            
            const action = document.createElement('div');
            action.className = 'rubi-action';
            action.textContent = data.action;
            
            const reason = document.createElement('div');
            reason.className = 'rubi-reason';
            reason.textContent = data.reason;
            
            item.appendChild(action);
            item.appendChild(reason);
            
            if (data.onClick) {
                item.style.cursor = 'pointer';
                item.addEventListener('click', data.onClick);
            }
            
            return item;
        },

        // Additional Components with microcopy support
        TabbedContentContainer: function(data) {
            const container = document.createElement('div');
            container.className = 'rubi-tabbed-container';
            container.setAttribute('data-component', 'TabbedContentContainer');
            
            if (data.tabs) {
                const tabBar = document.createElement('div');
                tabBar.className = 'rubi-tab-bar';
                
                data.tabs.forEach(tab => {
                    const tabButton = document.createElement('button');
                    tabButton.className = 'rubi-tab-button';
                    if (tab.active) {
                        tabButton.classList.add('active');
                    }
                    tabButton.textContent = tab.label;
                    tabButton.addEventListener('click', tab.onClick || function() {});
                    tabBar.appendChild(tabButton);
                });
                
                container.appendChild(tabBar);
            }
            
            if (data.content) {
                const content = document.createElement('div');
                content.className = 'rubi-tab-content';
                content.innerHTML = data.content;
                container.appendChild(content);
            }
            
            return container;
        },

        InsightCard: function(data) {
            const card = document.createElement('div');
            card.className = 'rubi-insight-card';
            card.setAttribute('data-component', 'InsightCard');
            
            const header = document.createElement('div');
            header.className = 'rubi-card-header';
            
            if (data.icon) {
                const icon = document.createElement('span');
                icon.className = 'rubi-icon';
                icon.textContent = data.icon;
                header.appendChild(icon);
            }
            
            const title = document.createElement('h3');
            title.textContent = data.title || window.RubiMicrocopy.getLabel('SECTION_ENGAGEMENT_INSIGHTS');
            header.appendChild(title);
            
            if (data.timestamp) {
                const timestamp = document.createElement('span');
                timestamp.className = 'rubi-timestamp';
                timestamp.textContent = data.timestamp;
                header.appendChild(timestamp);
            }
            
            card.appendChild(header);
            
            const content = document.createElement('div');
            content.className = 'rubi-content';
            content.textContent = data.content || window.RubiMicrocopy.getLabel('EMPTY_NO_INSIGHTS');
            card.appendChild(content);
            
            // Add insights list if available
            if (data.insights && data.insights.length > 0) {
                const insightsList = document.createElement('ul');
                insightsList.className = 'rubi-insights-list';
                
                data.insights.forEach(insight => {
                    const li = document.createElement('li');
                    li.className = 'insight-type-' + (insight.type || 'info');
                    li.textContent = insight.text;
                    insightsList.appendChild(li);
                });
                
                card.appendChild(insightsList);
            }
            
            return card;
        },

        QuickActionsGrid: function(data) {
            const grid = document.createElement('div');
            grid.className = 'rubi-quick-actions-grid';
            grid.setAttribute('data-component', 'QuickActionsGrid');
            
            if (data.columns) {
                grid.style.gridTemplateColumns = 'repeat(' + data.columns + ', 1fr)';
            }
            
            if (data.actions && data.actions.length > 0) {
                data.actions.forEach(action => {
                    grid.appendChild(renderSection('QuickActionButton', action));
                });
            } else {
                const emptyState = document.createElement('p');
                emptyState.className = 'rubi-empty-state';
                emptyState.textContent = data.emptyMessage || window.RubiMicrocopy.getLabel('EMPTY_NO_ACTIONS', 'No actions available');
                grid.appendChild(emptyState);
            }
            
            return grid;
        },

        QuickActionButton: function(data) {
            const button = document.createElement('button');
            button.className = 'rubi-quick-action-btn';
            
            if (data.icon) {
                const icon = document.createElement('span');
                icon.className = 'rubi-icon';
                icon.textContent = data.icon;
                button.appendChild(icon);
            }
            
            const label = document.createElement('span');
            label.className = 'rubi-label';
            label.textContent = data.label;
            button.appendChild(label);
            
            if (data.badge) {
                const badge = document.createElement('span');
                badge.className = 'rubi-badge';
                badge.textContent = data.badge;
                button.appendChild(badge);
            }
            
            if (data.action) {
                button.addEventListener('click', data.action);
            }
            
            return button;
        },

        RecommendedContentCard: function(data) {
            const card = document.createElement('div');
            card.className = 'rubi-recommended-card';
            card.setAttribute('data-component', 'RecommendedContentCard');
            
            if (data.title) {
                const title = document.createElement('h3');
                title.textContent = data.title;
                card.appendChild(title);
            }
            
            if (data.items && data.items.length > 0) {
                const list = document.createElement('div');
                list.className = 'rubi-recommended-list';
                
                data.items.forEach(item => {
                    list.appendChild(renderSection('RecommendedContentItem', item));
                });
                
                card.appendChild(list);
            } else {
                const emptyState = document.createElement('p');
                emptyState.className = 'rubi-empty-state';
                emptyState.textContent = data.emptyMessage || window.RubiMicrocopy.getLabel('EMPTY_NO_RECOMMENDATIONS');
                card.appendChild(emptyState);
            }
            
            return card;
        },

        RecommendedContentItem: function(data) {
            const item = document.createElement('div');
            item.className = 'rubi-recommended-item';
            
            const header = document.createElement('div');
            header.className = 'rubi-item-header';
            
            const title = document.createElement('span');
            title.className = 'rubi-title';
            title.textContent = data.title;
            header.appendChild(title);
            
            const type = document.createElement('span');
            type.className = 'rubi-type';
            type.textContent = data.type;
            header.appendChild(type);
            
            item.appendChild(header);
            
            if (data.preview) {
                const preview = document.createElement('p');
                preview.className = 'rubi-preview';
                preview.textContent = data.preview;
                item.appendChild(preview);
            }
            
            if (data.relevance) {
                const relevance = document.createElement('span');
                relevance.className = 'rubi-relevance';
                relevance.textContent = data.relevance + '% ' + window.RubiMicrocopy.getLabel('DATA_RELEVANCE', 'relevant');
                item.appendChild(relevance);
            }
            
            if (data.url) {
                item.style.cursor = 'pointer';
                item.addEventListener('click', function() {
                    window.open(data.url, '_blank');
                });
            }
            
            return item;
        },

        NotificationsCard: function(data) {
            const card = document.createElement('div');
            card.className = 'rubi-notifications-card';
            card.setAttribute('data-component', 'NotificationsCard');
            
            const header = document.createElement('div');
            header.className = 'rubi-card-header';
            
            const title = document.createElement('h3');
            title.textContent = data.title || window.RubiMicrocopy.getLabel('NOTIFY_INSIGHT_AVAILABLE');
            header.appendChild(title);
            
            if (data.count) {
                const badge = document.createElement('span');
                badge.className = 'rubi-badge';
                badge.textContent = data.count;
                header.appendChild(badge);
            }
            
            card.appendChild(header);
            
            if (data.notifications && data.notifications.length > 0) {
                const list = document.createElement('div');
                list.className = 'rubi-notifications-list';
                
                data.notifications.forEach(notification => {
                    list.appendChild(renderSection('NotificationRow', notification));
                });
                
                card.appendChild(list);
            } else {
                const emptyState = document.createElement('p');
                emptyState.className = 'rubi-empty-state';
                emptyState.textContent = data.emptyMessage || window.RubiMicrocopy.getLabel('EMPTY_NO_NOTIFICATIONS', 'No notifications');
                card.appendChild(emptyState);
            }
            
            return card;
        },

        NotificationRow: function(data) {
            const row = document.createElement('div');
            row.className = 'rubi-notification-row';
            
            if (data.type) {
                row.classList.add('notification-' + data.type);
            }
            
            if (!data.read) {
                row.classList.add('unread');
            }
            
            const message = document.createElement('div');
            message.className = 'rubi-message';
            message.textContent = data.message;
            
            const timestamp = document.createElement('span');
            timestamp.className = 'rubi-timestamp';
            timestamp.textContent = data.timestamp;
            
            row.appendChild(message);
            row.appendChild(timestamp);
            
            if (data.onClick) {
                row.style.cursor = 'pointer';
                row.addEventListener('click', data.onClick);
            }
            
            return row;
        },

        RecentActivityCard: function(data) {
            const card = document.createElement('div');
            card.className = 'rubi-activity-card';
            card.setAttribute('data-component', 'RecentActivityCard');
            
            const header = document.createElement('div');
            header.className = 'rubi-card-header';
            
            const title = document.createElement('h3');
            title.textContent = data.title || window.RubiMicrocopy.getLabel('SECTION_RECENT_ACTIVITY', 'Recent Activity');
            header.appendChild(title);
            
            if (data.timeRange) {
                const range = document.createElement('span');
                range.className = 'rubi-time-range';
                range.textContent = data.timeRange;
                header.appendChild(range);
            }
            
            card.appendChild(header);
            
            if (data.activities && data.activities.length > 0) {
                const list = document.createElement('div');
                list.className = 'rubi-activity-list';
                
                data.activities.forEach(activity => {
                    list.appendChild(renderSection('RecentActivityItem', activity));
                });
                
                card.appendChild(list);
            } else {
                const emptyState = document.createElement('p');
                emptyState.className = 'rubi-empty-state';
                emptyState.textContent = data.emptyMessage || window.RubiMicrocopy.getLabel('EMPTY_NO_ACTIVITIES');
                card.appendChild(emptyState);
            }
            
            return card;
        },

        RecentActivityItem: function(data) {
            const item = document.createElement('div');
            item.className = 'rubi-activity-item';
            
            if (data.icon) {
                const icon = document.createElement('span');
                icon.className = 'rubi-icon';
                icon.textContent = data.icon;
                item.appendChild(icon);
            }
            
            const content = document.createElement('div');
            content.className = 'rubi-activity-content';
            
            const activity = document.createElement('div');
            activity.className = 'rubi-activity';
            activity.textContent = data.activity;
            content.appendChild(activity);
            
            if (data.user) {
                const user = document.createElement('span');
                user.className = 'rubi-user';
                user.textContent = data.user;
                content.appendChild(user);
            }
            
            if (data.details) {
                const details = document.createElement('p');
                details.className = 'rubi-details';
                details.textContent = data.details;
                content.appendChild(details);
            }
            
            item.appendChild(content);
            
            const timestamp = document.createElement('span');
            timestamp.className = 'rubi-timestamp';
            timestamp.textContent = data.timestamp;
            item.appendChild(timestamp);
            
            return item;
        },

        // Tabs
        OpportunityTab: function(data) {
            const tab = document.createElement('div');
            tab.className = 'rubi-opportunity-tab';
            if (data.active) {
                tab.classList.add('active');
            }
            tab.setAttribute('data-component', 'OpportunityTab');
            
            if (data.opportunitySummary) {
                tab.appendChild(renderSection('OpportunitySummaryCard', data.opportunitySummary));
            }
            
            if (data.dealHealth) {
                tab.appendChild(renderSection('DealHealthCard', data.dealHealth));
            }
            
            if (data.nextActions) {
                tab.appendChild(renderSection('NextBestActionsCard', data.nextActions));
            }
            
            return tab;
        },

        MeetingPrepTab: function(data) {
            const tab = document.createElement('div');
            tab.className = 'rubi-meeting-tab';
            if (data.active) {
                tab.classList.add('active');
            }
            tab.setAttribute('data-component', 'MeetingPrepTab');
            
            if (data.insights) {
                data.insights.forEach(insight => {
                    tab.appendChild(renderSection('InsightCard', insight));
                });
            }
            
            if (data.quickActions) {
                tab.appendChild(renderSection('QuickActionsGrid', data.quickActions));
            }
            
            if (data.recentActivity) {
                tab.appendChild(renderSection('RecentActivityCard', data.recentActivity));
            }
            
            return tab;
        }
    };

    // Core rendering function with microcopy support
    function renderSection(componentName, dataObject) {
        // Validate component exists
        if (!window.RubiComponentRegistry) {
            console.error('[Rubi Renderer] RubiComponentRegistry not loaded');
            return document.createElement('div');
        }
        
        const componentDef = window.RubiComponentRegistry.getComponent(componentName);
        if (!componentDef) {
            console.warn('[Rubi Renderer] Component not found:', componentName);
            return document.createElement('div');
        }
        
        // Apply microcopy to data
        let enhancedData = dataObject || {};
        if (window.RubiMicrocopy) {
            enhancedData = applyMicrocopyToComponentData(componentName, enhancedData);
        }
        
        // Validate props
        if (!window.RubiComponentRegistry.validateProps(componentName, enhancedData)) {
            console.warn('[Rubi Renderer] Invalid props for', componentName);
        }
        
        // Get renderer
        const renderer = componentRenderers[componentName];
        if (!renderer) {
            console.warn('[Rubi Renderer] No renderer for', componentName);
            const fallback = document.createElement('div');
            fallback.className = componentDef.cssClass;
            fallback.setAttribute('data-component', componentName);
            fallback.textContent = '[' + componentName + ']';
            return fallback;
        }
        
        // Render component
        const element = renderer(enhancedData);
        
        // Add fade-in animation
        element.style.opacity = '0';
        element.style.animation = 'fadeIn 0.3s ease-in forwards';
        
        return element;
    }

    // Render multiple children
    function renderChildren(componentName, arrayOfData) {
        const fragment = document.createDocumentFragment();
        
        if (!Array.isArray(arrayOfData)) {
            console.warn('[Rubi Renderer] renderChildren expects an array');
            return fragment;
        }
        
        arrayOfData.forEach(data => {
            const child = renderSection(componentName, data);
            fragment.appendChild(child);
        });
        
        return fragment;
    }

    // Apply layout template with microcopy
    function applyLayoutTemplate(templateObject, payload) {
        if (!templateObject || !templateObject.sections) {
            console.error('[Rubi Renderer] Invalid template object');
            return document.createElement('div');
        }
        
        const container = document.createElement('div');
        container.className = 'rubi-layout-container';
        container.setAttribute('data-layout', templateObject.name || 'default');
        
        // Process each section
        templateObject.sections.forEach((section, index) => {
            const sectionData = extractSectionData(section, payload);
            
            if (sectionData !== null) {
                const element = renderSection(section.component, sectionData);
                
                // Add staggered animation
                if (element) {
                    element.style.animationDelay = (index * 50) + 'ms';
                    container.appendChild(element);
                }
            }
        });
        
        return container;
    }

    // Extract data for a section from payload
    function extractSectionData(section, payload) {
        if (!section.dataKey) {
            return section.staticData || {};
        }
        
        // Navigate nested keys (e.g., "user.profile.name")
        const keys = section.dataKey.split('.');
        let data = payload;
        
        for (const key of keys) {
            if (data && typeof data === 'object' && key in data) {
                data = data[key];
            } else {
                // Use default data if path not found
                return section.defaultData || null;
            }
        }
        
        // Merge with static data if provided
        if (section.staticData) {
            data = Object.assign({}, section.staticData, data);
        }
        
        return data;
    }

    // Export to global namespace
    window.RubiComponentRenderer = {
        renderSection: renderSection,
        renderChildren: renderChildren,
        applyLayoutTemplate: applyLayoutTemplate,
        
        // Utility functions
        clearContainer: function(container) {
            while (container.firstChild) {
                container.removeChild(container.firstChild);
            }
        },
        
        updateSection: function(container, componentName, data) {
            const existing = container.querySelector('[data-component="' + componentName + '"]');
            const newElement = renderSection(componentName, data);
            
            if (existing) {
                existing.replaceWith(newElement);
            } else {
                container.appendChild(newElement);
            }
        }
    };

    console.log('[Rubi Renderer] Component Renderer initialized with microcopy support');
})();