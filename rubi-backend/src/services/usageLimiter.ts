import { ExecutionContext } from '../types/execution';
import { OrgConfig } from '../types/orgConfig';

interface UsageCounter {
  count: number;
  date: string;
  lastUpdated: number;
}

interface UsageCheckResult {
  allowed: boolean;
  reason?: string;
}

export class UsageLimiter {
  private orgCounters: Map<string, UsageCounter> = new Map();
  private userCounters: Map<string, UsageCounter> = new Map();
  private readonly TTL_HOURS = 24;
  
  checkActionAllowed(context: ExecutionContext & { orgConfig?: OrgConfig }): UsageCheckResult {
    const { orgId, userId, orgConfig } = context;
    
    if (!orgConfig) {
      return { allowed: true, reason: 'orgConfigMissing' };
    }
    
    if (orgConfig.enabled === false) {
      return { allowed: false, reason: 'org_disabled' };
    }
    
    if (orgConfig.browser_extension_enabled === false) {
      return { allowed: false, reason: 'extension_disabled' };
    }
    
    if (orgConfig.allowed_domains) {
      const currentDomain = this.extractDomainFromContext(context);
      if (currentDomain && !orgConfig.allowed_domains.includes(currentDomain)) {
        return { allowed: false, reason: 'domain_not_allowed' };
      }
    }
    
    const today = this.getCurrentDateString();
    
    if (orgConfig.max_daily_actions_per_org) {
      const orgKey = `${orgId}:${today}`;
      const orgUsage = this.getOrCreateCounter(this.orgCounters, orgKey, today);
      
      if (orgUsage.count >= orgConfig.max_daily_actions_per_org) {
        return { allowed: false, reason: 'org_daily_limit_exceeded' };
      }
    }
    
    if (orgConfig.max_daily_actions_per_user && userId) {
      const userKey = `${orgId}:${userId}:${today}`;
      const userUsage = this.getOrCreateCounter(this.userCounters, userKey, today);
      
      if (userUsage.count >= orgConfig.max_daily_actions_per_user) {
        return { allowed: false, reason: 'user_daily_limit_exceeded' };
      }
    }
    
    return { allowed: true };
  }
  
  incrementUsage(context: ExecutionContext & { orgConfig?: OrgConfig }): void {
    const { orgId, userId, orgConfig } = context;
    
    if (!orgConfig) {
      return;
    }
    
    const today = this.getCurrentDateString();
    
    if (orgConfig.max_daily_actions_per_org) {
      const orgKey = `${orgId}:${today}`;
      const orgUsage = this.getOrCreateCounter(this.orgCounters, orgKey, today);
      orgUsage.count++;
      orgUsage.lastUpdated = Date.now();
    }
    
    if (orgConfig.max_daily_actions_per_user && userId) {
      const userKey = `${orgId}:${userId}:${today}`;
      const userUsage = this.getOrCreateCounter(this.userCounters, userKey, today);
      userUsage.count++;
      userUsage.lastUpdated = Date.now();
    }
    
    this.cleanupOldCounters();
  }
  
  private getOrCreateCounter(
    counters: Map<string, UsageCounter>,
    key: string,
    date: string
  ): UsageCounter {
    let counter = counters.get(key);
    
    if (!counter || counter.date !== date) {
      counter = {
        count: 0,
        date: date,
        lastUpdated: Date.now()
      };
      counters.set(key, counter);
    }
    
    return counter;
  }
  
  private getCurrentDateString(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }
  
  private cleanupOldCounters(): void {
    const now = Date.now();
    const ttlMs = this.TTL_HOURS * 60 * 60 * 1000;
    
    for (const [key, counter] of this.orgCounters.entries()) {
      if (now - counter.lastUpdated > ttlMs) {
        this.orgCounters.delete(key);
      }
    }
    
    for (const [key, counter] of this.userCounters.entries()) {
      if (now - counter.lastUpdated > ttlMs) {
        this.userCounters.delete(key);
      }
    }
  }
  
  private extractDomainFromContext(context: ExecutionContext): string | null {
    if (!context.payload?.url) {
      return null;
    }
    
    try {
      const url = new URL(context.payload.url);
      return url.hostname.toLowerCase();
    } catch {
      return null;
    }
  }
  
  getUsageStats(orgId: string, userId?: string): {
    orgUsage?: number;
    userUsage?: number;
    date: string;
  } {
    const today = this.getCurrentDateString();
    const result: any = { date: today };
    
    const orgKey = `${orgId}:${today}`;
    const orgCounter = this.orgCounters.get(orgKey);
    if (orgCounter) {
      result.orgUsage = orgCounter.count;
    }
    
    if (userId) {
      const userKey = `${orgId}:${userId}:${today}`;
      const userCounter = this.userCounters.get(userKey);
      if (userCounter) {
        result.userUsage = userCounter.count;
      }
    }
    
    return result;
  }
}

export const usageLimiter = new UsageLimiter();