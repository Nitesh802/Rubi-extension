/**
 * Organization Intelligence Types
 * Comprehensive schema for org-specific personalization
 */

export interface CompanyIdentity {
  companyName: string;
  companyDescription: string;
  missionStatement: string;
  tagline: string;
  brandPromise: string;
  headquarters: string;
  regionsOperated: string[];
  employeeCount: string;
  websiteUrl: string;
  primaryIndustry: string;
  secondaryIndustries: string[];
}

export interface ValueProposition {
  title: string;
  description: string;
  proofPoints: string[];
  examples: string[];
  metrics: string[];
}

export interface Differentiator {
  name: string;
  explanation: string;
  customerRelevance: string;
  supportingEvidence: string;
  competitorComparison: string;
}

export interface Product {
  name: string;
  category: string;
  description: string;
  idealUseCases: string[];
  benefits: string[];
  features: string[];
  successMetrics: string[];
}

export interface IdealCustomerProfile {
  targetIndustries: string[];
  targetRoles: string[];
  companySizes: string[];
  geographicFocus: string[];
  buyingTriggers: string[];
  painPoints: string[];
  goals: string[];
  maturityLevelIndicators: string[];
}

export interface BuyerPersona {
  personaName: string;
  roleTitle: string;
  goals: string[];
  frustrations: string[];
  kpis: string[];
  buyingMotivation: string;
  typicalObjections: string[];
  preferredLanguageStyle: string;
  doSayThinkFeel?: string;
}

export interface Competitor {
  competitorName: string;
  competitorSummary: string;
  weaknesses: string[];
  howToWinAgainst: string;
  redFlags: string[];
  opportunitySignals: string[];
  differentiationPoints: string[];
}

export interface StrategicNarrative {
  title: string;
  messagingPillars: string[];
  supportingTruths: string[];
  examples: string[];
  analogies: string[];
  storyArc: string;
}

export interface ObjectionHandler {
  objectionText: string;
  rootCause: string;
  counterMessage: string;
  supportiveData: string;
  discoveryQuestions: string[];
}

export interface MessagingRules {
  toneGuidelines: string[];
  forbiddenPhrases: string[];
  preferredTerms: Record<string, string>;
  formattingRules: string[];
  interactionStyle: string;
  responseLengthGuidelines: Record<string, string>;
}

export interface IndustryIntelligence {
  industryName: string;
  majorTrends: string[];
  commonChallenges: string[];
  regulatoryIssues: string[];
  kpis: string[];
  strategicPriorities: string[];
  buyingBehaviors: string[];
}

export interface SuccessStory {
  clientName: string;
  industry: string;
  challenge: string;
  solution: string;
  results: string;
  metrics: {
    before?: Record<string, string | number>;
    after?: Record<string, string | number>;
  };
  quote: string;
}

export interface OrgIntelligence {
  companyIdentity: CompanyIdentity;
  valuePropositions: ValueProposition[];
  differentiators: Differentiator[];
  productCatalog: Product[];
  icp: IdealCustomerProfile;
  buyerPersonas: BuyerPersona[];
  competitiveLandscape: Competitor[];
  strategicNarratives: StrategicNarrative[];
  objectionLibrary: ObjectionHandler[];
  messagingRules: MessagingRules;
  industryIntelligence: IndustryIntelligence[];
  successStories: SuccessStory[];
}

export type OrgIntelligenceSource = 'moodle' | 'backend_file' | 'default' | 'none';