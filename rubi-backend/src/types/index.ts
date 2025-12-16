export interface NormalizedRubiContextPayload {
  url: string;
  platform: string;
  context: {
    type: string;
    data: Record<string, any>;
  };
  user?: {
    id: string;
    email?: string;
  };
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface PromptTemplate {
  id: string;
  version: string;
  name: string;
  description: string;
  author: string;
  createdAt: string;
  updatedAt: string;
  model: {
    provider: LLMProvider;
    name: string;
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    topK?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
    fallbackProviders?: Array<{
      provider: LLMProvider;
      name: string;
    }>;
  };
  systemPrompt?: string;
  userPrompt: string;
  variables: string[];
  outputFormat?: 'json' | 'text';
  retryPrompt?: string;
  metadata?: Record<string, any>;
}

export type LLMProvider = 'openai' | 'anthropic' | 'azure-openai' | 'google';

export interface LLMConfig {
  provider: LLMProvider;
  model: string;
  apiKey: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  topK?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stopSequences?: string[];
  responseFormat?: { type: 'json_object' } | undefined;
  endpoint?: string;
  apiVersion?: string;
}

export interface LLMResponse {
  success: boolean;
  data?: any;
  error?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  provider: LLMProvider;
  duration?: number;
}

export interface ActionDefinition {
  name: string;
  description: string;
  templateFile: string;
  schemaFile: string;
  handler: ActionHandler;
  requiresAuth: boolean;
  rateLimit?: {
    windowMs: number;
    max: number;
  };
}

// Import AuthenticatedRequestContext from identity
import { AuthenticatedRequestContext } from './identity';

// Import ActionExecutionMetadata from execution
import { ActionExecutionMetadata } from './execution';

// Re-export for convenience
export { AuthenticatedRequestContext, ActionExecutionMetadata };

export type ActionHandler = (
  payload: NormalizedRubiContextPayload,
  utilities: ActionUtilities,
  authContext?: AuthenticatedRequestContext
) => Promise<ActionResponse>;

export interface ActionUtilities {
  renderPrompt: (template: PromptTemplate, payload: NormalizedRubiContextPayload) => string;
  callLLM: (prompt: string, config: LLMConfig) => Promise<LLMResponse>;
  validateSchema: (data: any, schemaPath: string) => ValidationResult;
  logger: Logger;
}

export interface ActionResponse {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: {
    tokensUsed?: number;
    modelUsed?: string;
    providerUsed?: LLMProvider;
    duration?: number;
  };
  // Phase 10A: Extended execution metadata
  executionMetadata?: ActionExecutionMetadata;
}

export interface ValidationResult {
  valid: boolean;
  errors?: string[];
  data?: any;
}

export interface Logger {
  info: (message: string, meta?: any) => void;
  error: (message: string, error?: any) => void;
  warn: (message: string, meta?: any) => void;
  debug: (message: string, meta?: any) => void;
}

export interface ActionLogEntry {
  id: string;
  timestamp: Date;
  action: string;
  userId?: string;
  success: boolean;
  tokensUsed?: number;
  model?: string;
  provider?: LLMProvider;
  duration?: number;
  inputSize: number;
  outputSize?: number;
  error?: string;
  metadata?: Record<string, any>;
}

export interface SessionData {
  userId: string;
  email?: string;
  extensionId: string;
  permissions: string[];
  expiresAt: Date;
}

// Phase 9A: Browser Extension Authentication Types
export interface ExtensionAuthPayload {
  userId: string;
  orgId: string;
  roles: string[];
  tokenType: 'browser_extension';
  iat?: number;
  exp?: number;
}

export interface ExtensionHandshakeRequest {
  userHint?: string;
  orgHint?: string;
  extensionVersion?: string;
}

export interface ExtensionHandshakeResponse {
  success: boolean;
  token?: string;
  expiresAt?: string;
  error?: string;
}

// Export all identity types from identity.ts
export * from './identity';

// Export all metadata types from metadata.ts
export * from './metadata';

// Export all execution types from execution.ts
export * from './execution';