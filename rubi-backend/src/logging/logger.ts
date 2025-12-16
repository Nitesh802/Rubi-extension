import winston from 'winston';
import * as path from 'path';
import { ActionLogEntry, Logger } from '../types';
import { v4 as uuidv4 } from 'uuid';

class LoggerService implements Logger {
  private logger: winston.Logger;
  private actionLogger: winston.Logger;

  constructor() {
    const logDir = process.env.LOG_DIR || './logs';
    const logLevel = process.env.LOG_LEVEL || 'info';

    const logFormat = winston.format.combine(
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss',
      }),
      winston.format.errors({ stack: true }),
      winston.format.splat(),
      winston.format.json(),
    );

    this.logger = winston.createLogger({
      level: logLevel,
      format: logFormat,
      defaultMeta: { service: 'rubi-backend' },
      transports: [
        new winston.transports.File({
          filename: path.join(logDir, 'error.log'),
          level: 'error',
          maxsize: 5242880,
          maxFiles: 5,
        }),
        new winston.transports.File({
          filename: path.join(logDir, 'combined.log'),
          maxsize: 5242880,
          maxFiles: 5,
        }),
      ],
    });

    this.actionLogger = winston.createLogger({
      level: 'info',
      format: logFormat,
      defaultMeta: { service: 'rubi-actions' },
      transports: [
        new winston.transports.File({
          filename: path.join(logDir, 'actions.log'),
          maxsize: 5242880,
          maxFiles: 10,
        }),
      ],
    });

    if (process.env.NODE_ENV !== 'production') {
      const consoleFormat = winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
      );

      this.logger.add(
        new winston.transports.Console({
          format: consoleFormat,
        }),
      );
    }
  }

  info(message: string, meta?: any): void {
    this.logger.info(message, meta);
  }

  error(message: string, error?: any): void {
    const errorMeta = error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      name: error.name,
    } : error;

    this.logger.error(message, errorMeta);
  }

  warn(message: string, meta?: any): void {
    this.logger.warn(message, meta);
  }

  debug(message: string, meta?: any): void {
    this.logger.debug(message, meta);
  }

  logAction(entry: Omit<ActionLogEntry, 'id' | 'timestamp'>): void {
    const logEntry: ActionLogEntry = {
      ...entry,
      id: uuidv4(),
      timestamp: new Date(),
    };

    this.actionLogger.info('Action executed', logEntry);
  }

  async getActionLogs(
    _filters?: {
      action?: string;
      userId?: string;
      startDate?: Date;
      endDate?: Date;
      success?: boolean;
    },
    _limit: number = 100
  ): Promise<ActionLogEntry[]> {
    return [];
  }

  async getActionStats(
    _timeRange: { start: Date; end: Date }
  ): Promise<{
    totalActions: number;
    successRate: number;
    averageTokensUsed: number;
    averageDuration: number;
    actionBreakdown: Record<string, number>;
    providerBreakdown: Record<string, number>;
  }> {
    return {
      totalActions: 0,
      successRate: 0,
      averageTokensUsed: 0,
      averageDuration: 0,
      actionBreakdown: {},
      providerBreakdown: {},
    };
  }
}

export const logger = new LoggerService();