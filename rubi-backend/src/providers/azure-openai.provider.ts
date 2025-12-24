import { AzureOpenAI } from 'openai';
import { BaseLLMProvider } from './base.provider';
import { LLMConfig, LLMResponse } from '../types';

export class AzureOpenAIProvider extends BaseLLMProvider {
  private client: AzureOpenAI;

  constructor(config: LLMConfig) {
    super(config);
    
    if (!config.endpoint || !config.apiVersion) {
      throw new Error('Azure OpenAI requires endpoint and apiVersion configuration');
    }

    this.client = new AzureOpenAI({
      apiKey: config.apiKey,
      endpoint: config.endpoint,
      apiVersion: config.apiVersion,
    });
  }

  async call(prompt: string, systemPrompt?: string): Promise<LLMResponse> {
    const startTime = Date.now();

    try {
      const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];
      
      if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
      }
      
      messages.push({ role: 'user', content: prompt });

      const response = await this.retry(async () => {
        return await this.client.chat.completions.create({
          model: this.config.model,
          messages,
          temperature: this.config.temperature ?? 0.7,
          max_tokens: this.config.maxTokens ?? 2000,
          top_p: this.config.topP,
          frequency_penalty: this.config.frequencyPenalty,
          presence_penalty: this.config.presencePenalty,
          response_format: this.config.responseFormat,
        });
      });

      const content = response.choices[0]?.message?.content || '';
      const duration = Date.now() - startTime;

      const promptTokens = response.usage?.prompt_tokens || 0;
      const completionTokens = response.usage?.completion_tokens || 0;
      const totalTokens = response.usage?.total_tokens || 0;

      let data = content;
      if (this.config.responseFormat?.type === 'json_object') {
        const parseResult = this.extractJsonFromResponse(content);
        if (!parseResult.success) {
          return {
            success: false,
            data: parseResult.data,
            error: parseResult.error || 'Failed to parse JSON from AI response',
            usage: { promptTokens, completionTokens, totalTokens },
            model: response.model,
            provider: 'azure-openai',
            duration,
          };
        }
        data = parseResult.data;
      }

      return {
        success: true,
        data,
        usage: { promptTokens, completionTokens, totalTokens },
        model: response.model,
        provider: 'azure-openai',
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        model: this.config.model,
        provider: 'azure-openai',
        duration,
      };
    }
  }
}