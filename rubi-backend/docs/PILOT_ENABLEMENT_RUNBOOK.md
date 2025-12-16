# PILOT ENABLEMENT RUNBOOK

## Audience
YOU (the owner) and any future teammate responsible for enabling and managing pilot organizations in the Rubi Intelligence System.

## 1. Prerequisites

Before enabling a new pilot organization, ensure:

- **Backend**: Staging or production backend running (rubi-backend)
  - Verify: `curl http://localhost:3000/api/health` returns 200 OK
  - Check logs: `npm run logs` or `pm2 logs` if using PM2

- **Moodle Plugin**: Installed and configured (local_rubi_ai_admin)
  - Verify: Navigate to Site Administration > Plugins > Local plugins > Rubi AI Admin
  - Check: Backend URL and API tokens are configured

- **Extension**: Loaded in appropriate environment mode
  - Development: Load unpacked extension from Chrome Extensions page
  - Production: Install from Chrome Web Store (when available)
  - Verify: Extension icon visible in browser toolbar

## 2. How to Enable Rubi for a New Pilot Org

### Step 1: Configure in Moodle Admin

1. Navigate to: **Site Administration > Plugins > Local plugins > Rubi AI Admin**

2. Configure organization settings:
   - **Default Organization ID**: Enter unique org identifier (e.g., "pilot-acmecorp")
   - **Organization Name**: Enter display name (e.g., "Acme Corporation")
   
3. Enable core features:
   - **Enable Rubi AI for this organization**: ✅ Check this box
   - **Enable Rubi Browser Extension experiences**: ✅ Check this box

4. Set usage limits (optional):
   - **Max daily AI actions (per org)**: Enter number or leave blank for unlimited
   - **Max daily AI actions (per user)**: Enter number or leave blank for unlimited
   
5. Configure allowed domains (optional):
   - **Allowed domains for browser extension AI**: 
     ```
     linkedin.com
     salesforce.com
     mail.google.com
     ```
   - One domain per line
   - Leave empty to allow all domains

6. Save changes

### Step 2: Verify Configuration

Check that config.php returns correct values:

```bash
# From backend server
curl -X GET \
  "http://your-moodle-site.com/local/rubi_ai_admin/api/config.php?orgid=pilot-acmecorp" \
  -H "X-API-Token: YOUR_BACKEND_API_TOKEN"
```

Expected response should include:
```json
{
  "status": "success",
  "data": {
    "orgId": "pilot-acmecorp",
    "orgName": "Acme Corporation",
    "enabled": true,
    "browser_extension_enabled": true,
    "max_daily_actions_per_org": 1000,
    "max_daily_actions_per_user": 100,
    "allowed_domains": ["linkedin.com", "salesforce.com", "mail.google.com"]
  }
}
```

## 3. How to Confirm Policy is Effective

### Using Debug Panel

1. Open browser with extension installed
2. Navigate to a supported site (e.g., LinkedIn profile)
3. Press **Cmd+Shift+K** (Mac) or **Ctrl+Shift+K** (Windows/Linux) to open debug panel
4. Look for "Resolution" section:
   - **Org Config**: Should show "Moodle" (green) if properly configured
   - **Identity**: Should show "Moodle" (green) if auth is working
   - **Policy**: Should show "ALLOWED" (green) or specific restrictions

### Using Drawer Indicators

1. Click the Rubi extension icon to open drawer
2. Check status indicator in top-right:
   - **Green "Rubi Connected"**: Full functionality enabled
   - **Yellow "Limited Mode"**: Some features restricted
   - **Red "Rubi Disabled"**: Organization has disabled Rubi
   - **Red "Site Not Allowed"**: Current domain is not in allowed list

### Backend Logs

Monitor backend logs for policy enforcement:
```bash
# Look for policy-related logs
grep "policy" /path/to/logs/rubi-backend.log

# Watch for blocked actions
grep "Action blocked" /path/to/logs/rubi-backend.log
```

## 4. How to Temporarily Disable Rubi for an Org

### Quick Disable (Emergency)

1. Navigate to Moodle admin settings
2. **Uncheck** "Enable Rubi AI for this organization"
3. Save changes
4. Effect is immediate (within 5 minutes due to cache)

### Expected UX when Disabled

- Extension drawer shows: **"Rubi AI is currently disabled for your organization"**
- Debug panel shows: **Policy: BLOCKED (Org Disabled)**
- Status indicator turns red: **"Rubi Disabled"**
- All AI actions return policy block messages
- Context extraction continues to work (passive feature)

## 5. How to Raise or Remove Limits During Pilot

### Adjusting Limits

1. Navigate to Moodle admin settings
2. Modify values:
   - **Increase org limit**: Change "Max daily AI actions (per org)" to higher number
   - **Remove org limit**: Clear the field entirely
   - **Increase user limit**: Change "Max daily AI actions (per user)" to higher number
   - **Remove user limit**: Clear the field entirely
3. Save changes

### How Quickly Changes Take Effect

- **Moodle → Backend**: Up to 5 minutes (config cache TTL)
- **Backend → Extension**: Immediate on next action
- **In-memory counters**: Reset at midnight or on backend restart

### Monitoring Usage

Check current usage via backend API:
```bash
# Not yet implemented - future feature
GET /api/admin/usage-stats?orgid=pilot-acmecorp
```

## 6. Notes on Limitations

### In-Memory Counter Limitations

- **Approximate counting**: Counters are held in memory, not persistent storage
- **Reset on restart**: All counters reset when backend restarts
- **No cross-instance sharing**: If running multiple backend instances, counters are not shared
- **24-hour rolling window**: Counters automatically expire after 24 hours

### Production Considerations

For full production deployment, these would be replaced with:
- Persistent database storage (PostgreSQL/MySQL)
- Distributed counters (Redis)
- Proper analytics pipeline
- Usage dashboards and alerts

### Safety Defaults

- If usage limiter fails → **ALLOW** (fail open, not fail closed)
- If org config missing → **ALLOW** with warning in metadata
- If Moodle unreachable → Use cached config or defaults
- If no config at all → Basic features work with stub implementations

## 7. Troubleshooting

### Rubi Not Working for Pilot Org

1. Check Moodle config is saved
2. Verify backend can reach Moodle:
   ```bash
   curl -X GET "http://your-moodle.com/local/rubi_ai_admin/api/config.php?orgid=YOUR_ORG"
   ```
3. Check backend logs for errors
4. Verify extension is in correct environment mode
5. Clear browser cache and reload extension

### Limits Not Being Enforced

1. Check limits are set in Moodle
2. Verify backend received updated config (check logs)
3. Remember: Counters reset on backend restart
4. Check for "policy" entries in execution metadata

### Extension Shows "Limited Mode"

This is expected if:
- Moodle is unreachable (temporary)
- Using cached configuration
- Identity verification pending

Usually resolves itself within 5 minutes.

## 8. Emergency Procedures

### Complete Shutdown

If needed to disable all Rubi AI immediately:

1. **Option A**: Stop backend service
   ```bash
   pm2 stop rubi-backend
   # or
   systemctl stop rubi-backend
   ```

2. **Option B**: Disable all orgs in Moodle
   - Uncheck "Enable Rubi AI" globally
   - Or set max_daily_actions_per_org to 0

3. **Option C**: Network level
   - Block backend port in firewall
   - Remove backend URL from Moodle config

### Rollback Procedure

If pilot causes issues:

1. Disable org in Moodle (immediate)
2. Document issues encountered
3. Review logs for error patterns
4. Revert backend to previous version if needed:
   ```bash
   git checkout previous-stable-tag
   npm install
   npm run build
   pm2 restart rubi-backend
   ```

## 9. Success Metrics

Monitor these during pilot:

- Action success rate (should be >95%)
- Average response time (<2 seconds)
- Policy block rate (should match expectations)
- Error rate in logs (should be <1%)
- User feedback and bug reports

## 10. Contact Information

For urgent issues:
- Primary: [Your contact]
- Backup: [Backup contact]
- Escalation: [Manager/lead contact]

For non-urgent questions:
- Slack: #rubi-pilot-support
- Email: rubi-support@company.com