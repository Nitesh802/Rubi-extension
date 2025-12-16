import { LLMProvider, ActionLogEntry } from '../types';
import { logger } from './logger';
import * as fs from 'fs';
import * as path from 'path';

interface LLMUsageEntry {
  id: string;
  timestamp: Date;
  action: string;
  provider: string;
  model: string;
  promptVersion?: string;
  tokensIn: number;
  tokensOut: number;
  totalTokens: number;
  duration: number;
  cost?: number;
  retryCount: number;
  fallbackUsed: boolean;
  validationFailures?: number;
  success: boolean;
  error?: string;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

interface UsageStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalTokens: number;
  totalCost: number;
  averageLatency: number;
  byProvider: Record<string, ProviderStats>;
  byAction: Record<string, ActionStats>;
}

interface ProviderStats {
  requests: number;
  tokens: number;
  cost: number;
  failures: number;
  averageLatency: number;
}

interface ActionStats {
  requests: number;
  tokens: number;
  successRate: number;
  averageLatency: number;
  primaryProvider: string;
  fallbackRate: number;
}

export class LLMUsageLogger {
  private logFile: string;
  private statsFile: string;
  private buffer: LLMUsageEntry[] = [];
  private flushInterval: NodeJS.Timeout;
  private stats: UsageStats;

  constructor() {
    const logsDir = path.join(__dirname, '../../logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    const date = new Date().toISOString().split('T')[0];
    this.logFile = path.join(logsDir, `llm-usage-${date}.jsonl`);
    this.statsFile = path.join(logsDir, `llm-stats-${date}.json`);

    this.stats = this.loadOrInitStats();
    
    // Flush buffer every 30 seconds
    this.flushInterval = setInterval(() => this.flush(), 30000);

    // Ensure flush on process exit
    process.on('beforeExit', () => this.flush());
    process.on('SIGTERM', () => this.flush());
    process.on('SIGINT', () => this.flush());
  }

  private loadOrInitStats(): UsageStats {
    if (fs.existsSync(this.statsFile)) {
      try {
        const content = fs.readFileSync(this.statsFile, 'utf-8');
        return JSON.parse(content);
      } catch (error) {
        logger.error('Failed to load usage stats', error);
      }
    }

    return {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalTokens: 0,
      totalCost: 0,
      averageLatency: 0,
      byProvider: {},
      byAction: {},
    };
  }

  logUsage(entry: {
    action: string;
    provider: string;
    model: string;
    promptVersion?: string;
    tokensIn: number;
    tokensOut: number;
    duration: number;
    retryCount?: number;
    fallbackUsed?: boolean;
    validationFailures?: number;
    success: boolean;
    error?: string;
    userId?: string;
    sessionId?: string;
    metadata?: Record<string, any>;
  }): void {
    try {
      const usageEntry: LLMUsageEntry = {
        id: this.generateId(),
        timestamp: new Date(),
        action: entry.action,
        provider: entry.provider,
        model: entry.model,
        promptVersion: entry.promptVersion,
        tokensIn: entry.tokensIn,
        tokensOut: entry.tokensOut,
        totalTokens: entry.tokensIn + entry.tokensOut,
        duration: entry.duration,
        cost: this.calculateCost(entry.provider, entry.model, entry.tokensIn, entry.tokensOut),
        retryCount: entry.retryCount || 0,
        fallbackUsed: entry.fallbackUsed || false,
        validationFailures: entry.validationFailures,
        success: entry.success,
        error: entry.error ? this.sanitizeError(entry.error) : undefined,
        userId: entry.userId,
        sessionId: entry.sessionId,
        metadata: this.sanitizeMetadata(entry.metadata),
      };

      this.buffer.push(usageEntry);
      this.updateStats(usageEntry);

      // Log summary (without sensitive data)
      logger.info('LLM usage logged', {
        action: usageEntry.action,
        provider: usageEntry.provider,
        model: usageEntry.model,
        tokens: usageEntry.totalTokens,
        duration: usageEntry.duration,
        success: usageEntry.success,
        fallbackUsed: usageEntry.fallbackUsed,
      });

      // Flush if buffer is large
      if (this.buffer.length >= 100) {
        this.flush();
      }
    } catch (error) {
      logger.error('Failed to log LLM usage', error);
    }
  }

  private sanitizeError(error: string): string {
    // Truncate error messages and remove sensitive data
    return error.substring(0, 200)
      .replace(/api[_-]?key["\s:=]+["']?[^"'\s]+/gi, 'API_KEY_REDACTED')
      .replace(/bearer\s+[^\s]+/gi, 'BEARER_TOKEN_REDACTED')
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, 'EMAIL_REDACTED');
  }

  private sanitizeMetadata(metadata?: Record<string, any>): Record<string, any> | undefined {
    if (!metadata) return undefined;

    const sanitized: Record<string, any> = {};
    
    for (const key in metadata) {
      const value = metadata[key];
      
      // Skip sensitive keys
      if (key.toLowerCase().includes('key') || 
          key.toLowerCase().includes('token') || 
          key.toLowerCase().includes('secret') ||
          key.toLowerCase().includes('password')) {
        continue;
      }

      // Truncate long strings
      if (typeof value === 'string' && value.length > 200) {
        sanitized[key] = value.substring(0, 200) + '...';
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  private calculateCost(provider: string, model: string, tokensIn: number, tokensOut: number): number {
    // Pricing per 1K tokens (approximate as of 2024)
    const pricing: Record<string, Record<string, { input: number; output: number }>> = {
      openai: {
        'gpt-4-turbo-preview': { input: 0.01, output: 0.03 },
        'gpt-4': { input: 0.03, output: 0.06 },
        'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
      },
      anthropic: {
        'claude-3-sonnet-20240229': { input: 0.003, output: 0.015 },
        'claude-3-opus-20240229': { input: 0.015, output: 0.075 },
        'claude-3-haiku-20240307': { input: 0.00025, output: 0.00125 },
      },
      google: {
        'gemini-2.0-pro': { input: 0.00025, output: 0.0005 },
        'gemini-1.5-pro': { input: 0.00125, output: 0.00375 },
        'gemini-1.5-flash': { input: 0.000075, output: 0.0003 },
      },
    };

    const modelPricing = pricing[provider]?.[model];
    if (!modelPricing) {
      // Default pricing if model not found
      return (tokensIn * 0.001 + tokensOut * 0.002) / 1000;
    }

    return (tokensIn * modelPricing.input + tokensOut * modelPricing.output) / 1000;
  }

  private updateStats(entry: LLMUsageEntry): void {
    // Update global stats
    this.stats.totalRequests++;
    this.stats.totalTokens += entry.totalTokens;
    this.stats.totalCost += entry.cost || 0;
    
    if (entry.success) {
      this.stats.successfulRequests++;
    } else {
      this.stats.failedRequests++;
    }

    // Update average latency
    const prevAvg = this.stats.averageLatency;
    const n = this.stats.totalRequests;
    this.stats.averageLatency = (prevAvg * (n - 1) + entry.duration) / n;

    // Update provider stats
    if (!this.stats.byProvider[entry.provider]) {
      this.stats.byProvider[entry.provider] = {
        requests: 0,
        tokens: 0,
        cost: 0,
        failures: 0,
        averageLatency: 0,
      };
    }

    const providerStats = this.stats.byProvider[entry.provider];
    providerStats.requests++;
    providerStats.tokens += entry.totalTokens;
    providerStats.cost += entry.cost || 0;
    if (!entry.success) providerStats.failures++;
    
    const prevProvAvg = providerStats.averageLatency;
    const provN = providerStats.requests;
    providerStats.averageLatency = (prevProvAvg * (provN - 1) + entry.duration) / provN;

    // Update action stats
    if (!this.stats.byAction[entry.action]) {
      this.stats.byAction[entry.action] = {
        requests: 0,
        tokens: 0,
        successRate: 0,
        averageLatency: 0,
        primaryProvider: entry.provider,
        fallbackRate: 0,
      };
    }

    const actionStats = this.stats.byAction[entry.action];
    actionStats.requests++;
    actionStats.tokens += entry.totalTokens;
    actionStats.successRate = 
      ((actionStats.successRate * (actionStats.requests - 1)) + (entry.success ? 1 : 0)) / 
      actionStats.requests;
    
    const prevActionAvg = actionStats.averageLatency;
    const actionN = actionStats.requests;
    actionStats.averageLatency = (prevActionAvg * (actionN - 1) + entry.duration) / actionN;
    
    if (entry.fallbackUsed) {
      actionStats.fallbackRate = 
        ((actionStats.fallbackRate * (actionN - 1)) + 1) / actionN;
    } else {
      actionStats.fallbackRate = 
        (actionStats.fallbackRate * (actionN - 1)) / actionN;
    }
  }

  private flush(): void {
    if (this.buffer.length === 0) return;

    try {
      // Write usage entries
      const lines = this.buffer.map(entry => JSON.stringify(entry)).join('\n');
      fs.appendFileSync(this.logFile, lines + '\n');

      // Write updated stats
      fs.writeFileSync(this.statsFile, JSON.stringify(this.stats, null, 2));

      logger.debug(`Flushed ${this.buffer.length} LLM usage entries to disk`);
      this.buffer = [];
    } catch (error) {
      logger.error('Failed to flush LLM usage logs', error);
    }
  }

  private generateId(): string {
    return `llm_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  getStats(): UsageStats {
    return { ...this.stats };
  }

  getActionStats(action: string): ActionStats | null {
    return this.stats.byAction[action] || null;
  }

  getProviderStats(provider: string): ProviderStats | null {
    return this.stats.byProvider[provider] || null;
  }

  async generateReport(startDate?: Date, endDate?: Date): Promise<string> {
    const start = startDate || new Date(Date.now() - 24 * 60 * 60 * 1000);
    const end = endDate || new Date();

    const entries = await this.loadEntriesInRange(start, end);
    
    const report = {
      period: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
      summary: {
        totalRequests: entries.length,
        successRate: entries.filter(e => e.success).length / entries.length,
        totalTokens: entries.reduce((sum, e) => sum + e.totalTokens, 0),
        totalCost: entries.reduce((sum, e) => sum + (e.cost || 0), 0),
        averageLatency: entries.reduce((sum, e) => sum + e.duration, 0) / entries.length,
      },
      topActions: this.getTopActions(entries, 5),
      providerUsage: this.getProviderUsage(entries),
      errorAnalysis: this.getErrorAnalysis(entries),
    };

    return JSON.stringify(report, null, 2);
  }

  private async loadEntriesInRange(start: Date, end: Date): Promise<LLMUsageEntry[]> {
    const entries: LLMUsageEntry[] = [];
    
    // Load from current buffer
    entries.push(...this.buffer.filter(e => 
      e.timestamp >= start && e.timestamp <= end
    ));

    // Load from files
    const logsDir = path.join(__dirname, '../../logs');
    const files = fs.readdirSync(logsDir)
      .filter(f => f.startsWith('llm-usage-') && f.endsWith('.jsonl'));

    for (const file of files) {
      const filePath = path.join(logsDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        try {
          const entry = JSON.parse(line);
          const timestamp = new Date(entry.timestamp);
          
          if (timestamp >= start && timestamp <= end) {
            entries.push(entry);
          }
        } catch (error) {
          // Skip malformed lines
        }
      }
    }

    return entries;
  }

  private getTopActions(entries: LLMUsageEntry[], limit: number): any[] {
    const actionCounts = new Map<string, number>();
    
    for (const entry of entries) {
      actionCounts.set(entry.action, (actionCounts.get(entry.action) || 0) + 1);
    }

    return Array.from(actionCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([action, count]) => ({ action, count }));
  }

  private getProviderUsage(entries: LLMUsageEntry[]): Record<string, any> {
    const usage: Record<string, any> = {};
    
    for (const entry of entries) {
      if (!usage[entry.provider]) {
        usage[entry.provider] = {
          requests: 0,
          tokens: 0,
          cost: 0,
          failures: 0,
        };
      }
      
      usage[entry.provider].requests++;
      usage[entry.provider].tokens += entry.totalTokens;
      usage[entry.provider].cost += entry.cost || 0;
      if (!entry.success) usage[entry.provider].failures++;
    }

    return usage;
  }

  private getErrorAnalysis(entries: LLMUsageEntry[]): any {
    const errors = entries.filter(e => !e.success);
    
    const errorTypes = new Map<string, number>();
    for (const error of errors) {
      const type = this.categorizeError(error.error || 'Unknown');
      errorTypes.set(type, (errorTypes.get(type) || 0) + 1);
    }

    return {
      totalErrors: errors.length,
      errorRate: errors.length / entries.length,
      byType: Object.fromEntries(errorTypes),
      fallbackSuccessRate: entries
        .filter(e => e.fallbackUsed && e.success).length / 
        entries.filter(e => e.fallbackUsed).length || 0,
    };
  }

  private categorizeError(error: string): string {
    if (error.includes('timeout') || error.includes('timed out')) {
      return 'timeout';
    }
    if (error.includes('rate limit') || error.includes('429')) {
      return 'rate_limit';
    }
    if (error.includes('validation') || error.includes('schema')) {
      return 'validation';
    }
    if (error.includes('network') || error.includes('connection')) {
      return 'network';
    }
    if (error.includes('auth') || error.includes('401') || error.includes('403')) {
      return 'authentication';
    }
    return 'other';
  }

  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flush();
  }
}

export const llmUsageLogger = new LLMUsageLogger();