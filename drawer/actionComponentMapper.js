// Rubi Action Component Mapper
// Maps action results to component props with microcopy integration
// Manifest V3 Compatible - Global Namespace Pattern

(function() {
    'use strict';

    // Transform experience data into component view model
    async function transformExperienceDataForComponents(experience, payload, actionResults) {
        console.log('[Rubi Mapper] Transforming experience data for components');
        
        if (!experience || !experience.componentBindings) {
            console.warn('[Rubi Mapper] No experience or component bindings provided');
            return {};
        }
        
        // Merge all action results into single data object
        const mergedData = mergeActionResults(actionResults, payload);
        
        // Add semantic enrichments
        mergedData.enrichments = generateSemanticEnrichments(mergedData, payload);
        
        // Load history data if memory store is available
        try {
            if (window.RubiMemoryStore) {
                await window.RubiMemoryStore.initMemoryStore();
                const entityKey = window.RubiMemoryStore.getEntityKey(payload);
                
                if (entityKey) {
                    const historyEntries = await window.RubiMemoryStore.getHistory(entityKey, { limit: 5 });
                    
                    // Transform history entries for UI display
                    mergedData.history = {
                        title: 'Recent Rubi Activity',
                        items: historyEntries.map(entry => ({
                            id: entry.id,
                            title: entry.summary,
                            timestamp: window.RubiMemoryStore.getRelativeTime(entry.timestamp),
                            type: entry.type === 'action' ? 'action' : 'context',
                            icon: entry.type === 'action' ? '✨' : '📊',
                            detail: entry.actionName ? `Action: ${entry.actionName}` : null
                        }))
                    };
                    
                    console.log('[Rubi Mapper] Loaded', historyEntries.length, 'history entries for entity:', entityKey);
                } else {
                    mergedData.history = {
                        title: 'Recent Rubi Activity',
                        items: []
                    };
                }
            }
        } catch (error) {
            console.warn('[Rubi Mapper] Failed to load history:', error);
            mergedData.history = {
                title: 'Recent Rubi Activity',
                items: []
            };
        }
        
        // Build component props for each binding
        const viewModel = {};
        
        Object.entries(experience.componentBindings).forEach(([componentName, binding]) => {
            try {
                const props = buildComponentPropsFromBinding(binding, mergedData, payload, componentName);
                if (props && Object.keys(props).length > 0) {
                    viewModel[componentName] = props;
                }
            } catch (error) {
                console.error('[Rubi Mapper] Error mapping component', componentName, error);
            }
        });
        
        console.log('[Rubi Mapper] Generated view model for', Object.keys(viewModel).length, 'components');
        return viewModel;
    }

    // Generate semantic enrichments based on context
    function generateSemanticEnrichments(data, payload) {
        const enrichments = {
            insights: [],
            risks: [],
            actions: [],
            coaching: []
        };
        
        // Add memory-based enrichments if history exists
        if (data.history && data.history.items && data.history.items.length > 0) {
            const recentActions = data.history.items.filter(item => item.type === 'action');
            const recentContexts = data.history.items.filter(item => item.type === 'context');
            
            if (recentActions.length >= 3) {
                enrichments.insights.push({
                    text: `You've analyzed this ${recentActions.length} times recently`,
                    type: 'frequency',
                    confidence: 'high'
                });
            }
            
            if (recentContexts.length > 0) {
                const lastContext = recentContexts[0];
                enrichments.insights.push({
                    text: `Last visited: ${lastContext.timestamp}`,
                    type: 'recency',
                    confidence: 'high'
                });
            }
        }
        
        // Platform-specific enrichments
        if (payload.platform === 'linkedin' && payload.pageType === 'profile') {
            const profile = data.profile || payload.fields;
            
            if (profile && profile.headline) {
                const headline = (profile.headline || '').toLowerCase();
                
                // Technology focus enrichments
                if (headline.includes('cloud') || headline.includes('devops')) {
                    enrichments.insights.push({
                        text: window.RubiMicrocopy.getLabel('SEMANTIC_CLOUD_TRANSFORMATION'),
                        type: 'technology',
                        confidence: 'high'
                    });
                    enrichments.coaching.push({
                        text: window.RubiMicrocopy.getLabel('COACH_VALUE_PROP'),
                        focus: 'cloud scalability'
                    });
                }
                
                if (headline.includes('security') || headline.includes('ciso') || headline.includes('infosec')) {
                    enrichments.insights.push({
                        text: window.RubiMicrocopy.getLabel('SEMANTIC_SECURITY_PRIORITY'),
                        type: 'priority',
                        confidence: 'high'
                    });
                    enrichments.actions.push({
                        text: window.RubiMicrocopy.getLabel('ACTION_DEMO_SPECIFIC_FEATURE'),
                        context: 'security features'
                    });
                }
                
                if (headline.includes('ai') || headline.includes('ml') || headline.includes('data science')) {
                    enrichments.insights.push({
                        text: window.RubiMicrocopy.getLabel('SEMANTIC_AI_ADOPTION'),
                        type: 'innovation',
                        confidence: 'medium'
                    });
                }
                
                // Authority level enrichments
                if (headline.includes('vp') || headline.includes('director') || headline.includes('head of') || headline.includes('chief')) {
                    enrichments.insights.push({
                        text: window.RubiMicrocopy.getLabel('LINKEDIN_DECISION_AUTHORITY'),
                        type: 'stakeholder',
                        confidence: 'high'
                    });
                    enrichments.actions.push({
                        text: window.RubiMicrocopy.getLabel('ACTION_SCHEDULE_EXECUTIVE_MEETING')
                    });
                }
                
                if (headline.includes('manager') || headline.includes('lead')) {
                    enrichments.insights.push({
                        text: window.RubiMicrocopy.getLabel('LINKEDIN_TECHNICAL_BACKGROUND'),
                        type: 'stakeholder',
                        confidence: 'medium'
                    });
                }
            }
            
            if (profile && profile.about) {
                const about = (profile.about || '').toLowerCase();
                
                if (about.includes('scaling') || about.includes('growth') || about.includes('expansion')) {
                    enrichments.insights.push({
                        text: window.RubiMicrocopy.getLabel('SEMANTIC_SCALING_CHALLENGE'),
                        type: 'opportunity',
                        confidence: 'medium'
                    });
                    enrichments.coaching.push({
                        text: window.RubiMicrocopy.getLabel('COACH_DEMONSTRATE_ROI'),
                        focus: 'scalability ROI'
                    });
                }
                
                if (about.includes('hiring') || about.includes('team') || about.includes('talent')) {
                    enrichments.insights.push({
                        text: window.RubiMicrocopy.getLabel('LINKEDIN_GROWTH_FOCUSED'),
                        type: 'opportunity',
                        confidence: 'medium'
                    });
                }
                
                if (about.includes('transform') || about.includes('innovation') || about.includes('moderniz')) {
                    enrichments.insights.push({
                        text: window.RubiMicrocopy.getLabel('SEMANTIC_INNOVATION_DRIVER'),
                        type: 'alignment',
                        confidence: 'high'
                    });
                }
            }
        }
        
        // Gmail enrichments
        if (payload.platform === 'gmail') {
            const emailBody = payload.fields?.body || data.emailContent;
            
            if (emailBody) {
                const bodyLength = emailBody.length;
                
                if (bodyLength < 50) {
                    enrichments.coaching.push({
                        text: window.RubiMicrocopy.getLabel('EMAIL_BRIEF_EXPAND'),
                        severity: 'medium'
                    });
                }
                
                if (bodyLength > 500) {
                    enrichments.coaching.push({
                        text: window.RubiMicrocopy.getLabel('EMAIL_LENGTHY_CONDENSE'),
                        severity: 'low'
                    });
                }
                
                if (!emailBody.includes('?')) {
                    enrichments.coaching.push({
                        text: window.RubiMicrocopy.getLabel('EMAIL_NO_CTA'),
                        severity: 'high'
                    });
                }
                
                // Check for value proposition
                const hasValueWords = ['benefit', 'value', 'impact', 'result', 'outcome', 'improve', 'increase', 'reduce'].some(word => 
                    emailBody.toLowerCase().includes(word)
                );
                
                if (!hasValueWords) {
                    enrichments.coaching.push({
                        text: window.RubiMicrocopy.getLabel('EMAIL_VALUE_MISSING'),
                        severity: 'high'
                    });
                }
            }
        }
        
        // Salesforce opportunity enrichments
        if (payload.platform === 'salesforce' && payload.pageType === 'opportunity') {
            const opp = data.opportunity || payload.fields;
            
            if (opp) {
                // Stage-based enrichments
                const stage = (opp.stage || '').toLowerCase();
                
                if (stage.includes('qualification') || stage.includes('discovery') || stage.includes('prospecting')) {
                    enrichments.insights.push({
                        text: window.RubiMicrocopy.getLabel('STAGE_EARLY_VALIDATION'),
                        type: 'guidance'
                    });
                    enrichments.actions.push({
                        text: window.RubiMicrocopy.getLabel('ACTION_IDENTIFY_CHAMPION')
                    });
                }
                
                if (stage.includes('proposal') || stage.includes('evaluation') || stage.includes('solution')) {
                    enrichments.insights.push({
                        text: window.RubiMicrocopy.getLabel('STAGE_MID_MULTITHREADING'),
                        type: 'guidance'
                    });
                    enrichments.coaching.push({
                        text: window.RubiMicrocopy.getLabel('COACH_MULTI_THREAD')
                    });
                }
                
                if (stage.includes('negotiation') || stage.includes('closing')) {
                    enrichments.insights.push({
                        text: window.RubiMicrocopy.getLabel('STAGE_NEGOTIATION_PREP'),
                        type: 'guidance'
                    });
                    enrichments.actions.push({
                        text: window.RubiMicrocopy.getLabel('ACTION_PROVIDE_REFERENCES')
                    });
                }
                
                // Risk analysis
                if (!opp.decisionMaker && opp.amount > 50000) {
                    enrichments.risks.push({
                        text: window.RubiMicrocopy.getMessageVariant('RISK_NO_DECISION_MAKER', 'long', {severity: 'high'}),
                        severity: 'high',
                        type: 'stakeholder'
                    });
                    enrichments.actions.push({
                        text: window.RubiMicrocopy.getMessageVariant('ACTION_ENGAGE_DECISION_MAKER', 'medium'),
                        priority: 'high'
                    });
                }
                
                if (opp.daysInStage > 30) {
                    enrichments.risks.push({
                        text: window.RubiMicrocopy.getLabel('RISK_STALLED_MOMENTUM'),
                        severity: 'medium',
                        type: 'momentum'
                    });
                    enrichments.coaching.push({
                        text: window.RubiMicrocopy.getLabel('COACH_CREATE_URGENCY')
                    });
                }
                
                if (opp.competitors && opp.competitors.length > 0) {
                    enrichments.risks.push({
                        text: window.RubiMicrocopy.getLabel('RISK_COMPETITOR_ACTIVE'),
                        severity: 'medium',
                        type: 'competitive'
                    });
                    enrichments.actions.push({
                        text: window.RubiMicrocopy.getLabel('ACTION_REVIEW_COMPETITIVE')
                    });
                    enrichments.coaching.push({
                        text: window.RubiMicrocopy.getLabel('COACH_COMPETITIVE_DIFFERENTIATE')
                    });
                }
                
                // Positive signals
                if (opp.engagementScore > 7) {
                    enrichments.insights.push({
                        text: window.RubiMicrocopy.getMessageVariant('INSIGHT_HIGH_ENGAGEMENT', 'medium'),
                        type: 'positive',
                        confidence: 'high'
                    });
                }
                
                if (opp.champion && opp.champion.name) {
                    enrichments.insights.push({
                        text: window.RubiMicrocopy.getLabel('INSIGHT_CHAMPION_ACTIVE'),
                        type: 'positive',
                        confidence: 'high'
                    });
                }
                
                if (opp.budgetConfirmed) {
                    enrichments.insights.push({
                        text: window.RubiMicrocopy.getLabel('INSIGHT_BUDGET_CONFIRMED'),
                        type: 'positive',
                        confidence: 'high'
                    });
                }
            }
        }
        
        console.log('[Rubi Semantic] Generated enrichments:', enrichments);
        return enrichments;
    }

    // Merge action results into single data object
    function mergeActionResults(actionResults, payload) {
        const merged = {
            // Include original context
            context: payload,
            
            // Platform and page info
            platform: payload?.platform,
            pageType: payload?.pageType,
            fields: payload?.fields || {}
        };
        
        // Merge each action result
        if (Array.isArray(actionResults)) {
            actionResults.forEach(result => {
                if (result && result.stubData) {
                    // Merge stub data directly into root (local stubs)
                    Object.assign(merged, result.stubData);
                }
                if (result && result.data) {
                    // Merge data from backend response
                    Object.assign(merged, result.data);
                }
            });
        }
        
        return merged;
    }

    // Build component props from binding configuration with microcopy
    function buildComponentPropsFromBinding(binding, data, payload, componentName) {
        let props = {};
        
        // Add static props first
        if (binding.staticProps) {
            // Replace static text with microcopy where applicable
            const enhancedStaticProps = {};
            Object.entries(binding.staticProps).forEach(([key, value]) => {
                if (typeof value === 'string' && value.startsWith('MICROCOPY:')) {
                    const microcopyKey = value.replace('MICROCOPY:', '');
                    enhancedStaticProps[key] = window.RubiMicrocopy.getLabel(microcopyKey, value);
                } else {
                    enhancedStaticProps[key] = value;
                }
            });
            Object.assign(props, enhancedStaticProps);
        }
        
        // Process each binding path
        Object.entries(binding).forEach(([key, value]) => {
            if (key === 'staticProps') return;
            
            if (key.endsWith('Path')) {
                const propName = key.replace('Path', '');
                const extractedValue = extractValueByPath(data, value);
                
                if (extractedValue !== undefined) {
                    // Check for transform function
                    const transformKey = 'transform' + capitalize(propName);
                    if (binding[transformKey]) {
                        props[propName] = applyTransform(binding[transformKey], extractedValue, data);
                    } else {
                        props[propName] = extractedValue;
                    }
                }
            } else if (key === 'from') {
                // Direct mapping from a data key
                const sourceData = data[value];
                if (sourceData !== undefined) {
                    if (typeof sourceData === 'object' && !Array.isArray(sourceData)) {
                        Object.assign(props, sourceData);
                    } else {
                        props.data = sourceData;
                    }
                }
            }
        });
        
        // Apply microcopy to component props
        props = applyMicrocopyToProps(props, binding, data);
        
        // Special handling for specific component types
        props = applyComponentSpecificTransforms(binding, props, data, payload, componentName);
        
        return props;
    }

    // Apply microcopy to component props
    function applyMicrocopyToProps(props, binding, data) {
        const enhancedProps = {...props};
        
        // Replace title with microcopy if available
        if (props.title && !props.titleFromData) {
            const microcopyKey = 'SECTION_' + (props.title || '').toUpperCase().replace(/\s+/g, '_');
            if (window.RubiMicrocopy.STRINGS[microcopyKey]) {
                enhancedProps.title = window.RubiMicrocopy.getLabel(microcopyKey, props.title);
            }
        }
        
        // Replace button labels
        if (props.buttonLabel) {
            const buttonKey = 'BTN_' + (props.buttonLabel || '').toUpperCase().replace(/\s+/g, '_');
            if (window.RubiMicrocopy.STRINGS[buttonKey]) {
                enhancedProps.buttonLabel = window.RubiMicrocopy.getLabel(buttonKey, props.buttonLabel);
            }
        }
        
        // Replace empty state messages
        if (props.emptyMessage) {
            const emptyKey = 'EMPTY_' + (props.emptyMessage || '').toUpperCase().replace(/\s+/g, '_');
            if (window.RubiMicrocopy.STRINGS[emptyKey]) {
                enhancedProps.emptyMessage = window.RubiMicrocopy.getLabel(emptyKey, props.emptyMessage);
            }
        }
        
        // Add enrichments if available
        if (data.enrichments) {
            if (data.enrichments.insights && data.enrichments.insights.length > 0 && !props.insights) {
                enhancedProps.insights = data.enrichments.insights;
            }
            if (data.enrichments.risks && data.enrichments.risks.length > 0 && !props.risks) {
                enhancedProps.risks = data.enrichments.risks;
            }
            if (data.enrichments.actions && data.enrichments.actions.length > 0 && !props.recommendedActions) {
                enhancedProps.recommendedActions = data.enrichments.actions;
            }
            if (data.enrichments.coaching && data.enrichments.coaching.length > 0 && !props.coachingTips) {
                enhancedProps.coachingTips = data.enrichments.coaching;
            }
        }
        
        return enhancedProps;
    }

    // Apply component-specific transformations with microcopy
    function applyComponentSpecificTransforms(binding, props, data, payload, componentName) {
        // Handle MessageAnalysisCard scores transformation
        if (props.scores && !Array.isArray(props.scores)) {
            props.scores = transformScoresToArray(props.scores);
        }
        
        // Handle AISuggestionsCard suggestions transformation with microcopy
        if (props.suggestions && Array.isArray(props.suggestions)) {
            props.suggestions = props.suggestions.map(suggestion => ({
                text: suggestion.preview || suggestion.text || suggestion.title,
                confidence: suggestion.confidence || window.RubiMicrocopy.getLabel('AI_CONFIDENCE_MEDIUM'),
                type: suggestion.type,
                onClick: suggestion.onClick || function() {
                    console.log('[Rubi Mapper] Suggestion clicked:', suggestion.id);
                }
            }));
        }
        
        // Handle QuickActionsGrid actions with microcopy
        if (props.actions && Array.isArray(props.actions)) {
            props.actions = props.actions.map(action => {
                const actionKey = 'ACTION_' + (action.label || '').toUpperCase().replace(/\s+/g, '_');
                const label = window.RubiMicrocopy.STRINGS[actionKey] 
                    ? window.RubiMicrocopy.getLabel(actionKey) 
                    : action.label;
                
                return {
                    label: label,
                    icon: action.icon || '▶',
                    badge: action.badge,
                    action: function() {
                        console.log('[Rubi Mapper] Quick action triggered:', action.action);
                        if (window.RubiActionsRouter) {
                            window.RubiActionsRouter.runAction(action.action, payload);
                        }
                    }
                };
            });
        }
        
        // Handle NextBestActionsCard actions with microcopy
        if (props.actions && binding.actionsPath === 'nextActions') {
            props.actions = props.actions.map(action => {
                const actionKey = 'ACTION_' + (action.label || '').toUpperCase().replace(/\s+/g, '_');
                const label = window.RubiMicrocopy.STRINGS[actionKey] 
                    ? window.RubiMicrocopy.getLabel(actionKey) 
                    : action.label;
                
                return {
                    action: label,
                    reason: action.reason || window.RubiMicrocopy.getLabel('AI_RECOMMENDS'),
                    priority: action.priority,
                    onClick: function() {
                        console.log('[Rubi Mapper] Next action triggered:', action.id);
                    }
                };
            });
        }
        
        // Handle DealHealthCard metrics with microcopy
        if (props.metrics && Array.isArray(props.metrics) && binding.transformMetrics) {
            props.metrics = props.metrics.map(item => {
                const metricKey = 'FIELD_' + (item.metric || item.label || '').toUpperCase().replace(/\s+/g, '_');
                const label = window.RubiMicrocopy.STRINGS[metricKey] 
                    ? window.RubiMicrocopy.getLabel(metricKey) 
                    : (item.metric || item.label);
                
                return {
                    metric: label,
                    value: item.value || item.detail,
                    status: item.status,
                    trend: item.trend
                };
            });
        }
        
        // Handle EmailContextCard with microcopy
        if (binding.recipientPath || binding.subjectPath) {
            if (!props.subject && payload?.fields?.subject) {
                props.subject = payload.fields.subject;
            }
            if (!props.recipients && payload?.fields?.recipients) {
                props.recipients = payload.fields.recipients;
            }
            if (!props.title) {
                props.title = window.RubiMicrocopy.getLabel('SECTION_EMAIL_INSIGHTS');
            }
        }
        
        // Handle HistoryCard with microcopy
        if (componentName === 'HistoryCard') {
            if (!props.title) {
                props.title = window.RubiMicrocopy.getLabel('HISTORY_TITLE');
            }
            
            // Set empty state message based on platform/pageType
            if (!props.emptyStateMessage || props.emptyStateMessage === 'No recent activity') {
                const platform = payload?.platform || 'generic';
                const pageType = payload?.pageType || 'default';
                
                if (platform === 'linkedin' && pageType === 'profile') {
                    props.emptyStateMessage = window.RubiMicrocopy.getLabel('HISTORY_EMPTY_CONTACT');
                } else if (platform === 'salesforce' && pageType === 'opportunity') {
                    props.emptyStateMessage = window.RubiMicrocopy.getLabel('HISTORY_EMPTY_OPPORTUNITY');
                } else if (platform === 'gmail') {
                    props.emptyStateMessage = window.RubiMicrocopy.getLabel('HISTORY_EMPTY_EMAIL');
                } else {
                    props.emptyStateMessage = window.RubiMicrocopy.getLabel('HISTORY_EMPTY_PAGE');
                }
            }
            
            // Transform history items with microcopy
            if (props.items && Array.isArray(props.items)) {
                props.items = props.items.map(item => ({
                    ...item,
                    typeLabel: item.type === 'action' 
                        ? window.RubiMicrocopy.getLabel('HISTORY_AI_ANALYSIS_RUN')
                        : window.RubiMicrocopy.getLabel('HISTORY_CONTEXT_CAPTURED')
                }));
            }
        }
        
        // Add tooltips from microcopy where appropriate
        if (props.title && !props.tooltip) {
            const tooltipKey = 'TOOLTIP_' + (props.title || '').toUpperCase().replace(/\s+/g, '_');
            if (window.RubiMicrocopy.STRINGS[tooltipKey]) {
                props.tooltip = window.RubiMicrocopy.getLabel(tooltipKey);
            }
        }
        
        return props;
    }

    // Extract value from object using dot-notation path
    function extractValueByPath(obj, path) {
        if (!path || !obj) return undefined;
        
        const parts = path.split('.');
        let value = obj;
        
        for (const part of parts) {
            if (value === null || value === undefined) {
                return undefined;
            }
            
            // Handle array length
            if (part === 'length' && Array.isArray(value)) {
                return value.length;
            }
            
            value = value[part];
        }
        
        return value;
    }

    // Apply named transform function
    function applyTransform(transformName, value, fullData) {
        // Check if RubiExperienceConfigs has the transform
        if (window.RubiExperienceConfigs && window.RubiExperienceConfigs.applyTransform) {
            return window.RubiExperienceConfigs.applyTransform(transformName, value);
        }
        
        // Local transforms
        const transforms = {
            scoresToProgressBars: transformScoresToArray,
            talkingPointsToAnalysisItems: transformTalkingPointsToItems,
            healthItemsToMetrics: transformHealthItemsToMetrics,
            summaryToRows: transformSummaryToRows
        };
        
        const transform = transforms[transformName];
        if (transform) {
            return transform(value, fullData);
        }
        
        return value;
    }

    // Transform scores object to array format with microcopy
    function transformScoresToArray(scores) {
        if (!scores || typeof scores !== 'object') return [];
        
        return Object.entries(scores).map(([key, value]) => {
            const labelKey = 'FIELD_' + key.toUpperCase();
            const label = window.RubiMicrocopy.STRINGS[labelKey] 
                ? window.RubiMicrocopy.getLabel(labelKey)
                : formatLabel(key);
            
            return {
                label: label,
                score: value,
                maxScore: 10,
                color: value >= 7 ? '#4CAF50' : value >= 4 ? '#FFC107' : '#F44336'
            };
        });
    }

    // Transform talking points to analysis items with microcopy
    function transformTalkingPointsToItems(points) {
        if (!Array.isArray(points)) return [];
        
        return points.map((point, index) => ({
            label: window.RubiMicrocopy.getLabel('AI_IDENTIFIES') + ' ' + (index + 1),
            value: point,
            icon: '💡',
            severity: 'info'
        }));
    }

    // Transform health items to metrics with microcopy
    function transformHealthItemsToMetrics(items) {
        if (!Array.isArray(items)) return [];
        
        return items.map(item => {
            const metricKey = 'FIELD_' + (item.label || '').toUpperCase().replace(/\s+/g, '_');
            const label = window.RubiMicrocopy.STRINGS[metricKey]
                ? window.RubiMicrocopy.getLabel(metricKey)
                : item.label;
            
            return {
                metric: label,
                value: item.detail || item.status,
                status: item.status,
                trend: item.trend
            };
        });
    }

    // Transform summary object to rows with microcopy
    function transformSummaryToRows(summary) {
        if (!summary || typeof summary !== 'object') return [];
        
        const rows = [];
        
        if (summary.amount !== undefined) {
            rows.push({
                label: window.RubiMicrocopy.getLabel('FIELD_DEAL_SIZE'),
                value: formatCurrency(summary.amount),
                highlight: true
            });
        }
        
        if (summary.closeDate) {
            rows.push({
                label: window.RubiMicrocopy.getLabel('FIELD_CLOSE_DATE'),
                value: formatDate(summary.closeDate)
            });
        }
        
        if (summary.stage) {
            rows.push({
                label: window.RubiMicrocopy.getLabel('FIELD_STAGE'),
                value: summary.stage
            });
        }
        
        if (summary.account || summary.accountName) {
            rows.push({
                label: window.RubiMicrocopy.getLabel('FIELD_ACCOUNT_NAME'),
                value: summary.account || summary.accountName
            });
        }
        
        if (summary.owner) {
            rows.push({
                label: window.RubiMicrocopy.getLabel('FIELD_OWNER'),
                value: summary.owner
            });
        }
        
        return rows;
    }

    // Helper functions
    function capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    function formatLabel(key) {
        return key.charAt(0).toUpperCase() + 
               key.slice(1).replace(/([A-Z])/g, ' $1')
                          .replace(/_/g, ' ')
                          .trim();
    }

    function formatCurrency(value) {
        if (typeof value === 'number') {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }).format(value);
        }
        return value;
    }

    function formatDate(dateStr) {
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
        } catch (e) {
            return dateStr;
        }
    }

    // Create fallback view model for error cases with microcopy
    function createFallbackViewModel(payload) {
        return {
            DrawerHeader: {
                title: window.RubiMicrocopy.getLabel('GENERIC_LOADING'),
                subtitle: window.RubiMicrocopy.getLabel('EMPTY_NO_INSIGHTS'),
                showRefresh: true
            },
            InsightCard: {
                title: window.RubiMicrocopy.getLabel('GENERIC_INFO'),
                content: window.RubiMicrocopy.getLabel('EMPTY_NO_INSIGHTS'),
                icon: '⏳'
            }
        };
    }

    // Validate view model has required components with microcopy
    function validateViewModel(viewModel, experience) {
        // Ensure we have at least a header
        if (!viewModel.DrawerHeader) {
            viewModel.DrawerHeader = {
                title: experience?.label || window.RubiMicrocopy.getLabel('SECTION_OPPORTUNITY_OVERVIEW'),
                showRefresh: true
            };
        }
        
        // Ensure all empty states have microcopy
        Object.values(viewModel).forEach(component => {
            if (component.emptyMessage === 'No data available' || !component.emptyMessage) {
                const emptyKey = 'EMPTY_NO_' + (component.dataType || 'DATA').toUpperCase();
                if (window.RubiMicrocopy.STRINGS[emptyKey]) {
                    component.emptyMessage = window.RubiMicrocopy.getLabel(emptyKey);
                }
            }
        });
        
        return viewModel;
    }

    // Export to global namespace
    window.RubiActionComponentMapper = {
        transformExperienceDataForComponents,
        mergeActionResults,
        buildComponentPropsFromBinding,
        extractValueByPath,
        applyTransform,
        createFallbackViewModel,
        validateViewModel,
        generateSemanticEnrichments,
        applyMicrocopyToProps,
        
        // Export transforms for external use
        transforms: {
            scoresToArray: transformScoresToArray,
            talkingPointsToItems: transformTalkingPointsToItems,
            healthItemsToMetrics: transformHealthItemsToMetrics,
            summaryToRows: transformSummaryToRows
        }
    };

    console.log('[Rubi Mapper] Action Component Mapper initialized with microcopy integration');
})();