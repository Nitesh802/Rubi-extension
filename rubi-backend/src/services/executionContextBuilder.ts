/**
 * Phase 10A: Execution Context Builder with Source Tracking
 * 
 * Builds execution contexts with detailed tracking of configuration
 * and identity sources for diagnostic purposes.
 */

import { ActionExecutionMetadata, ConfigSourceInfo } from '../types/metadata';
import { AuthenticatedRequestContext } from '../types/identity';
import { OrgConfig } from '../types/orgConfig';
import { logger } from '../logging/logger';

export class ExecutionContextBuilder {
  private metadata: Partial<ActionExecutionMetadata>;
  private configSources: ConfigSourceInfo;

  constructor() {
    this.metadata = {
      backendUsed: true,
      warnings: [],
      timestamp: new Date().toISOString()
    };
    
    this.configSources = {
      orgConfig: {
        source: 'none',
        fallbackUsed: false
      },
      identity: {
        source: 'anonymous',
        verified: false
      }
    };
  }

  /**
   * Set action name
   */
  setAction(actionName: string): ExecutionContextBuilder {
    this.metadata.actionName = actionName;
    return this;
  }

  /**
   * Set request ID for tracing
   */
  setRequestId(requestId: string): ExecutionContextBuilder {
    this.metadata.requestId = requestId;
    return this;
  }

  /**
   * Track org config source
   */
  setOrgConfigSource(
    source: 'moodle' | 'json' | 'default' | 'none',
    orgConfig: OrgConfig | null,
    fetchDuration?: number
  ): ExecutionContextBuilder {
    this.configSources.orgConfig.source = source;
    this.metadata.orgConfigSource = source;
    
    if (fetchDuration) {
      this.configSources.orgConfig.fetchDuration = fetchDuration;
    }
    
    if (orgConfig) {
      this.metadata.orgId = orgConfig.orgId;
    }
    
    // Add warnings based on source
    if (source === 'none') {
      this.metadata.warnings.push('orgConfigMissing');
    } else if (source === 'default') {
      this.metadata.warnings.push('usingDefaultConfig');
      this.configSources.orgConfig.fallbackUsed = true;
    } else if (source === 'json') {
      this.configSources.orgConfig.fallbackUsed = true;
    }
    
    return this;
  }

  /**
   * Track identity source
   */
  setIdentitySource(
    source: 'moodle' | 'mock' | 'anonymous' | 'extension',
    authContext: AuthenticatedRequestContext | null,
    verified: boolean = false
  ): ExecutionContextBuilder {
    this.configSources.identity.source = source;
    this.configSources.identity.verified = verified;
    this.metadata.identitySource = source;
    
    if (authContext?.session?.user) {
      this.metadata.userId = authContext.session.user.userId;
    }
    
    // Add warnings based on source
    if (source === 'anonymous') {
      this.metadata.warnings.push('identityMissing');
    } else if (source === 'mock') {
      this.metadata.warnings.push('usingMockIdentity');
    }
    
    return this;
  }

  /**
   * Track provider chain execution
   */
  setProviderExecution(
    primary: string | null,
    final: string | null,
    modelPrimary: string | null,
    modelFinal: string | null,
    fallbackOccurred: boolean = false
  ): ExecutionContextBuilder {
    this.metadata.providerPrimary = (primary as any) || 'unknown';
    this.metadata.providerFinal = (final as any) || 'unknown';
    this.metadata.modelPrimary = modelPrimary;
    this.metadata.modelFinal = modelFinal;
    this.metadata.providerFallbackOccurred = fallbackOccurred;
    
    if (fallbackOccurred) {
      this.metadata.warnings.push('providerFallbackUsed');
    }
    
    return this;
  }

  /**
   * Add performance metrics
   */
  setPerformanceMetrics(
    duration: number,
    tokensUsed?: number,
    attemptCount?: number
  ): ExecutionContextBuilder {
    this.metadata.duration = duration;
    if (tokensUsed) this.metadata.tokensUsed = tokensUsed;
    if (attemptCount) this.metadata.attemptCount = attemptCount;
    return this;
  }

  /**
   * Add a warning
   */
  addWarning(warning: string): ExecutionContextBuilder {
    if (!this.metadata.warnings.includes(warning)) {
      this.metadata.warnings.push(warning);
    }
    return this;
  }

  /**
   * Check if Moodle is unavailable and add warning
   */
  checkMoodleAvailability(moodleConfigFailed: boolean, moodleIdentityFailed: boolean): ExecutionContextBuilder {
    if (moodleConfigFailed || moodleIdentityFailed) {
      this.addWarning('moodleUnavailable');
    }
    return this;
  }

  /**
   * Build the final metadata object
   */
  build(): ActionExecutionMetadata {
    // Ensure all required fields have values
    return {
      actionName: this.metadata.actionName || 'unknown',
      backendUsed: this.metadata.backendUsed ?? true,
      providerPrimary: this.metadata.providerPrimary || 'unknown',
      providerFinal: this.metadata.providerFinal || 'unknown',
      modelPrimary: this.metadata.modelPrimary || null,
      modelFinal: this.metadata.modelFinal || null,
      providerFallbackOccurred: this.metadata.providerFallbackOccurred || false,
      orgConfigSource: this.metadata.orgConfigSource || 'unknown',
      identitySource: this.metadata.identitySource || 'unknown',
      orgId: this.metadata.orgId || null,
      userId: this.metadata.userId || null,
      warnings: this.metadata.warnings || [],
      duration: this.metadata.duration,
      tokensUsed: this.metadata.tokensUsed,
      attemptCount: this.metadata.attemptCount,
      timestamp: this.metadata.timestamp || new Date().toISOString(),
      requestId: this.metadata.requestId
    };
  }

  /**
   * Log execution context for debugging
   */
  logContext(level: 'info' | 'debug' = 'info'): void {
    const logData = {
      action: this.metadata.actionName,
      orgConfigSource: this.configSources.orgConfig.source,
      identitySource: this.configSources.identity.source,
      providerPrimary: this.metadata.providerPrimary,
      providerFinal: this.metadata.providerFinal,
      fallbackOccurred: this.metadata.providerFallbackOccurred,
      warnings: this.metadata.warnings,
      requestId: this.metadata.requestId
    };

    if (level === 'debug') {
      logger.debug('[ExecutionContext] Built context', logData);
    } else {
      logger.info('[ExecutionContext] Action execution', logData);
    }
  }
}

/**
 * Factory function for creating context builders
 */
export function createExecutionContextBuilder(): ExecutionContextBuilder {
  return new ExecutionContextBuilder();
}