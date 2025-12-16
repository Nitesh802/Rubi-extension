/**
 * Phase 9F: Moodle Identity JWT Verification Service
 * 
 * Validates JWT tokens issued by the Moodle local_rubi_ai_admin plugin
 * and integrates them into the existing identity handling system.
 */

import * as jwt from 'jsonwebtoken';
import { config } from '../config';
import { logger } from '../logging/logger';

/**
 * Identity structure from Moodle identity.php
 */
export interface MoodleIdentity {
  userid: number;
  username: string;
  email: string;
  fullname: string;
  orgid: string;
  roles: string[];
  capabilities: string[];
}

/**
 * JWT payload from Moodle identity.php
 */
export interface MoodleIdentityJWTPayload {
  sub: string; // User ID as string
  userid: number;
  username: string;
  email: string;
  fullname: string;
  orgid: string;
  roles: string[];
  capabilities: string[];
  iat: number;
  exp: number;
  iss: string; // Issuer (Moodle instance)
}

/**
 * Normalized identity for ExecutionContext
 */
export interface NormalizedIdentity {
  userId: string;
  username: string;
  email: string;
  fullName: string;
  orgId: string;
  roles: string[];
  capabilities: string[];
  locale?: string;
}

export class MoodleIdentityService {
  private jwtSecret: string | undefined;
  private enabled: boolean;

  constructor() {
    this.jwtSecret = config.get<string>('moodle.identityJwtSecret');
    this.enabled = !!this.jwtSecret;

    if (this.enabled) {
      logger.info('[MoodleIdentity] Service initialized with JWT verification');
    } else {
      logger.info('[MoodleIdentity] Service disabled - no JWT secret configured');
    }
  }

  /**
   * Verify and parse a JWT token from Moodle identity.php
   * 
   * @param token - JWT token from X-Rubi-Identity-JWT header
   * @returns Normalized identity or null if invalid
   */
  verifyIdentityToken(token: string): NormalizedIdentity | null {
    if (!this.enabled || !this.jwtSecret) {
      logger.debug('[MoodleIdentity] JWT verification disabled - no secret configured');
      return null;
    }

    try {
      // Verify the JWT
      const decoded = jwt.verify(token, this.jwtSecret, {
        algorithms: ['HS256', 'HS384', 'HS512'], // Common symmetric algorithms
        clockTolerance: 30 // Allow 30 seconds clock skew
      }) as MoodleIdentityJWTPayload;

      // Validate required fields
      if (!decoded.userid || !decoded.orgid) {
        logger.warn('[MoodleIdentity] Invalid JWT payload - missing required fields', {
          hasUserId: !!decoded.userid,
          hasOrgId: !!decoded.orgid
        });
        return null;
      }

      // Normalize the identity
      const identity: NormalizedIdentity = {
        userId: decoded.userid.toString(),
        username: decoded.username || `user${decoded.userid}`,
        email: decoded.email || '',
        fullName: decoded.fullname || decoded.username || '',
        orgId: decoded.orgid,
        roles: decoded.roles || [],
        capabilities: decoded.capabilities || [],
        locale: undefined // Can be extended if Moodle provides locale
      };

      logger.info('[MoodleIdentity] JWT verified successfully', {
        userId: identity.userId,
        username: identity.username,
        orgId: identity.orgId,
        roles: identity.roles
      });

      return identity;

    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        logger.debug('[MoodleIdentity] JWT expired', {
          expiredAt: error.expiredAt
        });
      } else if (error instanceof jwt.JsonWebTokenError) {
        logger.warn('[MoodleIdentity] Invalid JWT', {
          error: error.message
        });
      } else {
        logger.error('[MoodleIdentity] JWT verification failed', error);
      }
      return null;
    }
  }

  /**
   * Check if Moodle identity verification is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Build ExecutionContext-compatible identity
   * 
   * @param identity - Normalized identity from JWT
   * @returns Identity context for ExecutionContext
   */
  buildIdentityContext(identity: NormalizedIdentity) {
    return {
      userId: identity.userId,
      email: identity.email,
      displayName: identity.fullName || identity.username,
      roles: identity.roles,
      locale: identity.locale || 'en-US',
      orgId: identity.orgId,
      capabilities: identity.capabilities,
      source: 'moodle' as const
    };
  }
}

// Export singleton instance
export const moodleIdentityService = new MoodleIdentityService();