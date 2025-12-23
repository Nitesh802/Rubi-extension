import { ActionDefinition, ActionHandler, NormalizedRubiContextPayload, ActionUtilities, ActionResponse, AuthenticatedRequestContext } from '../types';
import { analyzeLinkedInProfile } from './handlers/analyze-linkedin-profile';
import { analyzeOpportunityRisk } from './handlers/analyze-opportunity-risk';
import { analyzeEmailMessage } from './handlers/analyze-email-message';
import { getDashboardInsights } from './handlers/get-dashboard-insights';
import { generateEmailDraft } from './handlers/generate-email-draft';
import { extractActionItems } from './handlers/extract-action-items';

export class ActionRegistry {
  private actions: Map<string, ActionDefinition> = new Map();

  constructor() {
    this.registerDefaultActions();
  }

  private registerDefaultActions(): void {
    this.register({
      name: 'analyze_linkedin_profile',
      description: 'Analyze a LinkedIn profile for insights and recommendations',
      templateFile: 'analyze_linkedin_profile',
      schemaFile: 'analyze_linkedin_profile',
      handler: analyzeLinkedInProfile,
      requiresAuth: true,
      rateLimit: {
        windowMs: 60000,
        max: 10,
      },
    });

    this.register({
      name: 'analyze_opportunity_risk',
      description: 'Analyze Salesforce opportunity for risk assessment',
      templateFile: 'analyze_opportunity_risk',
      schemaFile: 'analyze_opportunity_risk',
      handler: analyzeOpportunityRisk,
      requiresAuth: true,
      rateLimit: {
        windowMs: 60000,
        max: 20,
      },
    });

    this.register({
      name: 'analyze_email_message',
      description: 'Analyze email message for tone, clarity, and suggestions',
      templateFile: 'analyze_email_message',
      schemaFile: 'analyze_email_message',
      handler: analyzeEmailMessage,
      requiresAuth: true,
      rateLimit: {
        windowMs: 60000,
        max: 30,
      },
    });

    this.register({
      name: 'get_dashboard_insights',
      description: 'Generate insights from dashboard data',
      templateFile: 'get_dashboard_insights',
      schemaFile: 'get_dashboard_insights',
      handler: getDashboardInsights,
      requiresAuth: true,
      rateLimit: {
        windowMs: 60000,
        max: 15,
      },
    });

    this.register({
      name: 'generate_email_draft',
      description: 'Generate a professional email draft based on context',
      templateFile: 'generate_email_draft',
      schemaFile: 'generate_email_draft',
      handler: generateEmailDraft,
      requiresAuth: true,
      rateLimit: {
        windowMs: 60000,
        max: 20,
      },
    });

    this.register({
      name: 'extract_action_items',
      description: 'Extract action items from meeting notes or conversations',
      templateFile: 'extract_action_items',
      schemaFile: 'extract_action_items',
      handler: extractActionItems,
      requiresAuth: true,
      rateLimit: {
        windowMs: 60000,
        max: 25,
      },
    });

    // Legacy action name aliases for extension compatibility
    this.register({
      name: 'summarize_linkedin_profile',
      description: 'Alias for analyze_linkedin_profile',
      templateFile: 'analyze_linkedin_profile',
      schemaFile: 'analyze_linkedin_profile',
      handler: analyzeLinkedInProfile,
      requiresAuth: true,
      rateLimit: {
        windowMs: 60000,
        max: 10,
      },
    });
  }

  register(action: ActionDefinition): void {
    if (this.actions.has(action.name)) {
      throw new Error(`Action ${action.name} is already registered`);
    }
    this.actions.set(action.name, action);
  }

  unregister(actionName: string): boolean {
    return this.actions.delete(actionName);
  }

  get(actionName: string): ActionDefinition | undefined {
    return this.actions.get(actionName);
  }

  has(actionName: string): boolean {
    return this.actions.has(actionName);
  }

  getAll(): ActionDefinition[] {
    return Array.from(this.actions.values());
  }

  getAllNames(): string[] {
    return Array.from(this.actions.keys());
  }

  async execute(
    actionName: string,
    payload: NormalizedRubiContextPayload,
    utilities: ActionUtilities,
    authContext?: AuthenticatedRequestContext
  ): Promise<ActionResponse> {
    const action = this.get(actionName);
    
    if (!action) {
      return {
        success: false,
        error: `Action ${actionName} not found`,
      };
    }

    try {
      // Phase 9B: Pass auth context to handler
      return await action.handler(payload, utilities, authContext);
    } catch (error) {
      utilities.logger.error(`Action ${actionName} execution failed`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Action execution failed',
      };
    }
  }

  getActionMetadata(actionName: string): Partial<ActionDefinition> | null {
    const action = this.get(actionName);
    if (!action) return null;

    return {
      name: action.name,
      description: action.description,
      requiresAuth: action.requiresAuth,
      rateLimit: action.rateLimit,
    };
  }

  validatePayloadForAction(
    actionName: string,
    payload: NormalizedRubiContextPayload
  ): { valid: boolean; errors?: string[] } {
    const action = this.get(actionName);
    if (!action) {
      return { valid: false, errors: [`Action ${actionName} not found`] };
    }

    const errors: string[] = [];

    if (!payload.platform) {
      errors.push('Platform is required');
    }

    if (!payload.context || !payload.context.type) {
      errors.push('Context type is required');
    }

    if (!payload.url) {
      errors.push('URL is required');
    }

    if (!payload.timestamp) {
      errors.push('Timestamp is required');
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }
}

export const actionRegistry = new ActionRegistry();