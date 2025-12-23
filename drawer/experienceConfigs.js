/**
 * Rubi Experience Configurations
 * Defines experience blueprints that map platform/pageType combinations
 * to default actions, layouts, and component data bindings
 * Manifest V3 Compatible - Global Namespace Pattern
 */

(function() {
    'use strict';

    // Experience blueprint definitions
    const EXPERIENCES = {
        // LinkedIn Prospect Research Experience
        'linkedin.profile_prospect_research': {
            id: 'linkedin.profile_prospect_research',
            platform: 'linkedin',
            pageType: 'profile',
            label: 'LinkedIn Prospect Research',
            defaultActions: ['summarize_linkedin_profile'],
            layoutId: 'linkedin.profile',
            componentBindings: {
                DrawerHeader: {
                    titlePath: 'meta.title',
                    subtitlePath: 'meta.subtitle',
                    staticProps: {
                        showRefresh: true
                    }
                },
                EmailContextCard: {
                    recipientPath: 'profile.fullName',
                    emailPath: 'profile.email',
                    companyPath: 'profile.company'
                },
                UserMessageCard: {
                    titlePath: 'messageCard.title',
                    contentPath: 'messageCard.content',
                    placeholderPath: 'messageCard.placeholder',
                    staticProps: {
                        title: 'Draft Message'
                    }
                },
                MessageAnalysisCard: {
                    titlePath: 'analysisCard.title',
                    itemsPath: 'talkingPoints',
                    transformItems: 'talkingPointsToAnalysisItems',
                    staticProps: {
                        title: 'Key Talking Points'
                    }
                },
                AISuggestionsCard: {
                    titlePath: 'suggestionsCard.title',
                    suggestionsPath: 'engagementIdeas',
                    countPath: 'engagementIdeas.length',
                    staticProps: {
                        title: 'Engagement Ideas',
                        footerButton: {
                            label: 'Generate More',
                            icon: '✨'
                        }
                    }
                },
                QuickActionsGrid: {
                    actionsPath: 'quickActions',
                    staticProps: {
                        columns: 2
                    }
                },
                HistoryCard: {
                    titlePath: 'history.title',
                    itemsPath: 'history.items',
                    staticProps: {
                        title: 'Recent Rubi Activity',
                        emptyStateMessage: 'No recent activity for this contact'
                    }
                },
                DrawerFooterButton: {
                    labelPath: 'footerButton.label',
                    hrefPath: 'footerButton.href',
                    staticProps: {
                        label: 'Open Full Analysis in SuccessLAB',
                        variant: 'primary',
                        icon: '📊'
                    }
                }
            }
        },

        // Salesforce Opportunity Review Experience
        'salesforce.opportunity_review': {
            id: 'salesforce.opportunity_review',
            platform: 'salesforce',
            pageType: 'opportunity',
            label: 'Salesforce Opportunity Review & Meeting Prep',
            defaultActions: ['analyze_opportunity_risk'],
            layoutId: 'salesforce.opportunity',
            componentBindings: {
                DrawerHeader: {
                    titlePath: 'meta.title',
                    subtitlePath: 'meta.subtitle',
                    staticProps: {
                        title: 'Opportunity Review & Meeting Prep',
                        showRefresh: true
                    }
                },
                OpportunitySummaryCard: {
                    titlePath: 'summary.dealName',
                    stagePath: 'summary.stage',
                    rowsPath: 'summary.rows',
                    transformRows: 'summaryToRows'
                },
                DealHealthCard: {
                    titlePath: 'dealHealthCard.title',
                    overallScorePath: 'dealHealthCard.overallScore',
                    metricsPath: 'dealHealthItems',
                    transformMetrics: 'healthItemsToMetrics',
                    staticProps: {
                        title: 'Deal Health'
                    }
                },
                NextBestActionsCard: {
                    titlePath: 'nextActionsCard.title',
                    actionsPath: 'nextActions',
                    staticProps: {
                        title: 'Recommended Actions'
                    }
                },
                InsightCard: {
                    titlePath: 'patternInsight.title',
                    contentPath: 'patternInsight.message',
                    iconPath: 'patternInsight.icon',
                    staticProps: {
                        icon: '🤖',
                        timestamp: 'Just now'
                    }
                },
                NotificationsCard: {
                    notificationsPath: 'alerts',
                    countPath: 'alerts.length',
                    staticProps: {
                        title: 'Risk Alerts'
                    }
                },
                HistoryCard: {
                    titlePath: 'history.title',
                    itemsPath: 'history.items',
                    staticProps: {
                        title: 'Recent Rubi Activity',
                        emptyStateMessage: 'No recent activity for this opportunity'
                    }
                },
                DrawerFooterButton: {
                    labelPath: 'footerButton.label',
                    actionPath: 'footerButton.action',
                    staticProps: {
                        label: 'Update Opportunity',
                        variant: 'primary',
                        icon: '📈'
                    }
                }
            }
        },

        // Gmail Message Coaching Experience
        'gmail.message_coaching': {
            id: 'gmail.message_coaching',
            platform: 'gmail',
            pageType: 'compose',
            label: 'Gmail Message Coaching',
            defaultActions: ['analyze_email_message'],
            layoutId: 'gmail.compose',
            componentBindings: {
                DrawerHeader: {
                    titlePath: 'meta.title',
                    subtitlePath: 'meta.subtitle',
                    staticProps: {
                        title: 'Message Coaching',
                        showRefresh: true
                    }
                },
                EmailContextCard: {
                    subjectPath: 'emailContext.subject',
                    senderPath: 'emailContext.from',
                    recipientsPath: 'emailContext.to',
                    timestampPath: 'emailContext.timestamp'
                },
                UserMessageCard: {
                    titlePath: 'userMessage.title',
                    contentPath: 'userMessage.body',
                    maxLengthPath: 'userMessage.maxLength',
                    staticProps: {
                        title: 'Your Draft',
                        placeholder: 'Start typing your email...'
                    }
                },
                MessageAnalysisCard: {
                    titlePath: 'analysisCard.title',
                    summaryPath: 'analysisCard.summary',
                    itemsPath: 'analysis',
                    scoresPath: 'scores',
                    transformScores: 'scoresToProgressBars',
                    staticProps: {
                        title: 'Message Analysis'
                    }
                },
                AISuggestionsCard: {
                    titlePath: 'suggestionsCard.title',
                    suggestionsPath: 'aiSuggestions',
                    countPath: 'aiSuggestions.length',
                    staticProps: {
                        title: 'AI Suggestions',
                        footerButton: {
                            label: 'Apply Best Suggestion',
                            icon: '✨'
                        }
                    }
                },
                HistoryCard: {
                    titlePath: 'history.title',
                    itemsPath: 'history.items',
                    staticProps: {
                        title: 'Recent Rubi Activity',
                        emptyStateMessage: 'No recent activity for this email thread'
                    }
                },
                DrawerFooterButton: {
                    labelPath: 'footerButton.label',
                    actionPath: 'footerButton.action',
                    staticProps: {
                        label: 'Enhance Email',
                        variant: 'primary',
                        icon: '✨'
                    }
                }
            }
        },

        // Generic Dashboard Experience
        'generic.dashboard': {
            id: 'generic.dashboard',
            platform: 'generic',
            pageType: 'default',
            label: 'Generic Dashboard',
            defaultActions: ['get_dashboard_insights'],
            layoutId: 'generic.default',
            componentBindings: {
                DrawerHeader: {
                    titlePath: 'meta.title',
                    subtitlePath: 'meta.subtitle',
                    staticProps: {
                        title: 'SuccessLAB Dashboard',
                        subtitle: 'AI-powered sales intelligence',
                        showRefresh: true
                    }
                },
                InsightCard: {
                    titlePath: 'welcomeInsight.title',
                    contentPath: 'welcomeInsight.content',
                    iconPath: 'welcomeInsight.icon',
                    staticProps: {
                        title: 'Welcome to Rubi',
                        content: 'Your AI assistant is monitoring for opportunities.',
                        icon: '👋'
                    }
                },
                QuickActionsGrid: {
                    actionsPath: 'quickActions',
                    columnsPath: 'quickActionsColumns',
                    staticProps: {
                        columns: 3
                    }
                },
                RecommendedContentCard: {
                    titlePath: 'recommendedContent.title',
                    itemsPath: 'recommendedContent.items',
                    staticProps: {
                        title: 'Recommended Resources'
                    }
                },
                NotificationsCard: {
                    titlePath: 'notifications.title',
                    notificationsPath: 'notifications.items',
                    countPath: 'notifications.count',
                    staticProps: {
                        title: 'System Updates'
                    }
                },
                RecentActivityCard: {
                    titlePath: 'recentActivity.title',
                    timeRangePath: 'recentActivity.timeRange',
                    activitiesPath: 'recentActivity.activities',
                    staticProps: {
                        title: 'Recent Activity',
                        timeRange: 'Last 7 days'
                    }
                },
                HistoryCard: {
                    titlePath: 'history.title',
                    itemsPath: 'history.items',
                    staticProps: {
                        title: 'Recent Rubi Activity',
                        emptyStateMessage: 'No recent activity on this page'
                    }
                },
                DrawerFooterButton: {
                    labelPath: 'footerButton.label',
                    hrefPath: 'footerButton.href',
                    staticProps: {
                        label: 'Open SuccessLAB',
                        variant: 'primary',
                        icon: '🚀'
                    }
                }
            }
        }
    };

    // Transform function mappings
    const TRANSFORM_FUNCTIONS = {
        // Transform talking points into analysis items
        talkingPointsToAnalysisItems: function(points) {
            if (!Array.isArray(points)) return [];
            return points.map((point, index) => ({
                label: `Point ${index + 1}`,
                value: point,
                icon: '💡',
                severity: 'info'
            }));
        },

        // Transform summary object to rows
        summaryToRows: function(summary) {
            const rows = [];
            if (summary.amount) {
                rows.push({
                    label: 'Deal Value',
                    value: formatCurrency(summary.amount),
                    highlight: true
                });
            }
            if (summary.closeDate) {
                rows.push({
                    label: 'Close Date',
                    value: formatDate(summary.closeDate)
                });
            }
            if (summary.stage) {
                rows.push({
                    label: 'Stage',
                    value: summary.stage
                });
            }
            return rows;
        },

        // Transform health items to metrics
        healthItemsToMetrics: function(items) {
            if (!Array.isArray(items)) return [];
            return items.map(item => ({
                metric: item.label,
                value: item.detail || item.status,
                status: item.status,
                trend: item.trend
            }));
        },

        // Transform scores to progress bars
        scoresToProgressBars: function(scores) {
            if (!scores || typeof scores !== 'object') return [];
            return Object.entries(scores).map(([key, value]) => ({
                label: formatLabel(key),
                score: value,
                maxScore: 10,
                color: getScoreColor(value)
            }));
        }
    };

    // Helper functions
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

    function formatLabel(key) {
        return key.charAt(0).toUpperCase() + 
               key.slice(1).replace(/([A-Z])/g, ' $1').trim();
    }

    function getScoreColor(score) {
        if (score >= 8) return '#4CAF50';
        if (score >= 5) return '#FFC107';
        return '#F44336';
    }

    // Get experience for platform/pageType combination
    function getExperienceFor(platform, pageType) {
        console.log(`[Rubi Experience] Looking up experience for ${platform}.${pageType}`);
        
        // Try specific match first
        const specificKey = `${platform}.${pageType}_${getExperienceVariant(platform, pageType)}`;
        if (EXPERIENCES[specificKey]) {
            console.log(`[Rubi Experience] Found specific experience: ${specificKey}`);
            return EXPERIENCES[specificKey];
        }
        
        // Try base match
        const baseKey = `${platform}.${getBaseExperience(platform, pageType)}`;
        if (EXPERIENCES[baseKey]) {
            console.log(`[Rubi Experience] Found base experience: ${baseKey}`);
            return EXPERIENCES[baseKey];
        }
        
        // Fall back to generic dashboard
        console.log('[Rubi Experience] Falling back to generic dashboard');
        return EXPERIENCES['generic.dashboard'];
    }

    // Determine experience variant based on context
    function getExperienceVariant(platform, pageType) {
        if (platform === 'linkedin' && pageType === 'profile') {
            return 'prospect_research';
        }
        if (platform === 'salesforce' && pageType === 'opportunity') {
            return 'review';
        }
        if (platform === 'gmail' && pageType === 'compose') {
            return 'message_coaching';
        }
        return 'dashboard';
    }

    // Get base experience name
    function getBaseExperience(platform, pageType) {
        const variantMap = {
            'linkedin.profile': 'profile_prospect_research',
            'salesforce.opportunity': 'opportunity_review',
            'gmail.compose': 'message_coaching'
        };
        
        const key = `${platform}.${pageType}`;
        return variantMap[key] || 'dashboard';
    }

    // Apply transforms to data
    function applyTransform(transformName, data) {
        const transform = TRANSFORM_FUNCTIONS[transformName];
        if (!transform) {
            console.warn(`[Rubi Experience] Transform function not found: ${transformName}`);
            return data;
        }
        
        try {
            return transform(data);
        } catch (error) {
            console.error(`[Rubi Experience] Transform error in ${transformName}:`, error);
            return data;
        }
    }

    // Extract value from object using path
    function extractValue(obj, path) {
        if (!path || !obj) return undefined;
        
        const parts = path.split('.');
        let value = obj;
        
        for (const part of parts) {
            if (value === null || value === undefined) {
                return undefined;
            }
            
            // Handle array length special case
            if (part === 'length' && Array.isArray(value)) {
                return value.length;
            }
            
            value = value[part];
        }
        
        return value;
    }

    // Build component props from binding configuration
    function buildComponentProps(binding, data) {
        const props = {};
        
        // Add static props
        if (binding.staticProps) {
            Object.assign(props, binding.staticProps);
        }
        
        // Extract dynamic values
        Object.entries(binding).forEach(([key, value]) => {
            if (key === 'staticProps') return;
            
            if (key.endsWith('Path')) {
                const propName = key.replace('Path', '');
                const extractedValue = extractValue(data, value);
                
                if (extractedValue !== undefined) {
                    // Check for transform
                    const transformKey = `transform${propName.charAt(0).toUpperCase() + propName.slice(1)}`;
                    if (binding[transformKey]) {
                        props[propName] = applyTransform(binding[transformKey], extractedValue);
                    } else {
                        props[propName] = extractedValue;
                    }
                }
            }
        });
        
        return props;
    }

    // Export to global namespace
    window.RubiExperienceConfigs = {
        EXPERIENCES: EXPERIENCES,
        getExperienceFor: getExperienceFor,
        buildComponentProps: buildComponentProps,
        applyTransform: applyTransform,
        extractValue: extractValue,
        
        // Expose helpers for external use
        helpers: {
            formatCurrency: formatCurrency,
            formatDate: formatDate,
            formatLabel: formatLabel,
            getScoreColor: getScoreColor
        }
    };

    console.log('[Rubi Experience] Experience configurations initialized with', 
                Object.keys(EXPERIENCES).length, 'experiences');
})();