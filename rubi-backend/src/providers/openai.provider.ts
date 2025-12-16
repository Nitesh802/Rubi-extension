import OpenAI from 'openai';
import { BaseLLMProvider } from './base.provider';
import { LLMConfig, LLMResponse } from '../types';

export class OpenAIProvider extends BaseLLMProvider {
  private client: OpenAI;

  constructor(config: LLMConfig) {
    super(config);
    this.client = new OpenAI({
      apiKey: config.apiKey,
    });
  }

  async call(prompt: string, systemPrompt?: string): Promise<LLMResponse> {
    const startTime = Date.now();

    try {
      const messages: OpenAI.ChatCompletionMessageParam[] = [];
      
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

      let data = content;
      if (this.config.responseFormat?.type === 'json_object') {
        data = this.extractJsonFromResponse(content);
      }

      return {
        success: true,
        data,
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0,
        },
        model: response.model,
        provider: 'openai',
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        model: this.config.model,
        provider: 'openai',
        duration,
      };
    }
  }
}