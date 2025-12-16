import { ActionHandler, LLMConfig } from '../../types';
import { templateEngine } from '../../templates/template-engine';

export const generateEmailDraft: ActionHandler = async (payload, utilities) => {
  try {
    const template = await templateEngine.loadTemplate('generate_email_draft');
    const prompt = utilities.renderPrompt(template, payload);

    const llmConfig: Partial<LLMConfig> = {
      provider: template.model.provider,
      model: template.model.name,
      temperature: template.model.temperature || 0.7,
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

    const validation = utilities.validateSchema(llmResponse.data, 'generate_email_draft');

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
      },
    };
  } catch (error) {
    utilities.logger.error('Failed to generate email draft', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate email draft',
    };
  }
};