import { Router, Response } from 'express';
import { adminAuthMiddleware, AdminAuthenticatedRequest } from '../middleware/adminAuth';
import { orgConfigPersistence } from '../config/orgConfigPersistence';
import { logger } from '../logging/logger';
import { OrgConfig } from '../types/orgConfig';

const router = Router();

// All routes require admin authentication
router.use(adminAuthMiddleware.authenticateAdmin);

// GET /api/admin/orgs - List all orgs
router.get('/', async (req: AdminAuthenticatedRequest, res: Response) => {
  try {
    const orgs = await orgConfigPersistence.getAllOrgs();
    
    logger.info('Admin listed orgs', {
      adminId: req.adminSession?.userId,
      count: orgs.length,
      action: 'admin_list_orgs'
    });

    res.json({
      success: true,
      orgs,
      count: orgs.length
    });
  } catch (error) {
    logger.error('Failed to list orgs', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve organizations'
    });
  }
});

// GET /api/admin/orgs/:orgId - Get specific org
router.get('/:orgId', async (req: AdminAuthenticatedRequest, res: Response) => {
  try {
    const { orgId } = req.params;
    const org = await orgConfigPersistence.getOrgById(orgId);

    if (!org) {
      res.status(404).json({
        success: false,
        error: 'Organization not found'
      });
      return;
    }

    logger.info('Admin retrieved org', {
      adminId: req.adminSession?.userId,
      orgId,
      action: 'admin_get_org'
    });

    res.json({
      success: true,
      org
    });
  } catch (error) {
    logger.error('Failed to get org', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve organization'
    });
  }
});

// POST /api/admin/orgs - Create new org
router.post('/', async (req: AdminAuthenticatedRequest, res: Response) => {
  try {
    // Validate CSRF token for write operations
    if (!adminAuthMiddleware.verifyCsrfToken(req)) {
      res.status(403).json({
        success: false,
        error: 'Invalid CSRF token'
      });
      return;
    }

    const orgConfig: OrgConfig = req.body;

    // Validate required fields
    if (!orgConfig.orgId || !orgConfig.orgName) {
      res.status(400).json({
        success: false,
        error: 'Organization ID and name are required'
      });
      return;
    }

    // Set defaults for missing fields
    const configWithDefaults: OrgConfig = {
      orgId: orgConfig.orgId,
      orgName: orgConfig.orgName,
      planTier: orgConfig.planTier || 'free',
      allowedActions: orgConfig.allowedActions || [
        'summarize_linkedin_profile',
        'analyze_email_message',
        'review_salesforce_opportunity',
        'generate_dashboard_insights'
      ],
      blockedActions: orgConfig.blockedActions || [],
      modelPreferences: orgConfig.modelPreferences || {
        defaultProvider: 'openai',
        perAction: {}
      },
      toneProfile: orgConfig.toneProfile || {
        id: 'default',
        style: 'consultative'
      },
      featureFlags: orgConfig.featureFlags || {
        enableDebugPanel: true,
        enableHistory: false,
        enableExperimentalActions: false,
        enableSalesforceBeta: false,
        enableLinkedInDeepDive: false,
        enableEmailToneStrictMode: false
      },
      limits: orgConfig.limits || {
        maxActionsPerPage: 10,
        maxActionsPerSession: 100,
        maxTokensPerAction: 4000
      }
    };

    const created = await orgConfigPersistence.createOrg(configWithDefaults);

    logger.info('Admin created org', {
      adminId: req.adminSession?.userId,
      orgId: created.orgId,
      orgName: created.orgName,
      planTier: created.planTier,
      action: 'admin_create_org'
    });

    res.status(201).json({
      success: true,
      org: created
    });
  } catch (error: any) {
    logger.error('Failed to create org', error);
    
    if (error.message?.includes('already exists')) {
      res.status(409).json({
        success: false,
        error: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to create organization'
      });
    }
  }
});

// PUT /api/admin/orgs/:orgId - Update org
router.put('/:orgId', async (req: AdminAuthenticatedRequest, res: Response) => {
  try {
    // Validate CSRF token for write operations
    if (!adminAuthMiddleware.verifyCsrfToken(req)) {
      res.status(403).json({
        success: false,
        error: 'Invalid CSRF token'
      });
      return;
    }

    const { orgId } = req.params;
    const updates = req.body;

    // Remove fields that shouldn't be updated directly
    delete updates.orgId;
    delete updates.createdAt;
    delete updates.active;

    const updated = await orgConfigPersistence.updateOrg(orgId, updates);

    logger.info('Admin updated org', {
      adminId: req.adminSession?.userId,
      orgId,
      orgName: updated.orgName,
      fields: Object.keys(updates),
      action: 'admin_update_org'
    });

    res.json({
      success: true,
      org: updated
    });
  } catch (error: any) {
    logger.error('Failed to update org', error);
    
    if (error.message?.includes('not found')) {
      res.status(404).json({
        success: false,
        error: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to update organization'
      });
    }
  }
});

// DELETE /api/admin/orgs/:orgId - Soft delete org
router.delete('/:orgId', async (req: AdminAuthenticatedRequest, res: Response) => {
  try {
    // Validate CSRF token for delete operations
    if (!adminAuthMiddleware.verifyCsrfToken(req)) {
      res.status(403).json({
        success: false,
        error: 'Invalid CSRF token'
      });
      return;
    }

    const { orgId } = req.params;
    const { hard } = req.query;

    // Only superadmin can hard delete
    if (hard === 'true' && req.adminSession?.role !== 'superadmin') {
      res.status(403).json({
        success: false,
        error: 'Superadmin privileges required for hard delete'
      });
      return;
    }

    await orgConfigPersistence.deleteOrg(orgId, hard === 'true');

    logger.info('Admin deleted org', {
      adminId: req.adminSession?.userId,
      orgId,
      hardDelete: hard === 'true',
      action: 'admin_delete_org'
    });

    res.json({
      success: true,
      message: `Organization ${hard === 'true' ? 'permanently' : 'soft'} deleted`
    });
  } catch (error: any) {
    logger.error('Failed to delete org', error);
    
    if (error.message?.includes('not found')) {
      res.status(404).json({
        success: false,
        error: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to delete organization'
      });
    }
  }
});

// POST /api/admin/orgs/:orgId/restore - Restore soft-deleted org
router.post('/:orgId/restore', 
  adminAuthMiddleware.requireSuperAdmin,
  async (req: AdminAuthenticatedRequest, res: Response) => {
    try {
      // Validate CSRF token
      if (!adminAuthMiddleware.verifyCsrfToken(req)) {
        res.status(403).json({
          success: false,
          error: 'Invalid CSRF token'
        });
        return;
      }

      const { orgId } = req.params;
      const restored = await orgConfigPersistence.restoreOrg(orgId);

      logger.info('Admin restored org', {
        adminId: req.adminSession?.userId,
        orgId,
        orgName: restored.orgName,
        action: 'admin_restore_org'
      });

      res.json({
        success: true,
        org: restored
      });
    } catch (error: any) {
      logger.error('Failed to restore org', error);
      
      if (error.message?.includes('not found')) {
        res.status(404).json({
          success: false,
          error: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to restore organization'
        });
      }
    }
  }
);

// GET /api/admin/orgs/stats/summary - Get org statistics
router.get('/stats/summary', async (req: AdminAuthenticatedRequest, res: Response) => {
  try {
    const orgs = await orgConfigPersistence.getAllOrgs();
    
    const stats = {
      total: orgs.length,
      byPlanTier: {
        free: orgs.filter(o => o.planTier === 'free').length,
        pilot: orgs.filter(o => o.planTier === 'pilot').length,
        enterprise: orgs.filter(o => o.planTier === 'enterprise').length,
        custom: orgs.filter(o => o.planTier === 'custom').length
      },
      featuresEnabled: {
        debugPanel: orgs.filter(o => o.featureFlags.enableDebugPanel).length,
        history: orgs.filter(o => o.featureFlags.enableHistory).length,
        experimentalActions: orgs.filter(o => o.featureFlags.enableExperimentalActions).length,
        salesforceBeta: orgs.filter(o => o.featureFlags.enableSalesforceBeta).length,
        linkedInDeepDive: orgs.filter(o => o.featureFlags.enableLinkedInDeepDive).length,
        emailToneStrictMode: orgs.filter(o => o.featureFlags.enableEmailToneStrictMode).length
      }
    };

    logger.info('Admin retrieved org stats', {
      adminId: req.adminSession?.userId,
      action: 'admin_get_org_stats'
    });

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    logger.error('Failed to get org stats', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve statistics'
    });
  }
});

export default router;