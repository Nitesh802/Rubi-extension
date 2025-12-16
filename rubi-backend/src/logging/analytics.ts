import { ActionLogEntry, LLMProvider } from '../types';
import { logger } from './logger';

export class AnalyticsService {
  private metricsBuffer: ActionLogEntry[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private readonly FLUSH_INTERVAL_MS = 30000;
  private readonly BUFFER_SIZE = 100;

  constructor() {
    this.startFlushInterval();
  }

  private startFlushInterval(): void {
    this.flushInterval = setInterval(() => {
      this.flush();
    }, this.FLUSH_INTERVAL_MS);
  }

  trackAction(entry: Omit<ActionLogEntry, 'id' | 'timestamp'>): void {
    const fullEntry: ActionLogEntry = {
      ...entry,
      id: this.generateId(),
      timestamp: new Date(),
    };

    this.metricsBuffer.push(fullEntry);
    logger.logAction(entry);

    if (this.metricsBuffer.length >= this.BUFFER_SIZE) {
      this.flush();
    }
  }

  trackTokenUsage(
    action: string,
    provider: LLMProvider,
    model: string,
    tokens: number
  ): void {
    this.trackAction({
      action,
      provider,
      model,
      tokensUsed: tokens,
      success: true,
    });
  }

  trackError(
    action: string,
    error: string,
    metadata?: Record<string, any>
  ): void {
    this.trackAction({
      action,
      success: false,
      error,
      metadata,
    });
  }

  trackDuration(
    action: string,
    duration: number,
    success: boolean = true
  ): void {
    this.trackAction({
      action,
      duration,
      success,
    });
  }

  async getMetrics(
    timeRange: { start: Date; end: Date }
  ): Promise<{
    totalRequests: number;
    successRate: number;
    averageResponseTime: number;
    tokensConsumed: number;
    costEstimate: number;
    topActions: Array<{ action: string; count: number }>;
    errorRate: number;
    providerUsage: Record<LLMProvider, number>;
  }> {
    const filteredMetrics = this.metricsBuffer.filter(
      m => m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
    );

    const totalRequests = filteredMetrics.length;
    const successfulRequests = filteredMetrics.filter(m => m.success).length;
    const successRate = totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0;

    const responseTimes = filteredMetrics
      .filter(m => m.duration)
      .map(m => m.duration!);
    const averageResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0;

    const tokensConsumed = filteredMetrics
      .filter(m => m.tokensUsed)
      .reduce((sum, m) => sum + m.tokensUsed!, 0);

    const costEstimate = this.estimateCost(filteredMetrics);

    const actionCounts = this.countActions(filteredMetrics);
    const topActions = Object.entries(actionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([action, count]) => ({ action, count }));

    const errorRate = totalRequests > 0
      ? ((totalRequests - successfulRequests) / totalRequests) * 100
      : 0;

    const providerUsage = this.countProviders(filteredMetrics);

    return {
      totalRequests,
      successRate,
      averageResponseTime,
      tokensConsumed,
      costEstimate,
      topActions,
      errorRate,
      providerUsage,
    };
  }

  private estimateCost(metrics: ActionLogEntry[]): number {
    const costPerToken: Record<string, number> = {
      'gpt-4-turbo-preview': 0.00001,
      'gpt-3.5-turbo': 0.0000015,
      'claude-3-sonnet': 0.000003,
      'claude-3-opus': 0.000015,
    };

    return metrics.reduce((total, metric) => {
      if (!metric.tokensUsed || !metric.model) return total;
      const rate = costPerToken[metric.model] || 0.00001;
      return total + (metric.tokensUsed * rate);
    }, 0);
  }

  private countActions(metrics: ActionLogEntry[]): Record<string, number> {
    return metrics.reduce((acc, metric) => {
      acc[metric.action] = (acc[metric.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private countProviders(metrics: ActionLogEntry[]): Record<LLMProvider, number> {
    return metrics
      .filter(m => m.provider)
      .reduce((acc, metric) => {
        acc[metric.provider!] = (acc[metric.provider!] || 0) + 1;
        return acc;
      }, {} as Record<LLMProvider, number>);
  }

  private flush(): void {
    if (this.metricsBuffer.length === 0) return;

    const metricsToFlush = [...this.metricsBuffer];
    this.metricsBuffer = [];

    logger.info(`Flushing ${metricsToFlush.length} metrics`, {
      metrics: metricsToFlush,
    });
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    this.flush();
  }
}

export const analytics = new AnalyticsService();