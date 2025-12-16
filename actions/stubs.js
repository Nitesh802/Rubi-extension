/**
 * Rubi Browser Extension - Action Stubs
 *
 * Stub implementations for Rubi actions during development.
 * These will be replaced with real API calls in production.
 */

/**
 * Phase 10A: Generate execution metadata for stub actions
 * 
 * @param {string} actionName - Name of the action
 * @returns {Object} Stub execution metadata
 */
function generateStubMetadata(actionName) {
  return {
    actionName: actionName,
    backendUsed: false,
    providerPrimary: 'stub',
    providerFinal: 'stub',
    modelPrimary: null,
    modelFinal: null,
    providerFallbackOccurred: false,
    orgConfigSource: 'none',
    identitySource: 'anonymous',
    orgId: null,
    userId: null,
    warnings: ['Backend unavailable', 'Using stub implementation'],
    timestamp: new Date().toISOString(),
    requestId: `stub-${Date.now()}`
  };
}

/**
 * Build prompt with recent history and org intelligence
 *
 * @param {Object} contextPayload - Context data from the page
 * @param {string} basePrompt - Base prompt to augment with memory
 * @returns {Promise<string>} Enhanced prompt with memory context
 */
async function buildPromptWithMemory(contextPayload, basePrompt) {
  let enhancedPrompt = basePrompt;
  
  // Phase 11B: Add org intelligence to prompt
  try {
    if (window.orgIntelligence) {
      const intelligence = await window.orgIntelligence.getIntelligence();
      
      if (intelligence) {
        let orgContext = '\n\nOrganization Context:\n';
        orgContext += `Company: ${intelligence.companyIdentity?.companyName || 'Unknown'}\n`;
        
        // Add relevant value props
        if (intelligence.valuePropositions && intelligence.valuePropositions.length > 0) {
          orgContext += 'Key Value Propositions:\n';
          intelligence.valuePropositions.slice(0, 2).forEach((vp, index) => {
            orgContext += `${index + 1}. ${vp.title}: ${vp.description}\n`;
          });
        }
        
        // Add messaging rules
        if (intelligence.messagingRules) {
          orgContext += `Tone: ${intelligence.messagingRules.interactionStyle || 'Professional'}\n`;
        }
        
        enhancedPrompt += orgContext;
      }
    }
  } catch (error) {
    console.warn('[Rubi Actions Stub] Failed to add org intelligence to prompt:', error);
  }
  
  // Add memory context
  try {
    if (!window.RubiMemoryStore) {
      return enhancedPrompt;
    }
    
    await window.RubiMemoryStore.initMemoryStore();
    const entityKey = window.RubiMemoryStore.getEntityKey(contextPayload);
    
    if (!entityKey) {
      return enhancedPrompt;
    }
    
    const recentHistory = await window.RubiMemoryStore.getHistory(entityKey, { limit: 5 });
    
    if (recentHistory && recentHistory.length > 0) {
      let memoryContext = '\n\nRecent interactions with this entity:\n';
      recentHistory.forEach((entry, index) => {
        memoryContext += `${index + 1}. ${entry.summary} (${window.RubiMemoryStore.getRelativeTime(entry.timestamp)})\n`;
      });
      
      enhancedPrompt += memoryContext;
    }
  } catch (error) {
    console.warn('[Rubi Actions Stub] Failed to add memory to prompt:', error);
  }
  
  return enhancedPrompt;
}

/**
 * Stub implementation for opportunity risk analysis
 *
 * @param {Object} contextPayload - Context data from Salesforce opportunity page
 * @returns {Promise<Object>} Stub response
 */
async function stubOpportunityRisk(contextPayload) {
  console.log('[Rubi Actions Stub] Running opportunity risk analysis stub');
  
  // Build prompt with memory context (in production, this would be sent to AI)
  const basePrompt = 'Analyze opportunity risk factors...';
  const enhancedPrompt = await buildPromptWithMemory(contextPayload, basePrompt);
  console.log('[Rubi Actions Stub] Built prompt with memory:', enhancedPrompt.length > basePrompt.length);
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const snippet = typeof window.RubiActionsUtils !== 'undefined' 
    ? window.RubiActionsUtils.extractSnippet(contextPayload, 500)
    : (contextPayload?.visibleText?.substring(0, 500) || 'No context available');
  
  // Extract opportunity details from context
  const oppName = contextPayload?.fields?.opportunityName || 'Enterprise Cloud Migration';
  const accountName = contextPayload?.fields?.accountName || 'Acme Corp';
  const stage = contextPayload?.fields?.stage || 'Proposal';
  const amount = contextPayload?.fields?.amount || 250000;
  const closeDate = contextPayload?.fields?.closeDate || '2025-01-15';
  
  const response = {
    success: true,
    type: 'stub',
    actionId: 'analyze_opportunity_risk',
    message: 'Stub response for Opportunity Risk Analysis',
    contextSnippet: snippet,
    // Phase 10A: Include execution metadata for stubs
    executionMetadata: generateStubMetadata('analyze_opportunity_risk'),
    stubData: {
      meta: {
        title: 'Opportunity Review',
        subtitle: `${oppName} - ${accountName}`
      },
      summary: {
        dealName: oppName,
        stage: stage,
        amount: amount,
        closeDate: closeDate,
        rows: [
          { label: 'Account', value: accountName },
          { label: 'Stage', value: stage },
          { label: 'Amount', value: amount },
          { label: 'Close Date', value: closeDate }
        ]
      },
      dealHealthItems: [
        {
          id: 'budget_confirmed',
          label: 'Budget Confirmed',
          status: 'good',
          detail: 'Finance team has approved budget allocation',
          trend: 'stable'
        },
        {
          id: 'missing_decision_maker',
          label: 'Decision Maker Engagement',
          status: 'risk',
          detail: 'CTO not yet engaged in evaluation process',
          trend: 'down'
        },
        {
          id: 'technical_validation',
          label: 'Technical Validation',
          status: 'caution',
          detail: 'POC scheduled but not yet completed',
          trend: 'up'
        },
        {
          id: 'competition',
          label: 'Competitive Position',
          status: 'good',
          detail: 'Preferred vendor based on initial feedback',
          trend: 'stable'
        }
      ],
      dealHealthCard: {
        overallScore: 72
      },
      nextActions: [
        {
          id: 'schedule_cto_meeting',
          label: 'Schedule CTO Meeting',
          action: 'schedule_cto_meeting',
          reason: 'Critical for technical buy-in',
          priority: 'high'
        },
        {
          id: 'complete_poc',
          label: 'Complete POC Demo',
          action: 'complete_poc',
          reason: 'Required for technical validation',
          priority: 'high'
        },
        {
          id: 'review_pricing',
          label: 'Review Pricing Strategy',
          action: 'review_pricing',
          reason: 'Ensure competitive positioning',
          priority: 'medium'
        },
        {
          id: 'prepare_proposal',
          label: 'Finalize Proposal Deck',
          action: 'prepare_proposal',
          reason: 'Needed for executive presentation',
          priority: 'medium'
        }
      ],
      patternInsight: {
        title: 'AI Pattern Recognition',
        message: 'Similar deals at this stage typically close 15% faster when technical validation is completed within 2 weeks. Consider prioritizing the POC to maintain momentum.',
        icon: '🤖'
      },
      alerts: [
        {
          message: 'Decision maker not engaged',
          timestamp: '2 days ago',
          type: 'warning',
          read: false
        },
        {
          message: 'POC deadline approaching',
          timestamp: '1 day ago',
          type: 'info',
          read: false
        }
      ],
      riskScore: 'Medium',
      keyFactors: ['Deal size above average', 'Long sales cycle', 'New stakeholder involvement'],
      recommendations: ['Schedule stakeholder alignment meeting', 'Confirm budget approval process']
    }
  };
  
  console.log('[Rubi Actions Stub] Opportunity risk analysis completed');
  return response;
}

/**
 * Stub implementation for LinkedIn profile summary
 *
 * @param {Object} contextPayload - Context data from LinkedIn profile page
 * @returns {Promise<Object>} Stub response
 */
async function stubLinkedInSummary(contextPayload) {
  console.log('[Rubi Actions Stub] Running LinkedIn profile summary stub');
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 600));
  
  const snippet = typeof window.RubiActionsUtils !== 'undefined' 
    ? window.RubiActionsUtils.extractSnippet(contextPayload, 500)
    : (contextPayload?.visibleText?.substring(0, 500) || 'No context available');
  
  // Extract profile details from context
  const profileName = contextPayload?.fields?.profileName || 'Sarah Johnson';
  const title = contextPayload?.fields?.title || 'VP of Engineering';
  const company = contextPayload?.fields?.company || 'Acme Corp';
  const location = contextPayload?.fields?.location || 'San Francisco Bay Area';
  
  const response = {
    success: true,
    type: 'stub',
    actionId: 'summarize_linkedin_profile',
    message: 'Stub response for LinkedIn Profile Summary',
    contextSnippet: snippet,
    // Phase 10A: Include execution metadata for stubs
    executionMetadata: generateStubMetadata('summarize_linkedin_profile'),
    stubData: {
      meta: {
        title: 'Prospect Research',
        subtitle: `${profileName} · ${title} at ${company}`
      },
      profile: {
        fullName: profileName,
        headline: `${title} at ${company}`,
        location: location,
        company: company,
        role: title,
        email: `${profileName.toLowerCase().replace(' ', '.')}@${company.toLowerCase().replace(' ', '')}.com`
      },
      talkingPoints: [
        '15+ years of experience building and scaling technical teams',
        'Passionate about cloud infrastructure and DevOps transformation',
        'Currently leading engineering org through hypergrowth phase',
        'Previously implemented similar solutions at Fortune 500 companies',
        'Active in the tech community with speaking engagements at major conferences'
      ],
      interactionIdeas: [
        {
          id: 'reference_recent_post',
          label: 'Reference recent LinkedIn post',
          preview: 'I saw your recent post about scaling infrastructure to support 10x growth. We\'ve helped similar teams...',
          type: 'opening',
          confidence: 85
        },
        {
          id: 'connect_on_devops',
          label: 'Connect on DevOps challenges',
          preview: 'We\'ve worked with other engineering leaders facing similar DevOps bottlenecks during rapid scaling...',
          type: 'opening',
          confidence: 78
        },
        {
          id: 'mutual_connection',
          label: 'Mention mutual connection',
          preview: 'John Smith suggested I reach out since you\'re exploring solutions for your infrastructure challenges...',
          type: 'opening',
          confidence: 92
        },
        {
          id: 'industry_insight',
          label: 'Share industry insight',
          preview: 'I noticed Acme is expanding into EMEA. We\'ve helped 3 similar companies navigate regulatory requirements...',
          type: 'value_prop',
          confidence: 71
        }
      ],
      quickActions: [
        { label: 'Send InMail', icon: '✉️', action: 'send_inmail' },
        { label: 'Save Lead', icon: '💾', action: 'save_lead' },
        { label: 'Add to Campaign', icon: '📊', action: 'add_to_campaign' },
        { label: 'View Similar', icon: '👥', action: 'view_similar' }
      ],
      summary: 'Experienced professional with strong background in target industry',
      keyPoints: ['5+ years relevant experience', 'Decision-maker role', 'Previously engaged with similar solutions'],
      engagementSuggestions: ['Reference mutual connections', 'Highlight industry-specific benefits']
    }
  };
  
  console.log('[Rubi Actions Stub] LinkedIn profile summary completed');
  return response;
}

/**
 * Stub implementation for generic page summary
 *
 * @param {Object} contextPayload - Context data from any page
 * @returns {Promise<Object>} Stub response
 */
async function stubGenericSummary(contextPayload) {
  console.log('[Rubi Actions Stub] Running generic summary stub');
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 400));
  
  const snippet = typeof window.RubiActionsUtils !== 'undefined' 
    ? window.RubiActionsUtils.extractSnippet(contextPayload, 500)
    : (contextPayload?.visibleText?.substring(0, 500) || 'No context available');
  
  const platform = contextPayload?.platform || 'unknown';
  const pageType = contextPayload?.pageType || 'unknown';
  
  const response = {
    success: true,
    type: 'stub',
    actionId: 'summarize_raw_context',
    message: 'Stub response for Generic Page Summary',
    contextSnippet: snippet,
    // Phase 10A: Include execution metadata for stubs
    executionMetadata: generateStubMetadata('summarize_raw_context'),
    stubData: {
      pageAnalysis: `This appears to be a ${pageType} page on ${platform}`,
      keyInsights: ['Page contains structured data', 'Multiple data points extracted', 'Context suitable for analysis'],
      suggestedActions: ['Review extracted fields', 'Check for additional context', 'Consider platform-specific actions']
    }
  };
  
  console.log('[Rubi Actions Stub] Generic summary completed');
  return response;
}

/**
 * Stub implementation for email message analysis
 *
 * @param {Object} contextPayload - Context data from Gmail compose page
 * @returns {Promise<Object>} Stub response
 */
async function stubEmailAnalysis(contextPayload) {
  console.log('[Rubi Actions Stub] Running email message analysis stub');
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 700));
  
  const snippet = typeof window.RubiActionsUtils !== 'undefined' 
    ? window.RubiActionsUtils.extractSnippet(contextPayload, 500)
    : (contextPayload?.visibleText?.substring(0, 500) || 'No context available');
  
  // Extract email details from context
  const toEmail = contextPayload?.fields?.toEmail || contextPayload?.fields?.recipients || 'john.smith@acmecorp.com';
  const subject = contextPayload?.fields?.subject || contextPayload?.fields?.emailSubject || 'Following up on our discussion';
  const draftBody = contextPayload?.fields?.draftMessage || contextPayload?.fields?.messageBody || 
    'Hi John,\n\nI wanted to follow up on our conversation yesterday about your infrastructure challenges...';
  
  const response = {
    success: true,
    type: 'stub',
    actionId: 'analyze_email_message',
    message: 'Stub response for Email Message Analysis',
    contextSnippet: snippet,
    // Phase 10A: Include execution metadata for stubs
    executionMetadata: generateStubMetadata('analyze_email_message'),
    stubData: {
      meta: {
        title: 'Message Coaching',
        subtitle: `Draft to ${toEmail.split('@')[0].replace('.', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}`
      },
      emailContext: {
        to: toEmail,
        subject: subject,
        from: 'you@yourcompany.com',
        timestamp: new Date().toISOString()
      },
      userMessage: {
        body: draftBody,
        maxLength: 2000
      },
      analysis: [
        {
          id: 'clear_cta',
          label: 'Clear Call to Action',
          value: 'Well-defined next step',
          severity: 'positive',
          icon: '✅',
          message: 'You\'ve requested a specific next step which increases response rate.'
        },
        {
          id: 'generic_opening',
          label: 'Generic Opening',
          value: 'Could be more specific',
          severity: 'warning',
          icon: '⚠️',
          message: 'Consider referencing specific pain points from your last conversation.'
        },
        {
          id: 'value_prop',
          label: 'Value Proposition',
          value: 'Missing clear value',
          severity: 'warning',
          icon: '⚠️',
          message: 'Explain how you solve their specific challenge to increase engagement.'
        },
        {
          id: 'length',
          label: 'Message Length',
          value: 'Optimal',
          severity: 'positive',
          icon: '✅',
          message: 'Your message is concise and to the point.'
        }
      ],
      scores: {
        clarity: 7,
        relevance: 4,
        momentum: 5,
        personalization: 3,
        professionalism: 8
      },
      analysisCard: {
        summary: 'Your email is professional but could be more personalized and value-focused.'
      },
      aiSuggestions: [
        {
          id: 'strengthen_opening',
          title: 'Strengthen Opening',
          preview: 'Hi John, following our conversation about reducing deployment time by 50%...',
          fullSuggestion: 'Hi John,\n\nFollowing our conversation about reducing deployment time by 50%, I\'ve been thinking about how our automated pipeline solution could specifically address the bottlenecks you mentioned with your current CI/CD process.',
          text: 'Hi John, following our conversation about reducing deployment time by 50%...',
          type: 'opening',
          confidence: 85
        },
        {
          id: 'add_social_proof',
          title: 'Add Social Proof',
          preview: 'Similar to what we did for TechCorp, where they saw a 60% reduction...',
          fullSuggestion: 'Similar to what we implemented for TechCorp (another enterprise SaaS company), where they saw a 60% reduction in deployment time and eliminated 90% of rollback incidents, we could help you achieve similar results.',
          text: 'Similar to what we did for TechCorp, where they saw a 60% reduction...',
          type: 'evidence',
          confidence: 78
        },
        {
          id: 'stronger_cta',
          title: 'Stronger Call to Action',
          preview: 'Could we schedule a 20-minute call this Thursday or Friday to discuss...',
          fullSuggestion: 'Could we schedule a 20-minute call this Thursday at 2 PM or Friday at 10 AM to walk through a customized demo focused on your specific use case? I\'ll show you exactly how we can address your deployment bottlenecks.',
          text: 'Could we schedule a 20-minute call this Thursday or Friday to discuss...',
          type: 'cta',
          confidence: 91
        }
      ],
      suggestionsCard: {
        footerButton: {
          label: 'Apply Best Suggestion',
          action: 'apply_suggestion'
        }
      }
    }
  };
  
  console.log('[Rubi Actions Stub] Email message analysis completed');
  return response;
}

/**
 * Stub implementation for dashboard insights
 *
 * @param {Object} contextPayload - Context data from generic page
 * @returns {Promise<Object>} Stub response
 */
async function stubDashboardInsights(contextPayload) {
  console.log('[Rubi Actions Stub] Running dashboard insights stub');
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const response = {
    success: true,
    type: 'stub',
    actionId: 'get_dashboard_insights',
    message: 'Stub response for Dashboard Insights',
    // Phase 10A: Include execution metadata for stubs
    executionMetadata: generateStubMetadata('get_dashboard_insights'),
    stubData: {
      meta: {
        title: 'SuccessLAB Dashboard',
        subtitle: 'AI-powered sales intelligence'
      },
      welcomeInsight: {
        title: 'Welcome to Rubi',
        content: 'Your AI assistant is actively monitoring for opportunities. Navigate to any supported platform to see contextual insights.',
        icon: '👋'
      },
      quickActions: [
        { label: 'Scan CRM', icon: '🔍', action: 'scan_crm', badge: 'New' },
        { label: 'Email Coach', icon: '✉️', action: 'email_coach' },
        { label: 'Call Prep', icon: '📞', action: 'call_prep' },
        { label: 'Research', icon: '🔬', action: 'research' },
        { label: 'Reports', icon: '📊', action: 'view_reports' },
        { label: 'Settings', icon: '⚙️', action: 'open_settings' }
      ],
      quickActionsColumns: 3,
      recommendedContent: {
        title: 'Recommended Resources',
        items: [
          {
            title: 'Sales Methodology Guide',
            type: 'Document',
            preview: 'Best practices for consultative selling approach',
            url: '#',
            relevance: 95
          },
          {
            title: 'Q4 Territory Plan Template',
            type: 'Template',
            preview: 'Strategic planning template for Q4 2024',
            url: '#',
            relevance: 88
          },
          {
            title: 'Competitive Battle Cards',
            type: 'Resource',
            preview: 'Updated positioning against key competitors',
            url: '#',
            relevance: 82
          }
        ]
      },
      notifications: {
        title: 'System Updates',
        count: 3,
        items: [
          {
            message: 'Rubi is monitoring for new opportunities',
            timestamp: 'Just now',
            type: 'info',
            read: false
          },
          {
            message: 'Email insights feature updated',
            timestamp: '2 hours ago',
            type: 'success',
            read: false
          },
          {
            message: 'CRM sync completed successfully',
            timestamp: '5 hours ago',
            type: 'success',
            read: true
          }
        ]
      },
      recentActivity: {
        title: 'Recent Activity',
        timeRange: 'Last 7 days',
        activities: [
          {
            activity: 'Analyzed opportunity: Enterprise Deal - TechCorp',
            timestamp: '2 hours ago',
            user: 'You',
            icon: '📊',
            details: 'Risk score: Low, Next steps identified'
          },
          {
            activity: 'LinkedIn profile researched: Jane Doe, CTO at StartupCo',
            timestamp: '5 hours ago',
            user: 'You',
            icon: '👤',
            details: 'Key talking points generated'
          },
          {
            activity: 'Email coaching session: Follow-up to demo',
            timestamp: 'Yesterday',
            user: 'You',
            icon: '✉️',
            details: 'Engagement score improved by 40%'
          },
          {
            activity: 'Meeting prep completed: Quarterly review with Acme',
            timestamp: '2 days ago',
            user: 'You',
            icon: '📅',
            details: '5 strategic questions prepared'
          }
        ]
      }
    }
  };
  
  console.log('[Rubi Actions Stub] Dashboard insights completed');
  return response;
}

/**
 * Stub for testing error handling
 *
 * @param {Object} contextPayload - Context data
 * @returns {Promise<Object>} Stub error response
 */
async function stubErrorTest(contextPayload) {
  console.log('[Rubi Actions Stub] Running error test stub');
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  throw new Error('Simulated action failure for testing');
}

/**
 * Get list of all available stub actions
 *
 * @returns {Array} Array of stub action information
 */
function getAvailableStubs() {
  return [
    {
      id: 'analyze_opportunity_risk',
      name: 'Opportunity Risk Analysis',
      description: 'Analyze risk factors for Salesforce opportunities'
    },
    {
      id: 'summarize_linkedin_profile', 
      name: 'LinkedIn Profile Summary',
      description: 'Summarize LinkedIn profiles for engagement planning'
    },
    {
      id: 'summarize_raw_context',
      name: 'Generic Page Summary',
      description: 'General page analysis and summary'
    },
    {
      id: 'analyze_email_message',
      name: 'Email Message Analysis',
      description: 'Analyze and provide coaching for email drafts'
    },
    {
      id: 'get_dashboard_insights',
      name: 'Dashboard Insights',
      description: 'Get dashboard overview and recommendations'
    }
  ];
}

// Export for use in content scripts
if (typeof window !== 'undefined') {
  window.RubiActionsStubs = {
    stubOpportunityRisk,
    stubLinkedInSummary,
    stubGenericSummary,
    stubEmailAnalysis,
    stubDashboardInsights,
    stubErrorTest,
    getAvailableStubs
  };
}