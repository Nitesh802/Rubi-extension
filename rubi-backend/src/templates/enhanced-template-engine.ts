import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'js-yaml';
import * as Handlebars from 'handlebars';
import { PromptTemplate, NormalizedRubiContextPayload } from '../types';
import { logger } from '../logging/logger';

export class EnhancedTemplateEngine {
  private templates: Map<string, PromptTemplate> = new Map();
  private compiledTemplates: Map<string, HandlebarsTemplateDelegate> = new Map();
  private templateDir: string;
  private handlebars: typeof Handlebars;

  constructor(templateDir: string = path.join(process.cwd(), 'prompts')) {
    this.templateDir = templateDir;
    this.handlebars = Handlebars.create();
    this.registerHelpers();
  }

  private registerHelpers(): void {
    // JSON stringify helper
    this.handlebars.registerHelper('json', (context) => {
      return JSON.stringify(context, null, 2);
    });

    // Conditional equality helper
    this.handlebars.registerHelper('eq', (a, b) => a === b);
    this.handlebars.registerHelper('neq', (a, b) => a !== b);
    this.handlebars.registerHelper('gt', (a, b) => a > b);
    this.handlebars.registerHelper('gte', (a, b) => a >= b);
    this.handlebars.registerHelper('lt', (a, b) => a < b);
    this.handlebars.registerHelper('lte', (a, b) => a <= b);

    // Array helpers
    this.handlebars.registerHelper('length', (array) => {
      return Array.isArray(array) ? array.length : 0;
    });

    this.handlebars.registerHelper('join', (array, separator) => {
      return Array.isArray(array) ? array.join(separator || ', ') : '';
    });

    // String helpers
    this.handlebars.registerHelper('uppercase', (str) => {
      return typeof str === 'string' ? str.toUpperCase() : '';
    });

    this.handlebars.registerHelper('lowercase', (str) => {
      return typeof str === 'string' ? str.toLowerCase() : '';
    });

    this.handlebars.registerHelper('truncate', (str, length) => {
      if (typeof str === 'string' && str.length > length) {
        return str.substring(0, length) + '...';
      }
      return str;
    });

    // Date helper
    this.handlebars.registerHelper('formatDate', (date, format) => {
      const d = new Date(date);
      if (isNaN(d.getTime())) return '';
      
      // Simple date formatting
      if (format === 'iso') return d.toISOString();
      if (format === 'date') return d.toISOString().split('T')[0];
      if (format === 'time') return d.toISOString().split('T')[1];
      return d.toLocaleString();
    });

    // Default value helper
    this.handlebars.registerHelper('default', (value, defaultValue) => {
      return value !== undefined && value !== null && value !== '' ? value : defaultValue;
    });

    // Math helpers
    this.handlebars.registerHelper('add', (a, b) => Number(a) + Number(b));
    this.handlebars.registerHelper('subtract', (a, b) => Number(a) - Number(b));
    this.handlebars.registerHelper('multiply', (a, b) => Number(a) * Number(b));
    this.handlebars.registerHelper('divide', (a, b) => Number(a) / Number(b));
    this.handlebars.registerHelper('round', (value, decimals) => {
      const factor = Math.pow(10, decimals || 0);
      return Math.round(Number(value) * factor) / factor;
    });

    // Logical helpers
    this.handlebars.registerHelper('and', (...args) => {
      // Remove the options hash from arguments
      const values = args.slice(0, -1);
      return values.every(v => !!v);
    });

    this.handlebars.registerHelper('or', (...args) => {
      // Remove the options hash from arguments
      const values = args.slice(0, -1);
      return values.some(v => !!v);
    });

    this.handlebars.registerHelper('not', (value) => !value);

    // Object/Array access helper
    this.handlebars.registerHelper('get', (obj, path) => {
      if (!obj || !path) return '';
      
      const keys = path.split('.');
      let value = obj;
      
      for (const key of keys) {
        if (value && typeof value === 'object') {
          value = value[key];
        } else {
          return '';
        }
      }
      
      return value;
    });

    // Phase 9D: Tone style helper
    this.handlebars.registerHelper('toneStyle', (style, options) => {
      const toneMap = {
        'formal': 'Use formal, professional language with proper business terminology.',
        'casual': 'Use friendly, approachable language with a conversational tone.',
        'consultative': 'Use expert advisory language with strategic insights and recommendations.',
        'executive': 'Use concise, high-level language focused on business impact and ROI.',
        'coach': 'Use encouraging, supportive language with actionable guidance.'
      };
      return toneMap[style] || toneMap['consultative'];
    });

    // Phase 9D: Plan tier helper
    this.handlebars.registerHelper('planTier', (tier, options) => {
      if (tier === 'enterprise') {
        return 'comprehensive enterprise-grade';
      } else if (tier === 'pilot') {
        return 'focused pilot program';
      } else if (tier === 'custom') {
        return 'customized';
      } else {
        return 'standard';
      }
    });

    // Context debugging helper (only in development)
    this.handlebars.registerHelper('debug', (context) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('Template Debug:', JSON.stringify(context, null, 2));
      }
      return '';
    });
  }

  async loadTemplate(templateName: string): Promise<PromptTemplate> {
    const cacheKey = templateName;
    
    if (this.templates.has(cacheKey)) {
      return this.templates.get(cacheKey)!;
    }

    const templatePath = path.join(this.templateDir, `${templateName}.yaml`);
    const jsonTemplatePath = path.join(this.templateDir, `${templateName}.json`);

    let template: PromptTemplate;

    try {
      const fileContent = await fs.readFile(templatePath, 'utf-8');
      template = yaml.load(fileContent) as PromptTemplate;
    } catch {
      try {
        const fileContent = await fs.readFile(jsonTemplatePath, 'utf-8');
        template = JSON.parse(fileContent) as PromptTemplate;
      } catch (error) {
        throw new Error(`Template ${templateName} not found in ${this.templateDir}`);
      }
    }

    this.validateTemplate(template);
    this.templates.set(cacheKey, template);

    // Pre-compile templates for better performance
    this.compileTemplate(template);

    return template;
  }

  private compileTemplate(template: PromptTemplate): void {
    const key = template.id;

    if (template.userPrompt) {
      const userCompiled = this.handlebars.compile(template.userPrompt);
      this.compiledTemplates.set(`${key}_user`, userCompiled);
    }

    if (template.systemPrompt) {
      const systemCompiled = this.handlebars.compile(template.systemPrompt);
      this.compiledTemplates.set(`${key}_system`, systemCompiled);
    }

    if (template.retryPrompt) {
      const retryCompiled = this.handlebars.compile(template.retryPrompt);
      this.compiledTemplates.set(`${key}_retry`, retryCompiled);
    }
  }

  renderTemplate(
    template: PromptTemplate,
    payload: NormalizedRubiContextPayload & { orgConfig?: any }
  ): {
    systemPrompt?: string;
    userPrompt: string;
    retryPrompt?: string;
  } {
    // Prepare context with all necessary data including org config
    const context = this.prepareContext(payload);

    const result: any = {};

    try {
      // Render system prompt
      if (template.systemPrompt) {
        const systemCompiled = this.compiledTemplates.get(`${template.id}_system`);
        if (systemCompiled) {
          result.systemPrompt = systemCompiled(context);
        } else {
          result.systemPrompt = this.handlebars.compile(template.systemPrompt)(context);
        }
      }

      // Render user prompt
      const userCompiled = this.compiledTemplates.get(`${template.id}_user`);
      if (userCompiled) {
        result.userPrompt = userCompiled(context);
      } else {
        result.userPrompt = this.handlebars.compile(template.userPrompt)(context);
      }

      // Render retry prompt
      if (template.retryPrompt) {
        const retryCompiled = this.compiledTemplates.get(`${template.id}_retry`);
        if (retryCompiled) {
          result.retryPrompt = retryCompiled(context);
        } else {
          result.retryPrompt = this.handlebars.compile(template.retryPrompt)(context);
        }
      }

      return result;
    } catch (error) {
      logger.error(`Failed to render template ${template.id}`, error);
      throw new Error(`Template rendering failed: ${error}`);
    }
  }

  private prepareContext(payload: NormalizedRubiContextPayload & { orgConfig?: any }): any {
    // Deep clone to avoid mutations
    const context = JSON.parse(JSON.stringify(payload));

    // Add helper properties
    context.timestamp = context.timestamp || new Date().toISOString();
    context.platform = context.platform || 'unknown';
    
    // Ensure fields exist
    if (!context.fields) {
      context.fields = {};
    }

    // Parse context data if it's a string
    if (context.context && typeof context.context.data === 'string') {
      try {
        context.context.data = JSON.parse(context.context.data);
      } catch {
        // Keep as string if not valid JSON
      }
    }

    // Add commonly used shortcuts
    context.url = context.url || '';
    context.title = context.metadata?.title || '';
    context.pageType = context.context?.type || '';

    // Extract visible text from various possible locations
    context.visibleText = this.extractVisibleText(context);

    // Process history if available
    if (context.metadata?.history && Array.isArray(context.metadata.history)) {
      context.history = context.metadata.history;
    } else {
      context.history = [];
    }

    // Add user context placeholder
    context.userContext = context.metadata?.userContext || '';

    // Phase 9D: Add org config context
    if (context.orgConfig) {
      context.organization = {
        name: context.orgConfig.orgName || '',
        tier: context.orgConfig.planTier || 'free',
        toneStyle: context.orgConfig.toneStyle || 'consultative',
        locale: context.orgConfig.locale || 'en-US'
      };

      // Add tone instructions based on org config
      context.toneInstructions = this.getToneInstructions(context.orgConfig.toneStyle);

      // Add feature availability based on plan tier
      context.features = this.getFeaturesByTier(context.orgConfig.planTier);
    }

    return context;
  }

  private getToneInstructions(style?: string): string {
    const toneMap = {
      'formal': 'Maintain a formal, professional tone using proper business terminology and complete sentences.',
      'casual': 'Use a friendly, approachable tone with conversational language while remaining professional.',
      'consultative': 'Provide expert advisory insights with strategic recommendations and data-driven analysis.',
      'executive': 'Be concise and high-level, focusing on business impact, ROI, and strategic implications.',
      'coach': 'Use an encouraging, supportive tone with actionable guidance and constructive feedback.'
    };

    return toneMap[style || 'consultative'] || toneMap['consultative'];
  }

  private getFeaturesByTier(tier?: string): any {
    const features = {
      enterprise: {
        deepAnalysis: true,
        riskAssessment: true,
        historicalInsights: true,
        advancedCoaching: true,
        customRecommendations: true
      },
      pilot: {
        deepAnalysis: false,
        riskAssessment: true,
        historicalInsights: true,
        advancedCoaching: false,
        customRecommendations: false
      },
      free: {
        deepAnalysis: false,
        riskAssessment: false,
        historicalInsights: false,
        advancedCoaching: false,
        customRecommendations: false
      },
      custom: {
        deepAnalysis: true,
        riskAssessment: true,
        historicalInsights: true,
        advancedCoaching: true,
        customRecommendations: true
      }
    };

    return features[tier || 'free'] || features['free'];
  }

  private extractVisibleText(context: any): string {
    // Try multiple possible locations for visible text
    const possiblePaths = [
      context.context?.data?.visibleText,
      context.context?.data?.text,
      context.context?.data?.content,
      context.fields?.content,
      context.fields?.text,
      context.metadata?.visibleText,
    ];

    for (const text of possiblePaths) {
      if (text && typeof text === 'string') {
        return text;
      }
    }

    // If no text found, try to extract from structured data
    if (context.context?.data && typeof context.context.data === 'object') {
      const extracted = this.extractTextFromObject(context.context.data);
      if (extracted) return extracted;
    }

    return '';
  }

  private extractTextFromObject(obj: any, maxDepth: number = 3, depth: number = 0): string {
    if (depth >= maxDepth) return '';
    
    const texts: string[] = [];

    for (const key in obj) {
      const value = obj[key];
      
      if (typeof value === 'string' && value.length > 10) {
        texts.push(value);
      } else if (Array.isArray(value)) {
        for (const item of value) {
          if (typeof item === 'string') {
            texts.push(item);
          } else if (typeof item === 'object' && item !== null) {
            const nested = this.extractTextFromObject(item, maxDepth, depth + 1);
            if (nested) texts.push(nested);
          }
        }
      } else if (typeof value === 'object' && value !== null) {
        const nested = this.extractTextFromObject(value, maxDepth, depth + 1);
        if (nested) texts.push(nested);
      }
    }

    return texts.join('\n');
  }

  private validateTemplate(template: PromptTemplate): void {
    if (!template.id || !template.version || !template.userPrompt) {
      throw new Error('Invalid template: missing required fields (id, version, userPrompt)');
    }

    if (!template.model || !template.model.provider || !template.model.name) {
      throw new Error('Invalid template: missing model configuration');
    }

    // Updated to include google
    const validProviders = ['openai', 'anthropic', 'azure-openai', 'google'];
    if (!validProviders.includes(template.model.provider) && 
        !template.model.fallbackProviders) {
      throw new Error(`Invalid provider: ${template.model.provider}`);
    }
  }

  async loadAllTemplates(): Promise<void> {
    try {
      const files = await fs.readdir(this.templateDir);
      const templateFiles = files.filter(f => f.endsWith('.yaml') || f.endsWith('.json'));

      for (const file of templateFiles) {
        const templateName = file.replace(/\.(yaml|json)$/, '');
        try {
          await this.loadTemplate(templateName);
          logger.debug(`Loaded template: ${templateName}`);
        } catch (error) {
          logger.error(`Failed to load template ${file}:`, error);
        }
      }
    } catch (error) {
      logger.error('Failed to load templates directory:', error);
    }
  }

  async getTemplateVersion(templateName: string, version?: string): Promise<PromptTemplate> {
    if (!version) {
      return this.loadTemplate(templateName);
    }

    const versionedName = `${templateName}_v${version}`;
    try {
      return await this.loadTemplate(versionedName);
    } catch {
      logger.warn(`Version ${version} not found for template ${templateName}, falling back to latest`);
      return this.loadTemplate(templateName);
    }
  }

  getLoadedTemplates(): string[] {
    return Array.from(this.templates.keys());
  }

  clearCache(): void {
    this.templates.clear();
    this.compiledTemplates.clear();
  }

  async saveTemplate(template: PromptTemplate): Promise<void> {
    const fileName = `${template.id}.yaml`;
    const filePath = path.join(this.templateDir, fileName);
    
    template.updatedAt = new Date().toISOString();
    
    const yamlContent = yaml.dump(template, {
      indent: 2,
      lineWidth: -1,
      noRefs: true,
      sortKeys: false,
    });

    await fs.writeFile(filePath, yamlContent, 'utf-8');
    this.templates.set(template.id, template);
    this.compileTemplate(template);
  }

  renderSimpleTemplate(templateStr: string, context: any): string {
    try {
      const compiled = this.handlebars.compile(templateStr);
      return compiled(context);
    } catch (error) {
      logger.error('Failed to render simple template', error);
      return templateStr;
    }
  }
}

export const enhancedTemplateEngine = new EnhancedTemplateEngine();