import { ActionHandler, LLMConfig } from '../../types';
import { templateEngine } from '../../templates/template-engine';

export const extractActionItems: ActionHandler = async (payload, utilities) => {
  try {
    const template = await templateEngine.loadTemplate('extract_action_items');
    const prompt = utilities.renderPrompt(template, payload);

    const llmConfig: Partial<LLMConfig> = {
      provider: template.model.provider,
      model: template.model.name,
      temperature: template.model.temperature || 0.3,
      maxTokens: template.model.maxTokens || 1000,
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

    const validation = utilities.validateSchema(llmResponse.data, 'extract_action_items');

    if (!validation.valid) {
      // Schema validation failed but we have AI data - return success with warning
      return {
        success: true,
        data: llmResponse.data,
        metadata: {
          tokensUsed: llmResponse.usage?.totalTokens,
          modelUsed: llmResponse.model,
          providerUsed: llmResponse.provider,
          validationWarning: `Schema validation skipped: ${validation.errors?.join(', ')}`,
        },
      };
    }

    const enrichedData = {
      ...validation.data,
      extractedAt: new Date().toISOString(),
      sourceUrl: payload.url,
      contextType: payload.context?.type,
    };

    return {
      success: true,
      data: enrichedData,
      metadata: {
        tokensUsed: llmResponse.usage?.totalTokens,
        modelUsed: llmResponse.model,
        providerUsed: llmResponse.provider,
        duration: llmResponse.duration,
      },
    };
  } catch (error) {
    utilities.logger.error('Failed to extract action items', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to extract action items',
    };
  }
};