// Rubi Browser Extension - Microcopy System
// Global namespace for all microcopy, tone, and semantic text management

window.RubiMicrocopy = (function() {
    'use strict';

    // Brand Tone System - SuccessLAB Voice
    const TONE = {
        PRIMARY: {
            wordChoice: ['strategic', 'momentum', 'accelerate', 'optimize', 'unlock', 'drive', 'elevate'],
            sentenceLength: 'medium',
            personaNotes: 'Professional sales enablement expert, confident but not pushy',
            examples: ['Accelerate deal velocity', 'Strategic opportunity identified']
        },
        CALL_TO_ACTION: {
            wordChoice: ['connect', 'engage', 'review', 'validate', 'confirm', 'schedule', 'update'],
            sentenceLength: 'short',
            personaNotes: 'Direct, action-oriented coach',
            examples: ['Connect with decision maker', 'Update deal stage']
        },
        ANALYSIS: {
            wordChoice: ['indicates', 'suggests', 'reveals', 'demonstrates', 'highlights', 'shows'],
            sentenceLength: 'medium-long',
            personaNotes: 'Data-driven analyst, precise and factual',
            examples: ['Analysis indicates strong buyer intent', 'Data reveals engagement pattern']
        },
        WARNING: {
            wordChoice: ['risk', 'attention needed', 'review required', 'potential blocker', 'consider'],
            sentenceLength: 'short-medium',
            personaNotes: 'Helpful advisor, not alarmist',
            examples: ['Decision maker not engaged', 'Deal momentum at risk']
        },
        POSITIVE: {
            wordChoice: ['strong', 'excellent', 'progressing', 'aligned', 'validated', 'confirmed'],
            sentenceLength: 'short',
            personaNotes: 'Encouraging but measured',
            examples: ['Strong engagement detected', 'Champion identified']
        }
    };

    // Comprehensive Microcopy Dictionary
    const STRINGS = {
        // Section Titles
        SECTION_OPPORTUNITY_OVERVIEW: 'Opportunity Overview',
        SECTION_DEAL_HEALTH: 'Deal Health',
        SECTION_KEY_CONTACTS: 'Key Contacts',
        SECTION_ENGAGEMENT_INSIGHTS: 'Engagement Insights',
        SECTION_RECOMMENDED_ACTIONS: 'Recommended Actions',
        SECTION_RISK_ANALYSIS: 'Risk Analysis',
        SECTION_DECISION_MAKERS: 'Decision Makers',
        SECTION_TIMELINE: 'Timeline & Milestones',
        SECTION_COMPETITIVE_LANDSCAPE: 'Competitive Landscape',
        SECTION_BUYING_SIGNALS: 'Buying Signals',
        SECTION_STAKEHOLDER_MAP: 'Stakeholder Map',
        SECTION_NEXT_STEPS: 'Next Steps',
        SECTION_COACHING_TIPS: 'Coaching Tips',
        SECTION_TALK_TRACKS: 'Talk Tracks',
        SECTION_EMAIL_INSIGHTS: 'Email Insights',
        SECTION_MEETING_PREP: 'Meeting Preparation',
        SECTION_PROFILE_ANALYSIS: 'Profile Analysis',
        SECTION_CONNECTION_STRATEGY: 'Connection Strategy',
        
        // Field Labels
        FIELD_OPPORTUNITY_NAME: 'Opportunity',
        FIELD_ACCOUNT_NAME: 'Account',
        FIELD_DEAL_SIZE: 'Deal Size',
        FIELD_CLOSE_DATE: 'Expected Close',
        FIELD_STAGE: 'Stage',
        FIELD_PROBABILITY: 'Win Probability',
        FIELD_OWNER: 'Owner',
        FIELD_LAST_ACTIVITY: 'Last Activity',
        FIELD_DAYS_IN_STAGE: 'Days in Stage',
        FIELD_DECISION_MAKER: 'Decision Maker',
        FIELD_CHAMPION: 'Champion',
        FIELD_ECONOMIC_BUYER: 'Economic Buyer',
        FIELD_TECHNICAL_EVALUATOR: 'Technical Evaluator',
        FIELD_END_USER: 'End User',
        FIELD_TITLE: 'Title',
        FIELD_DEPARTMENT: 'Department',
        FIELD_SENIORITY: 'Seniority',
        FIELD_ENGAGEMENT_SCORE: 'Engagement Score',
        FIELD_LAST_CONTACT: 'Last Contact',
        FIELD_RESPONSE_TIME: 'Response Time',
        FIELD_INDUSTRY: 'Industry',
        FIELD_COMPANY_SIZE: 'Company Size',
        FIELD_LOCATION: 'Location',
        
        // Button Labels
        BTN_VIEW_DETAILS: 'View Details',
        BTN_UPDATE: 'Update',
        BTN_SEND_EMAIL: 'Send Email',
        BTN_SCHEDULE_MEETING: 'Schedule Meeting',
        BTN_ADD_NOTE: 'Add Note',
        BTN_VIEW_HISTORY: 'View History',
        BTN_REFRESH: 'Refresh',
        BTN_ANALYZE: 'Analyze',
        BTN_GENERATE_TALK_TRACK: 'Generate Talk Track',
        BTN_COPY: 'Copy',
        BTN_SAVE: 'Save',
        BTN_APPLY: 'Apply',
        BTN_CONNECT: 'Connect',
        BTN_ENGAGE: 'Engage',
        BTN_FOLLOW_UP: 'Follow Up',
        BTN_REVIEW: 'Review',
        BTN_VALIDATE: 'Validate',
        BTN_CONFIRM: 'Confirm',
        BTN_EXPAND: 'Expand',
        BTN_COLLAPSE: 'Collapse',
        
        // Tooltips
        TOOLTIP_DEAL_HEALTH: 'Overall health based on engagement, timeline, and stakeholder involvement',
        TOOLTIP_ENGAGEMENT_SCORE: 'Composite score of email opens, replies, and meeting attendance',
        TOOLTIP_DECISION_MAKER: 'Person with authority to approve purchase decision',
        TOOLTIP_CHAMPION: 'Internal advocate supporting your solution',
        TOOLTIP_RISK_INDICATOR: 'Factors that may impact deal success',
        TOOLTIP_BUYING_SIGNAL: 'Behavior indicating purchase intent',
        TOOLTIP_TALK_TRACK: 'Suggested messaging based on context',
        TOOLTIP_STAKEHOLDER_INFLUENCE: 'Level of influence in purchase decision',
        TOOLTIP_MOMENTUM_SCORE: 'Rate of positive progression in sales cycle',
        TOOLTIP_WIN_PROBABILITY: 'AI-calculated likelihood of closing',
        
        // Empty States
        EMPTY_NO_OPPORTUNITIES: 'No opportunities to display',
        EMPTY_NO_CONTACTS: 'No contacts identified',
        EMPTY_NO_ACTIVITIES: 'No recent activities',
        EMPTY_NO_RISKS: 'No risks detected',
        EMPTY_NO_RECOMMENDATIONS: 'No recommendations available',
        EMPTY_NO_INSIGHTS: 'Gathering insights...',
        EMPTY_NO_EMAILS: 'No emails found',
        EMPTY_NO_MEETINGS: 'No upcoming meetings',
        EMPTY_NO_NOTES: 'No notes available',
        EMPTY_NO_HISTORY: 'No history to show',
        
        // History & Memory
        HISTORY_TITLE: 'Recent Rubi Activity',
        HISTORY_CONTEXT_CAPTURED: 'Context captured',
        HISTORY_AI_ANALYSIS_RUN: 'AI analysis run',
        HISTORY_VIEW_MORE: 'View more history',
        HISTORY_EMPTY_CONTACT: 'No recent Rubi activity yet for this contact',
        HISTORY_EMPTY_OPPORTUNITY: 'No recent Rubi activity yet for this opportunity',
        HISTORY_EMPTY_EMAIL: 'No recent Rubi activity yet for this email thread',
        HISTORY_EMPTY_PAGE: 'No recent Rubi activity yet on this page',
        HISTORY_ACTION_PERFORMED: 'Action performed',
        HISTORY_INSIGHT_GENERATED: 'Insight generated',
        HISTORY_PATTERN_DETECTED: 'Pattern detected',
        
        // Insight Phrasing
        INSIGHT_HIGH_ENGAGEMENT: 'Strong engagement pattern detected',
        INSIGHT_LOW_ENGAGEMENT: 'Engagement below typical levels',
        INSIGHT_DECISION_MAKER_MISSING: 'Key decision maker not identified',
        INSIGHT_CHAMPION_ACTIVE: 'Champion actively supporting',
        INSIGHT_STALLED_DEAL: 'Deal momentum has stalled',
        INSIGHT_FAST_MOVING: 'Deal progressing faster than average',
        INSIGHT_MULTIPLE_STAKEHOLDERS: 'Multiple stakeholders engaged',
        INSIGHT_SINGLE_THREADED: 'Single-threaded relationship risk',
        INSIGHT_BUDGET_CONFIRMED: 'Budget authority confirmed',
        INSIGHT_TIMELINE_RISK: 'Timeline may be at risk',
        INSIGHT_COMPETITOR_PRESENT: 'Competitor evaluation detected',
        INSIGHT_STRONG_FIT: 'Strong solution fit indicators',
        INSIGHT_EXPANSION_OPPORTUNITY: 'Expansion opportunity identified',
        INSIGHT_RENEWAL_RISK: 'Renewal at risk',
        INSIGHT_UPSELL_READY: 'Account ready for upsell',
        
        // Recommended Actions
        ACTION_ENGAGE_DECISION_MAKER: 'Engage decision maker',
        ACTION_IDENTIFY_CHAMPION: 'Identify internal champion',
        ACTION_SCHEDULE_EXECUTIVE_MEETING: 'Schedule executive alignment',
        ACTION_SEND_FOLLOW_UP: 'Send follow-up',
        ACTION_UPDATE_OPPORTUNITY: 'Update opportunity details',
        ACTION_ADD_STAKEHOLDER: 'Add stakeholder',
        ACTION_REVIEW_COMPETITIVE: 'Review competitive positioning',
        ACTION_VALIDATE_BUDGET: 'Validate budget',
        ACTION_CONFIRM_TIMELINE: 'Confirm timeline',
        ACTION_ADDRESS_CONCERNS: 'Address technical concerns',
        ACTION_PROVIDE_REFERENCES: 'Provide customer references',
        ACTION_DEMO_SPECIFIC_FEATURE: 'Demo requested feature',
        ACTION_ESCALATE_INTERNALLY: 'Escalate internally',
        ACTION_DOCUMENT_REQUIREMENTS: 'Document requirements',
        ACTION_BUILD_BUSINESS_CASE: 'Build business case',
        
        // Risk Messaging
        RISK_NO_DECISION_MAKER: 'Decision maker not engaged',
        RISK_SINGLE_THREAD: 'Single-threaded relationship',
        RISK_STALLED_MOMENTUM: 'Deal momentum stalled',
        RISK_COMPETITOR_ACTIVE: 'Competitor actively engaged',
        RISK_BUDGET_UNCLEAR: 'Budget not validated',
        RISK_TIMELINE_SLIPPING: 'Timeline slipping',
        RISK_LOW_ENGAGEMENT: 'Low stakeholder engagement',
        RISK_TECHNICAL_CONCERNS: 'Unresolved technical concerns',
        RISK_NO_CHAMPION: 'No internal champion',
        RISK_EXECUTIVE_MISALIGNMENT: 'Executive alignment needed',
        RISK_CONTRACT_ISSUES: 'Contract negotiation issues',
        RISK_PROCUREMENT_DELAY: 'Procurement process delay',
        
        // Coaching Language
        COACH_BUILD_CHAMPION: 'Focus on building champion relationship',
        COACH_MULTI_THREAD: 'Develop multiple stakeholder relationships',
        COACH_VALUE_PROP: 'Reinforce value proposition',
        COACH_HANDLE_OBJECTION: 'Address objection directly',
        COACH_CREATE_URGENCY: 'Create sense of urgency',
        COACH_DEMONSTRATE_ROI: 'Quantify business impact',
        COACH_EXECUTIVE_SPONSOR: 'Secure executive sponsorship',
        COACH_COMPETITIVE_DIFFERENTIATE: 'Differentiate from competition',
        COACH_REFERENCE_STORY: 'Share relevant success story',
        COACH_TRIAL_CLOSE: 'Test for close readiness',
        COACH_DISCOVERY_DEEPER: 'Deepen discovery conversation',
        COACH_ALIGN_PRIORITIES: 'Align with business priorities',
        
        // Interpretation Language
        INTERPRET_HIGH_OPEN_RATE: 'High email engagement indicates interest',
        INTERPRET_QUICK_RESPONSE: 'Fast response time shows priority',
        INTERPRET_MULTIPLE_FORWARDS: 'Email forwarding suggests internal discussion',
        INTERPRET_CALENDAR_BLOCK: 'Calendar availability indicates commitment',
        INTERPRET_STAKEHOLDER_LOOP: 'Stakeholder inclusion shows progression',
        INTERPRET_TECHNICAL_QUESTIONS: 'Technical questions indicate evaluation',
        INTERPRET_BUDGET_DISCUSSION: 'Budget conversation signals intent',
        INTERPRET_TIMELINE_MENTION: 'Timeline discussion shows urgency',
        INTERPRET_REFERENCE_REQUEST: 'Reference request indicates final stage',
        INTERPRET_CONTRACT_REVIEW: 'Contract review suggests close readiness',
        
        // AI Suggestion Phrasing
        AI_SUGGESTS: 'Analysis suggests',
        AI_RECOMMENDS: 'Recommended approach',
        AI_IDENTIFIES: 'Pattern identified',
        AI_PREDICTS: 'Likely outcome',
        AI_CONFIDENCE_HIGH: 'High confidence',
        AI_CONFIDENCE_MEDIUM: 'Moderate confidence',
        AI_CONFIDENCE_LOW: 'Low confidence',
        AI_BASED_ON_DATA: 'Based on historical data',
        AI_SIMILAR_DEALS: 'Similar deals indicate',
        AI_BEST_PRACTICE: 'Best practice suggests',
        
        // Data-Driven Interpretations
        DATA_ABOVE_AVERAGE: 'Above average',
        DATA_BELOW_AVERAGE: 'Below average',
        DATA_TRENDING_UP: 'Trending upward',
        DATA_TRENDING_DOWN: 'Trending downward',
        DATA_STABLE: 'Stable pattern',
        DATA_ANOMALY: 'Unusual pattern detected',
        DATA_CORRELATION: 'Strong correlation with',
        DATA_BENCHMARK: 'Compared to benchmark',
        DATA_PERCENTILE: 'percentile',
        DATA_INCREASE: 'increase',
        DATA_DECREASE: 'decrease',
        
        // Notification Text
        NOTIFY_OPPORTUNITY_UPDATED: 'Opportunity updated',
        NOTIFY_NEW_ACTIVITY: 'New activity detected',
        NOTIFY_RISK_IDENTIFIED: 'New risk identified',
        NOTIFY_ACTION_COMPLETED: 'Action completed',
        NOTIFY_INSIGHT_AVAILABLE: 'New insight available',
        NOTIFY_REMINDER: 'Reminder',
        NOTIFY_DEADLINE_APPROACHING: 'Deadline approaching',
        NOTIFY_STAKEHOLDER_CHANGE: 'Stakeholder change detected',
        NOTIFY_ENGAGEMENT_SPIKE: 'Engagement spike detected',
        NOTIFY_COMPETITIVE_ALERT: 'Competitive activity detected',
        
        // Platform-Specific
        PLATFORM_SALESFORCE: 'Salesforce',
        PLATFORM_LINKEDIN: 'LinkedIn',
        PLATFORM_GMAIL: 'Gmail',
        PLATFORM_HUBSPOT: 'HubSpot',
        PLATFORM_OUTREACH: 'Outreach',
        PLATFORM_SALESLOFT: 'SalesLoft',
        
        // Generic Fallbacks
        GENERIC_LOADING: 'Loading...',
        GENERIC_ERROR: 'Unable to load',
        GENERIC_RETRY: 'Retry',
        GENERIC_UNKNOWN: 'Unknown',
        GENERIC_NOT_AVAILABLE: 'Not available',
        GENERIC_SEE_MORE: 'See more',
        GENERIC_SEE_LESS: 'See less',
        GENERIC_CONFIRM: 'Confirm',
        GENERIC_CANCEL: 'Cancel',
        GENERIC_CLOSE: 'Close',
        GENERIC_BACK: 'Back',
        GENERIC_NEXT: 'Next',
        GENERIC_SUBMIT: 'Submit',
        GENERIC_SUCCESS: 'Success',
        GENERIC_WARNING: 'Warning',
        GENERIC_INFO: 'Information',
        
        // Semantic Enrichments
        SEMANTIC_MODERNIZATION_FOCUS: 'Focus on modernization initiatives',
        SEMANTIC_SECURITY_PRIORITY: 'Security is top priority',
        SEMANTIC_CLOUD_TRANSFORMATION: 'Cloud transformation underway',
        SEMANTIC_AI_ADOPTION: 'AI adoption in progress',
        SEMANTIC_COST_OPTIMIZATION: 'Cost optimization focus',
        SEMANTIC_SCALING_CHALLENGE: 'Scaling challenges present',
        SEMANTIC_COMPLIANCE_REQUIREMENT: 'Compliance requirements identified',
        SEMANTIC_INTEGRATION_NEED: 'Integration requirements',
        SEMANTIC_PERFORMANCE_CONCERN: 'Performance optimization needed',
        SEMANTIC_INNOVATION_DRIVER: 'Innovation initiatives active',
        
        // LinkedIn Profile Insights
        LINKEDIN_DECISION_AUTHORITY: 'Decision-making authority likely',
        LINKEDIN_TECHNICAL_BACKGROUND: 'Strong technical background',
        LINKEDIN_BUSINESS_FOCUSED: 'Business outcome focused',
        LINKEDIN_CHANGE_AGENT: 'Change agent profile',
        LINKEDIN_INDUSTRY_EXPERT: 'Industry expertise noted',
        LINKEDIN_GROWTH_FOCUSED: 'Growth and expansion focus',
        LINKEDIN_OPERATIONAL_EXCELLENCE: 'Operational excellence priority',
        LINKEDIN_DIGITAL_TRANSFORMATION: 'Digital transformation leader',
        
        // Email Insights
        EMAIL_BRIEF_EXPAND: 'Consider adding specific value points',
        EMAIL_LENGTHY_CONDENSE: 'Consider more concise messaging',
        EMAIL_NO_CTA: 'Add clear call to action',
        EMAIL_MULTIPLE_CTA: 'Focus on single call to action',
        EMAIL_VALUE_MISSING: 'Include specific value proposition',
        EMAIL_TOO_TECHNICAL: 'Simplify technical details',
        EMAIL_TOO_GENERIC: 'Personalize with specific context',
        EMAIL_URGENCY_LACKING: 'Add time-based element',
        
        // Deal Stage Insights
        STAGE_EARLY_VALIDATION: 'Validate project sponsor early',
        STAGE_MID_MULTITHREADING: 'Build multiple relationships now',
        STAGE_LATE_ACCELERATION: 'Accelerate to close',
        STAGE_NEGOTIATION_PREP: 'Prepare negotiation strategy',
        STAGE_CLOSING_CHECKLIST: 'Complete closing requirements',
        STAGE_POST_CLOSE_SUCCESS: 'Ensure customer success transition'
    };

    // Message variant system
    const MESSAGE_VARIANTS = {
        RISK_NO_DECISION_MAKER: {
            short: 'Decision maker not engaged',
            medium: 'Key decision maker has not been engaged in this opportunity',
            long: 'Critical risk: The decision maker for this opportunity has not been identified or engaged. This significantly impacts deal probability and should be addressed immediately.'
        },
        INSIGHT_HIGH_ENGAGEMENT: {
            short: 'High engagement',
            medium: 'Strong engagement pattern detected across stakeholders',
            long: 'Excellent engagement indicators: Multiple stakeholders are actively engaged with consistent email responses, meeting attendance, and document reviews. This pattern strongly correlates with successful deal closure.'
        },
        ACTION_ENGAGE_DECISION_MAKER: {
            short: 'Engage DM',
            medium: 'Schedule meeting with decision maker',
            long: 'Priority action: Schedule an executive alignment meeting with the identified decision maker to validate business case and confirm budget authority.'
        },
        COACH_MULTI_THREAD: {
            short: 'Build relationships',
            medium: 'Develop multiple stakeholder relationships',
            long: 'Strategic coaching: Develop relationships across multiple departments and levels to reduce single-thread risk. Target technical evaluators, end users, and economic buyers in parallel.'
        },
        SEMANTIC_CLOUD_TRANSFORMATION: {
            short: 'Cloud focus',
            medium: 'Organization focused on cloud transformation',
            long: 'Strategic opportunity: This organization is actively pursuing cloud transformation initiatives. Position solution benefits around scalability, agility, and cloud-native capabilities.'
        }
    };

    // Get label with fallback
    function getLabel(key, fallback) {
        if (STRINGS[key]) {
            console.log('[Rubi Microcopy] Retrieved label:', key);
            return STRINGS[key];
        }
        console.warn('[Rubi Microcopy] Missing label:', key, 'Using fallback');
        return fallback || STRINGS.GENERIC_NOT_AVAILABLE;
    }

    // Get text with tone application
    function getText(key, tone, fallback) {
        const baseText = getLabel(key, fallback);
        if (tone && TONE[tone]) {
            console.log('[Rubi Microcopy] Applying tone:', tone, 'to text:', key);
            // Tone is already embedded in the strings, but this allows for future dynamic tone adjustment
            return baseText;
        }
        return baseText;
    }

    // Get message variant based on context
    function getMessageVariant(key, variant, context) {
        variant = variant || 'medium';
        
        // Check for predefined variants
        if (MESSAGE_VARIANTS[key] && MESSAGE_VARIANTS[key][variant]) {
            console.log('[Rubi Microcopy] Retrieved variant:', key, variant);
            return MESSAGE_VARIANTS[key][variant];
        }
        
        // Dynamic variant selection based on context
        if (context) {
            if (context.severity === 'high' || context.confidence === 'high') {
                variant = 'long';
            } else if (context.space === 'limited' || context.platform === 'mobile') {
                variant = 'short';
            }
        }
        
        // Fallback to base string
        const baseText = getLabel(key);
        
        // If no variant exists, return base text
        if (!MESSAGE_VARIANTS[key]) {
            return baseText;
        }
        
        // Try to fall back to medium variant
        if (MESSAGE_VARIANTS[key].medium) {
            return MESSAGE_VARIANTS[key].medium;
        }
        
        // Last resort: return any available variant
        const variants = MESSAGE_VARIANTS[key];
        const availableVariant = variants.short || variants.medium || variants.long;
        return availableVariant || baseText;
    }

    // Semantic enrichment function
    function enrichSemantics(data, context) {
        console.log('[Rubi Microcopy] Enriching semantics for context:', context);
        const enrichments = [];
        
        // LinkedIn profile enrichments
        if (context === 'linkedin_profile' && data) {
            if (data.headline) {
                const headline = data.headline.toLowerCase();
                if (headline.includes('cloud') || headline.includes('devops')) {
                    enrichments.push(getLabel('SEMANTIC_CLOUD_TRANSFORMATION'));
                }
                if (headline.includes('security') || headline.includes('ciso')) {
                    enrichments.push(getLabel('SEMANTIC_SECURITY_PRIORITY'));
                }
                if (headline.includes('ai') || headline.includes('machine learning')) {
                    enrichments.push(getLabel('SEMANTIC_AI_ADOPTION'));
                }
                if (headline.includes('vp') || headline.includes('director') || headline.includes('head of')) {
                    enrichments.push(getLabel('LINKEDIN_DECISION_AUTHORITY'));
                }
            }
            if (data.about) {
                const about = data.about.toLowerCase();
                if (about.includes('scaling') || about.includes('growth')) {
                    enrichments.push(getLabel('SEMANTIC_SCALING_CHALLENGE'));
                }
                if (about.includes('transformation') || about.includes('innovation')) {
                    enrichments.push(getLabel('SEMANTIC_INNOVATION_DRIVER'));
                }
            }
        }
        
        // Email enrichments
        if (context === 'gmail_draft' && data) {
            if (data.body && data.body.length < 50) {
                enrichments.push(getLabel('EMAIL_BRIEF_EXPAND'));
            }
            if (data.body && data.body.length > 500) {
                enrichments.push(getLabel('EMAIL_LENGTHY_CONDENSE'));
            }
            if (data.body && !data.body.includes('?')) {
                enrichments.push(getLabel('EMAIL_NO_CTA'));
            }
        }
        
        // Salesforce deal enrichments
        if (context === 'salesforce_opportunity' && data) {
            if (data.stage) {
                const stage = data.stage.toLowerCase();
                if (stage.includes('qualification') || stage.includes('discovery')) {
                    enrichments.push(getLabel('STAGE_EARLY_VALIDATION'));
                }
                if (stage.includes('proposal') || stage.includes('evaluation')) {
                    enrichments.push(getLabel('STAGE_MID_MULTITHREADING'));
                }
                if (stage.includes('negotiation') || stage.includes('closing')) {
                    enrichments.push(getLabel('STAGE_NEGOTIATION_PREP'));
                }
            }
            if (data.amount && data.amount > 100000 && !data.decisionMaker) {
                enrichments.push(getLabel('RISK_NO_DECISION_MAKER'));
                enrichments.push(getLabel('ACTION_ENGAGE_DECISION_MAKER'));
            }
            if (data.daysInStage && data.daysInStage > 30) {
                enrichments.push(getLabel('RISK_STALLED_MOMENTUM'));
            }
        }
        
        return enrichments;
    }

    // Public API
    return {
        getLabel: getLabel,
        getText: getText,
        getMessageVariant: getMessageVariant,
        enrichSemantics: enrichSemantics,
        TONE: TONE,
        STRINGS: STRINGS
    };
})();

console.log('[Rubi Microcopy] Microcopy system initialized with', Object.keys(window.RubiMicrocopy.STRINGS).length, 'strings');