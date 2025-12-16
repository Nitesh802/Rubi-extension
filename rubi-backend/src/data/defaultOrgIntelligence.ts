/**
 * Default Organization Intelligence for Fused
 * This matches the org intelligence defined in the browser extension
 */

import { OrgIntelligence } from '../types/orgIntelligence';

export const defaultFusedIntelligence: OrgIntelligence = {
  companyIdentity: {
    companyName: 'Fused',
    companyDescription: 'Boutique consulting and technology firm specializing in sales enablement through customized learning platforms, AI-powered coaching tools, and performance intelligence systems for B2B enterprise revenue teams',
    missionStatement: 'Transform B2B sales performance through the seamless integration of learning, workflow automation, and contextual AI that lives where sellers actually work',
    tagline: 'Performance Intelligence for Enterprise Sales',
    brandPromise: 'Deliver measurable sales performance improvement through custom-built enablement systems that combine methodology, technology, and in-the-flow coaching',
    headquarters: 'San Francisco, CA with operations in Lisbon, Portugal',
    regionsOperated: ['United States', 'Europe (Portugal, UK, Germany)', 'Canada'],
    employeeCount: '25-50',
    websiteUrl: 'https://fused.ai',
    primaryIndustry: 'Sales Enablement & Performance Technology',
    secondaryIndustries: ['Learning & Development', 'B2B Consulting', 'AI/ML Applications', 'Custom Software Development']
  },

  valuePropositions: [
    {
      title: 'Measurable Sales Performance Improvement',
      description: 'Drive quantifiable improvements in pipeline quality, deal velocity, and win rates through integrated enablement systems',
      proofPoints: [
        'Average 35% increase in qualified pipeline within 6 months',
        '42% reduction in sales rep ramp time',
        '28% improvement in average deal size',
        'ROI typically achieved within 120 days'
      ],
      examples: [
        'Waters Corporation: 40% pipeline quality improvement through SuccessLAB deployment',
        'Energy sector client: 50% reduction in new hire ramp time with AI simulations'
      ],
      metrics: ['Pipeline velocity +35%', 'Win rate improvement +22%', 'Forecast accuracy +45%', 'Rep productivity +4.2 hours/week']
    },
    {
      title: 'In-the-Flow-of-Work Enablement',
      description: 'Deliver coaching, intelligence, and tools directly within CRM, email, and collaboration platforms - no context switching required',
      proofPoints: [
        'Sub-2 second contextual intelligence delivery',
        '95% adoption rate within 30 days',
        'Zero additional logins or platforms to manage',
        'Seamless integration with existing tech stack'
      ],
      examples: [
        'Salesforce embedded coaching for MEDDICC qualification',
        'Gmail Pitch Practice for real-time email optimization',
        'LinkedIn intelligence overlay for prospect research'
      ],
      metrics: ['Time saved: 5+ hours/week/rep', 'CRM hygiene: 89% data completeness', 'Adoption: 95% daily active usage']
    },
    {
      title: 'AI-Powered Coaching at Scale',
      description: 'Deploy consistent, personalized coaching through AI simulations, conversation intelligence, and contextual guidance',
      proofPoints: [
        'Custom AI models trained on your top performers',
        'Real-time feedback on discovery, negotiation, and storytelling',
        'Automated role-plays with 200+ scenario variations',
        'Manager coaching amplification through AI insights'
      ],
      examples: [
        'SalesTrainer AI: Interactive discovery call simulations',
        'Pitch Practice: Email and proposal optimization',
        'Customer Intelligence Engine: Account strategy recommendations'
      ],
      metrics: ['Coaching coverage: 100% of interactions', 'Quality score improvement: +31%', 'Manager time saved: 8 hours/week']
    }
  ],

  differentiators: [
    {
      name: 'Context Engineering Rigor',
      explanation: 'Sophisticated prompt engineering and schema-based orchestration that ensures AI outputs are accurate, relevant, and actionable',
      customerRelevance: 'AI that actually works in complex B2B sales scenarios, not generic chatbot responses',
      supportingEvidence: '98% accuracy in opportunity assessment, 94% relevance score on coaching feedback',
      competitorComparison: 'Unlike generic AI tools that produce hallucinations and irrelevant suggestions'
    },
    {
      name: 'Deep Workflow Integration',
      explanation: 'Native integration with Salesforce, Gmail, LinkedIn, and collaboration tools - intelligence delivered where work happens',
      customerRelevance: 'No behavior change required, instant adoption, immediate value',
      supportingEvidence: 'Average 95% adoption in 30 days, 5+ hours saved per rep weekly',
      competitorComparison: 'Not another standalone platform requiring separate login and data entry'
    },
    {
      name: 'Boutique Senior Expertise',
      explanation: 'Direct access to senior consultants who understand both sales methodology and technical implementation',
      customerRelevance: 'Strategic partner, not just vendor - we understand your business and build accordingly',
      supportingEvidence: 'Average consultant experience: 15+ years, All projects led by senior partners',
      competitorComparison: 'Not outsourced to junior resources or offshore teams like larger consultancies'
    }
  ],

  productCatalog: [
    {
      name: 'Rubi Platform',
      category: 'Core Platform',
      description: 'White-labeled, Moodle-based learning and collaboration hub with AI-powered tools, customized for each client\'s brand and methodology',
      idealUseCases: ['Enterprise sales enablement', 'New hire onboarding', 'Product launch training', 'Ongoing coaching and development'],
      benefits: [
        'Single source of truth for all enablement content',
        'Seamless integration with existing tools',
        'Measurable behavior change and performance improvement',
        'Reduced time to productivity for new hires'
      ],
      features: [
        'Custom branding and white-labeling',
        'AI-powered content recommendations',
        'Interactive learning paths',
        'Collaboration spaces and communities'
      ],
      successMetrics: ['User engagement rate', 'Content completion', 'Knowledge retention scores', 'Time to competency']
    },
    {
      name: 'SalesTrainer AI',
      category: 'AI Coaching',
      description: 'Interactive AI simulations for sales conversations including discovery, demo, negotiation, and objection handling scenarios',
      idealUseCases: ['Sales skill development', 'New product training', 'Methodology reinforcement', 'Interview preparation'],
      benefits: [
        'Unlimited practice without manager time',
        'Consistent coaching at scale',
        'Safe environment for experimentation',
        'Personalized feedback and improvement paths'
      ],
      features: [
        '200+ customizable scenarios',
        'Real-time conversational AI',
        'Scoring and feedback engine',
        'Video and audio analysis'
      ],
      successMetrics: ['Simulation completion rate', 'Skill score improvement', 'Confidence ratings', 'Real-world performance correlation']
    }
  ],

  icp: {
    targetIndustries: [
      'Enterprise B2B Software/SaaS',
      'Life Sciences & Pharmaceuticals',
      'Medical Devices & Diagnostics',
      'Energy & Utilities',
      'Financial Services',
      'Industrial & Manufacturing'
    ],
    targetRoles: [
      'VP Sales / Chief Revenue Officer',
      'Head of Sales Enablement',
      'Director of Commercial Excellence',
      'Sales Operations Leader',
      'Learning & Development Leader',
      'Sales Productivity Manager'
    ],
    companySizes: [
      '500-2000 employees (mid-market)',
      '2000-10000 employees (enterprise)',
      '10000+ employees (large enterprise)'
    ],
    geographicFocus: [
      'North America (US & Canada)',
      'Western Europe (UK, Germany, France)',
      'Northern Europe (Nordics, Benelux)'
    ],
    buyingTriggers: [
      'Pipeline quality crisis (40% or more unqualified)',
      'New product or solution launch',
      'Sales methodology rollout or refresh',
      'High rep turnover or scaling challenges',
      'CRM adoption below 60%',
      'Missed revenue targets for 2+ quarters'
    ],
    painPoints: [
      'Reps spending 70% of time on non-selling activities',
      'Inconsistent deal qualification and methodology adherence',
      '6-9 month ramp time for new hires',
      'Managers lack time for meaningful coaching',
      'Training doesn\'t translate to behavior change',
      'Difficulty scaling best practices across team'
    ],
    goals: [
      'Improve pipeline quality and predictability',
      'Reduce sales cycle length by 20-30%',
      'Increase average deal size',
      'Accelerate new hire time to productivity',
      'Scale coaching without adding headcount',
      'Improve forecast accuracy above 85%'
    ],
    maturityLevelIndicators: [
      'Has defined sales methodology (MEDDIC, Challenger, etc.)',
      'CRM is primary system of record',
      'Invests in enablement (headcount and budget)',
      'Values data-driven decision making',
      'Executive sponsorship for transformation initiatives'
    ]
  },

  buyerPersonas: [
    {
      personaName: 'VP Sales Victor',
      roleTitle: 'VP Sales / Chief Revenue Officer',
      goals: [
        'Hit or exceed revenue targets consistently',
        'Build predictable, high-quality pipeline',
        'Reduce sales cycle length and increase deal size',
        'Develop and retain top talent',
        'Gain competitive advantage'
      ],
      frustrations: [
        'Reps not following sales methodology',
        'Poor pipeline visibility and forecast accuracy',
        'Too much time on reporting, not enough on coaching',
        'Losing deals to competition',
        'Can\'t scale what\'s working'
      ],
      kpis: [
        'Revenue attainment',
        'Pipeline coverage ratio',
        'Win rate',
        'Average deal size',
        'Sales cycle length'
      ],
      buyingMotivation: 'Need to predictably hit number while scaling the team efficiently',
      typicalObjections: [
        'We\'ve tried enablement tools before',
        'My reps won\'t adopt another system',
        'We don\'t have time for long implementations'
      ],
      preferredLanguageStyle: 'Direct, ROI-focused, metrics-driven, executive-level',
      doSayThinkFeel: 'Do: Review pipeline daily. Say: "We need to improve our execution." Think: "How do I scale what\'s working?" Feel: Pressure to deliver results quarter after quarter.'
    },
    {
      personaName: 'Enablement Emma',
      roleTitle: 'Head of Sales Enablement / Commercial Excellence',
      goals: [
        'Drive measurable performance improvement',
        'Deliver effective onboarding and training',
        'Enable consistent methodology adoption',
        'Prove ROI of enablement investments',
        'Build strategic enablement function'
      ],
      frustrations: [
        'Limited resources and budget',
        'Lack of engagement with training programs',
        'Difficulty measuring impact',
        'Technology limitations',
        'Siloed from sales leadership'
      ],
      kpis: [
        'Time to first deal',
        'Ramp time reduction',
        'Training completion rates',
        'Methodology adoption scores',
        'Performance improvement metrics'
      ],
      buyingMotivation: 'Build a world-class enablement function that drives measurable results',
      typicalObjections: [
        'We already have an LMS',
        'IT won\'t approve another vendor',
        'We need to build this internally'
      ],
      preferredLanguageStyle: 'Strategic, process-oriented, best-practice focused, collaborative',
      doSayThinkFeel: 'Do: Design programs and content. Say: "How do we scale this?" Think: "I need to prove our impact." Feel: Excited about potential but frustrated by constraints.'
    }
  ],

  competitiveLandscape: [
    {
      competitorName: 'Traditional LMS Vendor',
      competitorSummary: 'Legacy learning management systems like Cornerstone, Docebo, or Lessonly',
      weaknesses: [
        'Not designed for sales workflows',
        'Poor integration with sales tools',
        'Generic content libraries',
        'Limited AI capabilities',
        'Separate login required'
      ],
      howToWinAgainst: 'Emphasize in-the-flow enablement, AI coaching, and sales-specific design',
      redFlags: [
        'Current LMS contract in place',
        'L&D owns decision (not sales)',
        'Focus on compliance training'
      ],
      opportunitySignals: [
        'Low LMS adoption by sales',
        'Complaints about relevance',
        'Need for sales-specific tools'
      ],
      differentiationPoints: [
        'Built for sales, not generic training',
        'AI coaching and intelligence',
        'No separate login needed',
        'Methodology reinforcement'
      ]
    },
    {
      competitorName: 'Horizontal AI Tool',
      competitorSummary: 'Generic AI platforms like ChatGPT, Claude, or Microsoft Copilot',
      weaknesses: [
        'No sales context or methodology',
        'Hallucinations and inaccuracies',
        'Security and compliance concerns',
        'No CRM integration',
        'Requires prompt engineering skills'
      ],
      howToWinAgainst: 'Highlight purpose-built for sales, accuracy, security, and integration',
      redFlags: [
        'DIY mindset',
        'Underestimate complexity',
        'No budget allocated'
      ],
      opportunitySignals: [
        'Tried generic AI and frustrated',
        'Security concerns raised',
        'Need for consistency'
      ],
      differentiationPoints: [
        'Pre-trained on sales scenarios',
        'Integrated with sales tools',
        'Consistent methodology application',
        'Enterprise security and compliance'
      ]
    }
  ],

  strategicNarratives: [
    {
      title: 'From Training Events to Performance Systems',
      messagingPillars: [
        'Traditional training doesn\'t change behavior',
        'Learning must happen in the flow of work',
        'AI can deliver personalized coaching at scale',
        'Performance improvement requires integrated systems'
      ],
      supportingTruths: [
        '87% of training content is forgotten within 30 days',
        'Reps spend only 33% of time selling',
        'Managers have less than 2 hours per week for coaching',
        'Average B2B sale involves 6-10 decision makers'
      ],
      examples: [
        'Sales kickoff training forgotten by Q2',
        'CRM adoption below 50% despite training',
        'Reps reverting to old habits under pressure',
        'Managers becoming deal closers, not coaches'
      ],
      analogies: [
        'Like having a GPS vs memorizing directions',
        'Spell-check for sales conversations',
        'Flight simulator for customer interactions',
        'Personal trainer for revenue teams'
      ],
      storyArc: 'Acknowledge training limitations → Paint vision of integrated performance system → Show how Fused delivers this → Share success metrics'
    },
    {
      title: 'Solving the 40% Pipeline Crisis',
      messagingPillars: [
        '40% of pipeline is typically unqualified',
        'Poor qualification leads to wasted resources',
        'AI can assess and improve pipeline quality',
        'Better pipeline leads to predictable revenue'
      ],
      supportingTruths: [
        'Average win rate is only 20-25%',
        '60% of deals end in no decision',
        'Sales cycles increasing 22% year-over-year',
        'Cost of poor qualification: $1.2M per year'
      ],
      examples: [
        'Reps chasing deals that will never close',
        'Surprise losses in late-stage pipeline',
        'Forecast misses due to phantom deals',
        'Resources wasted on unwinnable opportunities'
      ],
      analogies: [
        'Pipeline like a leaky bucket',
        'Qualifying like panning for gold',
        'Bad pipeline like junk food - filling but not nutritious',
        'AI as pipeline quality inspector'
      ],
      storyArc: 'Expose pipeline quality problem → Quantify impact → Present intelligent qualification solution → Demonstrate ROI'
    }
  ],

  objectionLibrary: [
    {
      objectionText: 'We already have an LMS',
      rootCause: 'Perception that LMS solves enablement needs',
      counterMessage: 'Your LMS is great for training delivery, but Fused adds the AI coaching and workflow integration that drives actual performance change. We complement your LMS investment.',
      supportiveData: 'Companies using both LMS and Fused see 3x better sales performance metrics than LMS alone',
      discoveryQuestions: [
        'How well is your sales team adopting the LMS?',
        'Does your LMS provide in-the-moment coaching?',
        'Can reps access LMS content within Salesforce?'
      ]
    },
    {
      objectionText: 'We don\'t want another AI tool',
      rootCause: 'AI fatigue and failed implementations',
      counterMessage: 'This isn\'t another generic AI tool - it\'s purpose-built intelligence for B2B sales, trained on your methodology and integrated into your existing workflow.',
      supportiveData: 'Our AI has 98% accuracy because it\'s specialized for sales, not trying to be everything',
      discoveryQuestions: [
        'What\'s been your experience with AI tools so far?',
        'Where do you see AI helping your sales team most?',
        'How important is accuracy and relevance in AI recommendations?'
      ]
    },
    {
      objectionText: 'Our reps won\'t use it',
      rootCause: 'Change management concerns and past adoption failures',
      counterMessage: 'Reps adopt Fused because it makes their job easier, not harder. No new logins, no behavior change - just intelligence where they already work.',
      supportiveData: '95% daily active usage within 30 days because we reduce work, not add to it',
      discoveryQuestions: [
        'What tools do your reps use most today?',
        'What\'s caused poor adoption in the past?',
        'If reps could save 5 hours per week, would they use it?'
      ]
    }
  ],

  messagingRules: {
    toneGuidelines: [
      'Professional and authoritative without being arrogant',
      'Data-driven and specific, not vague or hyperbolic',
      'Action-oriented and practical, not theoretical',
      'Consultative and helpful, not pushy or salesy',
      'Clear and direct, avoiding jargon when possible'
    ],
    forbiddenPhrases: [
      'Revolutionary',
      'Game-changing',
      'Disruptive',
      'Silver bullet',
      'Magic',
      'Best-in-class',
      'Cutting-edge',
      'World-class',
      'Synergy',
      'Low-hanging fruit'
    ],
    preferredTerms: {
      'AI': 'Intelligence or coaching',
      'Tool': 'Platform or system',
      'User': 'Sales professional or rep',
      'Feature': 'Capability',
      'Training': 'Enablement',
      'Content': 'Resources or guidance',
      'Buy': 'Partner or invest',
      'Sell': 'Position or articulate value',
      'Problem': 'Challenge or opportunity',
      'Solution': 'Approach or system'
    },
    formattingRules: [
      'Lead with business impact, not product features',
      'Use specific metrics and data points',
      'Keep sentences under 20 words when possible',
      'Use bullet points for multiple benefits or examples',
      'Bold key metrics and important phrases',
      'Include customer examples when relevant'
    ],
    interactionStyle: 'Strategic consultant who understands both business and technology',
    responseLengthGuidelines: {
      'email': '3-5 sentences for initial outreach, 2-3 paragraphs for follow-up',
      'linkedin': '2-3 sentences maximum, focus on one key point',
      'slackMessage': '1-2 sentences, very casual and brief',
      'proposal': '2-3 pages executive summary, 10-15 pages full proposal',
      'demo': '45 minutes talk time, 15 minutes Q&A'
    }
  },

  industryIntelligence: [
    {
      industryName: 'B2B SaaS',
      majorTrends: [
        'Shift from growth at all costs to efficient growth',
        'PLG companies adding enterprise sales motions',
        'Consolidation and increased competition',
        'AI becoming table stakes',
        'Longer sales cycles and more stakeholders'
      ],
      commonChallenges: [
        'CAC payback periods extending beyond 18 months',
        'Win rates declining due to competition',
        'Difficulty differentiating in crowded market',
        'Scaling from founder-led sales',
        'Maintaining growth while improving efficiency'
      ],
      regulatoryIssues: [
        'SOC 2 Type II certification required',
        'GDPR and data privacy compliance',
        'Industry-specific compliance (HIPAA, FedRAMP)',
        'AI governance and transparency requirements'
      ],
      kpis: [
        'ARR growth rate',
        'CAC payback period',
        'Net Revenue Retention (NRR)',
        'Gross margin',
        'Sales efficiency (magic number)'
      ],
      strategicPriorities: [
        'Improve sales efficiency and reduce CAC',
        'Expand within existing accounts',
        'Move upmarket to enterprise',
        'Differentiate through customer success',
        'Build predictable revenue engine'
      ],
      buyingBehaviors: [
        'Extensive vendor evaluation process',
        'POC or pilot required',
        'Multiple stakeholder sign-off',
        'Heavy focus on ROI and integration',
        'Preference for consumption-based pricing'
      ]
    },
    {
      industryName: 'Life Sciences / Pharma',
      majorTrends: [
        'Digital transformation acceleration',
        'Shift to value-based selling',
        'Increased regulatory scrutiny',
        'Personalized medicine and targeted therapies',
        'Direct-to-patient engagement models'
      ],
      commonChallenges: [
        'Complex stakeholder landscape (providers, payers, patients)',
        'Regulatory constraints on sales activities',
        'Long sales cycles (12-24 months)',
        'Demonstrating clinical and economic value',
        'Field force effectiveness and access'
      ],
      regulatoryIssues: [
        'FDA regulations and compliance',
        'Sunshine Act reporting',
        'HIPAA and patient privacy',
        'Anti-kickback statutes',
        'International regulatory variations'
      ],
      kpis: [
        'Territory coverage and reach',
        'HCP engagement rates',
        'Message recall and retention',
        'Market share growth',
        'Launch success metrics'
      ],
      strategicPriorities: [
        'Improve field force effectiveness',
        'Enhance HCP engagement and access',
        'Accelerate product launch success',
        'Build evidence-based value stories',
        'Ensure regulatory compliance'
      ],
      buyingBehaviors: [
        'Risk-averse with long decision cycles',
        'Heavy IT and compliance involvement',
        'Preference for proven vendors',
        'Extensive pilot and validation requirements',
        'Global rollout considerations'
      ]
    }
  ],

  successStories: [
    {
      clientName: 'Global Analytics Software Company',
      industry: 'B2B SaaS',
      challenge: 'Sales team struggled with 40% pipeline consisting of unqualified opportunities, leading to poor forecast accuracy and wasted resources on deals that would never close',
      solution: 'Implemented Rubi platform with custom MEDDPICC qualification system, AI-powered opportunity scoring, and automated coaching for discovery calls',
      results: 'Within 6 months: Pipeline quality improved by 45%, forecast accuracy increased from 68% to 89%, and win rate improved from 19% to 27%',
      metrics: {
        before: {pipelineQuality: '60%', forecastAccuracy: '68%', winRate: '19%'},
        after: {pipelineQuality: '87%', forecastAccuracy: '89%', winRate: '27%'}
      },
      quote: 'Fused helped us transform our pipeline from quantity to quality. Our reps now spend time on deals that actually close.'
    },
    {
      clientName: 'Mid-Size Pharmaceutical Company',
      industry: 'Life Sciences',
      challenge: 'New product launch required training 200+ sales reps on complex clinical data and value messaging within 90 days while ensuring compliance',
      solution: 'Deployed white-labeled SuccessLAB hub with AI simulation training, compliant message templates, and real-time coaching for HCP interactions',
      results: 'Achieved 100% certification in 60 days, 94% message consistency in field, and exceeded launch targets by 23% in first two quarters',
      metrics: {
        before: {trainingTime: '6 months', messageConsistency: '45%', launchReadiness: '60%'},
        after: {trainingTime: '60 days', messageConsistency: '94%', launchReadiness: '100%'}
      },
      quote: 'The combination of AI simulations and compliant coaching tools gave our team confidence and competence for a successful launch.'
    }
  ]
};