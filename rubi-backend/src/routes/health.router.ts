import { Router, Request, Response } from 'express';
import { llmOrchestrator } from '../providers';
import { templateEngine } from '../templates/template-engine';
import { schemaValidator } from '../schemas/schema-validator';
import { actionRegistry } from '../actions/registry';
import * as os from 'os';

const router = Router();

router.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

router.get('/ready', async (req: Request, res: Response) => {
  const checks = {
    providers: false,
    templates: false,
    schemas: false,
    actions: false,
  };

  try {
    checks.providers = llmOrchestrator.getAvailableProviders().length > 0;
    checks.templates = templateEngine.getLoadedTemplates().length > 0;
    checks.schemas = schemaValidator.getLoadedSchemas().length > 0;
    checks.actions = actionRegistry.getAllNames().length > 0;

    const isReady = Object.values(checks).every(v => v === true);

    res.status(isReady ? 200 : 503).json({
      success: isReady,
      status: isReady ? 'ready' : 'not_ready',
      checks,
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'error',
      checks,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/metrics', (req: Request, res: Response) => {
  const metrics = {
    system: {
      platform: os.platform(),
      release: os.release(),
      type: os.type(),
      arch: os.arch(),
      hostname: os.hostname(),
      uptime: os.uptime(),
    },
    process: {
      version: process.version,
      pid: process.pid,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
    },
    app: {
      environment: process.env.NODE_ENV || 'development',
      providers: llmOrchestrator.getAvailableProviders(),
      loadedTemplates: templateEngine.getLoadedTemplates().length,
      loadedSchemas: schemaValidator.getLoadedSchemas().length,
      registeredActions: actionRegistry.getAllNames().length,
    },
  };

  res.json({
    success: true,
    data: metrics,
  });
});

router.get('/config', (req: Request, res: Response) => {
  const config = {
    environment: process.env.NODE_ENV || 'development',
    providers: {
      available: llmOrchestrator.getAvailableProviders(),
      default: process.env.DEFAULT_PROVIDER || 'openai',
    },
    models: {
      default: process.env.DEFAULT_MODEL || 'gpt-4-turbo-preview',
      temperature: parseFloat(process.env.DEFAULT_TEMPERATURE || '0.7'),
      maxTokens: parseInt(process.env.DEFAULT_MAX_TOKENS || '2000'),
    },
    security: {
      corsOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3001'],
      rateLimiting: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
      },
    },
    actions: actionRegistry.getAll().map(a => ({
      name: a.name,
      description: a.description,
    })),
  };

  res.json({
    success: true,
    data: config,
  });
});

export default router;