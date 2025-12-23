import { Router, Request, Response } from 'express';
import { actionRegistry } from '../actions/registry';
import { templateEngine } from '../templates/template-engine';
import { schemaValidator } from '../schemas/schema-validator';
import { llmOrchestrator } from '../providers';
import { logger } from '../logging/logger';
import { analytics } from '../logging/analytics';
import { authMiddleware } from '../middleware/auth';
import { extensionAuthService, ExtensionAuthRequest } from '../middleware/extensionAuth';
import { securityMiddleware } from '../middleware/security';
import { NormalizedRubiContextPayload, ActionUtilities, AuthenticatedRequestContext, ActionExecutionMetadata, LLMConfig, LLMProvider } from '../types';
import { OrgConfig } from '../types/orgConfig';
import { orgConfigService } from '../config/orgConfigService';
import { orgIntelligenceService } from '../services/orgIntelligenceService';
import { OrgIntelligence, OrgIntelligenceSource } from '../types/orgIntelligence';
import { createExecutionContextBuilder } from '../services/executionContextBuilder';
import { usageLimiter } from '../services/usageLimiter';

const router = Router();

// Phase 9D: Add org config endpoint for extension to fetch its config
router.get(
  '/org-config',
  extensionAuthService.requireExtensionAuth,
  async (req: ExtensionAuthRequest, res: Response) => {
    const orgConfig = req.orgConfig;
    
    if (!orgConfig) {
      res.status(404).json({
        success: false,
        error: 'No organization configuration found',
        code: 'ORG_CONFIG_NOT_FOUND',
      });
      return;
    }

    res.json({
      success: true,
      data: orgConfig,
    });
  }
);

router.post(
  '/:actionName/execute',
  extensionAuthService.requireExtensionAuth,
  securityMiddleware.rateLimiter(),
  async (req: ExtensionAuthRequest, res: Response) => {
    const { actionName } = req.params;
    const payload: NormalizedRubiContextPayload = req.body.payload;
    const requestId = (req as any).requestId;
    const startTime = Date.now();
    const orgConfig = req.orgConfig; // Phase 9D
    
    // Phase 10A: Initialize execution context builder
    const contextBuilder = createExecutionContextBuilder()
      .setAction(actionName)
      .setRequestId(requestId)
      .setOrgConfigSource(req.orgConfigSource || 'default', orgConfig)
      .setIdentitySource(req.identitySource || 'anonymous', req.rubiAuthContext);

    try {
      // Phase 10C: Check usage limits and policies
      const usageCheck = usageLimiter.checkActionAllowed({
        orgId: req.userContext?.orgId || 'unknown',
        userId: req.userContext?.userId,
        actionName,
        payload,
        orgConfig,
      } as any);
      
      if (!usageCheck.allowed) {
        logger.warn(`Action blocked by policy: ${actionName}`, {
          requestId,
          orgId: req.userContext?.orgId,
          userId: req.userContext?.userId,
          actionName,
          reason: usageCheck.reason,
        });
        
        const errorMessages: { [key: string]: string } = {
          org_disabled: 'Rubi AI is currently disabled for your organization.',
          extension_disabled: 'The Rubi browser extension is not enabled for your organization.',
          org_daily_limit_exceeded: 'Your organization has reached today\'s Rubi AI usage limit.',
          user_daily_limit_exceeded: 'You\'ve reached today\'s Rubi AI usage limit.',
          domain_not_allowed: 'Rubi AI isn\'t enabled for this site.',
        };
        
        const errorMessage = errorMessages[usageCheck.reason || ''] || 'This action is disabled for your organization.';
        
        res.status(403).json({
          success: false,
          error: errorMessage,
          code: 'ACTION_DISABLED_BY_POLICY',
          requestId,
          executionMetadata: {
            ...contextBuilder.build(),
            policy: {
              enabled: false,
              reason: usageCheck.reason,
              limitsApplied: {
                maxDailyOrg: orgConfig?.max_daily_actions_per_org,
                maxDailyUser: orgConfig?.max_daily_actions_per_user,
              },
            },
          },
        });
        return;
      }
      
      // Phase 9D: Check if action is allowed based on org config
      if (!orgConfigService.isActionAllowed(orgConfig, actionName)) {
        logger.warn(`Action blocked by org policy: ${actionName}`, {
          requestId,
          orgId: req.userContext?.orgId,
          actionName,
        });

        res.status(403).json({
          success: false,
          error: 'This action has been disabled by your organization administrator',
          code: 'ACTION_DISABLED_BY_POLICY',
          requestId,
          executionMetadata: {
            ...contextBuilder.build(),
            policy: {
              enabled: false,
              reason: 'action_not_allowed',
            },
          },
        });
        return;
      }

      const validationResult = actionRegistry.validatePayloadForAction(actionName, payload);
      if (!validationResult.valid) {
        logger.warn(`Invalid payload for action ${actionName}`, {
          requestId,
          errors: validationResult.errors,
        });

        res.status(400).json({
          success: false,
          error: 'Invalid payload',
          details: validationResult.errors,
          requestId,
        });
        return;
      }

      const action = actionRegistry.get(actionName);
      if (!action) {
        logger.warn(`Action not found: ${actionName}`, { requestId });
        
        res.status(404).json({
          success: false,
          error: `Action '${actionName}' not found`,
          requestId,
        });
        return;
      }

      // Phase 9D: Check rate limits from org config
      if (orgConfig?.limits?.maxTokensPerAction) {
        const maxTokens = orgConfig.limits.maxTokensPerAction;
        logger.debug(`Applying org token limit: ${maxTokens}`, { 
          requestId, 
          actionName,
          orgId: req.userContext?.orgId 
        });
      }

      // Phase 9B: Build authenticated request context with org config
      const authContext: AuthenticatedRequestContext = req.rubiAuthContext || {
        session: undefined,
        isDevMode: true,
        rawTokenClaims: req.extensionAuth,
      };

      // Phase 9D: Get effective model preferences for this action
      const modelPreferences = orgConfigService.getEffectiveModelPreferences(orgConfig, actionName);
      
      // Phase 10A: Track primary provider attempt
      contextBuilder.setProviderExecution(
        modelPreferences.provider || 'openai',
        null, // Will be set after execution
        modelPreferences.model || null,
        null, // Will be set after execution
        false // Will be updated if fallback occurs
      );

      // Phase 11D: Fetch org intelligence
      const { data: orgIntelligence, source: orgIntelligenceSource } = await orgIntelligenceService.getOrgIntelligence(
        authContext.session?.org?.orgId || req.userContext?.orgId || null
      );
      
      if (orgIntelligence) {
        logger.debug(`Loaded org intelligence from source: ${orgIntelligenceSource}`, {
          requestId,
          orgId: authContext.session?.org?.orgId || req.userContext?.orgId
        });
      }

      const utilities: ActionUtilities = {
        renderPrompt: (template, data) => {
          // Phase 9D & 11D: Extend template data with org config and intelligence context
          const sessionUser = authContext.session?.user;
          const extendedData = {
            ...data,
            user: sessionUser ? { id: sessionUser.userId || 'unknown', ...sessionUser } : { id: 'unknown' },
            org: authContext.session?.org || null,
            auth: {
              isDevMode: authContext.isDevMode,
              sessionId: authContext.session?.sessionId,
            },
            orgConfig: orgConfig ? {
              orgName: orgConfig.orgName,
              planTier: orgConfig.planTier,
              toneStyle: orgConfig.toneProfile?.style,
              locale: orgConfig.toneProfile?.localeOverride || authContext.session?.user?.locale,
            } : null,
            // Phase 11D & 11E: Add org intelligence for prompt templates with action-specific mapping
            orgIntelligence: orgIntelligence ? orgIntelligenceService.getIntelligenceForPrompt(orgIntelligence, actionName) : null,
          };
          return templateEngine.renderTemplate(template, extendedData);
        },
        callLLM: async (prompt, config) => {
          const systemPrompt = config.responseFormat?.type === 'json_object' 
            ? 'You must respond with valid JSON only.' 
            : undefined;
          
          // Phase 9D: Override provider/model based on org config
          const effectiveConfig: Partial<LLMConfig> = {
            ...config,
            provider: (modelPreferences.provider || config.provider) as LLMProvider,
            model: modelPreferences.model || config.model,
            maxTokens: orgConfig?.limits?.maxTokensPerAction
              ? Math.min(config.maxTokens || 4000, orgConfig.limits.maxTokensPerAction)
              : config.maxTokens,
          };

          logger.debug(`Using model preferences for action ${actionName}`, {
            requestId,
            provider: effectiveConfig.provider,
            model: effectiveConfig.model,
            maxTokens: effectiveConfig.maxTokens,
          });
          
          const response = await llmOrchestrator.call(prompt, effectiveConfig, systemPrompt);
          
          // Phase 10A: Update metadata with provider execution details
          const executionMetadata = llmOrchestrator.getLastExecutionMetadata();
          if (executionMetadata) {
            contextBuilder.setProviderExecution(
              executionMetadata.providerPrimary,
              executionMetadata.providerFinal,
              executionMetadata.modelPrimary,
              executionMetadata.modelFinal,
              executionMetadata.fallbackOccurred
            );
          }
          
          return response;
        },
        validateSchema: (data, schemaName) => {
          return schemaValidator.validate(data, schemaName);
        },
        logger,
      };

      // Phase 9D & 11D: Pass auth context, org config, and org intelligence to action execution
      const extendedAuthContext = {
        ...authContext,
        orgConfig,
        orgIntelligence,
      };

      const result = await actionRegistry.execute(actionName, payload, utilities, extendedAuthContext);
      const duration = Date.now() - startTime;
      
      // Phase 10C: Increment usage counters if action succeeded
      if (result.success) {
        usageLimiter.incrementUsage({
          orgId: req.userContext?.orgId || 'unknown',
          userId: req.userContext?.userId,
          actionName,
          payload,
          orgConfig,
        } as any);
      }
      
      // Phase 10A: Complete metadata with performance metrics
      contextBuilder.setPerformanceMetrics(
        duration,
        result.metadata?.tokensUsed,
        llmOrchestrator.getLastExecutionMetadata()?.attemptCount
      );
      
      // Build final execution metadata with policy info and org intelligence source
      const executionMetadata = {
        ...contextBuilder.build(),
        orgIntelligenceSource: orgIntelligenceSource as OrgIntelligenceSource,
        policy: {
          enabled: orgConfig?.enabled !== false,
          browserExtensionEnabled: orgConfig?.browser_extension_enabled !== false,
          limitsApplied: {
            maxDailyOrg: orgConfig?.max_daily_actions_per_org,
            maxDailyUser: orgConfig?.max_daily_actions_per_user,
          },
        },
      };

      // Enhanced analytics with org config context
      analytics.trackAction({
        action: actionName,
        userId: authContext.session?.user.userId || req.userContext?.userId || 'anonymous',
        success: result.success,
        tokensUsed: result.metadata?.tokensUsed,
        model: result.metadata?.modelUsed,
        provider: result.metadata?.providerUsed,
        duration,
        inputSize: JSON.stringify(payload).length,
        outputSize: result.data ? JSON.stringify(result.data).length : 0,
        error: result.error,
        metadata: {
          requestId,
          platform: payload.platform,
          contextType: payload.context.type,
          orgId: authContext.session?.org.orgId || req.userContext?.orgId || 'anonymous',
          sessionId: authContext.session?.sessionId,
          isDevMode: authContext.isDevMode,
          planTier: orgConfig?.planTier || authContext.session?.org.planTier,
          toneStyle: orgConfig?.toneProfile?.style,
        },
      });

      // Phase 10A & 11D: Log execution metadata including org intelligence source
      logger.info('[ActionExecution] Completed', {
        actionName,
        success: result.success,
        orgConfigSource: executionMetadata.orgConfigSource,
        identitySource: executionMetadata.identitySource,
        orgIntelligenceSource: executionMetadata.orgIntelligenceSource,
        providerFinal: executionMetadata.providerFinal,
        modelFinal: executionMetadata.modelFinal,
        fallbackOccurred: executionMetadata.providerFallbackOccurred,
        duration,
        requestId
      });
      
      if (result.success) {
        res.status(200).json({
          success: true,
          data: result.data,
          metadata: {
            ...result.metadata,
            requestId,
            duration,
          },
          // Phase 10A: Include execution metadata
          executionMetadata
        });
      } else {
        res.status(422).json({
          success: false,
          error: result.error,
          data: result.data,
          metadata: {
            ...result.metadata,
            requestId,
            duration,
          },
          // Phase 10A: Include execution metadata even on failure
          executionMetadata
        });
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.error(`Failed to execute action ${actionName}`, {
        error,
        requestId,
        userId: req.userContext?.userId,
      });

      analytics.trackError(actionName, error instanceof Error ? error.message : 'Unknown error', {
        requestId,
        userId: req.userContext?.userId,
      });

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        requestId,
        metadata: {
          duration,
        },
      });
    }
  }
);

// Alias route: POST /api/actions/execute with actionName in body
// This matches the extension's expected path format
router.post(
  '/execute',
  extensionAuthService.requireExtensionAuth,
  securityMiddleware.rateLimiter(),
  async (req: ExtensionAuthRequest, res: Response) => {
    const { actionName, actionId, action, payload, context } = req.body;
    // Support multiple field names: actionName, actionId, or action
    const effectiveActionName = actionName || actionId || action;

    if (!effectiveActionName) {
      res.status(400).json({
        success: false,
        error: 'actionName, actionId, or action is required in request body',
        code: 'MISSING_ACTION_NAME',
      });
      return;
    }

    // Set up params for the execute handler
    req.params.actionName = effectiveActionName;

    // Ensure payload is in expected format (extension sends 'context', backend expects 'payload')
    if (!req.body.payload && context) {
      req.body.payload = context;
    }

    // Import and use the execute handler logic
    const requestId = (req as any).requestId;
    const startTime = Date.now();
    const orgConfig = req.orgConfig;

    const contextBuilder = createExecutionContextBuilder()
      .setAction(effectiveActionName)
      .setRequestId(requestId)
      .setOrgConfigSource(req.orgConfigSource || 'default', orgConfig)
      .setIdentitySource(req.identitySource || 'anonymous', req.rubiAuthContext);

    try {
      const usageCheck = usageLimiter.checkActionAllowed({
        orgId: req.userContext?.orgId || 'unknown',
        userId: req.userContext?.userId,
        actionName: effectiveActionName,
        payload,
        orgConfig,
      } as any);

      if (!usageCheck.allowed) {
        res.status(403).json({
          success: false,
          error: 'Action not allowed by policy',
          code: 'ACTION_DISABLED_BY_POLICY',
          requestId,
        });
        return;
      }

      if (!orgConfigService.isActionAllowed(orgConfig, effectiveActionName)) {
        res.status(403).json({
          success: false,
          error: 'This action has been disabled by your organization administrator',
          code: 'ACTION_DISABLED_BY_POLICY',
          requestId,
        });
        return;
      }

      const action = actionRegistry.get(effectiveActionName);
      if (!action) {
        res.status(404).json({
          success: false,
          error: `Action '${effectiveActionName}' not found`,
          requestId,
        });
        return;
      }

      const authContext: AuthenticatedRequestContext = req.rubiAuthContext || {
        session: undefined,
        isDevMode: true,
        rawTokenClaims: req.extensionAuth,
      };

      const modelPreferences = orgConfigService.getEffectiveModelPreferences(orgConfig, effectiveActionName);

      const { data: orgIntelligence, source: orgIntelligenceSource } = await orgIntelligenceService.getOrgIntelligence(
        authContext.session?.org?.orgId || req.userContext?.orgId || null
      );

      const utilities: ActionUtilities = {
        renderPrompt: (template, data) => {
          const extendedData = {
            ...data,
            user: authContext.session?.user || null,
            org: authContext.session?.org || null,
            orgConfig: orgConfig ? { orgName: orgConfig.orgName, planTier: orgConfig.planTier } : null,
            orgIntelligence: orgIntelligence ? orgIntelligenceService.getIntelligenceForPrompt(orgIntelligence, effectiveActionName) : null,
          };
          return templateEngine.renderTemplate(template, extendedData);
        },
        callLLM: async (prompt, config) => {
          const effectiveConfig = {
            ...config,
            provider: modelPreferences.provider || config.provider,
            model: modelPreferences.model || config.model,
          };
          return llmOrchestrator.call(prompt, effectiveConfig);
        },
        validateSchema: (data, schemaName) => schemaValidator.validate(data, schemaName),
        logger,
      };

      const extendedAuthContext = { ...authContext, orgConfig, orgIntelligence };
      const result = await actionRegistry.execute(effectiveActionName, payload || context, utilities, extendedAuthContext);
      const duration = Date.now() - startTime;

      if (result.success) {
        usageLimiter.incrementUsage({
          orgId: req.userContext?.orgId || 'unknown',
          userId: req.userContext?.userId,
          actionName: effectiveActionName,
          payload,
          orgConfig,
        } as any);
      }

      logger.info('[ActionExecution] Completed via /execute alias', {
        actionName: effectiveActionName,
        success: result.success,
        duration,
        requestId
      });

      if (result.success) {
        res.status(200).json({
          success: true,
          data: result.data,
          metadata: { ...result.metadata, requestId, duration },
        });
      } else {
        res.status(422).json({
          success: false,
          error: result.error,
          data: result.data,
          metadata: { ...result.metadata, requestId, duration },
        });
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error(`Failed to execute action ${effectiveActionName}`, { error, requestId });
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        requestId,
        metadata: { duration },
      });
    }
  }
);

router.get(
  '/list',
  extensionAuthService.requireExtensionAuth,
  (req: ExtensionAuthRequest, res: Response) => {
    const orgConfig = req.orgConfig;
    
    // Phase 9D: Filter actions based on org config
    const allActions = actionRegistry.getAll();
    const filteredActions = allActions.filter(action => 
      orgConfigService.isActionAllowed(orgConfig, action.name)
    ).map(action => ({
      name: action.name,
      description: action.description,
      requiresAuth: action.requiresAuth,
      rateLimit: action.rateLimit,
    }));

    res.json({
      success: true,
      data: {
        actions: filteredActions,
        total: filteredActions.length,
      },
    });
  }
);

router.get(
  '/:actionName/metadata',
  extensionAuthService.requireExtensionAuth,
  (req: ExtensionAuthRequest, res: Response) => {
    const { actionName } = req.params;
    const orgConfig = req.orgConfig;

    // Phase 9D: Check if action is allowed
    if (!orgConfigService.isActionAllowed(orgConfig, actionName)) {
      res.status(403).json({
        success: false,
        error: 'This action has been disabled by your organization administrator',
        code: 'ACTION_DISABLED_BY_POLICY',
      });
      return;
    }

    const metadata = actionRegistry.getActionMetadata(actionName);

    if (!metadata) {
      res.status(404).json({
        success: false,
        error: `Action '${actionName}' not found`,
      });
      return;
    }

    res.json({
      success: true,
      data: metadata,
    });
  }
);

router.post(
  '/validate',
  extensionAuthService.requireExtensionAuth,
  async (req: ExtensionAuthRequest, res: Response) => {
    const { actionName, payload } = req.body;
    const orgConfig = req.orgConfig;

    if (!actionName || !payload) {
      res.status(400).json({
        success: false,
        error: 'actionName and payload are required',
      });
      return;
    }

    // Phase 9D: Check if action is allowed
    if (!orgConfigService.isActionAllowed(orgConfig, actionName)) {
      res.status(403).json({
        success: false,
        error: 'This action has been disabled by your organization administrator',
        code: 'ACTION_DISABLED_BY_POLICY',
      });
      return;
    }

    const action = actionRegistry.get(actionName);
    if (!action) {
      res.status(404).json({
        success: false,
        error: `Action '${actionName}' not found`,
      });
      return;
    }

    const validationResult = actionRegistry.validatePayloadForAction(actionName, payload);

    res.json({
      success: validationResult.valid,
      errors: validationResult.errors,
    });
  }
);

export default router;