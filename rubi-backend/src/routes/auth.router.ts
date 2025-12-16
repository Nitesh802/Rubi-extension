import { Router, Request, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../logging/logger';

const router = Router();

router.post('/session/create', async (req: Request, res: Response) => {
  const { userId, email, extensionId } = req.body;

  if (!userId || !extensionId) {
    res.status(400).json({
      success: false,
      error: 'userId and extensionId are required',
    });
    return;
  }

  try {
    const token = authMiddleware.generateToken({
      userId,
      email,
      extensionId,
      permissions: ['execute_actions', 'read_templates'],
    });

    logger.info('Session created', {
      userId,
      extensionId,
    });

    res.json({
      success: true,
      data: {
        token,
        expiresIn: '24h',
      },
    });
  } catch (error) {
    logger.error('Failed to create session', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create session',
    });
  }
});

router.post('/session/validate', (req: Request, res: Response) => {
  const { token } = req.body;

  if (!token) {
    res.status(400).json({
      success: false,
      error: 'Token is required',
    });
    return;
  }

  const session = authMiddleware.verifyToken(token);

  if (!session) {
    res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
    });
    return;
  }

  res.json({
    success: true,
    data: {
      valid: true,
      session: {
        userId: session.userId,
        email: session.email,
        extensionId: session.extensionId,
        permissions: session.permissions,
        expiresAt: session.expiresAt,
      },
    },
  });
});

router.post('/session/refresh', authMiddleware.authenticate, (req: AuthenticatedRequest, res: Response) => {
  if (!req.session) {
    res.status(401).json({
      success: false,
      error: 'No valid session',
    });
    return;
  }

  try {
    const newToken = authMiddleware.generateToken({
      userId: req.session.userId,
      email: req.session.email,
      extensionId: req.session.extensionId,
      permissions: req.session.permissions,
    });

    logger.info('Session refreshed', {
      userId: req.session.userId,
    });

    res.json({
      success: true,
      data: {
        token: newToken,
        expiresIn: '24h',
      },
    });
  } catch (error) {
    logger.error('Failed to refresh session', error);
    res.status(500).json({
      success: false,
      error: 'Failed to refresh session',
    });
  }
});

router.post('/session/revoke', authMiddleware.authenticate, (req: AuthenticatedRequest, res: Response) => {
  logger.info('Session revoked', {
    userId: req.session?.userId,
  });

  res.json({
    success: true,
    message: 'Session revoked successfully',
  });
});

export default router;