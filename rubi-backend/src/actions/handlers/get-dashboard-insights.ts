import { ActionHandler, LLMConfig } from '../../types';
import { templateEngine } from '../../templates/template-engine';
import { orgIntelligenceService } from '../../services/orgIntelligenceService';

export const getDashboardInsights: ActionHandler = async (payload, utilities, authContext) => {
  try {
    // Phase 11E: Extract org intelligence from auth context
    const orgId = authContext?.session?.org?.orgId || (authContext as any)?.orgConfig?.orgId || null;
    const orgIntelligence = (authContext as any)?.orgIntelligence || null;
    const orgIntelligenceSource = orgIntelligence ? 'provided' : 'none';
    
    // Log dashboard insights generation with org intelligence info
    utilities.logger.info('[Rubi Actions] Generating dashboard insights', {
      orgId,
      contextType: payload.context?.type,
      dataPoints: Object.keys(payload.context?.data || {}).length,
      orgIntelligenceSource,
      orgIntelligenceApplied: !!orgIntelligence,
    });
    
    const template = await templateEngine.loadTemplate('get_dashboard_insights');
    
    // Phase 11E: Prepare org intelligence for prompt
    const promptData = {
      ...payload,
      orgIntelligence: orgIntelligence ? orgIntelligenceService.getIntelligenceForPrompt(orgIntelligence) : null,
    };
    
    const prompt = utilities.renderPrompt(template, promptData);

    const llmConfig: Partial<LLMConfig> = {
      provider: template.model.provider,
      model: template.model.name,
      temperature: template.model.temperature || 0.6,
      maxTokens: template.model.maxTokens || 1500,
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

    const validation = utilities.validateSchema(llmResponse.data, 'get_dashboard_insights');

    if (!validation.valid) {
      utilities.logger.warn('Dashboard insights validation failed, using partial data', validation.errors);
    }

    const insightsData = validation.valid ? validation.data : llmResponse.data;

    const enrichedData = {
      ...insightsData,
      generatedAt: new Date().toISOString(),
      dashboardUrl: payload.url,
      dataPoints: Object.keys(payload.context.data).length,
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
    utilities.logger.error('Failed to generate dashboard insights', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate dashboard insights',
    };
  }
};