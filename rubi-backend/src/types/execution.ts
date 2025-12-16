/**
 * Execution Context Types for Rubi Platform
 */

import { NormalizedRubiContextPayload } from './index';

/**
 * Execution context for action processing
 */
export interface ExecutionContext {
  /** Organization ID */
  orgId: string;

  /** User ID */
  userId?: string;

  /** Action name being executed */
  actionName?: string;

  /** Request payload */
  payload?: NormalizedRubiContextPayload;

  /** Timestamp of execution */
  timestamp?: Date;

  /** Request ID for tracing */
  requestId?: string;
}

/**
 * Action execution metadata for tracking and analytics
 */
export interface ActionExecutionMetadata {
  /** Request ID */
  requestId?: string;

  /** Execution start time */
  startTime?: number;

  /** Execution end time */
  endTime?: number;

  /** Duration in milliseconds */
  duration?: number;

  /** Provider used for LLM call */
  providerUsed?: string;

  /** Model used for LLM call */
  modelUsed?: string;

  /** Tokens used */
  tokensUsed?: number;

  /** Organization intelligence applied */
  orgIntelligenceApplied?: boolean;

  /** Organization intelligence source */
  orgIntelligenceSource?: string;

  /** Warnings during execution */
  warnings?: string[];

  /** Fallback used */
  fallbackUsed?: boolean;

  /** Retry count */
  retryCount?: number;
}

/**
 * Identity context for user/org identification
 */
export interface IdentityContext {
  /** User ID */
  userId?: string;

  /** Organization ID */
  orgId?: string;

  /** Session ID */
  sessionId?: string;

  /** User email */
  email?: string;

  /** User roles */
  roles?: string[];

  /** Is development mode */
  isDevMode?: boolean;
}
