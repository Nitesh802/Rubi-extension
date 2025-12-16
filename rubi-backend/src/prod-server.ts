import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { createServer } from 'http';
import { orgConfigService } from './config/orgConfigService';
import { providerOrchestrator } from './providers/orchestrator';
import { authMiddleware } from './middleware/extensionAuth';
import { authRouter } from './routes/auth.router';
import { extensionAuthRouter } from './routes/extensionAuth.router';
import { extensionSessionRouter } from './routes/extensionSessionRoutes';
import { adminOrgsRouter } from './routes/admin.orgs.router';
import { actionsRouter } from './routes/actions.router';
import { healthRouter } from './routes/health.router';
import { adminAuthRouter } from './routes/admin.auth.router';
import { logger } from './logging/logger';
import { llmUsageLogger } from './logging/llmUsageLogger';
import { orgConfigPersistence } from './config/orgConfigPersistence';
import { moodleIdentityService } from './auth/moodleIdentityService';
import { orgIntelligenceService } from './services/orgIntelligenceService';

const ENV_FILE_MAP = {
  production: '.env.production',
  staging: '.env.staging',
  development: '.env.local',
  local: '.env.local',
  test: '.env.test'
};

const nodeEnv = process.env.NODE_ENV || 'development';
const envFile = ENV_FILE_MAP[nodeEnv] || '.env';
const envPath = path.resolve(process.cwd(), envFile);

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log(`Loaded environment from ${envFile}`);
} else {
  dotenv.config();
  console.log('Using default .env file or system environment variables');
}

const PORT = parseInt(process.env.PORT || '3000', 10);
const APP_BASE_URL = process.env.APP_BASE_URL || `http://localhost:${PORT}`;
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX || '100', 10);
const RATE_LIMIT_WINDOW = parseInt(process.env.RATE_LIMIT_WINDOW || '60000', 10);
const CORS_ALLOWED_ORIGINS = process.env.CORS_ALLOWED_ORIGINS?.split(',') || ['*'];

logger.info('Starting Rubi AI Backend Production Server', {
  nodeEnv,
  port: PORT,
  logLevel: LOG_LEVEL,
  baseUrl: APP_BASE_URL
});

const app = express();
const server = createServer(app);

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

app.use(compression());

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || CORS_ALLOWED_ORIGINS.includes('*')) {
      return callback(null, true);
    }
    if (CORS_ALLOWED_ORIGINS.some(allowed => {
      if (allowed.includes('*')) {
        const pattern = allowed.replace(/\*/g, '.*');
        return new RegExp(`^${pattern}$`).test(origin);
      }
      return allowed === origin;
    })) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Session-Id', 'X-Org-Id'],
  exposedHeaders: ['X-Request-Id', 'X-Response-Time']
}));

const limiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW,
  max: RATE_LIMIT_MAX,
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return req.path === '/health' || req.path === '/ready';
  }
});

app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use((req, res, next) => {
  const start = Date.now();
  const requestId = req.headers['x-request-id'] || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  req['requestId'] = requestId;
  res.setHeader('X-Request-Id', requestId);
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request completed', {
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      ip: req.ip
    });
  });
  
  next();
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: nodeEnv
  });
});

app.get('/ready', async (req, res) => {
  try {
    const orgConfigReady = true;
    const providersReady = true;
    const cacheReady = true;
    
    const isReady = orgConfigReady && providersReady && cacheReady;
    
    if (isReady) {
      res.json({
        status: 'ready',
        services: {
          orgConfig: orgConfigReady,
          providers: providersReady,
          cache: cacheReady
        }
      });
    } else {
      res.status(503).json({
        status: 'not_ready',
        services: {
          orgConfig: orgConfigReady,
          providers: providersReady,
          cache: cacheReady
        }
      });
    }
  } catch (error) {
    logger.error('Ready check failed', error);
    res.status(503).json({
      status: 'error',
      error: error.message
    });
  }
});

app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/extension/auth', extensionAuthRouter);
app.use('/api/extension/session', authMiddleware, extensionSessionRouter);
app.use('/api/admin/orgs', authMiddleware, adminOrgsRouter);
app.use('/api/actions', authMiddleware, actionsRouter);
app.use('/api/admin/auth', adminAuthRouter);

app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString()
  });
});

app.use((err, req, res, next) => {
  logger.error('Request error', {
    error: err.message,
    stack: err.stack,
    requestId: req['requestId'],
    path: req.path,
    method: req.method
  });
  
  const statusCode = err.statusCode || err.status || 500;
  const message = nodeEnv === 'production' ? 'Internal Server Error' : err.message;
  
  res.status(statusCode).json({
    error: message,
    requestId: req['requestId'],
    timestamp: new Date().toISOString()
  });
});

async function initializeServices() {
  logger.info('Initializing services...');
  
  try {
    logger.info('Loading org configurations...');
    await orgConfigService.loadConfigurations();
    const orgCount = orgConfigService.getLoadedOrganizations().length;
    logger.info(`Loaded ${orgCount} organization configurations`);
    
    logger.info('Warming org config cache...');
    const orgs = orgConfigService.getLoadedOrganizations();
    for (const orgId of orgs) {
      await orgConfigService.getOrgConfig(orgId);
    }
    logger.info('Org config cache warmed');
    
    logger.info('Initializing provider orchestrator...');
    await providerOrchestrator.initialize();
    logger.info('Provider orchestrator initialized');
    
    logger.info('Initializing org config persistence...');
    await orgConfigPersistence.initialize();
    logger.info('Org config persistence initialized');
    
    logger.info('Initializing moodle identity service...');
    await moodleIdentityService.initialize();
    logger.info('Moodle identity service initialized');
    
    logger.info('Initializing org intelligence service...');
    await orgIntelligenceService.initialize();
    logger.info('Org intelligence service initialized');
    
    logger.info('Initializing LLM usage logger...');
    llmUsageLogger.initialize();
    logger.info('LLM usage logger initialized');
    
    logger.info('All services initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize services', error);
    throw error;
  }
}

async function startServer() {
  try {
    await initializeServices();
    
    server.listen(PORT, () => {
      logger.info(`Rubi AI Backend running on ${APP_BASE_URL}`);
      logger.info('Server configuration:', {
        port: PORT,
        environment: nodeEnv,
        corsOrigins: CORS_ALLOWED_ORIGINS,
        rateLimit: {
          max: RATE_LIMIT_MAX,
          windowMs: RATE_LIMIT_WINDOW
        },
        providers: {
          primary: process.env.PROVIDER_PRIMARY,
          fallbacks: process.env.PROVIDER_FALLBACKS
        }
      });
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
}

function setupGracefulShutdown() {
  let isShuttingDown = false;
  
  const shutdown = async (signal: string) => {
    if (isShuttingDown) {
      logger.info('Shutdown already in progress...');
      return;
    }
    
    isShuttingDown = true;
    logger.info(`Received ${signal}, starting graceful shutdown...`);
    
    server.close(() => {
      logger.info('HTTP server closed');
    });
    
    setTimeout(() => {
      logger.error('Graceful shutdown timeout, forcing exit');
      process.exit(1);
    }, 30000);
    
    try {
      logger.info('Closing org config persistence...');
      await orgConfigPersistence.close();
      
      logger.info('Saving LLM usage data...');
      await llmUsageLogger.flush();
      
      logger.info('Cleanup complete, exiting...');
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown', error);
      process.exit(1);
    }
  };
  
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGUSR2', () => shutdown('SIGUSR2'));
  
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', error);
    shutdown('uncaughtException');
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    shutdown('unhandledRejection');
  });
}

setupGracefulShutdown();
startServer();

export { app, server };