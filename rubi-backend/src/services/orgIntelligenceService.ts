/**
 * Organization Intelligence Service
 * Manages org-specific intelligence for personalization
 */

import { OrgIntelligence, OrgIntelligenceSource } from '../types/orgIntelligence';
import { logger } from '../logging/logger';
import * as fs from 'fs/promises';
import * as path from 'path';
import { orgIntelligencePromptMapper } from './orgIntelligencePromptMapper';

// Import the default Fused intelligence from the shared data
import { defaultFusedIntelligence } from '../data/defaultOrgIntelligence';

interface OrgIntelligenceCache {
  data: OrgIntelligence;
  timestamp: number;
  source: OrgIntelligenceSource;
}

class OrgIntelligenceService {
  private cache: Map<string, OrgIntelligenceCache> = new Map();
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
  private readonly ORG_INTEL_DIR = path.join(process.cwd(), 'org-intelligence');

  /**
   * Get org intelligence for a specific organization
   */
  async getOrgIntelligence(orgId: string | null): Promise<{ data: OrgIntelligence | null; source: OrgIntelligenceSource }> {
    if (!orgId) {
      logger.debug('No orgId provided, returning default intelligence');
      return { data: defaultFusedIntelligence, source: 'default' };
    }

    // Check cache first
    const cached = this.getCachedIntelligence(orgId);
    if (cached) {
      return { data: cached.data, source: cached.source };
    }

    // Try to load from various sources
    let intelligence: OrgIntelligence | null = null;
    let source: OrgIntelligenceSource = 'none';

    // 1. Try Moodle (future implementation)
    intelligence = await this.loadFromMoodle(orgId);
    if (intelligence) {
      source = 'moodle';
    }

    // 2. Try backend file
    if (!intelligence) {
      intelligence = await this.loadFromFile(orgId);
      if (intelligence) {
        source = 'backend_file';
      }
    }

    // 3. Use default for known orgs
    if (!intelligence && this.isKnownOrg(orgId)) {
      intelligence = defaultFusedIntelligence;
      source = 'default';
    }

    // Cache the result if found
    if (intelligence) {
      this.setCachedIntelligence(orgId, intelligence, source);
    }

    return { data: intelligence, source };
  }

  /**
   * Get cached intelligence if still fresh
   */
  private getCachedIntelligence(orgId: string): OrgIntelligenceCache | null {
    const cached = this.cache.get(orgId);
    if (!cached) return null;

    const age = Date.now() - cached.timestamp;
    if (age > this.CACHE_DURATION) {
      this.cache.delete(orgId);
      return null;
    }

    return cached;
  }

  /**
   * Set cached intelligence
   */
  private setCachedIntelligence(orgId: string, data: OrgIntelligence, source: OrgIntelligenceSource): void {
    this.cache.set(orgId, {
      data,
      timestamp: Date.now(),
      source
    });
  }

  /**
   * Load intelligence from Moodle (placeholder for future implementation)
   */
  private async loadFromMoodle(orgId: string): Promise<OrgIntelligence | null> {
    // TODO: Implement Moodle integration
    // This would call the Moodle API to fetch org-specific intelligence
    return null;
  }

  /**
   * Load intelligence from local file
   */
  private async loadFromFile(orgId: string): Promise<OrgIntelligence | null> {
    try {
      const filePath = path.join(this.ORG_INTEL_DIR, `${orgId}.json`);
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(fileContent) as OrgIntelligence;
      
      logger.debug(`Loaded org intelligence from file for org ${orgId}`);
      return data;
    } catch (error) {
      // File doesn't exist or is invalid - this is expected for most orgs
      return null;
    }
  }

  /**
   * Check if this is a known org with default intelligence
   */
  private isKnownOrg(orgId: string): boolean {
    // List of known orgs with default intelligence
    const knownOrgs = ['fused', 'demo', 'test', '1']; // orgId '1' is often used for testing
    return knownOrgs.includes(orgId.toLowerCase());
  }

  /**
   * Clear cache for a specific org or all orgs
   */
  clearCache(orgId?: string): void {
    if (orgId) {
      this.cache.delete(orgId);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Get a subset of intelligence for prompt templates
   * This creates a simplified version optimized for LLM consumption
   * @param intelligence - The org intelligence to transform
   * @param actionName - Optional action name for tailored mapping
   */
  getIntelligenceForPrompt(intelligence: OrgIntelligence | null, actionName?: string): Record<string, any> {
    if (!intelligence) return {};

    // Use the mapper for consistent transformation
    if (actionName) {
      return orgIntelligencePromptMapper.mapForAction(intelligence, actionName) || {};
    }
    
    return orgIntelligencePromptMapper.mapForPrompt(intelligence) || {};
  }
  
  /**
   * Score how well a context matches the ICP
   */
  scoreICPFit(
    orgId: string | null,
    context: {
      industry?: string;
      role?: string;
      companySize?: string;
      painPoints?: string[];
      technologies?: string[];
    }
  ): number {
    const { data: intelligence } = this.getOrgIntelligence(orgId);
    return orgIntelligencePromptMapper.scoreICPFit(intelligence, context);
  }
}

// Export singleton instance
export const orgIntelligenceService = new OrgIntelligenceService();