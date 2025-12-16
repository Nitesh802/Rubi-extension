# Rubi AI Backend Deployment - Team Assignments

## Overview
Deploying the Rubi AI Backend to production at **https://ai.fus-ed.com**  
Integrating with Rubi development instance at **https://sales.multi.rubi.digital**

---

## Team Member 1: AWS/Infrastructure Engineer

### Your Documentation
📄 **File:** `/rubi-backend/docs/AWS_EC2_DEPLOYMENT_GUIDE.txt`

### Your Tasks
1. **AWS Infrastructure Setup**
   - Launch EC2 instance (Ubuntu 22.04)
   - Configure security groups
   - Set up Elastic IP
   - Configure DNS (ai.fus-ed.com → EC2)

2. **System Configuration**
   - Install Node.js 20.x, PM2, Nginx, Certbot
   - Configure SSL with Let's Encrypt
   - Set up PM2 for process management
   - Configure Nginx reverse proxy

3. **Application Deployment**
   - Clone repository
   - Build application
   - Configure environment variables from template
   - Start application with PM2

### Key Information Needed From You
After setup, provide to the Moodle developer:
- Confirmation that backend is running at https://ai.fus-ed.com
- The API token you want Moodle to use
- The JWT secret for identity validation

### Timeline
- EC2 setup and basic config: 2-3 hours
- Application deployment: 1-2 hours
- SSL and final config: 1 hour
- Testing: 1 hour

---

## Team Member 2: Moodle/Rubi Developer

### Your Documentation
📄 **File:** `/rubi-backend/local_rubi_ai_admin/INSTALLATION_GUIDE.md`

### Your Tasks
1. **Plugin Installation**
   - Install the `local_rubi_ai_admin` plugin on https://sales.multi.rubi.digital
   - Run database upgrades
   - Enable web services and REST protocol

2. **Plugin Configuration**
   - Configure API token (coordinate with AWS engineer)
   - Set JWT secret (must match backend)
   - Configure organization settings
   - Set feature flags and usage limits

3. **Testing**
   - Verify config.php endpoint responds
   - Verify identity.php endpoint works
   - Test with sample curl commands in guide

### Key Information Needed From You
After setup, provide to the AWS engineer:
- Moodle base URL: https://sales.multi.rubi.digital
- Config endpoint: https://sales.multi.rubi.digital/local/rubi_ai_admin/api/config.php
- Identity endpoint: https://sales.multi.rubi.digital/local/rubi_ai_admin/api/identity.php
- The API token you configured
- Confirmation that JWT secret matches

### Timeline
- Plugin installation: 30 minutes
- Configuration: 30 minutes
- Testing: 30 minutes

---

## Coordination Points

### Before Starting
1. **Agree on shared secrets:**
   - JWT Secret (32+ characters)
   - API Token (32+ characters)
   - Both teams must use identical values

2. **Confirm URLs:**
   - Backend: https://ai.fus-ed.com
   - Moodle: https://sales.multi.rubi.digital

### During Deployment
1. AWS engineer deploys backend first
2. AWS engineer provides connection details to Moodle dev
3. Moodle dev installs and configures plugin
4. Both teams test integration together

### Integration Testing Checklist
Once both parts are deployed:

- [ ] Backend health check: `curl https://ai.fus-ed.com/api/health`
- [ ] Moodle config endpoint: `curl -H "X-API-Token: [token]" https://sales.multi.rubi.digital/local/rubi_ai_admin/api/config.php?orgid=fused`
- [ ] Backend can fetch Moodle config (check backend logs)
- [ ] Browser extension can connect to backend
- [ ] Identity JWT validation works end-to-end

---

## Support Contacts

- **Project Lead:** [Your name/email]
- **AWS Support:** [Contact]
- **Moodle Support:** [Contact]
- **Emergency Contact:** [Contact]

---

## Quick Reference

### Files in This Repository

```
/rubi-backend/
├── docs/
│   ├── AWS_EC2_DEPLOYMENT_GUIDE.txt     # For AWS engineer
│   └── DEPLOYMENT_TEAM_ASSIGNMENTS.md   # This file
├── local_rubi_ai_admin/
│   ├── INSTALLATION_GUIDE.md            # For Moodle developer
│   └── [plugin files]                   # Moodle plugin code
└── [backend application code]
```

### Key URLs After Deployment

- **Backend API:** https://ai.fus-ed.com
- **Backend Health:** https://ai.fus-ed.com/api/health
- **Moodle Config API:** https://sales.multi.rubi.digital/local/rubi_ai_admin/api/config.php
- **Moodle Identity API:** https://sales.multi.rubi.digital/local/rubi_ai_admin/api/identity.php

### Deployment Order
1. ✅ AWS EC2 instance setup
2. ✅ Backend deployment
3. ✅ SSL certificate
4. ✅ Moodle plugin installation
5. ✅ Configuration sync
6. ✅ Integration testing
7. ✅ Browser extension configuration