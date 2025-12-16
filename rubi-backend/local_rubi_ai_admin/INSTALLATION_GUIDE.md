# Rubi AI Admin Moodle Plugin Installation Guide

## Overview
The `local_rubi_ai_admin` plugin enables Moodle/Rubi to integrate with the Rubi AI Backend, providing organization configuration management and identity services for the Rubi Browser Extension.

**Target Moodle Instance:** https://sales.multi.rubi.digital  
**Backend API Endpoint:** https://ai.fus-ed.com  
**Plugin Version:** 1.0.0  
**Moodle Requirement:** 4.0+ (2022041900 or higher)

## Pre-Installation Requirements

### 1. Access Requirements
- [ ] Moodle administrator access to https://sales.multi.rubi.digital
- [ ] FTP/SSH access to Moodle server OR ability to install plugins via web interface
- [ ] Ability to modify Moodle configuration files (if using manual installation)

### 2. Shared Secrets (Coordinate with Backend Team)
You'll need these values from the backend deployment team:
- **JWT Secret**: Shared secret for identity token validation
- **API Token**: Token for backend to authenticate to your Moodle instance

## Installation Methods

### Method A: Web Interface Installation (Recommended)

1. **Download Plugin Package**
   ```bash
   # From this repository, create a ZIP file
   cd rubi-backend/
   zip -r local_rubi_ai_admin.zip local_rubi_ai_admin/
   ```

2. **Install via Moodle Admin**
   - Log in to https://sales.multi.rubi.digital as administrator
   - Navigate to: Site administration → Plugins → Install plugins
   - Upload `local_rubi_ai_admin.zip`
   - Click "Install plugin from the ZIP file"
   - Follow the installation wizard

3. **Run Database Upgrades**
   - Moodle will detect the plugin and prompt for database upgrades
   - Click "Upgrade Moodle database now"
   - Wait for completion message

### Method B: Manual Installation (Direct File Access)

1. **Copy Plugin Files**
   ```bash
   # SSH into your Moodle server
   ssh your-server
   
   # Navigate to Moodle local plugins directory
   cd /path/to/moodle/local/
   
   # Copy the plugin folder
   cp -r /path/to/local_rubi_ai_admin ./
   
   # Set proper permissions
   chown -R www-data:www-data local_rubi_ai_admin/
   chmod -R 755 local_rubi_ai_admin/
   ```

2. **Trigger Installation**
   - Visit https://sales.multi.rubi.digital/admin
   - Moodle will detect new plugin and show notification
   - Click "Upgrade Moodle database now"

## Post-Installation Configuration

### 1. Configure Plugin Settings

Navigate to: **Site administration → Plugins → Local plugins → Rubi AI Admin**

Configure the following settings:

#### API Authentication
- **API Token**: `[Generate a secure token, e.g., 64 random characters]`
  - This token will be used by the backend to authenticate
  - Share this with the backend team for their `MOODLE_CONFIG_API_TOKEN`
  
- **JWT Secret**: `[Coordinate with backend team - must match their MOODLE_IDENTITY_JWT_SECRET]`
  - Used to sign identity tokens
  - Must be the same value configured in backend

- **Backend URL**: `https://ai.fus-ed.com`
  - The Rubi AI Backend endpoint

#### Organization Settings
- **Organization ID**: `fused` (or your org identifier)
- **Organization Name**: `Fused`
- **Browser Extension Enabled**: `Yes`
- **Moodle Integration Enabled**: `Yes`

#### Feature Flags
- **Enable LinkedIn Analysis**: `Yes`
- **Enable Salesforce Integration**: `Yes`
- **Enable Gmail Integration**: `Yes`
- **Enable Dashboard Insights**: `Yes`

#### Usage Limits (per day)
- **Global Daily Limit**: `10000`
- **LinkedIn Analysis Limit**: `100`
- **Opportunity Analysis Limit**: `50`
- **Email Analysis Limit**: `200`
- **Dashboard Insights Limit**: `50`

### 2. Configure Webservice Access

1. **Enable Web Services**
   - Navigate to: Site administration → Advanced features
   - Check "Enable web services"
   - Save changes

2. **Enable REST Protocol**
   - Navigate to: Site administration → Plugins → Web services → Manage protocols
   - Enable "REST protocol"

3. **Create Service User** (Optional but recommended)
   - Navigate to: Site administration → Users → Add a new user
   - Username: `rubi_ai_service`
   - Password: [Secure password]
   - Email: `rubi-ai@your-domain.com`
   - First/Last name: `Rubi AI / Service`

4. **Assign Capabilities**
   - The plugin requires these capabilities:
     - `local/rubi_ai_admin:viewconfig` - View organization configuration
     - `local/rubi_ai_admin:editconfig` - Edit organization configuration
     - `local/rubi_ai_admin:viewidentity` - Access identity endpoint

### 3. Test API Endpoints

After installation, verify the endpoints are accessible:

#### Test Config Endpoint
```bash
curl -H "X-API-Token: YOUR_API_TOKEN" \
  "https://sales.multi.rubi.digital/local/rubi_ai_admin/api/config.php?orgid=fused"
```

Expected response:
```json
{
  "success": true,
  "data": {
    "orgId": "fused",
    "name": "Fused",
    "features": {
      "browser_extension_enabled": true,
      "linkedin_analysis": true,
      "salesforce_integration": true,
      "gmail_integration": true,
      "dashboard_insights": true
    },
    "limits": {
      "daily_global": 10000,
      "analyze_linkedin": 100,
      "analyze_opportunity": 50,
      "analyze_email": 200,
      "dashboard_insights": 50
    },
    "modelPreferences": {
      "primary": "anthropic",
      "fallbacks": ["openai", "google"]
    }
  }
}
```

#### Test Identity Endpoint
```bash
curl "https://sales.multi.rubi.digital/local/rubi_ai_admin/api/identity.php"
```

Expected response (when accessed from browser with active session):
```json
{
  "success": true,
  "data": {
    "userId": "123",
    "username": "john.doe",
    "email": "john@example.com",
    "orgId": "fused",
    "jwt": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 4. Configure CORS (if needed)

If you encounter CORS issues, add to Moodle's config.php:

```php
// Allow CORS from backend
header('Access-Control-Allow-Origin: https://ai.fus-ed.com');
header('Access-Control-Allow-Headers: Content-Type, X-API-Token, Authorization');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
```

## Integration with Backend

Once the plugin is installed, provide these details to the backend team:

1. **Moodle Base URL**: `https://sales.multi.rubi.digital`
2. **Config Endpoint**: `https://sales.multi.rubi.digital/local/rubi_ai_admin/api/config.php`
3. **Identity Endpoint**: `https://sales.multi.rubi.digital/local/rubi_ai_admin/api/identity.php`
4. **API Token**: [The token you generated]
5. **JWT Secret**: [The shared secret you configured]

They will update their `.env.production`:
```env
MOODLE_BASE_URL=https://sales.multi.rubi.digital
MOODLE_CONFIG_API_TOKEN=[your-api-token]
MOODLE_IDENTITY_JWT_SECRET=[your-jwt-secret]
MOODLE_CONFIG_ENABLED=true
```

## Troubleshooting

### Plugin Not Appearing
- Clear Moodle cache: Site administration → Development → Purge all caches
- Check file permissions: Plugin files should be readable by web server
- Check Moodle version compatibility (requires 4.0+)

### API Endpoints Return 404
- Verify plugin is installed and enabled
- Check that web services are enabled
- Verify REST protocol is enabled
- Check .htaccess isn't blocking /local/ paths

### Authentication Failures
- Verify API token matches between Moodle and backend
- Check JWT secret is identical on both sides
- Ensure system clocks are synchronized (for JWT validation)

### CORS Errors
- Add CORS headers to config.php (see above)
- Or configure at web server level (Apache/Nginx)

### Database Errors
- Run: Site administration → Development → Upgrade database
- Check error logs at: Site administration → Reports → Logs

## Security Checklist

- [ ] API token is at least 32 characters, randomly generated
- [ ] JWT secret is at least 32 characters, unique
- [ ] HTTPS is enforced for all endpoints
- [ ] API token is not logged or exposed in client-side code
- [ ] Rate limiting is configured (backend handles this)
- [ ] Access logs are monitored for suspicious activity

## Maintenance

### Viewing Logs
- Plugin logs: Site administration → Reports → Logs
- API access logs: Check Moodle's web server access logs
- Error logs: Site administration → Development → Debugging

### Updating Configuration
- Organization settings can be updated via the plugin settings page
- Changes are immediately available to the backend (no restart needed)

### Monitoring Usage
- The backend tracks usage and enforces limits
- View current usage via backend admin panel at https://ai.fus-ed.com/admin

## Support Contacts

- **Moodle/Rubi Admin**: admin@rubi.digital
- **Backend Team**: rubi-backend@fus-ed.com
- **Integration Support**: support@fus-ed.com

## Version History

- **v1.0.0** (2024-01-10): Initial release
  - Organization configuration management
  - Identity service with JWT
  - API endpoints for backend integration