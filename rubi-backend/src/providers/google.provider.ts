import { LLMProvider, LLMConfig, LLMResponse } from '../types';

export class GoogleGeminiProvider {
  private apiKey: string;
  private endpoint: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.endpoint = 'https://generativelanguage.googleapis.com/v1beta';
  }

  async chat(
    messages: { role: string; content: string }[],
    config: Partial<LLMConfig>
  ): Promise<LLMResponse> {
    const startTime = Date.now();
    
    try {
      const model = config.model || 'gemini-2.0-pro';
      const url = `${this.endpoint}/models/${model}:generateContent?key=${this.apiKey}`;

      // Convert messages to Gemini format
      const contents = messages.map(msg => ({
        role: msg.role === 'system' ? 'user' : msg.role,
        parts: [{ text: msg.content }]
      }));

      // If there's a system message, merge it with the first user message
      if (messages[0]?.role === 'system') {
        const systemContent = messages[0].content;
        const userContent = messages[1]?.content || '';
        contents[0] = {
          role: 'user',
          parts: [{ text: `${systemContent}\n\n${userContent}` }]
        };
        contents.splice(1, 1);
      }

      const requestBody = {
        contents,
        generationConfig: {
          temperature: config.temperature ?? 0.7,
          topK: config.topK ?? 40,
          topP: config.topP ?? 0.95,
          maxOutputTokens: config.maxTokens ?? 2048,
          stopSequences: config.stopSequences,
        },
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_ONLY_HIGH'
          },
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_ONLY_HIGH'
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_ONLY_HIGH'
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_ONLY_HIGH'
          }
        ]
      };

      // Add JSON response format if specified
      if (config.responseFormat?.type === 'json_object') {
        requestBody.generationConfig.responseMimeType = 'application/json';
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.candidates[0]?.content?.parts[0]?.text;

      if (!content) {
        throw new Error('No content in Gemini response');
      }

      // Parse JSON if expected
      let parsedContent = content;
      if (config.responseFormat?.type === 'json_object') {
        try {
          parsedContent = JSON.parse(content);
        } catch (e) {
          // Try to extract JSON from the response
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            parsedContent = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error('Failed to parse JSON response from Gemini');
          }
        }
      }

      // Calculate token usage (approximate for Gemini)
      const promptTokens = this.estimateTokens(messages.map(m => m.content).join(' '));
      const completionTokens = this.estimateTokens(content);

      return {
        success: true,
        data: parsedContent,
        usage: {
          promptTokens,
          completionTokens,
          totalTokens: promptTokens + completionTokens,
        },
        model,
        provider: 'google' as LLMProvider,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        model: config.model || 'gemini-2.0-pro',
        provider: 'google' as LLMProvider,
        duration: Date.now() - startTime,
      };
    }
  }

  private estimateTokens(text: string): number {
    // Rough estimation: 1 token per 4 characters
    return Math.ceil(text.length / 4);
  }

  async listModels(): Promise<string[]> {
    try {
      const url = `${this.endpoint}/models?key=${this.apiKey}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to list models: ${response.status}`);
      }

      const data = await response.json();
      return data.models
        .filter((model: any) => model.supportedGenerationMethods?.includes('generateContent'))
        .map((model: any) => model.name.replace('models/', ''));
    } catch (error) {
      console.error('Failed to list Gemini models:', error);
      return ['gemini-2.0-pro', 'gemini-1.5-pro', 'gemini-1.5-flash'];
    }
  }

  validateConfig(config: Partial<LLMConfig>): boolean {
    if (!this.apiKey) {
      throw new Error('Google API key is required');
    }

    if (config.temperature !== undefined && (config.temperature < 0 || config.temperature > 2)) {
      throw new Error('Temperature must be between 0 and 2');
    }

    if (config.maxTokens !== undefined && config.maxTokens > 8192) {
      throw new Error('Max tokens cannot exceed 8192 for Gemini');
    }

    return true;
  }
}