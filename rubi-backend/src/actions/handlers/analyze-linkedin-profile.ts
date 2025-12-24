import { ActionHandler, LLMConfig } from '../../types';
import { templateEngine } from '../../templates/template-engine';
import { schemaValidator } from '../../schemas/schema-validator';
import { orgIntelligenceService } from '../../services/orgIntelligenceService';

export const analyzeLinkedInProfile: ActionHandler = async (payload, utilities, authContext) => {
  try {
    // Phase 11E: Extract org intelligence for consistency
    const orgId = authContext?.session?.org?.orgId || (authContext as any)?.orgConfig?.orgId || null;
    const orgIntelligence = (authContext as any)?.orgIntelligence || null;
    const orgIntelligenceSource = orgIntelligence ? 'provided' : 'none';
    
    // Cast to any to access runtime properties that may not be in the TypeScript type
    const payloadAny = payload as any;
    const fields = payloadAny.fields || payload.context?.data || {};

    utilities.logger.info('[Rubi Actions] Analyzing LinkedIn profile', {
      orgId,
      profileUrl: payload.url,
      orgIntelligenceSource,
      orgIntelligenceApplied: !!orgIntelligence,
      hasFields: !!fields && Object.keys(fields).length > 0,
      fieldKeys: Object.keys(fields),
      fullName: fields.fullName,
      payloadKeys: Object.keys(payload),
    });
    
    const template = await templateEngine.loadTemplate('analyze_linkedin_profile');
    
    // Phase 11E: Use the mapper for consistent org intelligence formatting
    // Ensure fields is explicitly available for the template
    const promptData = {
      ...payload,
      fields: fields, // Explicitly include fields for template access
      orgIntelligence: orgIntelligence
        ? orgIntelligenceService.getIntelligenceForPrompt(orgIntelligence, 'analyze_linkedin_profile')
        : null,
    };
    
    const prompt = utilities.renderPrompt(template, promptData);

    const llmConfig: Partial<LLMConfig> = {
      provider: template.model.provider,
      model: template.model.name,
      temperature: template.model.temperature,
      maxTokens: template.model.maxTokens,
      responseFormat: template.outputFormat === 'json' ? { type: 'json_object' } : undefined,
    };

    let llmResponse = await utilities.callLLM(prompt, llmConfig);

    // Retry once if JSON parsing failed (common issue with LLM responses)
    if (!llmResponse.success && llmResponse.error?.includes('JSON')) {
      utilities.logger.warn('JSON parse failed, retrying with explicit JSON instruction');
      const retryPrompt = prompt + '\n\nIMPORTANT: Your response MUST be valid JSON starting with { and ending with }. No markdown, no explanation, just pure JSON.';
      llmResponse = await utilities.callLLM(retryPrompt, llmConfig);
    }

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

    const validation = utilities.validateSchema(llmResponse.data, 'analyze_linkedin_profile');

    if (!validation.valid) {
      if (template.retryPrompt) {
        const retryPrompt = `${template.retryPrompt}\n\nOriginal output:\n${JSON.stringify(llmResponse.data)}\n\nErrors:\n${validation.errors?.join('\n')}`;
        const retryResponse = await utilities.callLLM(retryPrompt, llmConfig);
        
        if (retryResponse.success) {
          const retryValidation = utilities.validateSchema(retryResponse.data, 'analyze_linkedin_profile');
          if (retryValidation.valid) {
            return {
              success: true,
              data: retryValidation.data,
              metadata: {
                tokensUsed: (llmResponse.usage?.totalTokens || 0) + (retryResponse.usage?.totalTokens || 0),
                modelUsed: retryResponse.model,
                providerUsed: retryResponse.provider,
                duration: (llmResponse.duration || 0) + (retryResponse.duration || 0),
              },
            };
          }
        }
      }

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
      analyzedAt: new Date().toISOString(),
      profileUrl: payload.url,
      platform: payload.platform,
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
    utilities.logger.error('Failed to analyze LinkedIn profile', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to analyze LinkedIn profile',
    };
  }
};