import { LLMConfig, LLMResponse } from '../types';

export abstract class BaseLLMProvider {
  protected config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = config;
  }

  abstract call(prompt: string, systemPrompt?: string): Promise<LLMResponse>;

  protected async retry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error | undefined;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
        }
      }
    }
    
    throw lastError;
  }

  protected extractJsonFromResponse(text: string): { success: boolean; data: any; error?: string } {
    text = text.trim();

    try {
      return { success: true, data: JSON.parse(text) };
    } catch {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch && jsonMatch[1]) {
        try {
          return { success: true, data: JSON.parse(jsonMatch[1]) };
        } catch {}
      }

      // Try to extract any JSON object
      const objectMatch = text.match(/\{[\s\S]*\}/);
      if (objectMatch) {
        try {
          return { success: true, data: JSON.parse(objectMatch[0]) };
        } catch {}
      }

      // If all JSON extraction fails, return failure with raw text for debugging
      return {
        success: false,
        data: { rawResponse: text.substring(0, 500), parseError: 'Could not parse as JSON' },
        error: 'Failed to parse JSON from AI response'
      };
    }
  }
}