import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../logging/logger';
import crypto from 'crypto';

export interface AdminSessionData {
  userId: string;
  email: string;
  role: 'admin' | 'superadmin';
  permissions: string[];
  expiresAt: Date;
  csrfToken?: string;
}

export interface AdminAuthenticatedRequest extends Request {
  adminSession?: AdminSessionData;
  adminId?: string;
}

export class AdminAuthMiddleware {
  private jwtSecret: string;
  private adminCredentials: Map<string, { passwordHash: string; role: 'admin' | 'superadmin' }>;

  constructor() {
    this.jwtSecret = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET || 'admin-secret-change-in-production';
    
    if (this.jwtSecret === 'admin-secret-change-in-production') {
      logger.warn('Using default admin JWT secret. Please set ADMIN_JWT_SECRET environment variable.');
    }

    // Initialize admin credentials from environment or defaults
    this.adminCredentials = new Map();
    this.initializeAdminCredentials();
  }

  private initializeAdminCredentials(): void {
    // Load from environment variables
    const adminUser = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'changeme123';
    
    // Hash the password
    const passwordHash = this.hashPassword(adminPassword);
    
    this.adminCredentials.set(adminUser, {
      passwordHash,
      role: 'superadmin'
    });

    // Add secondary admin if configured
    if (process.env.SECONDARY_ADMIN_USERNAME && process.env.SECONDARY_ADMIN_PASSWORD) {
      const secondaryHash = this.hashPassword(process.env.SECONDARY_ADMIN_PASSWORD);
      this.adminCredentials.set(process.env.SECONDARY_ADMIN_USERNAME, {
        passwordHash: secondaryHash,
        role: 'admin'
      });
    }

    logger.info('Admin credentials initialized', { adminCount: this.adminCredentials.size });
  }

  private hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password).digest('hex');
  }

  authenticateAdmin = (req: AdminAuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      const token = this.extractToken(req);

      if (!token) {
        res.status(401).json({
          success: false,
          error: 'No admin authentication token provided',
        });
        return;
      }

      const decoded = jwt.verify(token, this.jwtSecret) as AdminSessionData;

      if (this.isSessionExpired(decoded)) {
        res.status(401).json({
          success: false,
          error: 'Admin session expired',
        });
        return;
      }

      if (decoded.role !== 'admin' && decoded.role !== 'superadmin') {
        res.status(403).json({
          success: false,
          error: 'Admin privileges required',
        });
        return;
      }

      req.adminSession = decoded;
      req.adminId = decoded.userId;

      next();
    } catch (error) {
      logger.error('Admin authentication failed', error);
      res.status(401).json({
        success: false,
        error: 'Invalid admin authentication token',
      });
    }
  };

  requireSuperAdmin = (req: AdminAuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.adminSession) {
      res.status(401).json({
        success: false,
        error: 'Admin authentication required',
      });
      return;
    }

    if (req.adminSession.role !== 'superadmin') {
      res.status(403).json({
        success: false,
        error: 'Superadmin privileges required',
      });
      return;
    }

    next();
  };

  validateCredentials(username: string, password: string): boolean {
    const credentials = this.adminCredentials.get(username);
    if (!credentials) {
      return false;
    }

    const passwordHash = this.hashPassword(password);
    return credentials.passwordHash === passwordHash;
  }

  getAdminRole(username: string): 'admin' | 'superadmin' | null {
    const credentials = this.adminCredentials.get(username);
    return credentials?.role || null;
  }

  private extractToken(req: Request): string | null {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    if (req.cookies && req.cookies.adminToken) {
      return req.cookies.adminToken;
    }

    return null;
  }

  private isSessionExpired(session: AdminSessionData): boolean {
    return new Date(session.expiresAt) < new Date();
  }

  generateAdminToken(username: string, email: string): string | null {
    const role = this.getAdminRole(username);
    if (!role) {
      return null;
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 8); // 8 hour admin sessions

    const session: AdminSessionData = {
      userId: username,
      email,
      role,
      permissions: role === 'superadmin' 
        ? ['org:read', 'org:write', 'org:delete', 'admin:manage']
        : ['org:read', 'org:write'],
      expiresAt,
      csrfToken: crypto.randomBytes(32).toString('hex')
    };

    return jwt.sign(session, this.jwtSecret, {
      expiresIn: '8h',
    });
  }

  verifyAdminToken(token: string): AdminSessionData | null {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as AdminSessionData;
      
      if (this.isSessionExpired(decoded)) {
        return null;
      }

      return decoded;
    } catch {
      return null;
    }
  }

  verifyCsrfToken(req: AdminAuthenticatedRequest): boolean {
    if (!req.adminSession?.csrfToken) {
      return false;
    }

    const csrfToken = req.headers['x-csrf-token'] || req.body?._csrf;
    return csrfToken === req.adminSession.csrfToken;
  }
}

export const adminAuthMiddleware = new AdminAuthMiddleware();