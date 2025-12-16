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
