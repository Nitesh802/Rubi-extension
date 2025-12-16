/**
 * Rubi Layout Templates
 * Platform-specific layout definitions for drawer UI
 * Manifest V3 Compatible - Global Namespace Pattern
 */

(function() {
    'use strict';

    // Layout template definitions
    const layoutTemplates = {
        // LinkedIn Profile Layout
        'linkedin.profile': {
            name: 'linkedin.profile',
            platform: 'linkedin',
            pageType: 'profile',
            sections: [
                {
                    component: 'DrawerHeader',
                    staticData: {
                        title: 'LinkedIn Profile Assistant',
                        subtitle: 'AI-powered insights',
                        showRefresh: true
                    }
                },
                {
                    component: 'OpportunitySummaryCard',
                    dataKey: 'profile',
                    defaultData: {
                        title: 'Profile Overview',
                        rows: []
                    }
                },
                {
                    component: 'InsightCard',
                    dataKey: 'insights.profile',
                    defaultData: {
                        title: 'Key Insights',
                        content: 'Analyzing profile...',
                        icon: '💡'
                    }
                },
                {
                    component: 'QuickActionsGrid',
                    staticData: {
                        columns: 2,
                        actions: [
                            { label: 'Send Message', icon: '✉️', action: null },
                            { label: 'View Activity', icon: '📊', action: null },
                            { label: 'Save Contact', icon: '💾', action: null },
                            { label: 'Add Note', icon: '📝', action: null }
                        ]
                    }
                },
                {
                    component: 'RecommendedContentCard',
                    dataKey: 'recommendations',
                    defaultData: {
                        title: 'Recommended Actions',
                        items: []
                    }
                },
                {
                    component: 'DrawerFooterButton',
                    staticData: {
                        label: 'Generate Outreach',
                        variant: 'primary',
                        icon: '✨'
                    }
                }
            ]
        },

        // LinkedIn Feed Layout
        'linkedin.feed': {
            name: 'linkedin.feed',
            platform: 'linkedin',
            pageType: 'feed',
            sections: [
                {
                    component: 'DrawerHeader',
                    staticData: {
                        title: 'LinkedIn Feed Assistant',
                        subtitle: 'Content insights',
                        showRefresh: true
                    }
                },
                {
                    component: 'MessageAnalysisCard',
                    dataKey: 'postAnalysis',
                    defaultData: {
                        title: 'Post Analysis',
                        summary: 'Analyzing content...'
                    }
                },
                {
                    component: 'AISuggestionsCard',
                    dataKey: 'suggestions',
                    defaultData: {
                        title: 'Response Suggestions',
                        suggestions: []
                    }
                },
                {
                    component: 'RecentActivityCard',
                    dataKey: 'activity',
                    defaultData: {
                        title: 'Recent Interactions',
                        timeRange: 'Last 7 days',
                        activities: []
                    }
                },
                {
                    component: 'DrawerFooterButton',
                    staticData: {
                        label: 'Generate Response',
                        variant: 'primary',
                        icon: '💬'
                    }
                }
            ]
        },

        // Salesforce Opportunity Layout
        'salesforce.opportunity': {
            name: 'salesforce.opportunity',
            platform: 'salesforce',
            pageType: 'opportunity',
            sections: [
                {
                    component: 'DrawerHeader',
                    staticData: {
                        title: 'Opportunity Assistant',
                        subtitle: 'Deal intelligence',
                        showRefresh: true
                    }
                },
                {
                    component: 'TabbedContentContainer',
                    staticData: {
                        tabs: [
                            { label: 'Overview', active: true },
                            { label: 'Health', active: false },
                            { label: 'Actions', active: false }
                        ]
                    }
                },
                {
                    component: 'OpportunitySummaryCard',
                    dataKey: 'opportunity',
                    defaultData: {
                        title: 'Deal Summary',
                        stage: 'Qualification',
                        rows: []
                    }
                },
                {
                    component: 'DealHealthCard',
                    dataKey: 'health',
                    defaultData: {
                        title: 'Deal Health Score',
                        overallScore: 75,
                        metrics: []
                    }
                },
                {
                    component: 'NextBestActionsCard',
                    dataKey: 'actions',
                    defaultData: {
                        title: 'Recommended Actions',
                        actions: []
                    }
                },
                {
                    component: 'NotificationsCard',
                    dataKey: 'notifications',
                    defaultData: {
                        title: 'Alerts',
                        count: 0,
                        notifications: []
                    }
                },
                {
                    component: 'DrawerFooterButton',
                    staticData: {
                        label: 'Update Opportunity',
                        variant: 'primary',
                        icon: '📈'
                    }
                }
            ]
        },

        // Salesforce Account Layout
        'salesforce.account': {
            name: 'salesforce.account',
            platform: 'salesforce',
            pageType: 'account',
            sections: [
                {
                    component: 'DrawerHeader',
                    staticData: {
                        title: 'Account Assistant',
                        subtitle: 'Customer intelligence',
                        showRefresh: true
                    }
                },
                {
                    component: 'OpportunitySummaryCard',
                    dataKey: 'account',
                    defaultData: {
                        title: 'Account Overview',
                        rows: []
                    }
                },
                {
                    component: 'InsightCard',
                    dataKey: 'insights.account',
                    defaultData: {
                        title: 'Account Insights',
                        content: 'Loading insights...',
                        icon: '🏢'
                    }
                },
                {
                    component: 'RecentActivityCard',
                    dataKey: 'activity',
                    defaultData: {
                        title: 'Account Activity',
                        timeRange: 'Last 30 days',
                        activities: []
                    }
                },
                {
                    component: 'QuickActionsGrid',
                    staticData: {
                        columns: 3,
                        actions: [
                            { label: 'Log Call', icon: '📞', action: null },
                            { label: 'Schedule Meeting', icon: '📅', action: null },
                            { label: 'Send Email', icon: '✉️', action: null },
                            { label: 'Create Task', icon: '✅', action: null },
                            { label: 'Add Note', icon: '📝', action: null },
                            { label: 'View Reports', icon: '📊', action: null }
                        ]
                    }
                },
                {
                    component: 'DrawerFooterButton',
                    staticData: {
                        label: 'Generate Report',
                        variant: 'primary',
                        icon: '📄'
                    }
                }
            ]
        },

        // Gmail Compose Layout
        'gmail.compose': {
            name: 'gmail.compose',
            platform: 'gmail',
            pageType: 'compose',
            sections: [
                {
                    component: 'DrawerHeader',
                    staticData: {
                        title: 'Email Assistant',
                        subtitle: 'Smart composition',
                        showRefresh: true
                    }
                },
                {
                    component: 'EmailContextCard',
                    dataKey: 'emailContext',
                    defaultData: {
                        subject: '',
                        sender: '',
                        recipients: ''
                    }
                },
                {
                    component: 'UserMessageCard',
                    dataKey: 'draft',
                    defaultData: {
                        title: 'Your Message',
                        content: '',
                        placeholder: 'Start typing your email...'
                    }
                },
                {
                    component: 'MessageAnalysisCard',
                    dataKey: 'analysis',
                    defaultData: {
                        title: 'Message Analysis',
                        items: [
                            { label: 'Tone', value: 'Professional' },
                            { label: 'Clarity', value: 'High' },
                            { label: 'Length', value: 'Appropriate' }
                        ],
                        scores: [
                            { label: 'Professionalism', score: 85, maxScore: 100 },
                            { label: 'Engagement', score: 72, maxScore: 100 }
                        ]
                    }
                },
                {
                    component: 'AISuggestionsCard',
                    dataKey: 'suggestions',
                    defaultData: {
                        title: 'AI Suggestions',
                        count: 3,
                        suggestions: [],
                        footerButton: {
                            label: 'View All Suggestions',
                            icon: '→'
                        }
                    }
                },
                {
                    component: 'DrawerFooterButton',
                    staticData: {
                        label: 'Enhance Email',
                        variant: 'primary',
                        icon: '✨'
                    }
                }
            ]
        },

        // Gmail Thread Layout
        'gmail.thread': {
            name: 'gmail.thread',
            platform: 'gmail',
            pageType: 'thread',
            sections: [
                {
                    component: 'DrawerHeader',
                    staticData: {
                        title: 'Thread Assistant',
                        subtitle: 'Conversation insights',
                        showRefresh: true
                    }
                },
                {
                    component: 'EmailContextCard',
                    dataKey: 'threadContext',
                    defaultData: {
                        subject: 'Thread Subject',
                        sender: '',
                        recipients: '',
                        timestamp: ''
                    }
                },
                {
                    component: 'InsightCard',
                    dataKey: 'threadInsights',
                    defaultData: {
                        title: 'Thread Summary',
                        content: 'Analyzing conversation...',
                        icon: '📧'
                    }
                },
                {
                    component: 'MessageAnalysisCard',
                    dataKey: 'sentiment',
                    defaultData: {
                        title: 'Sentiment Analysis',
                        summary: 'Overall tone: Professional',
                        items: []
                    }
                },
                {
                    component: 'NextBestActionsCard',
                    dataKey: 'suggestedActions',
                    defaultData: {
                        title: 'Suggested Responses',
                        actions: [
                            { action: 'Reply with acknowledgment', reason: 'Shows engagement' },
                            { action: 'Schedule follow-up', reason: 'Keep momentum' }
                        ]
                    }
                },
                {
                    component: 'DrawerFooterButton',
                    staticData: {
                        label: 'Generate Reply',
                        variant: 'primary',
                        icon: '↩️'
                    }
                }
            ]
        },

        // Generic Default Layout
        'generic.default': {
            name: 'generic.default',
            platform: 'generic',
            pageType: 'default',
            sections: [
                {
                    component: 'DrawerHeader',
                    staticData: {
                        title: 'Rubi Assistant',
                        subtitle: 'AI-powered helper',
                        showRefresh: true
                    }
                },
                {
                    component: 'InsightCard',
                    staticData: {
                        title: 'Welcome',
                        content: 'Rubi is ready to assist you. Navigate to a supported page to see contextual insights.',
                        icon: '👋'
                    }
                },
                {
                    component: 'QuickActionsGrid',
                    staticData: {
                        columns: 2,
                        actions: [
                            { label: 'Settings', icon: '⚙️', action: null },
                            { label: 'Help', icon: '❓', action: null },
                            { label: 'Feedback', icon: '💬', action: null },
                            { label: 'About', icon: 'ℹ️', action: null }
                        ]
                    }
                },
                {
                    component: 'NotificationsCard',
                    dataKey: 'systemNotifications',
                    defaultData: {
                        title: 'Updates',
                        notifications: [
                            {
                                message: 'Rubi is active and monitoring',
                                timestamp: 'Just now',
                                type: 'info'
                            }
                        ]
                    }
                }
            ]
        }
    };

    // Template selection logic
    function getLayoutFor(platform, pageType) {
        const templateKey = `${platform}.${pageType}`;
        
        // Try exact match first
        if (layoutTemplates[templateKey]) {
            return layoutTemplates[templateKey];
        }
        
        // Try platform default
        const platformDefault = `${platform}.default`;
        if (layoutTemplates[platformDefault]) {
            return layoutTemplates[platformDefault];
        }
        
        // Return generic default
        return layoutTemplates['generic.default'];
    }

    // Dynamic template builder for custom layouts
    function buildCustomLayout(config) {
        return {
            name: config.name || 'custom',
            platform: config.platform || 'generic',
            pageType: config.pageType || 'custom',
            sections: config.sections || []
        };
    }

    // Template validation
    function validateTemplate(template) {
        if (!template || typeof template !== 'object') {
            return false;
        }
        
        if (!Array.isArray(template.sections)) {
            return false;
        }
        
        // Validate each section
        for (const section of template.sections) {
            if (!section.component) {
                return false;
            }
            
            // Check if component exists
            if (window.RubiComponentRegistry && 
                !window.RubiComponentRegistry.validateComponent(section.component)) {
                console.warn(`Template references unknown component: ${section.component}`);
                return false;
            }
        }
        
        return true;
    }

    // Template utilities
    const templateUtils = {
        // Merge two templates
        mergeTemplates: function(base, override) {
            const merged = Object.assign({}, base);
            
            if (override.sections) {
                // Deep merge sections
                merged.sections = [...base.sections];
                
                override.sections.forEach(overrideSection => {
                    const index = merged.sections.findIndex(
                        s => s.component === overrideSection.component
                    );
                    
                    if (index >= 0) {
                        merged.sections[index] = Object.assign(
                            {}, 
                            merged.sections[index], 
                            overrideSection
                        );
                    } else {
                        merged.sections.push(overrideSection);
                    }
                });
            }
            
            return merged;
        },
        
        // Add section to template
        addSection: function(template, section, position) {
            const newTemplate = Object.assign({}, template);
            newTemplate.sections = [...template.sections];
            
            if (position === undefined || position >= newTemplate.sections.length) {
                newTemplate.sections.push(section);
            } else {
                newTemplate.sections.splice(position, 0, section);
            }
            
            return newTemplate;
        },
        
        // Remove section from template
        removeSection: function(template, componentName) {
            const newTemplate = Object.assign({}, template);
            newTemplate.sections = template.sections.filter(
                s => s.component !== componentName
            );
            return newTemplate;
        },
        
        // Get all available templates
        getAllTemplates: function() {
            return Object.keys(layoutTemplates);
        }
    };

    // Export to global namespace
    window.RubiDrawerTemplates = {
        templates: layoutTemplates,
        getLayoutFor: getLayoutFor,
        buildCustomLayout: buildCustomLayout,
        validateTemplate: validateTemplate,
        utils: templateUtils
    };

    console.log('Rubi Layout Templates initialized with', Object.keys(layoutTemplates).length, 'templates');
})();