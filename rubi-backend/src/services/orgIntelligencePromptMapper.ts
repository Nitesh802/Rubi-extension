/**
 * Organization Intelligence Prompt Mapper
 * Provides consistent transformation of OrgIntelligence data for prompt templates
 */

import { OrgIntelligence } from '../types/orgIntelligence';
import { logger } from '../logging/logger';

export interface PromptIntelligence {
  company: {
    name: string;
    description: string;
    mission: string;
    tagline: string;
    industry: string;
  };
  valueProps: Array<{
    title: string;
    description: string;
    metrics: string[];
  }>;
  differentiators: string[];
  messagingRules: {
    tone: string[];
    forbidden: string[];
    preferred: Record<string, string>;
    style: string;
  };
  targetPersonas: Array<{
    role: string;
    goals: string[];
    style: string;
  }>;
  icp: {
    industries: string[];
    roles: string[];
    triggers: string[];
    painPoints: string[];
    companySizes?: string[];
  };
  narratives: Array<{
    title: string;
    pillars: string[];
  }>;
  objections: Array<{
    objection: string;
    response: string;
  }>;
  successStories?: Array<{
    client: string;
    outcome: string;
  }>;
}

export class OrgIntelligencePromptMapper {
  /**
   * Convert full OrgIntelligence to prompt-optimized format
   * @param intelligence - Full org intelligence object
   * @param options - Options for customizing the output
   * @returns Simplified intelligence for prompts
   */
  static mapForPrompt(
    intelligence: OrgIntelligence | null,
    options: {
      maxValueProps?: number;
      maxDifferentiators?: number;
      maxPersonas?: number;
      maxNarratives?: number;
      maxObjections?: number;
      includeSuccessStories?: boolean;
    } = {}
  ): PromptIntelligence | null {
    if (!intelligence) return null;

    const {
      maxValueProps = 3,
      maxDifferentiators = 3,
      maxPersonas = 3,
      maxNarratives = 2,
      maxObjections = 5,
      includeSuccessStories = false,
    } = options;

    try {
      const mapped: PromptIntelligence = {
        company: {
          name: intelligence.companyIdentity.companyName,
          description: intelligence.companyIdentity.companyDescription,
          mission: intelligence.companyIdentity.missionStatement,
          tagline: intelligence.companyIdentity.tagline,
          industry: intelligence.companyIdentity.primaryIndustry,
        },
        valueProps: intelligence.valuePropositions.slice(0, maxValueProps).map(vp => ({
          title: vp.title,
          description: vp.description,
          metrics: vp.metrics.slice(0, 2),
        })),
        differentiators: intelligence.differentiators
          .slice(0, maxDifferentiators)
          .map(d => `${d.name}: ${d.explanation}`),
        messagingRules: {
          tone: intelligence.messagingRules.toneGuidelines.slice(0, 3),
          forbidden: intelligence.messagingRules.forbiddenPhrases.slice(0, 5),
          preferred: Object.entries(intelligence.messagingRules.preferredTerms)
            .slice(0, 5)
            .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {}),
          style: intelligence.messagingRules.interactionStyle,
        },
        targetPersonas: intelligence.buyerPersonas.slice(0, maxPersonas).map(p => ({
          role: p.roleTitle,
          goals: p.goals.slice(0, 3),
          style: p.preferredLanguageStyle,
        })),
        icp: {
          industries: intelligence.icp.targetIndustries.slice(0, 5),
          roles: intelligence.icp.targetRoles.slice(0, 5),
          triggers: intelligence.icp.buyingTriggers.slice(0, 3),
          painPoints: intelligence.icp.painPoints.slice(0, 3),
          companySizes: intelligence.icp.companySizes,
        },
        narratives: intelligence.strategicNarratives.slice(0, maxNarratives).map(n => ({
          title: n.title,
          pillars: n.messagingPillars.slice(0, 3),
        })),
        objections: intelligence.objectionLibrary.slice(0, maxObjections).map(o => ({
          objection: o.objectionText,
          response: o.counterMessage,
        })),
      };

      // Optionally include success stories
      if (includeSuccessStories && intelligence.successStories) {
        mapped.successStories = intelligence.successStories.slice(0, 3).map(s => ({
          client: s.clientName,
          outcome: s.results,
        }));
      }

      return mapped;
    } catch (error) {
      logger.error('Failed to map org intelligence for prompt', { error });
      return null;
    }
  }

  /**
   * Map intelligence for specific action types with tailored content
   */
  static mapForAction(
    intelligence: OrgIntelligence | null,
    actionName: string
  ): PromptIntelligence | null {
    if (!intelligence) return null;

    // Customize mapping based on action type
    switch (actionName) {
      case 'analyze_email_message':
        return this.mapForPrompt(intelligence, {
          maxValueProps: 3,
          maxDifferentiators: 2,
          maxPersonas: 3,
          maxNarratives: 2,
          maxObjections: 5,
          includeSuccessStories: false,
        });

      case 'get_dashboard_insights':
        return this.mapForPrompt(intelligence, {
          maxValueProps: 4,
          maxDifferentiators: 3,
          maxPersonas: 2,
          maxNarratives: 3,
          maxObjections: 3,
          includeSuccessStories: true,
        });

      case 'analyze_linkedin_profile':
      case 'summarize_linkedin_profile':
        return this.mapForPrompt(intelligence, {
          maxValueProps: 3,
          maxDifferentiators: 3,
          maxPersonas: 3,
          maxNarratives: 2,
          maxObjections: 4,
          includeSuccessStories: false,
        });

      case 'analyze_opportunity_risk':
        return this.mapForPrompt(intelligence, {
          maxValueProps: 4,
          maxDifferentiators: 3,
          maxPersonas: 2,
          maxNarratives: 2,
          maxObjections: 6,
          includeSuccessStories: true,
        });

      default:
        // Default mapping for unknown actions
        return this.mapForPrompt(intelligence);
    }
  }

  /**
   * Extract only messaging rules for lightweight usage
   */
  static getMessagingRules(intelligence: OrgIntelligence | null) {
    if (!intelligence) return null;

    return {
      tone: intelligence.messagingRules.toneGuidelines,
      forbidden: intelligence.messagingRules.forbiddenPhrases,
      preferred: intelligence.messagingRules.preferredTerms,
      style: intelligence.messagingRules.interactionStyle,
    };
  }

  /**
   * Get ICP criteria for opportunity scoring
   */
  static getICPCriteria(intelligence: OrgIntelligence | null) {
    if (!intelligence) return null;

    return {
      industries: intelligence.icp.targetIndustries,
      roles: intelligence.icp.targetRoles,
      companySizes: intelligence.icp.companySizes,
      painPoints: intelligence.icp.painPoints,
      triggers: intelligence.icp.buyingTriggers,
    };
  }

  /**
   * Check if a given context matches ICP
   * Returns a score from 0-100
   */
  static scoreICPFit(
    intelligence: OrgIntelligence | null,
    context: {
      industry?: string;
      role?: string;
      companySize?: string;
      painPoints?: string[];
      technologies?: string[];
    }
  ): number {
    if (!intelligence) return 50; // Neutral score if no intelligence

    let score = 0;
    let factors = 0;

    // Industry match (30 points)
    if (context.industry) {
      factors++;
      const industryMatch = intelligence.icp.targetIndustries.some(
        ind => ind.toLowerCase() === context.industry?.toLowerCase()
      );
      if (industryMatch) score += 30;
    }

    // Role match (30 points)
    if (context.role) {
      factors++;
      const roleMatch = intelligence.icp.targetRoles.some(
        role => role.toLowerCase().includes(context.role?.toLowerCase() || '')
      );
      if (roleMatch) score += 30;
    }

    // Company size match (20 points)
    if (context.companySize) {
      factors++;
      const sizeMatch = intelligence.icp.companySizes?.includes(context.companySize);
      if (sizeMatch) score += 20;
    }

    // Pain points match (20 points)
    if (context.painPoints && context.painPoints.length > 0) {
      factors++;
      const painPointMatches = context.painPoints.filter(pp =>
        intelligence.icp.painPoints.some(icpPain =>
          icpPain.toLowerCase().includes(pp.toLowerCase())
        )
      );
      score += Math.min(20, (painPointMatches.length / context.painPoints.length) * 20);
    }

    // If no factors to compare, return neutral score
    if (factors === 0) return 50;

    // Normalize score to 0-100 based on available factors
    return Math.round((score / (factors * 30)) * 100);
  }
}

// Export singleton-like static methods
export const orgIntelligencePromptMapper = OrgIntelligencePromptMapper;