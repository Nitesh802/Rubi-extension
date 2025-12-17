# Rubi Browser Extension - Installation Guide

This guide will help you install and run the Rubi Browser Extension on your server.

## Prerequisites

- **Node.js 18+** - Download from https://nodejs.org/
- **Chrome/Chromium browser** - For the browser extension
- **API Key** - Anthropic (Claude) or OpenAI API key

---

## Part 1: Backend Server Setup

### Step 1: Copy Files to Your Server

Upload the entire project to your server. For example, to `/var/www/html/`:

```bash
# Using SCP from your local machine:
scp -r ./Rubi-extension root@your-server-ip:/var/www/html/

# Or using rsync:
rsync -avz ./Rubi-extension root@your-server-ip:/var/www/html/
```

### Step 2: Navigate to Backend Directory

```bash
cd /var/www/html/Rubi-extension/rubi-backend
```

### Step 3: Install Dependencies

```bash
npm install
```

### Step 4: Create Environment Configuration

```bash
cp .env.example .env
nano .env
```

Add your configuration:

```env
# Server Settings
PORT=3000
NODE_ENV=production

# Anthropic Claude API Key (get from console.anthropic.com)
ANTHROPIC_API_KEY=sk-ant-your-api-key-here

# OR OpenAI API Key (get from platform.openai.com)
# OPENAI_API_KEY=sk-your-openai-key-here

# Security - Generate with: openssl rand -hex 32
JWT_SECRET=your-64-character-random-secret
```

Save and exit: `Ctrl+X`, then `Y`, then `Enter`

### Step 5: Build the Project

```bash
npm run build
```

You may see some TypeScript warnings - these are normal and won't affect functionality.

### Step 6: Start the Server

```bash
# For production:
npm start

# Or for development (with auto-reload):
npm run dev
```

### Step 7: Verify Server is Running

```bash
curl http://localhost:3000/health
```

You should see: `{"status":"healthy",...}`

---

## Part 2: Browser Extension Setup

### Step 1: Open Chrome Extensions

1. Open Chrome browser
2. Go to `chrome://extensions/`
3. Enable **Developer mode** (toggle in top-right corner)

### Step 2: Load the Extension

1. Click **"Load unpacked"**
2. Navigate to `/var/www/html/Rubi-extension/` (the main folder, NOT rubi-backend)
3. Click **Select Folder**

### Step 3: Verify Installation

- The Rubi extension should appear in your extensions list
- You should see a small icon in your Chrome toolbar

---

## Part 3: Using the Extension

### Supported Platforms

The extension works on:
- **Salesforce** - Opportunities, Accounts, Contacts
- **Gmail** - Email composition and analysis
- **Outlook Web** - Email and calendar
- **Google Calendar** - Meeting preparation
- **LinkedIn** - Profile research

### How to Use

1. Visit any supported website (Gmail, LinkedIn, Salesforce, etc.)
2. Look for the **purple floating bubble** in the bottom-right corner
3. Click the bubble to open the Rubi panel
4. The extension will analyze the current page and provide AI insights

---

## Running as a Service (Production)

### Using PM2 (Recommended)

```bash
# Install PM2 globally
npm install -g pm2

# Start the server with PM2
cd /var/www/html/Rubi-extension/rubi-backend
pm2 start dist/prod-server.js --name rubi-backend

# Save PM2 process list
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

### Using systemd

Create `/etc/systemd/system/rubi-backend.service`:

```ini
[Unit]
Description=Rubi Backend Server
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/var/www/html/Rubi-extension/rubi-backend
ExecStart=/usr/bin/node dist/prod-server.js
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Then:

```bash
systemctl daemon-reload
systemctl enable rubi-backend
systemctl start rubi-backend
```

---

## Part 4: Nginx Reverse Proxy Setup (Required for HTTPS)

If you're using nginx as a reverse proxy (required for HTTPS), you must configure it to properly handle CORS headers from the browser extension.

### Nginx Configuration

Create or edit `/etc/nginx/sites-available/rubi-backend`:

```nginx
server {
    listen 80;
    server_name ai.fus-ed.com;  # Change to your domain
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ai.fus-ed.com;  # Change to your domain

    # SSL certificates (use certbot/Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/ai.fus-ed.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ai.fus-ed.com/privkey.pem;

    # SSL settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;

    location / {
        # Handle preflight OPTIONS requests at nginx level
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' $http_origin always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS, PATCH' always;
            add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization,X-Extension-Token,X-Moodle-Url,X-Request-Id' always;
            add_header 'Access-Control-Allow-Credentials' 'true' always;
            add_header 'Access-Control-Max-Age' 1728000;
            add_header 'Content-Type' 'text/plain; charset=utf-8';
            add_header 'Content-Length' 0;
            return 204;
        }

        # Proxy to Node.js backend
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Pass through CORS headers from backend
        proxy_hide_header 'Access-Control-Allow-Origin';
        add_header 'Access-Control-Allow-Origin' $http_origin always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS, PATCH' always;
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization,X-Extension-Token,X-Moodle-Url,X-Request-Id' always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;
        add_header 'Access-Control-Expose-Headers' 'X-Request-Id,X-Response-Time' always;
    }
}
```

### Enable the Site

```bash
# Create symlink to enable site
sudo ln -s /etc/nginx/sites-available/rubi-backend /etc/nginx/sites-enabled/

# Test nginx configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

### Quick CORS Fix (If nginx config is complex)

If you have an existing nginx config and don't want to modify it extensively, add this to your existing `location /` block:

```nginx
# Add inside your existing location block
if ($request_method = 'OPTIONS') {
    add_header 'Access-Control-Allow-Origin' $http_origin always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS, PATCH' always;
    add_header 'Access-Control-Allow-Headers' '*' always;
    add_header 'Access-Control-Allow-Credentials' 'true' always;
    return 204;
}

add_header 'Access-Control-Allow-Origin' $http_origin always;
add_header 'Access-Control-Allow-Credentials' 'true' always;
```

---

## Troubleshooting

### Server won't start
- Check if port 3000 is already in use: `lsof -i :3000`
- Verify .env file exists and has correct API keys
- Check logs: `npm run dev` for detailed output

### Extension not loading
- Make sure you selected the correct folder (main project folder)
- Check Chrome DevTools console for errors (F12)

### Purple bubble not appearing
- Refresh the page after installing the extension
- Make sure you're on a supported website
- Check that the extension is enabled in `chrome://extensions/`

### API errors
- Verify your API key is correct in .env
- Check that your API key has credits/quota available
- Check server logs for detailed error messages

### CORS Errors (No 'Access-Control-Allow-Origin' header)

This is the most common issue when using nginx as a reverse proxy.

**Step 1: Check if nginx is stripping headers**
```bash
# Test directly against Node.js (should work)
curl -v -X OPTIONS http://localhost:3000/api/actions/org-config \
  -H "Origin: https://mail.google.com" \
  -H "Access-Control-Request-Method: POST"

# Test through nginx (if this fails, nginx is the problem)
curl -v -X OPTIONS https://ai.fus-ed.com/api/actions/org-config \
  -H "Origin: https://mail.google.com" \
  -H "Access-Control-Request-Method: POST"
```

**Step 2: View your current nginx config**
```bash
cat /etc/nginx/sites-enabled/default
# or
cat /etc/nginx/sites-enabled/ai.fus-ed.com
```

**Step 3: Add CORS headers to nginx**

Find your `location /` block and add:
```nginx
location / {
    # CORS - Add these lines
    if ($request_method = 'OPTIONS') {
        add_header 'Access-Control-Allow-Origin' $http_origin always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS, PATCH' always;
        add_header 'Access-Control-Allow-Headers' '*' always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;
        return 204;
    }
    add_header 'Access-Control-Allow-Origin' $http_origin always;
    add_header 'Access-Control-Allow-Credentials' 'true' always;

    # Your existing proxy_pass line
    proxy_pass http://127.0.0.1:3000;
    # ... rest of your config
}
```

**Step 4: Test and reload**
```bash
sudo nginx -t
sudo systemctl reload nginx
```

**Step 5: Verify CORS is working**
```bash
curl -v -X OPTIONS https://ai.fus-ed.com/api/actions/org-config \
  -H "Origin: https://mail.google.com" 2>&1 | grep -i "access-control"
```

You should see:
```
< Access-Control-Allow-Origin: https://mail.google.com
< Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH
< Access-Control-Allow-Credentials: true
```

---

## API Keys

### Anthropic (Claude)
1. Go to https://console.anthropic.com/
2. Sign in or create an account
3. Navigate to **API Keys**
4. Click **Create Key**
5. Copy the key (starts with `sk-ant-...`)

### OpenAI
1. Go to https://platform.openai.com/
2. Sign in or create an account
3. Navigate to **API Keys**
4. Click **Create new secret key**
5. Copy the key (starts with `sk-...`)

---

## Quick Reference

| Command | Description |
|---------|-------------|
| `npm install` | Install dependencies |
| `npm run build` | Build the project |
| `npm start` | Start production server |
| `npm run dev` | Start development server |
| `curl localhost:3000/health` | Check server health |

---

## Support

For issues and feature requests, please visit the project repository.
