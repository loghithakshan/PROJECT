# ⚡ ResilientEcho - INSTANT DEPLOYMENT (2-5 Minutes)

## Option 1: Automated Deployment (RECOMMENDED)

### Windows PowerShell Users:
```powershell
# 1. Navigate to backend folder
cd "c:\Users\rakes\Downloads\in assisto\backend"

# 2. Run the deployment script
.\Deploy-Heroku.ps1

# The script will:
# ✅ Check Heroku CLI installation
# ✅ Authenticate with Heroku
# ✅ Create a new app
# ✅ Configure PostgreSQL database
# ✅ Configure Redis cache
# ✅ Generate & set secure API keys
# ✅ Deploy your code
# ✅ Show live URL
```

### Linux/macOS Users:
```bash
# 1. Navigate to backend folder
cd ~/Downloads/in\ assisto/backend

# 2. Make script executable
chmod +x deploy-heroku.sh

# 3. Run the deployment script
./deploy-heroku.sh

# The script will do all the same steps as PowerShell version
```

---

## Option 2: Manual Deployment (5-10 Minutes)

If you prefer to run commands individually:

### Step 1: Install Heroku CLI
```bash
# Download from: https://devcenter.heroku.com/articles/heroku-cli
```

### Step 2: Login to Heroku
```bash
heroku login
# Opens browser to authenticate
```

### Step 3: Create App
```bash
heroku create my-resilient-echo-app
# Or let Heroku generate a name:
heroku create
```

### Step 4: Add PostgreSQL Database
```bash
heroku addons:create heroku-postgresql:hobby-dev
```

### Step 5: Add Redis Cache
```bash
heroku addons:create heroku-redis:premium-0
```

### Step 6: Configure Environment Variables
```bash
# Generate secure keys (or use openssl rand -hex 32)
export JWT_SECRET="your-32-char-hex-string"
export ENCRYPTION_KEY="your-16-char-hex-string"
export MASTER_KEY="your-32-char-hex-string"

# Set all variables
heroku config:set \
  NODE_ENV=production \
  JWT_SECRET=$JWT_SECRET \
  ENCRYPTION_KEY=$ENCRYPTION_KEY \
  MASTER_KEY=$MASTER_KEY
```

### Step 7: Add Git Remote
```bash
heroku git:remote -a my-resilient-echo-app
```

### Step 8: Deploy
```bash
git push heroku main

# Wait 2-5 minutes for deployment to complete
```

### Step 9: Verify Deployment
```bash
heroku logs --tail
heroku open
```

---

## What Happens During Deployment

```
┌─────────────────────────────────────────────┐
│ 1. Code uploaded to Heroku (30 seconds)     │
├─────────────────────────────────────────────┤
│ 2. Dependencies installed via npm (1 min)   │
├─────────────────────────────────────────────┤
│ 3. Prisma schema applied to PostgreSQL      │
│    (45 seconds)                             │
├─────────────────────────────────────────────┤
│ 4. Redis cache initialized (15 seconds)     │
├─────────────────────────────────────────────┤
│ 5. Application starts on dyno (30 seconds)  │
├─────────────────────────────────────────────┤
│ ✅ Live at: https://my-app-name.herokuapp.com
└─────────────────────────────────────────────┘
```

---

## After Deployment

### Check That Everything Works
```bash
# View logs in real-time
heroku logs --tail

# Test API health
curl https://my-app-name.herokuapp.com/health

# Test translation endpoint
curl -X POST https://my-app-name.herokuapp.com/translation/translate \
  -H "Content-Type: application/json" \
  -d '{
    "text": "URGENT: Earthquake detected",
    "sourceLanguage": "en",
    "targetLanguage": "es"
  }'

# Expected response should include Spanish translation with urgency preserved
```

### Run Database Migrations
```bash
heroku run npm run migrate
```

### Restart Application
```bash
heroku restart
```

### View App Metrics
```bash
heroku metrics
```

---

## Troubleshooting

### Build Fails: "npm ERR! 404 Not Found"
**Solution:**
```bash
# Clear npm cache and redeploy
npm cache clean --force
git push heroku main
```

### Database Connection Error
**Solution:**
```bash
# Check database is provisioned
heroku pg:info

# Reset database if needed
heroku pg:reset DATABASE
```

### Application Won't Start
**Solution:**
```bash
# Check logs for error details
heroku logs --tail

# Make sure required env vars are set
heroku config
```

### Stuck Deployment
**Solution:**
```bash
# Cancel and restart
heroku releases:rollback
git push heroku main --force
```

---

## Scaling & Monitoring

### Upgrade to Standard-1X Dyno (Better Performance)
```bash
heroku ps:resize standard-1x
# Cost: $25/month (vs $7/month for eco)
```

### Monitor Performance
```bash
# Real-time logs
heroku logs --tail --dyno=web

# Metrics dashboard
heroku metrics

# Set up alerts
heroku alerts:add
```

### Database Backups
```bash
# Schedule automatic daily backups
heroku pg:backups:schedule --at "02:00 UTC"

# Create manual backup
heroku pg:backups:capture

# Download backup
heroku pg:backups:download b001
```

---

## Cost Summary

| Component | Dev Tier | Production Tier | Monthly Cost |
|-----------|----------|-----------------|--------------|
| Dyno (Web) | Eco | Standard-1X | $5-25 |
| PostgreSQL | Hobby Dev | Standard-0 | Free-$50 |
| Redis | Premium-0 | Premium-2+ | $15-50+ |
| **TOTAL** | | | **$20-125+** |

> **Tip:** Start with Hobby Dev ($0) + Premium-0 Redis ($15) = ~$15/month, then scale up as needed

---

## Next Steps After Deployment

✅ **Phase 1:** Deploy (you are here)
⬜ **Phase 2:** Setup monitoring (Sentry, Papertrail)
⬜ **Phase 3:** Configure custom domain
⬜ **Phase 4:** Implement CI/CD with GitHub Actions
⬜ **Phase 5:** Add mobile app (React Native)
⬜ **Phase 6:** Scale to multiple regions

---

## Quick Command Reference

```bash
# Important Commands
heroku open                    # Open app in browser
heroku logs --tail            # Stream application logs
heroku config                 # View all environment variables
heroku ps                      # View running processes
heroku pg:info                # Database status
heroku restart                # Restart application
heroku releases               # Deployment history

# Debugging
heroku logs --tail --dyno=web
heroku ps:exec -- bash
heroku pg:psql
heroku redis-cli

# Settings
heroku config:set KEY=value   # Set environment variable
heroku config:unset KEY       # Remove variable
heroku apps:info              # App details

# Deployment
git push heroku main          # Deploy
heroku releases:rollback      # Revert to previous version
```

---

## Support & Documentation

- **Heroku Docs:** https://devcenter.heroku.com/
- **ResilientEcho GitHub:** https://github.com/loghithakshan/PROJECT
- **NestJS Docs:** https://docs.nestjs.com/
- **Prisma Docs:** https://www.prisma.io/docs/

---

**🎉 You're ready to go live!** Run the deployment script or follow the manual steps, and your ResilientEcho platform will be live in minutes.

**Support 150+ languages, detect hazards, and coordinate emergency response — all from the cloud.** 🌍🚀
