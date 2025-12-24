import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { PromptTemplate, NormalizedRubiContextPayload } from '../types';

export class TemplateEngine {
  private templates: Map<string, PromptTemplate> = new Map();
  private templateDir: string;

  constructor(templateDir: string = path.join(process.cwd(), 'prompts')) {
    this.templateDir = templateDir;
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
    return template;
  }

  async loadAllTemplates(): Promise<void> {
    try {
      const files = await fs.readdir(this.templateDir);
      const templateFiles = files.filter(f => f.endsWith('.yaml') || f.endsWith('.json'));

      for (const file of templateFiles) {
        const templateName = file.replace(/\.(yaml|json)$/, '');
        try {
          await this.loadTemplate(templateName);
        } catch (error) {
          console.error(`Failed to load template ${file}:`, error);
        }
      }
    } catch (error) {
      console.error('Failed to load templates directory:', error);
    }
  }

  renderTemplate(template: PromptTemplate, payload: NormalizedRubiContextPayload): string {
    let rendered = template.userPrompt;
    
    const variables = this.extractVariables(rendered);
    
    for (const variable of variables) {
      const value = this.resolveVariable(variable, payload);
      const placeholder = `{{${variable}}}`;
      rendered = rendered.replace(new RegExp(placeholder, 'g'), value);
    }

    rendered = this.processConditionals(rendered, payload);
    rendered = this.processIterators(rendered, payload);

    return rendered;
  }

  private extractVariables(template: string): string[] {
    const regex = /\{\{([^}]+)\}\}/g;
    const variables: string[] = [];
    let match;

    while ((match = regex.exec(template)) !== null) {
      if (!match[1].startsWith('#') && !match[1].startsWith('/')) {
        variables.push(match[1].trim());
      }
    }

    return [...new Set(variables)];
  }

  private resolveVariable(path: string, payload: any): string {
    const parts = path.split('.');
    let value: any = payload;

    for (const part of parts) {
      if (value && typeof value === 'object') {
        value = value[part];
      } else {
        return '';
      }
    }

    if (value === null || value === undefined) {
      return '';
    }

    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }

    return String(value);
  }

  private processConditionals(template: string, payload: any): string {
    const regex = /\{\{#if\s+([^}]+)\}\}([\s\S]*?)\{\{\/if\}\}/g;
    
    return template.replace(regex, (match, condition, content) => {
      const value = this.resolveVariable(condition.trim(), payload);
      return value && value !== 'false' && value !== '0' ? content : '';
    });
  }

  private processIterators(template: string, payload: any): string {
    const regex = /\{\{#each\s+([^}]+)\}\}([\s\S]*?)\{\{\/each\}\}/g;

    return template.replace(regex, (match, listPath, itemTemplate) => {
      const list = this.resolveVariable(listPath.trim(), payload);

      // Handle empty or invalid list values
      if (!list || list === '') {
        return '';
      }

      try {
        const items = JSON.parse(list);
        if (!Array.isArray(items)) {
          return '';
        }

        return items.map((item: any, index: number) => {
          let rendered = itemTemplate;
          // Handle {{this.property}} patterns
          const thisPropertyRegex = /\{\{this\.([^}]+)\}\}/g;
          rendered = rendered.replace(thisPropertyRegex, (m, propPath) => {
            const parts = propPath.split('.');
            let value: any = item;
            for (const part of parts) {
              if (value && typeof value === 'object') {
                value = value[part];
              } else {
                return '';
              }
            }
            return value !== null && value !== undefined ? String(value) : '';
          });
          // Handle simple {{this}} for string items
          rendered = rendered.replace(/\{\{this\}\}/g,
            typeof item === 'string' ? item : JSON.stringify(item));
          rendered = rendered.replace(/\{\{@index\}\}/g, String(index));
          return rendered;
        }).join('');
      } catch {
        // JSON parse failed - list is not valid JSON
        return '';
      }
    });
  }

  private validateTemplate(template: PromptTemplate): void {
    if (!template.id || !template.version || !template.userPrompt) {
      throw new Error('Invalid template: missing required fields (id, version, userPrompt)');
    }

    if (!template.model || !template.model.provider || !template.model.name) {
      throw new Error('Invalid template: missing model configuration');
    }

    const validProviders = ['openai', 'anthropic', 'azure-openai'];
    if (!validProviders.includes(template.model.provider)) {
      throw new Error(`Invalid provider: ${template.model.provider}`);
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
      console.warn(`Version ${version} not found for template ${templateName}, falling back to latest`);
      return this.loadTemplate(templateName);
    }
  }

  getLoadedTemplates(): string[] {
    return Array.from(this.templates.keys());
  }

  clearCache(): void {
    this.templates.clear();
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
  }

  async updateTemplateMetadata(
    templateName: string,
    updates: Partial<PromptTemplate>
  ): Promise<PromptTemplate> {
    const template = await this.loadTemplate(templateName);
    
    const updatedTemplate: PromptTemplate = {
      ...template,
      ...updates,
      id: template.id,
      version: updates.version || template.version,
      updatedAt: new Date().toISOString(),
    };

    await this.saveTemplate(updatedTemplate);
    return updatedTemplate;
  }
}

export const templateEngine = new TemplateEngine();