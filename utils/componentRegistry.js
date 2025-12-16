/**
 * Rubi Component Registry
 * Defines all Figma-based components with metadata and constraints
 * Manifest V3 Compatible - Global Namespace Pattern
 */

(function() {
    'use strict';

    const componentRegistry = {
        // Header Components
        DrawerHeader: {
            componentName: 'DrawerHeader',
            description: 'Main header container with branding and controls',
            allowedChildren: ['DrawerHeaderTitle', 'DrawerHeaderSubtext', 'DrawerHeaderRefreshButton'],
            requiredProps: [],
            optionalProps: ['title', 'subtitle', 'showRefresh'],
            cssClass: 'rubi-drawer-header'
        },
        DrawerHeaderTitle: {
            componentName: 'DrawerHeaderTitle',
            description: 'Primary title text in header',
            allowedChildren: [],
            requiredProps: ['text'],
            optionalProps: ['icon'],
            cssClass: 'rubi-header-title'
        },
        DrawerHeaderSubtext: {
            componentName: 'DrawerHeaderSubtext',
            description: 'Secondary text below header title',
            allowedChildren: [],
            requiredProps: ['text'],
            optionalProps: [],
            cssClass: 'rubi-header-subtext'
        },
        DrawerHeaderRefreshButton: {
            componentName: 'DrawerHeaderRefreshButton',
            description: 'Button to refresh context data',
            allowedChildren: [],
            requiredProps: [],
            optionalProps: ['onClick'],
            cssClass: 'rubi-refresh-btn'
        },

        // Email Context Components
        EmailContextCard: {
            componentName: 'EmailContextCard',
            description: 'Card displaying email thread context',
            allowedChildren: ['EmailContextRow'],
            requiredProps: ['subject'],
            optionalProps: ['sender', 'recipients', 'timestamp'],
            cssClass: 'rubi-context-card'
        },
        EmailContextRow: {
            componentName: 'EmailContextRow',
            description: 'Single row of email context information',
            allowedChildren: [],
            requiredProps: ['label', 'value'],
            optionalProps: ['icon'],
            cssClass: 'rubi-context-row'
        },

        // User Message Components
        UserMessageCard: {
            componentName: 'UserMessageCard',
            description: 'Card for displaying user draft message',
            allowedChildren: ['UserMessageField'],
            requiredProps: [],
            optionalProps: ['title'],
            cssClass: 'rubi-message-card'
        },
        UserMessageField: {
            componentName: 'UserMessageField',
            description: 'Text field showing draft message content',
            allowedChildren: [],
            requiredProps: ['content'],
            optionalProps: ['placeholder', 'maxLength'],
            cssClass: 'rubi-message-field'
        },

        // Message Analysis Components
        MessageAnalysisCard: {
            componentName: 'MessageAnalysisCard',
            description: 'Card showing AI analysis of message',
            allowedChildren: ['MessageAnalysisItem', 'MessageAnalysisScoreRow'],
            requiredProps: [],
            optionalProps: ['title', 'summary'],
            cssClass: 'rubi-analysis-card'
        },
        MessageAnalysisItem: {
            componentName: 'MessageAnalysisItem',
            description: 'Individual analysis metric or insight',
            allowedChildren: [],
            requiredProps: ['label', 'value'],
            optionalProps: ['icon', 'severity'],
            cssClass: 'rubi-analysis-item'
        },
        MessageAnalysisScoreRow: {
            componentName: 'MessageAnalysisScoreRow',
            description: 'Row showing score or rating',
            allowedChildren: [],
            requiredProps: ['label', 'score'],
            optionalProps: ['maxScore', 'color'],
            cssClass: 'rubi-score-row'
        },

        // AI Suggestions Components
        AISuggestionsCard: {
            componentName: 'AISuggestionsCard',
            description: 'Card containing AI-generated suggestions',
            allowedChildren: ['AISuggestionPreview', 'AISuggestionFooterButton'],
            requiredProps: [],
            optionalProps: ['title', 'count'],
            cssClass: 'rubi-suggestions-card'
        },
        AISuggestionPreview: {
            componentName: 'AISuggestionPreview',
            description: 'Preview of a single AI suggestion',
            allowedChildren: [],
            requiredProps: ['text'],
            optionalProps: ['confidence', 'type', 'onClick'],
            cssClass: 'rubi-suggestion-preview'
        },
        AISuggestionFooterButton: {
            componentName: 'AISuggestionFooterButton',
            description: 'Action button at bottom of suggestions',
            allowedChildren: [],
            requiredProps: ['label', 'action'],
            optionalProps: ['icon'],
            cssClass: 'rubi-suggestion-footer-btn'
        },

        // Footer Components
        DrawerFooterButton: {
            componentName: 'DrawerFooterButton',
            description: 'Primary action button in drawer footer',
            allowedChildren: [],
            requiredProps: ['label', 'action'],
            optionalProps: ['variant', 'icon', 'disabled'],
            cssClass: 'rubi-footer-btn'
        },

        // Tab Components
        OpportunityTab: {
            componentName: 'OpportunityTab',
            description: 'Tab for opportunity view',
            allowedChildren: ['OpportunitySummaryCard', 'DealHealthCard', 'NextBestActionsCard'],
            requiredProps: [],
            optionalProps: ['active'],
            cssClass: 'rubi-opportunity-tab'
        },
        MeetingPrepTab: {
            componentName: 'MeetingPrepTab',
            description: 'Tab for meeting preparation view',
            allowedChildren: ['InsightCard', 'QuickActionsGrid', 'RecentActivityCard'],
            requiredProps: [],
            optionalProps: ['active'],
            cssClass: 'rubi-meeting-tab'
        },
        TabbedContentContainer: {
            componentName: 'TabbedContentContainer',
            description: 'Container for tabbed content sections',
            allowedChildren: ['OpportunityTab', 'MeetingPrepTab'],
            requiredProps: [],
            optionalProps: ['activeTab'],
            cssClass: 'rubi-tabbed-container'
        },

        // Opportunity Components
        OpportunitySummaryCard: {
            componentName: 'OpportunitySummaryCard',
            description: 'Card showing opportunity overview',
            allowedChildren: ['OpportunitySummaryRow'],
            requiredProps: [],
            optionalProps: ['title', 'dealName', 'stage'],
            cssClass: 'rubi-opp-summary-card'
        },
        OpportunitySummaryRow: {
            componentName: 'OpportunitySummaryRow',
            description: 'Row of opportunity data',
            allowedChildren: [],
            requiredProps: ['label', 'value'],
            optionalProps: ['highlight'],
            cssClass: 'rubi-opp-summary-row'
        },

        // Deal Health Components
        DealHealthCard: {
            componentName: 'DealHealthCard',
            description: 'Card showing deal health metrics',
            allowedChildren: ['DealHealthItem'],
            requiredProps: [],
            optionalProps: ['title', 'overallScore'],
            cssClass: 'rubi-deal-health-card'
        },
        DealHealthItem: {
            componentName: 'DealHealthItem',
            description: 'Individual health metric',
            allowedChildren: [],
            requiredProps: ['metric', 'value'],
            optionalProps: ['status', 'trend'],
            cssClass: 'rubi-deal-health-item'
        },

        // Next Best Actions Components
        NextBestActionsCard: {
            componentName: 'NextBestActionsCard',
            description: 'Card with recommended next actions',
            allowedChildren: ['NextBestActionsItem'],
            requiredProps: [],
            optionalProps: ['title'],
            cssClass: 'rubi-actions-card'
        },
        NextBestActionsItem: {
            componentName: 'NextBestActionsItem',
            description: 'Single recommended action',
            allowedChildren: [],
            requiredProps: ['action', 'reason'],
            optionalProps: ['priority', 'onClick'],
            cssClass: 'rubi-action-item'
        },

        // Insight Components
        InsightCard: {
            componentName: 'InsightCard',
            description: 'Card displaying key insights',
            allowedChildren: [],
            requiredProps: ['title', 'content'],
            optionalProps: ['icon', 'timestamp'],
            cssClass: 'rubi-insight-card'
        },

        // Quick Actions Components
        QuickActionsGrid: {
            componentName: 'QuickActionsGrid',
            description: 'Grid layout for quick action buttons',
            allowedChildren: ['QuickActionButton'],
            requiredProps: [],
            optionalProps: ['columns'],
            cssClass: 'rubi-quick-actions-grid'
        },
        QuickActionButton: {
            componentName: 'QuickActionButton',
            description: 'Quick action button',
            allowedChildren: [],
            requiredProps: ['label', 'action'],
            optionalProps: ['icon', 'badge'],
            cssClass: 'rubi-quick-action-btn'
        },

        // Content Recommendation Components
        RecommendedContentCard: {
            componentName: 'RecommendedContentCard',
            description: 'Card with recommended content',
            allowedChildren: ['RecommendedContentItem'],
            requiredProps: [],
            optionalProps: ['title'],
            cssClass: 'rubi-recommended-card'
        },
        RecommendedContentItem: {
            componentName: 'RecommendedContentItem',
            description: 'Single content recommendation',
            allowedChildren: [],
            requiredProps: ['title', 'type'],
            optionalProps: ['url', 'preview', 'relevance'],
            cssClass: 'rubi-recommended-item'
        },

        // Notification Components
        NotificationsCard: {
            componentName: 'NotificationsCard',
            description: 'Card displaying notifications',
            allowedChildren: ['NotificationRow'],
            requiredProps: [],
            optionalProps: ['title', 'count'],
            cssClass: 'rubi-notifications-card'
        },
        NotificationRow: {
            componentName: 'NotificationRow',
            description: 'Single notification row',
            allowedChildren: [],
            requiredProps: ['message', 'timestamp'],
            optionalProps: ['type', 'read', 'onClick'],
            cssClass: 'rubi-notification-row'
        },

        // Recent Activity Components
        RecentActivityCard: {
            componentName: 'RecentActivityCard',
            description: 'Card showing recent activity',
            allowedChildren: ['RecentActivityItem'],
            requiredProps: [],
            optionalProps: ['title', 'timeRange'],
            cssClass: 'rubi-activity-card'
        },
        RecentActivityItem: {
            componentName: 'RecentActivityItem',
            description: 'Single activity item',
            allowedChildren: [],
            requiredProps: ['activity', 'timestamp'],
            optionalProps: ['user', 'icon', 'details'],
            cssClass: 'rubi-activity-item'
        }
    };

    // Validation helper functions
    const validateComponent = function(componentName) {
        return componentRegistry.hasOwnProperty(componentName);
    };

    const getComponent = function(componentName) {
        if (!validateComponent(componentName)) {
            console.warn(`Component ${componentName} not found in registry`);
            return null;
        }
        return componentRegistry[componentName];
    };

    const validateProps = function(componentName, props) {
        const component = getComponent(componentName);
        if (!component) return false;

        // Check required props
        for (const requiredProp of component.requiredProps) {
            if (!props.hasOwnProperty(requiredProp)) {
                console.warn(`Missing required prop '${requiredProp}' for ${componentName}`);
                return false;
            }
        }
        return true;
    };

    const canContainChild = function(parentName, childName) {
        const parent = getComponent(parentName);
        if (!parent) return false;
        
        if (parent.allowedChildren.length === 0) return false;
        return parent.allowedChildren.includes(childName);
    };

    // Export to global namespace
    window.RubiComponentRegistry = {
        registry: componentRegistry,
        validateComponent: validateComponent,
        getComponent: getComponent,
        validateProps: validateProps,
        canContainChild: canContainChild,
        getAllComponents: function() {
            return Object.keys(componentRegistry);
        }
    };

    console.log('Rubi Component Registry initialized with', Object.keys(componentRegistry).length, 'components');
})();