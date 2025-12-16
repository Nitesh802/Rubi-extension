import Ajv from 'ajv';
import * as fs from 'fs/promises';
import * as path from 'path';
import { ValidationResult } from '../types';

export class SchemaValidator {
  private ajv: Ajv;
  private schemas: Map<string, any> = new Map();
  private schemaDir: string;

  constructor(schemaDir: string = path.join(process.cwd(), 'schemas')) {
    this.schemaDir = schemaDir;
    this.ajv = new Ajv({
      allErrors: true,
      verbose: true,
      strict: false,
      coerceTypes: true,
    });

    this.addCommonFormats();
  }

  private addCommonFormats(): void {
    this.ajv.addFormat('email', /^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    this.ajv.addFormat('url', /^https?:\/\/.+/);
    this.ajv.addFormat('date', /^\d{4}-\d{2}-\d{2}$/);
    this.ajv.addFormat('date-time', /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  }

  async loadSchema(schemaName: string): Promise<any> {
    if (this.schemas.has(schemaName)) {
      return this.schemas.get(schemaName);
    }

    const schemaPath = path.join(this.schemaDir, `${schemaName}.json`);
    
    try {
      const schemaContent = await fs.readFile(schemaPath, 'utf-8');
      const schema = JSON.parse(schemaContent);
      
      this.ajv.addSchema(schema, schemaName);
      this.schemas.set(schemaName, schema);
      
      return schema;
    } catch (error) {
      throw new Error(`Failed to load schema ${schemaName}: ${error}`);
    }
  }

  async loadAllSchemas(): Promise<void> {
    try {
      const files = await fs.readdir(this.schemaDir);
      const schemaFiles = files.filter(f => f.endsWith('.json'));

      for (const file of schemaFiles) {
        const schemaName = file.replace('.json', '');
        try {
          await this.loadSchema(schemaName);
        } catch (error) {
          console.error(`Failed to load schema ${file}:`, error);
        }
      }
    } catch (error) {
      console.error('Failed to load schemas directory:', error);
    }
  }

  validate(data: any, schemaName: string): ValidationResult {
    try {
      const validate = this.ajv.getSchema(schemaName);
      
      if (!validate) {
        return {
          valid: false,
          errors: [`Schema ${schemaName} not found`],
        };
      }

      const valid = validate(data);

      if (valid) {
        return {
          valid: true,
          data,
        };
      } else {
        const errors = validate.errors?.map(err => {
          const path = err.instancePath || 'root';
          return `${path}: ${err.message}`;
        }) || ['Validation failed'];

        return {
          valid: false,
          errors,
        };
      }
    } catch (error) {
      return {
        valid: false,
        errors: [`Validation error: ${error}`],
      };
    }
  }

  validateWithRetry(data: any, schemaName: string, corrections?: any): ValidationResult {
    const firstAttempt = this.validate(data, schemaName);
    
    if (firstAttempt.valid) {
      return firstAttempt;
    }

    if (!corrections) {
      return firstAttempt;
    }

    const correctedData = this.applyCorrections(data, corrections, schemaName);
    const secondAttempt = this.validate(correctedData, schemaName);

    if (secondAttempt.valid) {
      return secondAttempt;
    }

    const fallbackData = this.generateFallbackData(schemaName);
    return {
      valid: true,
      data: fallbackData,
      errors: ['Used fallback data after validation failures'],
    };
  }

  private applyCorrections(data: any, corrections: any, schemaName: string): any {
    const schema = this.schemas.get(schemaName);
    if (!schema || !schema.properties) {
      return data;
    }

    const corrected = { ...data };

    for (const [key, prop] of Object.entries(schema.properties as Record<string, any>)) {
      if (corrections[key] !== undefined) {
        corrected[key] = corrections[key];
      } else if (corrected[key] === undefined && prop.default !== undefined) {
        corrected[key] = prop.default;
      } else if (corrected[key] === undefined && this.isRequired(key, schema)) {
        corrected[key] = this.getDefaultValue(prop);
      }
    }

    return corrected;
  }

  private isRequired(key: string, schema: any): boolean {
    return schema.required && schema.required.includes(key);
  }

  private getDefaultValue(prop: any): any {
    switch (prop.type) {
      case 'string':
        return prop.default || '';
      case 'number':
        return prop.default || 0;
      case 'boolean':
        return prop.default || false;
      case 'array':
        return prop.default || [];
      case 'object':
        return prop.default || {};
      default:
        return null;
    }
  }

  private generateFallbackData(schemaName: string): any {
    const schema = this.schemas.get(schemaName);
    if (!schema || !schema.properties) {
      return {};
    }

    const fallback: any = {};

    for (const [key, prop] of Object.entries(schema.properties as Record<string, any>)) {
      fallback[key] = this.getDefaultValue(prop);
    }

    return fallback;
  }

  async validateAgainstFile(data: any, schemaPath: string): Promise<ValidationResult> {
    try {
      const schemaContent = await fs.readFile(schemaPath, 'utf-8');
      const schema = JSON.parse(schemaContent);
      
      const validate = this.ajv.compile(schema);
      const valid = validate(data);

      if (valid) {
        return {
          valid: true,
          data,
        };
      } else {
        const errors = validate.errors?.map(err => {
          const path = err.instancePath || 'root';
          return `${path}: ${err.message}`;
        }) || ['Validation failed'];

        return {
          valid: false,
          errors,
        };
      }
    } catch (error) {
      return {
        valid: false,
        errors: [`Failed to validate against schema file: ${error}`],
      };
    }
  }

  getLoadedSchemas(): string[] {
    return Array.from(this.schemas.keys());
  }

  clearCache(): void {
    this.schemas.clear();
    this.ajv = new Ajv({
      allErrors: true,
      verbose: true,
      strict: false,
      coerceTypes: true,
    });
    this.addCommonFormats();
  }
}

export const schemaValidator = new SchemaValidator();