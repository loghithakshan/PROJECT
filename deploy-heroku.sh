#!/bin/bash
# ResilientEcho - Heroku Deployment Automation Script
# This script automates the entire Heroku deployment process

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║   ResilientEcho - Heroku Deployment Automation Script     ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check if Heroku CLI is installed
if ! command -v heroku &> /dev/null; then
    echo "❌ Heroku CLI not found. Install it first:"
    echo "   https://devcenter.heroku.com/articles/heroku-cli"
    exit 1
fi

# Check if user is logged in
if ! heroku auth:whoami &> /dev/null; then
    echo "🔐 Logging in to Heroku..."
    heroku login
fi

# Get app name
read -p "Enter Heroku app name (or press Enter for auto-generated): " APP_NAME

if [ -z "$APP_NAME" ]; then
    echo "📦 Creating Heroku app (Heroku will generate a name)..."
    heroku create
    APP_NAME=$(heroku apps:info -s | grep name | cut -d= -f2)
else
    echo "📦 Creating Heroku app: $APP_NAME"
    heroku create "$APP_NAME" || echo "⚠️  App may already exist, continuing..."
fi

echo "✅ App: $APP_NAME"
echo ""

# Add PostgreSQL
echo "🗄️  Adding PostgreSQL database..."
heroku addons:create heroku-postgresql:hobby-dev --app="$APP_NAME" || echo "⚠️  PostgreSQL addon may already exist"
echo "✅ PostgreSQL added"
echo ""

# Add Redis
echo "🔴 Adding Redis cache..."
heroku addons:create heroku-redis:premium-0 --app="$APP_NAME" || echo "⚠️  Redis addon may already exist"
echo "✅ Redis added"
echo ""

# Set environment variables
echo "⚙️  Setting environment variables..."

# Generate secure keys
JWT_SECRET=$(openssl rand -hex 32)
ENCRYPTION_KEY=$(openssl rand -hex 16)
MASTER_KEY=$(openssl rand -hex 32)

heroku config:set \
  NODE_ENV=production \
  JWT_SECRET="$JWT_SECRET" \
  ENCRYPTION_KEY="$ENCRYPTION_KEY" \
  MASTER_KEY="$MASTER_KEY" \
  --app="$APP_NAME"

echo "✅ Environment variables set"
echo ""

# Configure API keys (optional)
read -p "Do you have external API keys to configure? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Enter DeepL API key (or press Enter to skip): " DEEPL_KEY
    [ ! -z "$DEEPL_KEY" ] && heroku config:set DEEPL_API_KEY="$DEEPL_KEY" --app="$APP_NAME"
    
    read -p "Enter NOAA API key (or press Enter to skip): " NOAA_KEY
    [ ! -z "$NOAA_KEY" ] && heroku config:set NOAA_API_KEY="$NOAA_KEY" --app="$APP_NAME"
fi
echo ""

# Add Heroku git remote
echo "🔗 Configuring git remote..."
heroku git:remote -a "$APP_NAME"
echo "✅ Git remote configured"
echo ""

# Deploy
echo "🚀 Deploying application..."
git push heroku main

echo ""
echo "✅ Deployment complete!"
echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                    DEPLOYMENT SUCCESS                     ║"
echo "╠════════════════════════════════════════════════════════════╣"
echo "║                                                            ║"
echo "║  App URL: https://${APP_NAME}.herokuapp.com               ║"
echo "║  Open: heroku open                                        ║"
echo "║  Logs: heroku logs --tail                                 ║"
echo "║                                                            ║"
echo "║  Next Steps:                                              ║"
echo "║  1. Run migrations: heroku run npm run migrate            ║"
echo "║  2. Test API: curl https://${APP_NAME}.herokuapp.com/health │"
echo "║  3. Monitor: heroku logs --tail                           ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "🎉 Your ResilientEcho app is now live!"
