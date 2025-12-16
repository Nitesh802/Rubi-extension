# Rubi Backend Intelligence System

Production-ready backend for the Rubi Browser Extension that powers all AI-driven actions through LLM orchestration, prompt management, and structured data validation.

## Architecture Overview

### Core Modules

1. **LLM Orchestration Layer** (`src/providers/`)
   - Multi-provider support (OpenAI, Anthropic, Azure OpenAI)
   - Automatic retry logic with exponential backoff
   - Response format enforcement (JSON mode)
   - Token usage tracking

2. **Prompt Template Engine** (`src/templates/`)
   - YAML/JSON template support with versioning
   - Variable interpolation with nested object support
   - Conditional rendering and iterators
   - Metadata management (author, version, model config)

3. **Schema Validation** (`src/schemas/`)
   - JSON Schema validation with AJV
   - Automatic retry with correction prompts
   - Fallback data generation
   - Custom format validators

4. **Action Registry** (`src/actions/`)
   - Modular action handlers
   - Payload validation
   - Rate limiting per action
   - Extensible architecture

5. **Security Middleware** (`src/middleware/`)
   - JWT-based authentication
   - CORS with extension support
   - Rate limiting
   - Input sanitization
   - Request logging

6. **Analytics & Logging** (`src/logging/`)
   - Structured logging with Winston
   - Action metrics tracking
   - Token usage analytics
   - Cost estimation

## Quick Start

### Installation

```bash
cd rubi-backend
npm install
```

### Configuration

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Configure your LLM provider API keys:
```env
OPENAI_API_KEY=sk-your-openai-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key
AZURE_OPENAI_API_KEY=your-azure-key
```

### Development

```bash
npm run dev
```

### Production

```bash
npm run build
npm start
```

## API Endpoints

### Actions

**Execute Action**
```http
POST /api/actions/:actionName/execute
Authorization: Bearer <token>

{
  "payload": {
    "url": "https://linkedin.com/in/johndoe",
    "platform": "linkedin",
    "context": {
      "type": "profile",
      "data": { ... }
    },
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

**List Actions**
```http
GET /api/actions/list
```

### Authentication

**Create Session**
```http
POST /api/auth/session/create

{
  "userId": "user123",
  "email": "user@example.com",
  "extensionId": "ext123"
}
```

### Health

```http
GET /api/health
GET /api/ready
GET /api/metrics
```

## Available Actions

1. **analyze_linkedin_profile** - LinkedIn profile analysis and insights
2. **analyze_opportunity_risk** - Salesforce opportunity risk assessment
3. **analyze_email_message** - Email tone and clarity analysis
4. **get_dashboard_insights** - Dashboard data insights generation
5. **generate_email_draft** - Professional email draft generation
6. **extract_action_items** - Meeting notes action item extraction

## Adding New Actions

1. Create prompt template in `prompts/`:
```yaml
id: my_action
version: "1.0.0"
name: My Action
model:
  provider: openai
  name: gpt-4-turbo-preview
userPrompt: |
  Analyze: {{context.data}}
```

2. Create JSON schema in `schemas/`:
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["result"],
  "properties": {
    "result": { "type": "string" }
  }
}
```

3. Create handler in `src/actions/handlers/`:
```typescript
export const myActionHandler: ActionHandler = async (payload, utilities) => {
  const template = await templateEngine.loadTemplate('my_action');
  const prompt = utilities.renderPrompt(template, payload);
  const llmResponse = await utilities.callLLM(prompt, config);
  // ... validation and processing
  return { success: true, data: result };
};
```

4. Register in `src/actions/registry.ts`:
```typescript
this.register({
  name: 'my_action',
  description: 'My new action',
  templateFile: 'my_action',
  schemaFile: 'my_action',
  handler: myActionHandler,
  requiresAuth: true
});
```

## Security Features

- JWT-based authentication with 24-hour sessions
- CORS protection with browser extension support
- Rate limiting (configurable per action)
- Input sanitization against XSS
- Helmet.js security headers
- Request ID tracking

## Monitoring

- Structured JSON logging
- Action execution metrics
- Token usage tracking
- Cost estimation
- Error tracking with stack traces
- Performance metrics (response times)

## Testing

```bash
npm test
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 3000 |
| NODE_ENV | Environment | development |
| OPENAI_API_KEY | OpenAI API key | - |
| ANTHROPIC_API_KEY | Anthropic API key | - |
| DEFAULT_PROVIDER | Default LLM provider | openai |
| DEFAULT_MODEL | Default model | gpt-4-turbo-preview |
| JWT_SECRET | JWT signing secret | (auto-generated) |
| ALLOWED_ORIGINS | CORS allowed origins | http://localhost:3001 |

## License

Proprietary - Rubi Browser Extension