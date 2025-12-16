import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { logger } from '../logging/logger';

export class SecurityMiddleware {
  private allowedOrigins: string[];

  constructor() {
    this.allowedOrigins = this.parseAllowedOrigins();
  }

  private parseAllowedOrigins(): string[] {
    const origins = process.env.ALLOWED_ORIGINS || 'http://localhost:3001';
    return origins.split(',').map(origin => origin.trim());
  }

  helmet() {
    return helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
    });
  }

  cors() {
    return cors({
      origin: (origin, callback) => {
        if (!origin) {
          callback(null, true);
          return;
        }

        if (this.allowedOrigins.includes(origin) || 
            origin.startsWith('chrome-extension://') ||
            origin.startsWith('moz-extension://')) {
          callback(null, true);
        } else {
          logger.warn(`CORS blocked origin: ${origin}`);
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-Token'],
      exposedHeaders: ['X-Request-Id'],
    });
  }

  rateLimiter(windowMs?: number, max?: number) {
    return rateLimit({
      windowMs: windowMs || parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
      max: max || parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
      message: 'Too many requests from this IP, please try again later',
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req: Request, res: Response) => {
        logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
          success: false,
          error: 'Rate limit exceeded. Please try again later.',
        });
      },
    });
  }

  validateContentType = (req: Request, res: Response, next: NextFunction): void => {
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      const contentType = req.headers['content-type'];
      
      if (!contentType || !contentType.includes('application/json')) {
        res.status(415).json({
          success: false,
          error: 'Content-Type must be application/json',
        });
        return;
      }
    }
    next();
  };

  sanitizeInput = (req: Request, res: Response, next: NextFunction): void => {
    if (req.body) {
      req.body = this.sanitizeObject(req.body);
    }
    if (req.query) {
      req.query = this.sanitizeObject(req.query as any) as any;
    }
    if (req.params) {
      req.params = this.sanitizeObject(req.params);
    }
    next();
  };

  private sanitizeObject(obj: any): any {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }

    const sanitized: any = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const sanitizedKey = this.sanitizeString(key);
      
      if (typeof value === 'string') {
        sanitized[sanitizedKey] = this.sanitizeString(value);
      } else if (typeof value === 'object') {
        sanitized[sanitizedKey] = this.sanitizeObject(value);
      } else {
        sanitized[sanitizedKey] = value;
      }
    }

    return sanitized;
  }

  private sanitizeString(str: string): string {
    return str
      .replace(/[<>]/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  }

  requestLogger = (req: Request, res: Response, next: NextFunction): void => {
    const requestId = this.generateRequestId();
    (req as any).requestId = requestId;
    res.setHeader('X-Request-Id', requestId);

    const startTime = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      
      logger.info('Request completed', {
        requestId,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        userId: (req as any).userId,
      });
    });

    next();
  };

  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  errorHandler = (err: Error, req: Request, res: Response, next: NextFunction): void => {
    const requestId = (req as any).requestId || 'unknown';
    
    logger.error('Unhandled error', {
      requestId,
      error: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
    });

    if (res.headersSent) {
      return next(err);
    }

    res.status(500).json({
      success: false,
      error: process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : err.message,
      requestId,
    });
  };
}

export const securityMiddleware = new SecurityMiddleware();