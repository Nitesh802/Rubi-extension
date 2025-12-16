# Rubi Admin Panel

The Rubi Admin Panel is a web-based interface for managing organization-level configurations in the Rubi Backend Intelligence System.

## Features

- **Organization Management**: Create, read, update, and delete organization configurations
- **Feature Flag Control**: Enable/disable features on a per-organization basis
- **Model Preferences**: Configure LLM provider preferences per organization
- **Action Permissions**: Control which actions are allowed for each organization
- **Plan Tier Management**: Set and modify organization plan tiers (free, pilot, enterprise, custom)
- **Tone Profile Configuration**: Customize communication styles per organization
- **Usage Limits**: Configure token and action limits

## Access

The admin panel is accessible at: `http://localhost:3000/admin`

## Authentication

### Default Credentials
- Username: `admin`
- Password: `changeme123`

**IMPORTANT**: Change these credentials in production by setting environment variables:
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`

### Secondary Admin (Optional)
You can configure a secondary admin account via environment variables:
- `SECONDARY_ADMIN_USERNAME`
- `SECONDARY_ADMIN_PASSWORD`

## Security Features

- JWT-based authentication with 8-hour sessions
- CSRF token protection for write operations
- Rate limiting on login attempts (5 attempts per 15 minutes)
- Role-based access control (admin vs superadmin)
- Secure password hashing

## API Endpoints

### Authentication
- `POST /api/admin/auth/login` - Admin login
- `POST /api/admin/auth/logout` - Admin logout
- `GET /api/admin/auth/session` - Get current session
- `POST /api/admin/auth/refresh` - Refresh auth token

### Organization Management
- `GET /api/admin/orgs` - List all organizations
- `GET /api/admin/orgs/:orgId` - Get specific organization
- `POST /api/admin/orgs` - Create new organization
- `PUT /api/admin/orgs/:orgId` - Update organization
- `DELETE /api/admin/orgs/:orgId` - Soft delete organization
- `POST /api/admin/orgs/:orgId/restore` - Restore deleted organization (superadmin only)
- `GET /api/admin/orgs/stats/summary` - Get organization statistics

## Configuration Storage

Organization configurations are persisted to `configs/orgs.json` with automatic backups and atomic writes to prevent data corruption.

## Backward Compatibility

The system maintains full backward compatibility:
- If no admin configurations exist, default sample organizations are created
- Existing in-memory configurations are preserved
- The extension continues to work without admin panel interaction

## Environment Variables

```bash
# Admin Authentication
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password
ADMIN_JWT_SECRET=your-jwt-secret

# Optional Secondary Admin
SECONDARY_ADMIN_USERNAME=secondary
SECONDARY_ADMIN_PASSWORD=another-secure-password

# Server Configuration
PORT=3000
HOST=0.0.0.0
```

## Organization Configuration Schema

```json
{
  "orgId": "unique-org-id",
  "orgName": "Organization Name",
  "planTier": "enterprise",
  "allowedActions": ["action1", "action2"],
  "blockedActions": [],
  "modelPreferences": {
    "defaultProvider": "openai",
    "perAction": {
      "action1": {
        "provider": "anthropic",
        "model": "claude-3-opus"
      }
    }
  },
  "toneProfile": {
    "id": "profile-id",
    "style": "consultative",
    "localeOverride": "en-US"
  },
  "featureFlags": {
    "enableDebugPanel": true,
    "enableHistory": false,
    "enableExperimentalActions": false,
    "enableSalesforceBeta": false,
    "enableLinkedInDeepDive": false,
    "enableEmailToneStrictMode": false
  },
  "limits": {
    "maxActionsPerPage": 10,
    "maxActionsPerSession": 100,
    "maxTokensPerAction": 4000
  }
}
```

## Logging

All admin actions are logged with the following information:
- Admin user ID
- Action performed
- Organization affected
- Timestamp
- Changes made

## Development

The admin panel is built with vanilla JavaScript, HTML, and CSS for simplicity and minimal dependencies.

### File Structure
```
admin/
├── index.html       # Main HTML structure
├── styles.css       # Styling
├── admin.js         # JavaScript functionality
└── README.md        # This file
```

## Production Deployment

1. Set strong admin credentials via environment variables
2. Configure HTTPS/TLS for secure access
3. Implement additional authentication layers (e.g., OAuth, SAML)
4. Set up regular backups of `configs/orgs.json`
5. Monitor admin action logs
6. Consider implementing IP whitelisting for admin access

## Troubleshooting

### Cannot Login
- Check admin credentials in environment variables
- Verify JWT secret is configured
- Check server logs for authentication errors

### Organizations Not Persisting
- Ensure `configs/` directory has write permissions
- Check disk space availability
- Review server logs for file system errors

### CSRF Token Errors
- Ensure cookies are enabled in browser
- Check for clock synchronization issues
- Verify CORS configuration if accessing from different domain