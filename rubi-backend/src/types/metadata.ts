/**
 * Phase 10A: Action Execution Metadata Types
 * 
 * Provides diagnostics and source-of-truth indicators for action execution.
 */

import { LLMProvider } from './index';

/**
 * Comprehensive metadata about how an action was executed
 */
export interface ActionExecutionMetadata {
  // Core action information
  actionName: string;
  backendUsed: boolean;
  
  // Provider information
  providerPrimary: LLMProvider | 'none' | 'unknown';
  providerFinal: LLMProvider | 'stub' | 'none' | 'unknown';
  modelPrimary: string | null;
  modelFinal: string | null;
  providerFallbackOccurred: boolean;
  
  // Configuration sources
  orgConfigSource: 'moodle' | 'json' | 'default' | 'none' | 'unknown';
  identitySource: 'moodle' | 'mock' | 'anonymous' | 'extension' | 'unknown';
  orgIntelligenceSource?: 'moodle' | 'backend_file' | 'default' | 'none';
  
  // Identity information (safe, non-PII)
  orgId: string | null;
  userId: string | null;
  
  // Warnings and diagnostic messages
  warnings: string[];
  
  // Performance metrics
  duration?: number;
  tokensUsed?: number;
  attemptCount?: number;
  
  // Additional context
  timestamp: string;
  requestId?: string;
  
  // Policy enforcement
  policy?: {
    enabled?: boolean;
    browserExtensionEnabled?: boolean;
    reason?: string;
    limitsApplied?: {
      maxDailyOrg?: number;
      maxDailyUser?: number;
    };
  };
}

/**
 * Provider execution details for tracking fallback chain
 */
export interface ProviderExecutionDetails {
  provider: LLMProvider;
  model: string;
  success: boolean;
  error?: string;
  duration: number;
  tokensUsed?: number;
}

/**
 * Configuration source tracking
 */
export interface ConfigSourceInfo {
  orgConfig: {
    source: 'moodle' | 'json' | 'default' | 'none';
    fetchDuration?: number;
    fallbackUsed: boolean;
  };
  identity: {
    source: 'moodle' | 'mock' | 'anonymous' | 'extension';
    verified: boolean;
  };
}