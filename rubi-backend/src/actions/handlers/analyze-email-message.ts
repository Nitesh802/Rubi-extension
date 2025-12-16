import { ActionHandler, LLMConfig } from '../../types';
import { templateEngine } from '../../templates/template-engine';
import { orgIntelligenceService } from '../../services/orgIntelligenceService';

export const analyzeEmailMessage: ActionHandler = async (payload, utilities, authContext) => {
  try {
    // Phase 9B & 11E: Log action execution with user context and org intelligence
    const orgId = authContext?.session?.org?.orgId || (authContext as any)?.orgConfig?.orgId || null;
    const orgIntelligence = (authContext as any)?.orgIntelligence || null;
    const orgIntelligenceSource = orgIntelligence ? 'provided' : 'none';
    
    if (authContext?.session) {
      utilities.logger.info('[Rubi Actions] Analyzing email message', {
        userId: authContext.session.user.userId,
        orgId,
        contextType: payload.context.type,
        orgIntelligenceSource,
        orgIntelligenceApplied: !!orgIntelligence,
      });
    }
    const template = await templateEngine.loadTemplate('analyze_email_message');
    
    // Phase 11E: Prepare org intelligence for prompt if available
    const promptData = {
      ...payload,
      orgIntelligence: orgIntelligence ? orgIntelligenceService.getIntelligenceForPrompt(orgIntelligence) : null,
    };
    
    const prompt = utilities.renderPrompt(template, promptData);

    const llmConfig: Partial<LLMConfig> = {
      provider: template.model.provider,
      model: template.model.name,
      temperature: template.model.temperature || 0.5,
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

    const validation = utilities.validateSchema(llmResponse.data, 'analyze_email_message');

    if (!validation.valid) {
      return {
        success: false,
        error: `Validation failed: ${validation.errors?.join(', ')}`,
        data: llmResponse.data,
        metadata: {
          tokensUsed: llmResponse.usage?.totalTokens,
          modelUsed: llmResponse.model,
          providerUsed: llmResponse.provider,
        },
      };
    }

    return {
      success: true,
      data: validation.data,
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
    utilities.logger.error('Failed to analyze email message', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to analyze email message',
    };
  }
};