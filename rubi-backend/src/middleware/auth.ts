import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { SessionData } from '../types';
import { logger } from '../logging/logger';

export interface AuthenticatedRequest extends Request {
  session?: SessionData;
  userId?: string;
}

export class AuthMiddleware {
  private jwtSecret: string;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'default-secret-change-in-production';
    
    if (this.jwtSecret === 'default-secret-change-in-production') {
      logger.warn('Using default JWT secret. Please set JWT_SECRET environment variable.');
    }
  }

  authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      const token = this.extractToken(req);

      if (!token) {
        res.status(401).json({
          success: false,
          error: 'No authentication token provided',
        });
        return;
      }

      const decoded = jwt.verify(token, this.jwtSecret) as SessionData;

      if (this.isSessionExpired(decoded)) {
        res.status(401).json({
          success: false,
          error: 'Session expired',
        });
        return;
      }

      req.session = decoded;
      req.userId = decoded.userId;

      next();
    } catch (error) {
      logger.error('Authentication failed', error);
      res.status(401).json({
        success: false,
        error: 'Invalid authentication token',
      });
    }
  };

  optionalAuthenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      const token = this.extractToken(req);

      if (!token) {
        next();
        return;
      }

      const decoded = jwt.verify(token, this.jwtSecret) as SessionData;

      if (!this.isSessionExpired(decoded)) {
        req.session = decoded;
        req.userId = decoded.userId;
      }

      next();
    } catch (error) {
      next();
    }
  };

  requirePermission = (permission: string) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
      if (!req.session) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      if (!req.session.permissions.includes(permission)) {
        res.status(403).json({
          success: false,
          error: `Permission '${permission}' required`,
        });
        return;
      }

      next();
    };
  };

  private extractToken(req: Request): string | null {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    if (req.cookies && req.cookies.token) {
      return req.cookies.token;
    }

    if (req.query.token && typeof req.query.token === 'string') {
      return req.query.token;
    }

    return null;
  }

  private isSessionExpired(session: SessionData): boolean {
    return new Date(session.expiresAt) < new Date();
  }

  generateToken(sessionData: Omit<SessionData, 'expiresAt'>): string {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const session: SessionData = {
      ...sessionData,
      expiresAt,
    };

    return jwt.sign(session, this.jwtSecret, {
      expiresIn: '24h',
    });
  }

  verifyToken(token: string): SessionData | null {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as SessionData;
      
      if (this.isSessionExpired(decoded)) {
        return null;
      }

      return decoded;
    } catch {
      return null;
    }
  }
}

export const authMiddleware = new AuthMiddleware();