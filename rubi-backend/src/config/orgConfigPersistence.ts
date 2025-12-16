import * as fs from 'fs/promises';
import * as path from 'path';
import { OrgConfig, OrgConfigWithDefaults } from '../types/orgConfig';
import { logger } from '../logging/logger';

export class OrgConfigPersistence {
  private configPath: string;
  private configs: Map<string, OrgConfigWithDefaults>;
  private fileLock: boolean = false;

  constructor() {
    this.configPath = path.join(process.cwd(), 'configs', 'orgs.json');
    this.configs = new Map();
  }

  async initialize(): Promise<void> {
    try {
      // Ensure configs directory exists
      const configDir = path.dirname(this.configPath);
      await fs.mkdir(configDir, { recursive: true });

      // Load existing configs
      await this.loadConfigs();
      logger.info('Org config persistence initialized', { 
        configCount: this.configs.size,
        path: this.configPath 
      });
    } catch (error) {
      logger.error('Failed to initialize org config persistence', error);
      throw error;
    }
  }

  private async loadConfigs(): Promise<void> {
    try {
      const data = await fs.readFile(this.configPath, 'utf-8');
      const parsed = JSON.parse(data);
      
      if (parsed.orgs && Array.isArray(parsed.orgs)) {
        for (const org of parsed.orgs) {
          if (this.validateOrgConfig(org)) {
            this.configs.set(org.orgId, {
              ...org,
              createdAt: new Date(org.createdAt || Date.now()),
              updatedAt: new Date(org.updatedAt || Date.now()),
              active: org.active !== false
            });
          }
        }
      }
    } catch (error) {
      // File doesn't exist yet, create with defaults
      if ((error as any).code === 'ENOENT') {
        logger.info('No existing org configs found, will create new file on first save');
        await this.saveConfigs();
      } else {
        logger.error('Error loading org configs', error);
      }
    }
  }

  private async saveConfigs(): Promise<void> {
    // Simple file lock mechanism
    while (this.fileLock) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    this.fileLock = true;
    
    try {
      const orgs = Array.from(this.configs.values());
      const data = {
        version: '1.0.0',
        lastUpdated: new Date().toISOString(),
        orgs
      };

      // Write to temp file first, then rename (atomic operation)
      const tempPath = `${this.configPath}.tmp`;
      await fs.writeFile(tempPath, JSON.stringify(data, null, 2));
      await fs.rename(tempPath, this.configPath);
      
      logger.debug('Org configs saved', { count: orgs.length });
    } catch (error) {
      logger.error('Failed to save org configs', error);
      throw error;
    } finally {
      this.fileLock = false;
    }
  }

  async getAllOrgs(): Promise<OrgConfigWithDefaults[]> {
    return Array.from(this.configs.values())
      .filter(org => org.active)
      .sort((a, b) => a.orgName.localeCompare(b.orgName));
  }

  async getOrgById(orgId: string): Promise<OrgConfigWithDefaults | null> {
    const config = this.configs.get(orgId);
    if (!config || !config.active) {
      return null;
    }
    return config;
  }

  async createOrg(orgConfig: OrgConfig): Promise<OrgConfigWithDefaults> {
    if (this.configs.has(orgConfig.orgId)) {
      throw new Error(`Org with ID ${orgConfig.orgId} already exists`);
    }

    if (!this.validateOrgConfig(orgConfig)) {
      throw new Error('Invalid org configuration');
    }

    const fullConfig: OrgConfigWithDefaults = {
      ...orgConfig,
      createdAt: new Date(),
      updatedAt: new Date(),
      active: true
    };

    this.configs.set(orgConfig.orgId, fullConfig);
    await this.saveConfigs();

    logger.info('Org created', {
      orgId: orgConfig.orgId,
      orgName: orgConfig.orgName,
      planTier: orgConfig.planTier,
      action: 'org_created'
    });

    return fullConfig;
  }

  async updateOrg(orgId: string, updates: Partial<OrgConfig>): Promise<OrgConfigWithDefaults> {
    const existing = this.configs.get(orgId);
    if (!existing) {
      throw new Error(`Org with ID ${orgId} not found`);
    }

    const updated: OrgConfigWithDefaults = {
      ...existing,
      ...updates,
      orgId: existing.orgId, // Prevent changing orgId
      createdAt: existing.createdAt,
      updatedAt: new Date(),
      active: existing.active
    };

    if (!this.validateOrgConfig(updated)) {
      throw new Error('Invalid org configuration');
    }

    this.configs.set(orgId, updated);
    await this.saveConfigs();

    logger.info('Org updated', {
      orgId,
      orgName: updated.orgName,
      changes: Object.keys(updates),
      action: 'org_updated'
    });

    return updated;
  }

  async deleteOrg(orgId: string, hard: boolean = false): Promise<void> {
    const existing = this.configs.get(orgId);
    if (!existing) {
      throw new Error(`Org with ID ${orgId} not found`);
    }

    if (hard) {
      this.configs.delete(orgId);
      logger.info('Org hard deleted', {
        orgId,
        orgName: existing.orgName,
        action: 'org_hard_deleted'
      });
    } else {
      // Soft delete
      existing.active = false;
      existing.updatedAt = new Date();
      this.configs.set(orgId, existing);
      logger.info('Org soft deleted', {
        orgId,
        orgName: existing.orgName,
        action: 'org_soft_deleted'
      });
    }

    await this.saveConfigs();
  }

  async restoreOrg(orgId: string): Promise<OrgConfigWithDefaults> {
    const existing = this.configs.get(orgId);
    if (!existing) {
      throw new Error(`Org with ID ${orgId} not found`);
    }

    existing.active = true;
    existing.updatedAt = new Date();
    this.configs.set(orgId, existing);
    await this.saveConfigs();

    logger.info('Org restored', {
      orgId,
      orgName: existing.orgName,
      action: 'org_restored'
    });

    return existing;
  }

  private validateOrgConfig(config: any): boolean {
    if (!config) return false;
    
    const requiredFields = [
      'orgId', 
      'orgName', 
      'planTier', 
      'allowedActions', 
      'modelPreferences', 
      'toneProfile', 
      'featureFlags'
    ];
    
    for (const field of requiredFields) {
      if (!(field in config)) {
        logger.error(`Missing required field: ${field}`);
        return false;
      }
    }

    if (!Array.isArray(config.allowedActions)) {
      logger.error('allowedActions must be an array');
      return false;
    }

    if (!['free', 'pilot', 'enterprise', 'custom'].includes(config.planTier)) {
      logger.error(`Invalid planTier: ${config.planTier}`);
      return false;
    }

    if (!config.modelPreferences?.defaultProvider) {
      logger.error('Missing modelPreferences.defaultProvider');
      return false;
    }

    if (!config.toneProfile?.id || !config.toneProfile?.style) {
      logger.error('Missing toneProfile.id or toneProfile.style');
      return false;
    }

    const validStyles = ['formal', 'casual', 'consultative', 'executive', 'coach'];
    if (!validStyles.includes(config.toneProfile.style)) {
      logger.error(`Invalid toneProfile.style: ${config.toneProfile.style}`);
      return false;
    }

    return true;
  }

  // For backward compatibility with existing orgConfigService
  getConfigMap(): Map<string, OrgConfigWithDefaults> {
    return new Map(this.configs);
  }
}

export const orgConfigPersistence = new OrgConfigPersistence();