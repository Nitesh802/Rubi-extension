#!/usr/bin/env node

/**
 * Development Test Harness for Organization Intelligence
 * 
 * This script tests the four main actions with org intelligence:
 * - analyze_linkedin_profile
 * - analyze_opportunity_risk  
 * - analyze_email_message
 * - get_dashboard_insights
 * 
 * Usage: npm run test:org-intel
 * or: npx ts-node src/dev/testOrgIntelligence.ts
 */

import { actionRegistry } from '../actions/registry';
import { templateEngine } from '../templates/template-engine';
import { schemaValidator } from '../schemas/schema-validator';
import { orgIntelligenceService } from '../services/orgIntelligenceService';
import { logger } from '../logging/logger';
import { NormalizedRubiContextPayload, ActionUtilities, AuthenticatedRequestContext } from '../types';
import * as fs from 'fs/promises';
import * as path from 'path';

// Test data fixtures
const TEST_PAYLOADS: Record<string, NormalizedRubiContextPayload> = {
  analyze_linkedin_profile: {
    url: 'https://www.linkedin.com/in/test-user/',
    platform: 'linkedin',
    pageType: 'profile',
    timestamp: new Date().toISOString(),
    context: {
      type: 'linkedin_profile',
      data: {
        name: 'John Smith',
        headline: 'VP of Sales at TechCorp',
        location: 'San Francisco, CA',
        company: 'TechCorp',
        experience: '15 years in enterprise SaaS sales',
        skills: ['Sales Management', 'Enterprise Software', 'Team Leadership'],
      },
    },
    fields: {
      name: 'John Smith',
      title: 'VP of Sales',
      company: 'TechCorp',
    },
    visibleText: 'VP of Sales with 15 years of experience in enterprise software sales...',
  },
  
  analyze_opportunity_risk: {
    url: 'https://salesforce.com/opportunity/123',
    platform: 'salesforce',
    pageType: 'opportunity',
    timestamp: new Date().toISOString(),
    context: {
      type: 'salesforce_opportunity',
      data: {
        opportunityName: 'TechCorp Q4 Enterprise Deal',
        amount: 250000,
        stage: 'Negotiation',
        closeDate: '2024-03-31',
        accountName: 'TechCorp',
        probability: 75,
      },
    },
    fields: {
      name: 'TechCorp Q4 Enterprise Deal',
      amount: '$250,000',
      stage: 'Negotiation',
    },
    visibleText: 'Opportunity: TechCorp Q4 Enterprise Deal - $250k - Negotiation stage...',
  },
  
  analyze_email_message: {
    url: 'https://mail.google.com/mail/u/0/#inbox/123',
    platform: 'gmail',
    pageType: 'email',
    timestamp: new Date().toISOString(),
    context: {
      type: 'email_message',
      data: {
        subject: 'Re: Proposal for Q4 Implementation',
        from: 'john.smith@techcorp.com',
        to: 'sales@fused.com',
        date: new Date().toISOString(),
      },
    },
    fields: {
      subject: 'Re: Proposal for Q4 Implementation',
      sender: 'john.smith@techcorp.com',
      recipient: 'sales@fused.com',
    },
    visibleText: `Hi Team,

Thanks for sending over the proposal. I've reviewed it with my team and we have a few questions:

1. Can you provide more details about the implementation timeline?
2. What kind of support is included in the first 90 days?
3. How does your solution compare to competitors in terms of ROI?

We're interested but need to justify the investment to our board. Looking forward to your response.

Best,
John`,
  },
  
  get_dashboard_insights: {
    url: 'https://app.rubi.ai/dashboard',
    platform: 'rubi',
    pageType: 'dashboard',
    timestamp: new Date().toISOString(),
    context: {
      type: 'dashboard',
      data: {
        totalOpportunities: 45,
        pipelineValue: 3500000,
        closedThisQuarter: 850000,
        winRate: 28,
        averageDealSize: 75000,
        stageDistribution: {
          'Prospecting': 15,
          'Qualification': 12,
          'Proposal': 8,
          'Negotiation': 6,
          'Closed Won': 4,
        },
      },
    },
    fields: {
      metric1: 'Pipeline: $3.5M',
      metric2: 'Win Rate: 28%',
      metric3: 'Avg Deal: $75K',
    },
    visibleText: 'Sales Dashboard - Q4 2024 - Pipeline $3.5M - 45 Active Opportunities...',
  },
};

// Mock utilities for testing
function createMockUtilities(actionName: string): ActionUtilities {
  return {
    renderPrompt: (template: any, data: any) => {
      // Use actual template rendering for realistic testing
      const Handlebars = require('handlebars');
      const systemTemplate = Handlebars.compile(template.systemPrompt || '');
      const userTemplate = Handlebars.compile(template.userPrompt || '');
      
      const systemPrompt = systemTemplate(data);
      const userPrompt = userTemplate(data);
      
      return {
        system: systemPrompt,
        user: userPrompt,
        combined: `System: ${systemPrompt}\n\nUser: ${userPrompt}`,
      };
    },
    
    callLLM: async (prompt: any, config: any) => {
      // Mock LLM response for testing
      console.log(`\n📝 [${actionName}] Generated Prompt (first 500 chars):`);
      const promptStr = typeof prompt === 'string' ? prompt : prompt.combined || JSON.stringify(prompt);
      console.log(promptStr.substring(0, 500) + '...\n');
      
      // Return mock successful response
      return {
        success: true,
        data: getMockResponse(actionName),
        usage: {
          promptTokens: 1000,
          completionTokens: 500,
          totalTokens: 1500,
        },
        model: config.model || 'gpt-4',
        provider: config.provider || 'openai',
        duration: 1234,
      };
    },
    
    validateSchema: (data: any, schemaName: string) => {
      // For testing, always return valid
      return {
        valid: true,
        data,
        errors: [],
      };
    },
    
    logger: {
      info: (msg: string, data?: any) => console.log(`ℹ️  ${msg}`, data || ''),
      warn: (msg: string, data?: any) => console.warn(`⚠️  ${msg}`, data || ''),
      error: (msg: string, data?: any) => console.error(`❌ ${msg}`, data || ''),
      debug: (msg: string, data?: any) => console.log(`🔍 ${msg}`, data || ''),
    } as any,
  };
}

// Mock responses for each action
function getMockResponse(actionName: string): any {
  const responses: Record<string, any> = {
    analyze_linkedin_profile: {
      summary: 'VP of Sales with extensive enterprise software experience',
      keyStrengths: ['Enterprise sales', 'Team leadership', 'SaaS expertise'],
      fitScore: { overall: 85 },
      personalizedOutreach: {
        recommendedApproach: 'Focus on ROI and team enablement',
        valuePropsToHighlight: ['Sales performance system', '40% productivity gain'],
      },
    },
    
    analyze_opportunity_risk: {
      dealHealth: {
        score: 75,
        trend: 'stable',
        stage: 'Negotiation',
        icpFitScore: 80,
      },
      riskFactors: [
        {
          category: 'timeline',
          severity: 'medium',
          description: 'Q4 close may slip to Q1',
        },
      ],
      nextActions: [
        {
          priority: 'high',
          action: 'Schedule executive alignment meeting',
        },
      ],
    },
    
    analyze_email_message: {
      clarityScore: 85,
      relevanceScore: 90,
      momentumScore: 70,
      overallScore: 82,
      suggestions: [
        {
          type: 'value_prop',
          suggestion: 'Emphasize 40% productivity improvement metric',
        },
      ],
      orgIntelligenceInsights: {
        messagingCompliance: { score: 85 },
        valuePropositionUsage: { effectiveness: 'moderate' },
      },
    },
    
    get_dashboard_insights: {
      recommendedActions: [
        {
          priority: 'critical',
          action: 'Focus on moving 6 deals in Negotiation to close',
        },
      ],
      kpiSummary: {
        topPerformers: [{ metric: 'Pipeline Value', value: '$3.5M' }],
      },
      orgIntelligenceInsights: {
        icpOpportunities: [
          {
            opportunity: 'TechCorp expansion',
            fitScore: 85,
          },
        ],
      },
    },
  };
  
  return responses[actionName] || {};
}

// Main test runner
async function runTests() {
  console.log('🧪 Organization Intelligence Test Harness\n');
  console.log('=' .repeat(60));
  
  // Test with Fused org intelligence
  console.log('\n📊 Testing with Fused Organization Intelligence\n');
  
  const { data: fusedIntel, source } = await orgIntelligenceService.getOrgIntelligence('fused');
  console.log(`✅ Loaded org intelligence from source: ${source}`);
  
  if (fusedIntel) {
    console.log(`   Company: ${fusedIntel.companyIdentity.companyName}`);
    console.log(`   Industry: ${fusedIntel.companyIdentity.primaryIndustry}`);
    console.log(`   Value Props: ${fusedIntel.valuePropositions.length}`);
    console.log(`   Personas: ${fusedIntel.buyerPersonas.length}`);
  }
  
  // Test each action
  const actions = [
    'analyze_linkedin_profile',
    'analyze_opportunity_risk',
    'analyze_email_message',
    'get_dashboard_insights',
  ];
  
  for (const actionName of actions) {
    console.log('\n' + '='.repeat(60));
    console.log(`\n🎯 Testing Action: ${actionName}\n`);
    
    const payload = TEST_PAYLOADS[actionName];
    if (!payload) {
      console.warn(`⚠️  No test payload for ${actionName}`);
      continue;
    }
    
    // Load template to check org intelligence usage
    try {
      const template = await templateEngine.loadTemplate(actionName);
      
      // Check if template uses org intelligence
      const hasOrgIntel = template.systemPrompt?.includes('orgIntelligence') || 
                         template.userPrompt?.includes('orgIntelligence');
      
      console.log(`📄 Template loaded: ${template.name}`);
      console.log(`🧠 Org Intelligence: ${hasOrgIntel ? '✅ Enabled' : '❌ Not configured'}`);
      
      // Create mock auth context with org intelligence
      const authContext: AuthenticatedRequestContext = {
        session: {
          sessionId: 'test-session',
          user: {
            userId: 'test-user',
            email: 'test@fused.com',
            name: 'Test User',
          },
          org: {
            orgId: 'fused',
            orgName: 'Fused',
          },
        },
        isDevMode: false,
        orgConfig: {
          orgId: 'fused',
          orgName: 'Fused',
          enabled: true,
        } as any,
        orgIntelligence: fusedIntel,
      } as any;
      
      // Get the action handler
      const handler = actionRegistry.get(actionName);
      if (!handler) {
        console.error(`❌ Action handler not found: ${actionName}`);
        continue;
      }
      
      // Create mock utilities
      const utilities = createMockUtilities(actionName);
      
      // Execute the action
      console.log(`\n🚀 Executing action...`);
      const result = await handler.handler(payload, utilities, authContext);
      
      // Display results
      if (result.success) {
        console.log(`\n✅ Action executed successfully`);
        console.log(`   Tokens used: ${result.metadata?.tokensUsed || 'N/A'}`);
        console.log(`   Model: ${result.metadata?.modelUsed || 'N/A'}`);
        console.log(`   Provider: ${result.metadata?.providerUsed || 'N/A'}`);
        console.log(`   Org Intel Applied: ${result.metadata?.orgIntelligenceApplied ? '✅' : '❌'}`);
        console.log(`   Org Intel Source: ${result.metadata?.orgIntelligenceSource || 'none'}`);
        
        // Check for org intelligence in response
        if (result.data?.orgIntelligenceInsights) {
          console.log(`\n🎯 Org Intelligence Insights Found:`);
          console.log(JSON.stringify(result.data.orgIntelligenceInsights, null, 2).substring(0, 300) + '...');
        }
      } else {
        console.error(`\n❌ Action failed: ${result.error}`);
      }
      
    } catch (error) {
      console.error(`❌ Error testing ${actionName}:`, error);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('\n✨ Test harness complete!\n');
  
  // Test without org intelligence (backwards compatibility)
  console.log('\n🔄 Testing Backwards Compatibility (no org intelligence)\n');
  
  const noIntelAction = 'analyze_email_message';
  const noIntelPayload = TEST_PAYLOADS[noIntelAction];
  
  const handler = actionRegistry.get(noIntelAction);
  if (handler) {
    const utilities = createMockUtilities(noIntelAction);
    const authContext = {} as AuthenticatedRequestContext; // Empty context
    
    const result = await handler.handler(noIntelPayload, utilities, authContext);
    
    if (result.success) {
      console.log(`✅ Action works without org intelligence`);
      console.log(`   Org Intel Applied: ${result.metadata?.orgIntelligenceApplied ? '✅' : '❌'}`);
    } else {
      console.error(`❌ Backwards compatibility issue: ${result.error}`);
    }
  }
  
  console.log('\n🎉 All tests complete!\n');
}

// Run tests if executed directly
if (require.main === module) {
  runTests().catch(error => {
    console.error('❌ Test harness failed:', error);
    process.exit(1);
  });
}

export { runTests, TEST_PAYLOADS, createMockUtilities };