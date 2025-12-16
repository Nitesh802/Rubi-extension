/**
 * Phase 9B: Rubi Session Binding Routes
 * 
 * Provides endpoints for binding Rubi web session context to browser extension tokens.
 * This enables full user/org context flow from Rubi web app through extension to backend.
 */

import { Router, Request, Response } from 'express';
import { extensionAuthService } from '../middleware/extensionAuth';
import { logger } from '../logging/logger';
import { config } from '../config';
import {
  SessionBindingRequest,
  SessionBindingResponse,
  RubiSessionContext,
  RubiUserContext,
  RubiOrgContext,
} from '../types';

const router = Router();

/**
 * POST /api/auth/extension-session/bind
 * 
 * Binds a Rubi web session to a browser extension JWT token.
 * 
 * TODO: In production, this endpoint must be secured to only accept
 * calls from internal Rubi systems or with proper signed requests.
 */
router.post('/bind', async (req: Request, res: Response) => {
  try {
    const bindingRequest = req.body as SessionBindingRequest;
    
    // Basic validation
    if (!bindingRequest.sessionId || !bindingRequest.user?.userId || !bindingRequest.org?.orgId) {
      logger.warn('[Rubi Auth] Invalid session binding request - missing required fields');
      return res.status(400).json({
        success: false,
        error: 'Invalid session binding request',
        code: 'INVALID_BINDING_REQUEST',
      });
    }

    // Log the binding request
    logger.info('[Rubi Auth] Received session binding request', {
      sessionId: bindingRequest.sessionId,
      userId: bindingRequest.user.userId,
      orgId: bindingRequest.org.orgId,
      extensionInstanceId: bindingRequest.extensionInstanceId,
      roles: bindingRequest.user.roles,
    });

    // In dev mode, warn about unverified binding
    const isDevMode = config.isDevelopment() || config.get<boolean>('security.extensionAuth.devBypassEnabled');
    if (isDevMode) {
      logger.warn('[Rubi Auth] UNVERIFIED DEV SESSION BINDING - must be restricted in production', {
        userId: bindingRequest.user.userId,
        orgId: bindingRequest.org.orgId,
      });
    }

    // TODO: In production, verify the request is legitimate:
    // - Check request signature from Rubi web app
    // - Verify the user/org exists and is active
    // - Check permissions for the binding operation
    // - Rate limit by IP and user

    // Construct session context
    const user: RubiUserContext = {
      userId: bindingRequest.user.userId,
      email: bindingRequest.user.email,
      displayName: bindingRequest.user.displayName,
      roles: bindingRequest.user.roles || ['user'],
      locale: bindingRequest.user.locale,
    };

    const org: RubiOrgContext = {
      orgId: bindingRequest.org.orgId,
      orgName: bindingRequest.org.orgName,
      planTier: bindingRequest.org.planTier,
    };

    const sessionContext: RubiSessionContext = {
      sessionId: bindingRequest.sessionId,
      user,
      org,
    };

    // Generate JWT with full session context
    const token = extensionAuthService.signRubiSessionToken(sessionContext, isDevMode);
    const expiresIn = config.get<number>('security.extensionAuth.tokenTTL') / 1000; // Convert to seconds

    // Construct response
    const response: SessionBindingResponse = {
      success: true,
      token,
      expiresIn,
      session: sessionContext,
    };

    logger.info('[Rubi Auth] Session binding successful', {
      sessionId: bindingRequest.sessionId,
      userId: bindingRequest.user.userId,
      orgId: bindingRequest.org.orgId,
      tokenExpiresIn: expiresIn,
    });

    return res.json(response);
  } catch (error) {
    logger.error('[Rubi Auth] Session binding failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    return res.status(500).json({
      success: false,
      error: 'Session binding failed',
      code: 'BINDING_ERROR',
    });
  }
});

/**
 * GET /api/auth/extension-session/status
 * 
 * Returns the current session binding capabilities and configuration.
 * Useful for debugging and health checks.
 */
router.get('/status', (req: Request, res: Response) => {
  const isDevMode = config.isDevelopment() || config.get<boolean>('security.extensionAuth.devBypassEnabled');
  
  res.json({
    success: true,
    bindingEnabled: true,
    contextVersion: 'rubi-1',
    isDevMode,
    tokenTTL: config.get<number>('security.extensionAuth.tokenTTL'),
    features: {
      userContext: true,
      orgContext: true,
      roleBasedAccess: true,
      multiTenant: true,
    },
    // TODO: Remove in production
    devWarning: isDevMode ? 'Session binding in DEV mode - unverified requests accepted' : undefined,
  });
});

export default router;