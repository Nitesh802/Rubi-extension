/**
 * Phase 9A: Browser Extension Authentication
 * Phase 9D: Extended with Org Config attachment
 * 
 * JWT-based authentication specifically for browser extension handshake.
 * Provides token generation, verification, middleware for extension auth,
 * and org configuration attachment.
 */

import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { 
  ExtensionAuthPayload,
  RubiExtensionAuthPayload,
  RubiSessionContext,
  RubiUserContext,
  RubiOrgContext,
  AuthenticatedRequestContext
} from '../types';
import { OrgConfig } from '../types/orgConfig';
import { config } from '../config';
import { logger } from '../logging/logger';
import { orgConfigService } from '../config/orgConfigService';
import { moodleIdentityService } from '../auth/moodleIdentityService';

export interface ExtensionAuthRequest extends Request {
  extensionAuth?: ExtensionAuthPayload;
  userContext?: {
    userId: string;
    orgId: string;
    roles: string[];
  };
  rubiAuthContext?: AuthenticatedRequestContext;
  orgConfig?: OrgConfig | null;
  // Phase 10A: Track identity and config sources
  identitySource?: 'moodle' | 'extension' | 'mock' | 'anonymous';
  orgConfigSource?: 'moodle' | 'json' | 'default' | 'none';
}

export class ExtensionAuthService {
  private jwtSecret: string;
  private jwtIssuer: string;
  private jwtAudience: string;
  private tokenTTL: number;
  private devBypassEnabled: boolean;
  private extensionSharedSecret: string;

  constructor() {
    this.jwtSecret = config.get<string>('security.jwt.secret');
    this.jwtIssuer = config.get<string>('security.jwt.issuer');
    this.jwtAudience = config.get<string>('security.jwt.audience');
    this.tokenTTL = config.get<number>('security.extensionAuth.tokenTTL');
    this.devBypassEnabled = config.get<boolean>('security.extensionAuth.devBypassEnabled');
    this.extensionSharedSecret = config.get<string>('security.extensionAuth.sharedSecret');

    // Warn about insecure defaults
    if (this.jwtSecret === 'default-secret-change-in-production' && config.isProduction()) {
      logger.error('CRITICAL: Using default JWT secret in production!');
      throw new Error('JWT_SECRET must be set in production');
    }

    if (this.extensionSharedSecret === 'dev-extension-secret' && config.isProduction()) {
      logger.error('CRITICAL: Using default extension shared secret in production!');
      throw new Error('RUBI_EXTENSION_SHARED_SECRET must be set in production');
    }

    logger.info('Extension auth service initialized', {
      issuer: this.jwtIssuer,
      audience: this.jwtAudience,
      tokenTTLMinutes: this.tokenTTL / 60000,
      devBypassEnabled: this.devBypassEnabled,
    });
  }

  /**
   * Sign a JWT token for browser extension authentication
   */
  signExtensionToken(payload: Omit<ExtensionAuthPayload, 'iat' | 'exp' | 'tokenType'>): string {
    const expiresIn = Math.floor(this.tokenTTL / 1000); // Convert ms to seconds

    const token = jwt.sign(
      {
        ...payload,
        tokenType: 'browser_extension' as const,
      },
      this.jwtSecret,
      {
        expiresIn,
        issuer: this.jwtIssuer,
        audience: this.jwtAudience,
      }
    );

    logger.debug('Extension token signed', {
      userId: payload.userId,
      orgId: payload.orgId,
      expiresInSeconds: expiresIn,
    });

    return token;
  }

  /**
   * Sign a JWT token with full Rubi session binding
   */
  signRubiSessionToken(sessionContext: RubiSessionContext, isDevMode: boolean = false): string {
    const expiresIn = Math.floor(this.tokenTTL / 1000); // Convert ms to seconds

    const payload: Omit<RubiExtensionAuthPayload, 'iat' | 'exp'> = {
      sub: sessionContext.sessionId,
      sessionId: sessionContext.sessionId,
      userId: sessionContext.user.userId,
      orgId: sessionContext.org.orgId,
      roles: sessionContext.user.roles || [],
      locale: sessionContext.user.locale,
      orgName: sessionContext.org.orgName,
      planTier: sessionContext.org.planTier,
      contextVersion: 'rubi-1',
      isDevMode,
      tokenType: 'browser_extension',
    };

    const token = jwt.sign(
      payload,
      this.jwtSecret,
      {
        expiresIn,
        issuer: this.jwtIssuer,
        audience: this.jwtAudience,
      }
    );

    logger.info('[Rubi Auth] Session token signed', {
      sessionId: sessionContext.sessionId,
      userId: sessionContext.user.userId,
      orgId: sessionContext.org.orgId,
      isDevMode,
      expiresInSeconds: expiresIn,
    });

    return token;
  }

  /**
   * Verify a JWT token from browser extension
   */
  verifyExtensionToken(token: string): ExtensionAuthPayload | null {
    try {
      const decoded = jwt.verify(token, this.jwtSecret, {
        issuer: this.jwtIssuer,
        audience: this.jwtAudience,
      }) as ExtensionAuthPayload;

      // Ensure it's an extension token
      if (decoded.tokenType !== 'browser_extension') {
        logger.warn('Token verification failed: not an extension token', {
          tokenType: decoded.tokenType,
        });
        return null;
      }

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        logger.debug('Extension token expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        logger.warn('Invalid extension token', { error: error.message });
      } else {
        logger.error('Extension token verification failed', error);
      }
      return null;
    }
  }

  /**
   * Verify a JWT token with Rubi session binding
   */
  verifyRubiSessionToken(token: string): RubiExtensionAuthPayload | null {
    try {
      const decoded = jwt.verify(token, this.jwtSecret, {
        issuer: this.jwtIssuer,
        audience: this.jwtAudience,
      }) as RubiExtensionAuthPayload;

      // Ensure it's an extension token
      if (decoded.tokenType !== 'browser_extension') {
        logger.warn('[Rubi Auth] Token verification failed: not an extension token', {
          tokenType: decoded.tokenType,
        });
        return null;
      }

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        logger.debug('[Rubi Auth] Session token expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        logger.warn('[Rubi Auth] Invalid session token', { error: error.message });
      } else {
        logger.error('[Rubi Auth] Session token verification failed', error);
      }
      return null;
    }
  }

  /**
   * Build AuthenticatedRequestContext from JWT claims
   */
  buildAuthContext(claims: ExtensionAuthPayload | RubiExtensionAuthPayload): AuthenticatedRequestContext {
    const rubiClaims = claims as RubiExtensionAuthPayload;
    
    // Check if this is a full Rubi session token
    if (rubiClaims.contextVersion === 'rubi-1' && rubiClaims.sessionId && rubiClaims.userId && rubiClaims.orgId) {
      const session: RubiSessionContext = {
        sessionId: rubiClaims.sessionId,
        user: {
          userId: rubiClaims.userId,
          roles: rubiClaims.roles,
          locale: rubiClaims.locale,
        },
        org: {
          orgId: rubiClaims.orgId,
          orgName: rubiClaims.orgName,
          planTier: rubiClaims.planTier,
        },
      };

      return {
        session,
        isDevMode: rubiClaims.isDevMode || false,
        rawTokenClaims: claims,
      };
    }

    // Legacy extension token without full session binding
    return {
      session: undefined,
      isDevMode: true,
      rawTokenClaims: claims,
    };
  }

  /**
   * Validate extension shared secret for handshake
   */
  validateSharedSecret(providedSecret: string | undefined): boolean {
    if (!providedSecret) {
      logger.warn('Extension handshake attempted without shared secret');
      return false;
    }

    const isValid = providedSecret === this.extensionSharedSecret;
    
    if (!isValid) {
      logger.warn('Extension handshake failed: invalid shared secret');
    }

    return isValid;
  }

  /**
   * Middleware to require extension authentication and attach org config
   */
  requireExtensionAuth = async (req: ExtensionAuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Development bypass if enabled
      if (this.devBypassEnabled && config.isDevelopment()) {
        const devBypassHeader = req.headers['x-rubi-dev-bypass'];
        const devTokenHeader = req.headers['x-rubi-dev-token'];
        
        if (devBypassHeader === 'true' || devTokenHeader) {
          logger.debug('Dev bypass activated for extension auth');
          req.userContext = {
            userId: 'dev-extension-user',
            orgId: 'techcorp', // Use sample org for dev mode
            roles: ['extension_user', 'dev_mode'],
          };
          req.extensionAuth = {
            userId: 'dev-extension-user',
            orgId: 'techcorp',
            roles: ['extension_user', 'dev_mode'],
            tokenType: 'browser_extension',
          };
          req.rubiAuthContext = {
            session: {
              sessionId: 'dev-session',
              user: {
                userId: 'dev-extension-user',
                roles: ['extension_user', 'dev_mode'],
              },
              org: {
                orgId: 'techcorp',
                orgName: 'TechCorp Industries',
                planTier: 'enterprise',
              },
            },
            isDevMode: true,
            rawTokenClaims: req.extensionAuth,
          };
          
          // Load org config for dev mode
          const orgConfigResult = await orgConfigService.getOrgConfig('techcorp');
          req.orgConfig = orgConfigResult.config;
          req.orgConfigSource = orgConfigResult.source;
          
          next();
          return;
        }
      }

      // Phase 9F: Check for Moodle identity JWT first
      const moodleIdentityHeader = req.headers['x-rubi-identity-jwt'] as string;
      if (moodleIdentityHeader && moodleIdentityService.isEnabled()) {
        logger.debug('[ExtensionAuth] Found Moodle identity JWT header');
        
        const moodleIdentity = moodleIdentityService.verifyIdentityToken(moodleIdentityHeader);
        if (moodleIdentity) {
          // Build identity context from Moodle JWT
          const identityContext = moodleIdentityService.buildIdentityContext(moodleIdentity);
          
          // Set up request context with Moodle identity
          req.userContext = {
            userId: moodleIdentity.userId,
            orgId: moodleIdentity.orgId,
            roles: moodleIdentity.roles
          };
          
          req.rubiAuthContext = {
            session: {
              sessionId: `moodle-${Date.now()}`, // Generate session ID
              user: {
                userId: moodleIdentity.userId,
                email: moodleIdentity.email,
                displayName: moodleIdentity.fullName,
                roles: moodleIdentity.roles,
                locale: identityContext.locale
              },
              org: {
                orgId: moodleIdentity.orgId,
                orgName: undefined, // Will be filled from org config
                planTier: undefined  // Will be filled from org config
              }
            },
            isDevMode: false,
            rawTokenClaims: { source: 'moodle', identity: moodleIdentity }
          };
          
          // Phase 10A: Track Moodle identity source
          req.identitySource = 'moodle';
          
          // Load org config using Moodle identity's orgId
          try {
            const orgConfigResult = await orgConfigService.getOrgConfig(moodleIdentity.orgId);
            req.orgConfig = orgConfigResult.config;
            req.orgConfigSource = orgConfigResult.source;
            
            if (orgConfigResult.config) {
              // Update org details in auth context
              req.rubiAuthContext.session!.org.orgName = orgConfigResult.config.orgName;
              req.rubiAuthContext.session!.org.planTier = orgConfigResult.config.planTier;
              
              logger.info('[ExtensionAuth] Moodle identity accepted with org config', {
                userId: moodleIdentity.userId,
                orgId: moodleIdentity.orgId,
                orgName: orgConfigResult.config.orgName,
                planTier: orgConfigResult.config.planTier,
                orgConfigSource: orgConfigResult.source
              });
            } else {
              logger.debug('[ExtensionAuth] No org config found for Moodle identity', {
                orgId: moodleIdentity.orgId,
                orgConfigSource: orgConfigResult.source
              });
            }
          } catch (error) {
            logger.warn('[ExtensionAuth] Failed to load org config for Moodle identity', {
              orgId: moodleIdentity.orgId,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
            req.orgConfig = null;
            req.orgConfigSource = 'none';
          }
          
          // Still require extension auth token for API access
          const authHeader = req.headers.authorization;
          if (authHeader && authHeader.startsWith('Bearer ')) {
            // Validate extension token but identity comes from Moodle
            const extensionToken = authHeader.substring(7);
            const extensionPayload = this.verifyExtensionToken(extensionToken);
            if (extensionPayload) {
              req.extensionAuth = extensionPayload;
              next();
              return;
            }
          }
          
          // Allow through with just Moodle identity in dev mode
          if (config.isDevelopment()) {
            logger.debug('[ExtensionAuth] Allowing Moodle identity without extension token in dev mode');
            req.extensionAuth = {
              userId: moodleIdentity.userId,
              orgId: moodleIdentity.orgId,
              roles: moodleIdentity.roles,
              tokenType: 'browser_extension'
            };
            next();
            return;
          }
        }
      }

      // Extract token from Authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
          success: false,
          error: 'No authentication token provided',
          code: 'AUTH_TOKEN_MISSING',
        });
        return;
      }

      const token = authHeader.substring(7);
      let payload: ExtensionAuthPayload | RubiExtensionAuthPayload | null = null;
      
      // Try to verify as Rubi session token first
      const rubiPayload = this.verifyRubiSessionToken(token);
      if (rubiPayload) {
        const authContext = this.buildAuthContext(rubiPayload);
        req.rubiAuthContext = authContext;
        req.extensionAuth = rubiPayload as ExtensionAuthPayload;
        req.userContext = {
          userId: rubiPayload.userId || 'unknown',
          orgId: rubiPayload.orgId || 'unknown',
          roles: rubiPayload.roles || [],
        };
        payload = rubiPayload;
      } else {
        // Fallback to legacy extension token
        const legacyPayload = this.verifyExtensionToken(token);
        if (!legacyPayload) {
          res.status(401).json({
            success: false,
            error: 'Invalid or expired authentication token',
            code: 'AUTH_TOKEN_INVALID',
          });
          return;
        }
        
        const authContext = this.buildAuthContext(legacyPayload);
        req.rubiAuthContext = authContext;
        req.extensionAuth = legacyPayload;
        req.userContext = {
          userId: legacyPayload.userId,
          orgId: legacyPayload.orgId,
          roles: legacyPayload.roles,
        };
        payload = legacyPayload;
      }

      logger.debug('Extension authenticated', {
        userId: payload.userId,
        orgId: payload.orgId,
      });

      // Phase 10A: Track extension identity source
      req.identitySource = req.rubiAuthContext?.session ? 'extension' : 'anonymous';
      
      // Attach org config to request (Phase 9D)
      if (req.userContext?.orgId) {
        try {
          const orgConfigResult = await orgConfigService.getOrgConfig(req.userContext.orgId);
          req.orgConfig = orgConfigResult.config;
          req.orgConfigSource = orgConfigResult.source;
          
          if (orgConfigResult.config) {
            logger.debug('Org config attached to request', {
              orgId: req.userContext.orgId,
              planTier: orgConfigResult.config.planTier,
              featureFlags: Object.keys(orgConfigResult.config.featureFlags).filter(k => orgConfigResult.config?.featureFlags[k]),
              source: orgConfigResult.source
            });
          } else {
            logger.debug('No org config found, using defaults', {
              orgId: req.userContext.orgId,
              source: orgConfigResult.source
            });
          }
        } catch (error) {
          logger.warn('Failed to load org config, continuing without it', {
            orgId: req.userContext.orgId,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          req.orgConfig = null;
          req.orgConfigSource = 'none';
        }
      } else {
        req.orgConfig = null;
        req.orgConfigSource = 'none';
      }

      next();
    } catch (error) {
      logger.error('Extension auth middleware error', error);
      res.status(500).json({
        success: false,
        error: 'Authentication failed',
        code: 'AUTH_ERROR',
      });
    }
  };

  /**
   * Get token expiration time
   */
  getTokenExpirationTime(): string {
    const expiresAt = new Date(Date.now() + this.tokenTTL);
    return expiresAt.toISOString();
  }
}

// Export singleton instance
export const extensionAuthService = new ExtensionAuthService();