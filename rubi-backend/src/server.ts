import express, { Express } from 'express';
import path from 'path';
import { config } from './config';
import { logger } from './logging/logger';
import { templateEngine } from './templates/template-engine';
import { schemaValidator } from './schemas/schema-validator';
import { securityMiddleware } from './middleware/security';
import { orgConfigPersistence } from './config/orgConfigPersistence';
import actionsRouter from './routes/actions.router';
import healthRouter from './routes/health.router';
import authRouter from './routes/auth.router';
import extensionAuthRouter from './routes/extensionAuth.router'; // Phase 9A
import extensionSessionRouter from './routes/extensionSessionRoutes'; // Phase 9B
import adminAuthRouter from './routes/admin.auth.router'; // Phase 9E
import adminOrgsRouter from './routes/admin.orgs.router'; // Phase 9E

class RubiBackendServer {
  private app: Express;
  private port: number;
  private host: string;

  constructor() {
    this.app = express();
    this.port = config.get('app.port', 3000);
    this.host = config.get('app.host', '0.0.0.0');
  }

  private async initializeServices(): Promise<void> {
    logger.info('Initializing services...');

    try {
      await templateEngine.loadAllTemplates();
      logger.info(`Loaded ${templateEngine.getLoadedTemplates().length} prompt templates`);

      await schemaValidator.loadAllSchemas();
      logger.info(`Loaded ${schemaValidator.getLoadedSchemas().length} schemas`);

      // Initialize org config persistence
      await orgConfigPersistence.initialize();
      logger.info('Org config persistence initialized');

      logger.info('All services initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize services', error);
      throw error;
    }
  }

  private setupMiddleware(): void {
    this.app.use(securityMiddleware.helmet());
    
    this.app.use(securityMiddleware.cors());
    
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    this.app.use(securityMiddleware.requestLogger);
    
    this.app.use(securityMiddleware.validateContentType);
    
    this.app.use(securityMiddleware.sanitizeInput);
    
    this.app.use(securityMiddleware.rateLimiter());
  }

  private setupRoutes(): void {
    // Serve admin panel static files
    const adminPath = path.join(process.cwd(), 'admin');
    this.app.use('/admin', express.static(adminPath));
    
    // API routes
    this.app.use('/api/actions', actionsRouter);
    
    this.app.use('/api/auth', authRouter);
    
    // Phase 9A: Extension authentication routes
    this.app.use('/api/auth/extension', extensionAuthRouter);
    
    // Phase 9B: Extension session binding routes
    this.app.use('/api/auth/extension-session', extensionSessionRouter);
    
    // Phase 9E: Admin authentication routes
    this.app.use('/api/admin/auth', adminAuthRouter);
    
    // Phase 9E: Admin org management routes
    this.app.use('/api/admin/orgs', adminOrgsRouter);
    
    this.app.use('/api', healthRouter);
    
    this.app.get('/', (_req, res) => {
      res.json({
        success: true,
        message: 'Rubi Backend Intelligence System',
        version: config.get('app.version'),
        environment: config.get('app.env'),
        adminPanel: '/admin'
      });
    });
    
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        path: req.originalUrl,
      });
    });
    
    this.app.use(securityMiddleware.errorHandler);
  }

  private setupGracefulShutdown(): void {
    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal}, shutting down gracefully...`);
      
      process.exit(0);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled rejection at:', { promise, reason });
    });
  }

  public async start(): Promise<void> {
    try {
      await this.initializeServices();
      
      this.setupMiddleware();
      
      this.setupRoutes();
      
      this.setupGracefulShutdown();
      
      this.app.listen(this.port, this.host, () => {
        logger.info(`Rubi Backend Server started`, {
          host: this.host,
          port: this.port,
          environment: config.get('app.env'),
          adminPanel: `http://${this.host}:${this.port}/admin`,
          providers: (config.get('llm.providers.openai.enabled') ? ['openai'] : [] as string[])
            .concat(config.get('llm.providers.anthropic.enabled') ? ['anthropic'] : [])
            .concat(config.get('llm.providers.azure.enabled') ? ['azure-openai'] : []),
        });
        
        console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║                 Rubi Backend Intelligence                 ║
║                        System v1.0.0                      ║
║                                                           ║
║  Server running at: http://${this.host}:${this.port}              ║
║  Environment: ${config.get('app.env').padEnd(43, ' ')}║
║  API Docs: http://${this.host}:${this.port}/api              ║
║  Admin Panel: http://${this.host}:${this.port}/admin           ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
        `);
      });
    } catch (error) {
      logger.error('Failed to start server', error);
      process.exit(1);
    }
  }
}

const server = new RubiBackendServer();
server.start().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});