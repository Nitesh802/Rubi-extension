/**
 * Identity and Session Context Types for Rubi Platform
 *
 * These types define the user, organization, and session context
 * that flows through the entire system from browser extension to backend.
 */

// Import and re-export IdentityContext from execution
export { IdentityContext } from './execution';

/**
 * Represents a Rubi user within the system
 */
export interface RubiUserContext {
  /** Stable Rubi internal user ID */
  userId: string;
  
  /** Optional email address */
  email?: string;
  
  /** Friendly display name for prompts and logging */
  displayName?: string;
  
  /** User roles (e.g. ["user"], ["manager"], ["admin"]) */
  roles?: string[];
  
  /** User locale (e.g. "en-US", "pt-PT") */
  locale?: string;
}

/**
 * Represents a Rubi organization or tenant
 */
export interface RubiOrgContext {
  /** Stable Rubi organization / tenant ID */
  orgId: string;
  
  /** Organization name for prompts and logging */
  orgName?: string;
  
  /** Service tier (e.g. "pilot", "enterprise") */
  planTier?: string;
}

/**
 * Complete session context binding user to organization
 */
export interface RubiSessionContext {
  /** Unique identifier for this logged-in Rubi web session */
  sessionId: string;
  
  /** User information */
  user: RubiUserContext;
  
  /** Organization information */
  org: RubiOrgContext;
}

/**
 * Request context that includes authentication and identity information
 */
export interface AuthenticatedRequestContext {
  /** Session information when user is bound, undefined in dev/anonymous mode */
  session?: RubiSessionContext;
  
  /** True if using development fallback (no real Rubi binding) */
  isDevMode: boolean;
  
  /** Raw JWT claims for debugging purposes */
  rawTokenClaims: any;
}

/**
 * Extended JWT payload for Rubi session binding
 */
export interface RubiExtensionAuthPayload {
  /** Subject - extension session ID or user ID */
  sub: string;
  
  /** Session identifier */
  sessionId?: string;
  
  /** User ID from Rubi system */
  userId?: string;
  
  /** Organization ID from Rubi system */
  orgId?: string;
  
  /** User roles */
  roles?: string[];
  
  /** User locale */
  locale?: string;
  
  /** Organization name */
  orgName?: string;
  
  /** Organization plan tier */
  planTier?: string;
  
  /** Context version for future compatibility */
  contextVersion: string;
  
  /** Development mode indicator */
  isDevMode: boolean;
  
  /** Token type identifier */
  tokenType: 'browser_extension';
  
  /** Standard JWT timestamps */
  iat: number;
  exp: number;
}

/**
 * Request payload for session binding endpoint
 */
export interface SessionBindingRequest {
  /** Rubi web session ID or random identifier */
  sessionId: string;
  
  /** User information to bind */
  user: {
    userId: string;
    email?: string;
    displayName?: string;
    roles?: string[];
    locale?: string;
  };
  
  /** Organization information to bind */
  org: {
    orgId: string;
    orgName?: string;
    planTier?: string;
  };
  
  /** Optional browser extension instance identifier */
  extensionInstanceId?: string;
}

/**
 * Response from session binding endpoint
 */
export interface SessionBindingResponse {
  /** Success indicator */
  success: boolean;
  
  /** JWT token with session information */
  token: string;
  
  /** Token expiry time in seconds */
  expiresIn: number;
  
  /** Full session context */
  session: RubiSessionContext;
}