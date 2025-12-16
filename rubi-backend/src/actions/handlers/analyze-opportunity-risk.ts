import { ActionHandler, LLMConfig } from '../../types';
import { templateEngine } from '../../templates/template-engine';
import { orgIntelligenceService } from '../../services/orgIntelligenceService';

export const analyzeOpportunityRisk: ActionHandler = async (payload, utilities, authContext) => {
  try {
    // Phase 11E: Extract org intelligence for consistency
    const orgId = authContext?.session?.org?.orgId || (authContext as any)?.orgConfig?.orgId || null;
    const orgIntelligence = (authContext as any)?.orgIntelligence || null;
    const orgIntelligenceSource = orgIntelligence ? 'provided' : 'none';
    
    utilities.logger.info('[Rubi Actions] Analyzing opportunity risk', {
      orgId,
      contextType: payload.context?.type,
      orgIntelligenceSource,
      orgIntelligenceApplied: !!orgIntelligence,
    });
    
    const template = await templateEngine.loadTemplate('analyze_opportunity_risk');
    
    // Phase 11E: Use the mapper for consistent org intelligence formatting
    const promptData = {
      ...payload,
      orgIntelligence: orgIntelligence 
        ? orgIntelligenceService.getIntelligenceForPrompt(orgIntelligence, 'analyze_opportunity_risk') 
        : null,
    };
    
    const prompt = utilities.renderPrompt(template, promptData);

    const llmConfig: Partial<LLMConfig> = {
      provider: template.model.provider,
      model: template.model.name,
      temperature: template.model.temperature || 0.3,
      maxTokens: template.model.maxTokens,
      responseFormat: { type: 'json_object' },
    };

    const llmResponse = await utilities.callLLM(prompt, llmConfig);

    if (!llmResponse.success) {
      return {
        success: false,
        error: llmResponse.error,
        metadata: {
          modelUsed: llmResponse.model,
          providerUsed: llmResponse.provider,
        },
      };
    }

    const validation = utilities.validateSchema(llmResponse.data, 'analyze_opportunity_risk');

    if (!validation.valid) {
      utilities.logger.warn('Opportunity risk analysis validation failed', validation.errors);
      
      const fallbackData = {
        riskLevel: 'medium',
        riskScore: 50,
        factors: [],
        recommendations: ['Unable to complete full analysis. Please review opportunity manually.'],
        confidence: 0,
      };

      return {
        success: true,
        data: fallbackData,
        metadata: {
          tokensUsed: llmResponse.usage?.totalTokens,
          modelUsed: llmResponse.model,
          providerUsed: llmResponse.provider,
          warning: 'Using fallback data due to validation failure',
        },
      };
    }

    const enrichedData = {
      ...validation.data,
      analyzedAt: new Date().toISOString(),
      opportunityUrl: payload.url,
      contextData: payload.context.data,
    };

    return {
      success: true,
      data: enrichedData,
      metadata: {
        tokensUsed: llmResponse.usage?.totalTokens,
        modelUsed: llmResponse.model,
        providerUsed: llmResponse.provider,
        duration: llmResponse.duration,
        orgIntelligenceSource,
        orgIntelligenceApplied: !!orgIntelligence,
      },
    };
  } catch (error) {
    utilities.logger.error('Failed to analyze opportunity risk', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to analyze opportunity risk',
    };
  }
};