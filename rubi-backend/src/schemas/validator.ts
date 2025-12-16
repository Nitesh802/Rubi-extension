import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { ValidationResult } from '../types';
import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../logging/logger';

interface SchemaCache {
  [key: string]: any;
}

export class SchemaValidator {
  private ajv: Ajv;
  private schemas: SchemaCache = {};
  private schemaDir: string;

  constructor() {
    this.ajv = new Ajv({
      allErrors: true,
      coerceTypes: true,
      useDefaults: true,
      removeAdditional: true,
      strict: false,
    });
    
    addFormats(this.ajv);
    this.schemaDir = path.join(__dirname, '../../schemas');
    this.loadSchemas();
  }

  private loadSchemas(): void {
    try {
      const files = fs.readdirSync(this.schemaDir);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const schemaPath = path.join(this.schemaDir, file);
          const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
          const schema = JSON.parse(schemaContent);
          
          // Extract schema name from filename
          const schemaName = file.replace('.json', '').replace('_v2', '');
          
          // Compile and cache schema
          this.schemas[schemaName] = schema;
          this.ajv.addSchema(schema, schemaName);
          
          logger.debug(`Loaded schema: ${schemaName}`);
        }
      }
    } catch (error) {
      logger.error('Failed to load schemas', error);
    }
  }

  validate(data: any, schemaName: string): ValidationResult {
    try {
      // Try both with and without _v2 suffix
      let validate = this.ajv.getSchema(schemaName);
      if (!validate) {
        validate = this.ajv.getSchema(`${schemaName}_v2`);
      }
      
      if (!validate) {
        // Try to load schema dynamically
        const schema = this.loadSchemaByName(schemaName);
        if (schema) {
          validate = this.ajv.compile(schema);
        } else {
          return {
            valid: false,
            errors: [`Schema '${schemaName}' not found`],
          };
        }
      }

      const valid = validate(data);
      
      if (!valid) {
        const errors = validate.errors?.map(err => {
          const field = err.instancePath || err.schemaPath;
          const message = err.message || 'Validation error';
          return `${field}: ${message}`;
        }) || ['Unknown validation error'];

        logger.warn(`Validation failed for schema ${schemaName}`, {
          errors,
          data: JSON.stringify(data).substring(0, 500),
        });

        return {
          valid: false,
          errors,
          data,
        };
      }

      return {
        valid: true,
        data,
      };
    } catch (error) {
      logger.error(`Validation error for schema ${schemaName}`, error);
      
      return {
        valid: false,
        errors: [error instanceof Error ? error.message : 'Unknown validation error'],
        data,
      };
    }
  }

  private loadSchemaByName(schemaName: string): any {
    // Try multiple file patterns
    const patterns = [
      `${schemaName}.json`,
      `${schemaName}_v2.json`,
      `${schemaName.replace(/_/g, '-')}.json`,
    ];

    for (const pattern of patterns) {
      const schemaPath = path.join(this.schemaDir, pattern);
      
      if (fs.existsSync(schemaPath)) {
        try {
          const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
          const schema = JSON.parse(schemaContent);
          
          // Cache for future use
          this.schemas[schemaName] = schema;
          this.ajv.addSchema(schema, schemaName);
          
          return schema;
        } catch (error) {
          logger.error(`Failed to load schema from ${schemaPath}`, error);
        }
      }
    }

    return null;
  }

  validateWithCorrection(data: any, schemaName: string): {
    valid: boolean;
    data?: any;
    errors?: string[];
    corrected?: boolean;
  } {
    // First attempt
    const result = this.validate(data, schemaName);
    
    if (result.valid) {
      return { valid: true, data: result.data };
    }

    // Try to correct common issues
    const corrected = this.attemptCorrection(data, schemaName, result.errors || []);
    
    if (corrected) {
      const secondResult = this.validate(corrected, schemaName);
      
      if (secondResult.valid) {
        return {
          valid: true,
          data: secondResult.data,
          corrected: true,
        };
      }
    }

    return {
      valid: false,
      data,
      errors: result.errors,
    };
  }

  private attemptCorrection(data: any, schemaName: string, errors: string[]): any {
    const corrected = JSON.parse(JSON.stringify(data));
    
    // Common corrections based on error patterns
    for (const error of errors) {
      if (error.includes('must be integer')) {
        // Convert strings to integers
        this.convertToIntegers(corrected);
      }
      
      if (error.includes('must be boolean')) {
        // Convert strings to booleans
        this.convertToBooleans(corrected);
      }
      
      if (error.includes('must be array')) {
        // Wrap non-arrays in arrays
        this.wrapInArrays(corrected, error);
      }
      
      if (error.includes('must match pattern')) {
        // Try to fix date formats
        this.fixDateFormats(corrected);
      }

      if (error.includes('must be string')) {
        // Convert numbers to strings
        this.convertToStrings(corrected);
      }
    }

    return corrected;
  }

  private convertToIntegers(obj: any): void {
    for (const key in obj) {
      if (typeof obj[key] === 'string' && /^\d+$/.test(obj[key])) {
        obj[key] = parseInt(obj[key], 10);
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        this.convertToIntegers(obj[key]);
      }
    }
  }

  private convertToBooleans(obj: any): void {
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        if (obj[key].toLowerCase() === 'true') {
          obj[key] = true;
        } else if (obj[key].toLowerCase() === 'false') {
          obj[key] = false;
        }
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        this.convertToBooleans(obj[key]);
      }
    }
  }

  private convertToStrings(obj: any): void {
    for (const key in obj) {
      if (typeof obj[key] === 'number') {
        obj[key] = String(obj[key]);
      } else if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        this.convertToStrings(obj[key]);
      }
    }
  }

  private wrapInArrays(obj: any, error: string): void {
    // Extract field name from error
    const match = error.match(/\/([^:]+):/);
    if (match) {
      const fieldPath = match[1].split('/').filter(Boolean);
      let current = obj;
      
      for (let i = 0; i < fieldPath.length - 1; i++) {
        if (current[fieldPath[i]]) {
          current = current[fieldPath[i]];
        }
      }
      
      const lastField = fieldPath[fieldPath.length - 1];
      if (current[lastField] && !Array.isArray(current[lastField])) {
        current[lastField] = [current[lastField]];
      }
    }
  }

  private fixDateFormats(obj: any): void {
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        // Try to parse and reformat dates
        const dateMatch = obj[key].match(/(\d{1,2})[-\/](\d{1,2})[-\/](\d{2,4})/);
        if (dateMatch) {
          const [_, day, month, year] = dateMatch;
          const fullYear = year.length === 2 ? `20${year}` : year;
          obj[key] = `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        this.fixDateFormats(obj[key]);
      }
    }
  }

  getSchema(schemaName: string): any {
    return this.schemas[schemaName] || this.loadSchemaByName(schemaName);
  }

  getAvailableSchemas(): string[] {
    return Object.keys(this.schemas);
  }

  reloadSchemas(): void {
    this.schemas = {};
    this.ajv.removeSchema();
    this.loadSchemas();
  }

  generateFallbackData(schemaName: string): any {
    const schema = this.getSchema(schemaName);
    if (!schema) {
      return {};
    }

    return this.generateFromSchema(schema);
  }

  private generateFromSchema(schema: any): any {
    if (schema.type === 'object') {
      const obj: any = {};
      
      if (schema.properties) {
        for (const prop in schema.properties) {
          const propSchema = schema.properties[prop];
          const isRequired = schema.required?.includes(prop);
          
          if (isRequired || propSchema.default !== undefined) {
            obj[prop] = propSchema.default ?? this.generateFromSchema(propSchema);
          }
        }
      }
      
      return obj;
    } else if (schema.type === 'array') {
      return [];
    } else if (schema.type === 'string') {
      if (schema.enum) {
        return schema.enum[0];
      }
      if (schema.format === 'date-time') {
        return new Date().toISOString();
      }
      if (schema.format === 'date') {
        return new Date().toISOString().split('T')[0];
      }
      return schema.default || '';
    } else if (schema.type === 'number' || schema.type === 'integer') {
      return schema.default ?? schema.minimum ?? 0;
    } else if (schema.type === 'boolean') {
      return schema.default ?? false;
    }
    
    return null;
  }
}

export const schemaValidator = new SchemaValidator();