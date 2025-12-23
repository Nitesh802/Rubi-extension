import { Router, Request, Response } from 'express';
import { adminAuthMiddleware, AdminAuthenticatedRequest } from '../middleware/adminAuth';
import { logger } from '../logging/logger';
import { securityMiddleware } from '../middleware/security';

const router = Router();

// Admin login
router.post('/login', 
  securityMiddleware.rateLimiter(15 * 60 * 1000, 5), // 5 attempts per 15 minutes
  async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        logger.warn('Admin login attempt with missing credentials');
        res.status(400).json({
          success: false,
          error: 'Username and password required'
        });
        return;
      }

      // Validate credentials
      if (!adminAuthMiddleware.validateCredentials(username, password)) {
        logger.warn('Failed admin login attempt', { username });
        res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
        return;
      }

      // Generate admin token
      const token = adminAuthMiddleware.generateAdminToken(
        username,
        `${username}@rubi.admin`
      );

      if (!token) {
        logger.error('Failed to generate admin token', { username });
        res.status(500).json({
          success: false,
          error: 'Failed to create session'
        });
        return;
      }

      const session = adminAuthMiddleware.verifyAdminToken(token);

      logger.info('Admin login successful', {
        username,
        role: session?.role,
        action: 'admin_login'
      });

      res.json({
        success: true,
        token,
        expiresAt: session?.expiresAt,
        role: session?.role,
        csrfToken: session?.csrfToken
      });
    } catch (error) {
      logger.error('Admin login error', error);
      res.status(500).json({
        success: false,
        error: 'Login failed'
      });
    }
  }
);

// Admin logout
router.post('/logout',
  adminAuthMiddleware.authenticateAdmin,
  (req: AdminAuthenticatedRequest, res: Response) => {
    try {
      logger.info('Admin logout', {
        username: req.adminSession?.userId,
        action: 'admin_logout'
      });

      // In production, you might want to invalidate the token server-side
      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      logger.error('Admin logout error', error);
      res.status(500).json({
        success: false,
        error: 'Logout failed'
      });
    }
  }
);

// Get current admin session
router.get('/session',
  adminAuthMiddleware.authenticateAdmin,
  (req: AdminAuthenticatedRequest, res: Response) => {
    try {
      res.json({
        success: true,
        session: {
          userId: req.adminSession?.userId,
          email: req.adminSession?.email,
          role: req.adminSession?.role,
          permissions: req.adminSession?.permissions,
          expiresAt: req.adminSession?.expiresAt
        }
      });
    } catch (error) {
      logger.error('Admin session check error', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve session'
      });
    }
  }
);

// Refresh admin token
router.post('/refresh',
  adminAuthMiddleware.authenticateAdmin,
  (req: AdminAuthenticatedRequest, res: Response) => {
    try {
      const username = req.adminSession?.userId;
      const email = req.adminSession?.email;

      if (!username || !email) {
        res.status(400).json({
          success: false,
          error: 'Invalid session'
        });
        return;
      }

      const newToken = adminAuthMiddleware.generateAdminToken(username, email);
      const session = adminAuthMiddleware.verifyAdminToken(newToken!);

      logger.info('Admin token refreshed', {
        username,
        action: 'admin_token_refresh'
      });

      res.json({
        success: true,
        token: newToken,
        expiresAt: session?.expiresAt,
        csrfToken: session?.csrfToken
      });
    } catch (error) {
      logger.error('Admin token refresh error', error);
      res.status(500).json({
        success: false,
        error: 'Failed to refresh token'
      });
    }
  }
);

export default router;