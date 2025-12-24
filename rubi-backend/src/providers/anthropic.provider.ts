import Anthropic from '@anthropic-ai/sdk';
import { BaseLLMProvider } from './base.provider';
import { LLMConfig, LLMResponse } from '../types';

export class AnthropicProvider extends BaseLLMProvider {
  private client: Anthropic;

  constructor(config: LLMConfig) {
    super(config);
    this.client = new Anthropic({
      apiKey: config.apiKey,
    });
  }

  async call(prompt: string, systemPrompt?: string): Promise<LLMResponse> {
    const startTime = Date.now();

    try {
      const response = await this.retry(async () => {
        return await this.client.messages.create({
          model: this.config.model,
          max_tokens: this.config.maxTokens ?? 2000,
          temperature: this.config.temperature ?? 0.7,
          top_p: this.config.topP,
          system: systemPrompt,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        });
      });

      const content = response.content[0].type === 'text'
        ? response.content[0].text
        : '';
      const duration = Date.now() - startTime;

      const inputTokens = response.usage?.input_tokens || 0;
      const outputTokens = response.usage?.output_tokens || 0;

      let data = content;
      if (this.config.responseFormat?.type === 'json_object') {
        const parseResult = this.extractJsonFromResponse(content);
        if (!parseResult.success) {
          // JSON parsing failed - return as failed response so it can be retried
          return {
            success: false,
            data: parseResult.data,
            error: parseResult.error || 'Failed to parse JSON from AI response',
            usage: {
              promptTokens: inputTokens,
              completionTokens: outputTokens,
              totalTokens: inputTokens + outputTokens,
            },
            model: response.model,
            provider: 'anthropic',
            duration,
          };
        }
        data = parseResult.data;
      }

      return {
        success: true,
        data,
        usage: {
          promptTokens: inputTokens,
          completionTokens: outputTokens,
          totalTokens: inputTokens + outputTokens,
        },
        model: response.model,
        provider: 'anthropic',
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        model: this.config.model,
        provider: 'anthropic',
        duration,
      };
    }
  }
}