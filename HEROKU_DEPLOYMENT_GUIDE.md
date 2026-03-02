# Heroku Deployment Guide - ResilientEcho

## Quick Deploy (5 minutes)

### Prerequisites
```bash
npm install -g heroku
heroku login
```

### Step 1: Create Heroku App
```bash
heroku create your-app-name-here
# or let Heroku generate a name
heroku create
```

### Step 2: Add PostgreSQL Database
```bash
heroku addons:create heroku-postgresql:hobby-dev
```

### Step 3: Add Redis Cache
```bash
heroku addons:create heroku-redis:premium-0
```

### Step 4: Set Environment Variables
```bash
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=$(openssl rand -hex 32)
heroku config:set ENCRYPTION_KEY=$(openssl rand -hex 16)
heroku config:set MASTER_KEY=$(openssl rand -hex 32)
heroku config:set DEEPL_API_KEY=your_deepl_key_here
heroku config:set NOAA_API_KEY=your_noaa_key_here
heroku config:set USGS_API_KEY=your_usgs_key_here
```

### Step 5: Deploy
```bash
# Push to Heroku (first deployment)
git push heroku main

# Check logs
heroku logs --tail
```

### Step 6: Verify Deployment
```bash
heroku open
# Or visit: https://your-app-name-here.herokuapp.com
```

---

## Detailed Deployment Instructions

### 1. Install Heroku CLI

**Windows:**
```bash
choco install heroku-cli
# or download from https://devcenter.heroku.com/articles/heroku-cli
```

**Mac:**
```bash
brew tap heroku/brew && brew install heroku
```

**Linux:**
```bash
curl https://cli-assets.heroku.com/install.sh | sh
```

### 2. Authenticate with Heroku
```bash
heroku login
# Opens browser to authenticate
```

### 3. Create New Heroku App
```bash
# Option A: Let Heroku name it
heroku create

# Option B: Use custom name
heroku create resilient-echo-app

# Verify
heroku apps
```

### 4. Configure Database & Cache

**PostgreSQL (Primary Database):**
```bash
heroku addons:create heroku-postgresql:hobby-dev
# Hobby plan: Free tier
# Production: Use standard-0 or higher
```

**Redis (Caching & Pub/Sub):**
```bash
heroku addons:create heroku-redis:premium-0
# Premium-0: Free tier (30MB)
# Production: Use premium-1 or higher
```

**Get Connection Strings:**
```bash
heroku config | grep DATABASE_URL
heroku config | grep REDIS_URL
```

### 5. Set Environment Variables

**Critical Variables (Must Set):**
```bash
# Node environment
heroku config:set NODE_ENV=production

# Security keys (generate new ones)
heroku config:set JWT_SECRET=$(openssl rand -hex 32)
heroku config:set ENCRYPTION_KEY=$(openssl rand -hex 16)
heroku config:set MASTER_KEY=$(openssl rand -hex 32)

# API keys (get from services)
heroku config:set DEEPL_API_KEY=your_key_here
heroku config:set NOAA_API_KEY=your_key_here
heroku config:set USGS_API_KEY=your_key_here
heroku config:set SENTINEL_API_KEY=your_key_here

# Optional: Monitoring
heroku config:set SENTRY_DSN=your_sentry_url
heroku config:set LOG_LEVEL=info
```

**View All Config:**
```bash
heroku config
```

### 6. Configure Git Remote

```bash
# Check remotes
git remote -v

# If not set, add Heroku remote
heroku git:remote -a your-app-name

# Verify
git remote -v
# Should show both 'origin' (GitHub) and 'heroku'
```

### 7. Deploy Code

**First Deployment:**
```bash
git push heroku main
# Heroku will:
# 1. Build Docker image
# 2. Run migrations
# 3. Start web dyno
```

**Subsequent Deployments:**
```bash
# Make changes locally
git add .
git commit -m "Feature: your change"

# Push to GitHub
git push origin main

# Deploy to Heroku
git push heroku main
```

### 8. Monitor Deployment

**View Logs:**
```bash
# Real-time logs
heroku logs --tail

# Filter logs
heroku logs --tail --source app
heroku logs --tail --source web
heroku logs --tail --source heroku
```

**Check App Status:**
```bash
heroku app:info
heroku ps
heroku status
```

**Access App:**
```bash
# Open in browser
heroku open

# Get URL
heroku apps:info
# URL: https://your-app-name.herokuapp.com
```

### 9. Database Setup

**Run Migrations:**
```bash
heroku run npm run migrate
```

**Access Database:**
```bash
# Connect to Heroku PostgreSQL
heroku pg:psql

# List tables
\dt

# Exit
\q
```

### 10. Scaling

**Scale Dynos:**
```bash
# Check current dynos
heroku ps

# Scale up web dyno
heroku ps:scale web=2

# Scale down
heroku ps:scale web=1

# Scale worker
heroku ps:scale worker=1
```

**Dyno Types:**
- Eco: $5/month (shared, sleeps after 30min inactivity)
- Basic: $7/month (dedicated, always on)
- Standard: $25/month (high performance)
- Performance: $50/month (enterprise)

---

## Production Configuration

### 1. Domain Setup

```bash
# Add custom domain
heroku domains:add yourdomain.com
heroku domains:add api.yourdomain.com

# Configure DNS (get CNAME from Heroku)
heroku domains:info
```

### 2. SSL/TLS Certificate

```bash
# Automatic SSL
heroku certs:auto:enable

# Check certificate
heroku certs
```

### 3. Performance Optimization

```bash
# Enable Redis for sessions
heroku config:set REDIS_ENABLED=true

# Upgrade dyno for better performance
heroku ps:resize standard-1x

# Enable log drain for monitoring
heroku drains:add syslog+tls://logs.provider.com:12345
```

### 4. Backup Strategy

```bash
# Backup PostgreSQL
heroku pg:backups:capture

# Schedule automatic backups
heroku pg:backups:schedule DATABASE_URL --at "02:00 UTC"

# Restore from backup
heroku pg:backups:restore a301 DATABASE_URL
```

### 5. Monitoring & Alerts

```bash
# View dyno metrics
heroku metrics

# Setup alerts (Heroku dashboard)
# Settings → Alerts
```

---

## API Endpoints After Deployment

```
Base URL: https://your-app-name.herokuapp.com

Auth:
  POST   /auth/register
  POST   /auth/challenge
  POST   /auth/verify

Translation (150+ Languages):
  GET    /translation/languages       (List all languages)
  GET    /translation/languages/:code (Get language details)
  GET    /translation/languages/stats (Coverage statistics)
  POST   /translation/translate       (Translate text)

Hazard:
  GET    /hazard/risks
  POST   /hazard/alert-zone
  GET    /hazard/forecast

Alerts:
  POST   /alerts/broadcast
  WS     /alerts/subscribe/:userId
```

---

## Troubleshooting

### App Won't Start

```bash
# Check logs
heroku logs --tail

# Common issues:
# 1. Missing environment variable
heroku config

# 2. Database not initialized
heroku run npm run migrate

# 3. Port not configured
heroku config:set PORT=3000
```

### Database Connection Issues

```bash
# Test connection
heroku pg:psql
\q

# Reset database
heroku pg:reset

# Migrate again
heroku run npm run migrate
```

### Redis Connection Issues

```bash
# View Redis status
heroku redis:info

# Check connection string
heroku config | grep REDIS_URL

# Restart Redis addon
heroku addons:destroy heroku-redis
heroku addons:create heroku-redis:premium-0
```

### Build Failures

```bash
# Clear build cache
heroku builds:cache:purge

# Try deployment again
git push heroku main --force
```

---

## Maintenance

### Regular Tasks

**Weekly:**
- Monitor logs and errors
- Check dyno usage
- Review performance metrics

**Monthly:**
- Update dependencies: `npm update`
- Run security audit: `npm audit`
- Review database size
- Check backup status

**Quarterly:**
- Performance optimization review
- Cost analysis
- Scaling assessment
- Security audit

---

## Cost Estimation (Monthly)

**Development:**
- Eco Dyno: Free (with limitations)
- Hobby PostgreSQL: $9
- Free Redis: Included
- **Total: ~$9/month**

**Production:**
- Basic Dyno (2x): $14
- Standard PostgreSQL: $50
- Premium Redis: $30
- Domain: Variable ($10-20)
- **Total: ~$100+/month**

---

## Post-Deployment

### 1. Test Application

```bash
# Get URL
APP_URL=$(heroku apps:info -s | grep web_url | cut -d= -f2)

# Test health
curl $APP_URL/health

# Test translation endpoint
curl -X GET "$APP_URL/translation/languages" \
  -H "Authorization: Bearer YOUR_JWT"
```

### 2. Set up Monitoring

```bash
# Papertrail (log aggregation)
heroku addons:create papertrail

# Sentry (error tracking)
heroku config:set SENTRY_DSN=your_sentry_dsn
```

### 3. Configure CI/CD

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Heroku
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: akhileshns/heroku-deploy@v3.13.15
        with:
          heroku_api_key: ${{ secrets.HEROKU_API_KEY }}
          heroku_app_name: "your-app-name"
          heroku_email: "your-email@example.com"
```

### 4. Setup Health Checks

```bash
# Enable health checks (self-healing)
heroku config:set HEALTH_CHECK_ENABLED=true
```

---

## Next Steps

1. ✅ Deploy to Heroku (use this guide)
2. ✅ Configure custom domain
3. ✅ Enable automatic backups
4. ✅ Setup monitoring (Sentry, Papertrail)
5. ✅ Configure CI/CD pipeline
6. ✅ Monitor performance
7. ✅ Scale as needed

---

## Support

**Heroku Docs:** https://devcenter.heroku.com/
**ResilientEcho Repo:** https://github.com/loghithakshan/PROJECT
**Issues:** https://github.com/loghithakshan/PROJECT/issues

---

## Quick Commands Reference

```bash
# Create & deploy
heroku create && heroku addons:create heroku-postgresql:hobby-dev
git push heroku main

# View app
heroku open

# View logs
heroku logs --tail

# Run command
heroku run npm run migrate

# Set env var
heroku config:set VAR_NAME=value

# Get env var
heroku config:get VAR_NAME

# Scale dyno
heroku ps:scale web=2

# Restart app
heroku restart

# Destroy app
heroku apps:destroy --app=your-app-name
```

---

**Estimated Deploy Time:** 5-10 minutes
**Getting Help:** Check logs with `heroku logs --tail`
**Ready to Deploy?** → `git push heroku main` 🚀
