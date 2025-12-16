/**
 * Phase 9A: Browser Extension Authentication Routes
 * 
 * Handles JWT-based handshake between browser extension and backend.
 * Provides token issuance, validation, and refresh endpoints.
 */

import { Router, Request, Response } from 'express';
import { ExtensionHandshakeRequest, ExtensionHandshakeResponse } from '../types';
import { extensionAuthService, ExtensionAuthRequest } from '../middleware/extensionAuth';
import { logger } from '../logging/logger';
import { config } from '../config';

const router = Router();

/**
 * POST /api/auth/extension/handshake
 * 
 * Initial handshake endpoint for browser extension authentication.
 * Validates shared secret and issues JWT token.
 */
router.post('/handshake', async (req: Request, res: Response) => {
  const startTime = Date.now();
  const requestId = (req as any).requestId || `handshake-${Date.now()}`;

  try {
    // Extract shared secret from header
    const sharedSecret = req.headers['x-rubi-extension-key'] as string;
    
    // Validate shared secret
    if (!extensionAuthService.validateSharedSecret(sharedSecret)) {
      logger.warn('Extension handshake failed: invalid shared secret', {
        requestId,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.status(401).json({
        success: false,
        error: 'Invalid extension key',
        code: 'INVALID_EXTENSION_KEY',
      } as ExtensionHandshakeResponse);
      return;
    }

    // Extract optional hints from body
    const { userHint, orgHint, extensionVersion } = req.body as ExtensionHandshakeRequest;

    // Log handshake attempt
    logger.info('Extension handshake initiated', {
      requestId,
      userHint,
      orgHint,
      extensionVersion,
      ip: req.ip,
    });

    // Build token payload
    // Phase 9A: Using static values for now, will be replaced with real user/org lookup in 9B
    const payload = {
      userId: userHint || 'dev-extension-user',
      orgId: orgHint || 'dev-extension-org',
      roles: ['extension_user'] as string[],
    };

    // Generate JWT token
    const token = extensionAuthService.signExtensionToken(payload);
    const expiresAt = extensionAuthService.getTokenExpirationTime();

    // Log successful handshake
    const duration = Date.now() - startTime;
    logger.info('Extension handshake succeeded', {
      requestId,
      userId: payload.userId,
      orgId: payload.orgId,
      duration,
    });

    // Return token
    res.status(200).json({
      success: true,
      token,
      expiresAt,
    } as ExtensionHandshakeResponse);

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Extension handshake failed', {
      error,
      requestId,
      duration,
    });

    res.status(500).json({
      success: false,
      error: 'Handshake failed',
      code: 'HANDSHAKE_ERROR',
    } as ExtensionHandshakeResponse);
  }
});

/**
 * POST /api/auth/extension/refresh
 * 
 * Refresh an existing extension token.
 * Requires valid existing token.
 */
router.post('/refresh', extensionAuthService.requireExtensionAuth, async (req: ExtensionAuthRequest, res: Response) => {
  const startTime = Date.now();
  const requestId = (req as any).requestId || `refresh-${Date.now()}`;

  try {
    if (!req.extensionAuth) {
      res.status(401).json({
        success: false,
        error: 'No valid session',
        code: 'NO_SESSION',
      });
      return;
    }

    // Generate new token with same claims
    const newPayload = {
      userId: req.extensionAuth.userId,
      orgId: req.extensionAuth.orgId,
      roles: req.extensionAuth.roles as string[],
    };

    const token = extensionAuthService.signExtensionToken(newPayload);
    const expiresAt = extensionAuthService.getTokenExpirationTime();

    const duration = Date.now() - startTime;
    logger.info('Extension token refreshed', {
      requestId,
      userId: req.extensionAuth.userId,
      orgId: req.extensionAuth.orgId,
      duration,
    });

    res.status(200).json({
      success: true,
      token,
      expiresAt,
    } as ExtensionHandshakeResponse);

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Extension token refresh failed', {
      error,
      requestId,
      userId: req.extensionAuth?.userId,
      duration,
    });

    res.status(500).json({
      success: false,
      error: 'Token refresh failed',
      code: 'REFRESH_ERROR',
    } as ExtensionHandshakeResponse);
  }
});

/**
 * POST /api/auth/extension/validate
 * 
 * Validate an extension token without refreshing it.
 * Useful for checking token validity.
 */
router.post('/validate', (req: Request, res: Response) => {
  const { token } = req.body;

  if (!token) {
    res.status(400).json({
      success: false,
      error: 'Token is required',
      code: 'TOKEN_REQUIRED',
    });
    return;
  }

  const payload = extensionAuthService.verifyExtensionToken(token);

  if (!payload) {
    res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
      code: 'TOKEN_INVALID',
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: {
      valid: true,
      userId: payload.userId,
      orgId: payload.orgId,
      roles: payload.roles,
      exp: payload.exp,
    },
  });
});

/**
 * GET /api/auth/extension/config
 * 
 * Get public configuration for extension.
 * This is safe to expose as it contains no secrets.
 */
router.get('/config', (_req: Request, res: Response) => {
  const tokenTTL = config.get<number>('security.extensionAuth.tokenTTL');
  const devBypassEnabled = config.get<boolean>('security.extensionAuth.devBypassEnabled');
  const environment = config.get<string>('app.env');

  res.status(200).json({
    success: true,
    data: {
      tokenTTLSeconds: Math.floor(tokenTTL / 1000),
      refreshLeewaySeconds: 300, // Refresh 5 minutes before expiry
      environment,
      devMode: environment === 'development' && devBypassEnabled,
    },
  });
});

export default router;