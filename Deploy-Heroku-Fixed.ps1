# ResilientEcho - Heroku Deployment Automation Script (PowerShell)
# This script automates the entire Heroku deployment process for Windows

Write-Host ""
Write-Host "=================================================="
Write-Host "ResilientEcho - Heroku Deployment Script"
Write-Host "==================================================`n" -ForegroundColor Cyan

# Check if Heroku CLI is installed
try {
    $herokuVersion = heroku --version
    Write-Host "[OK] Heroku CLI found: $herokuVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Heroku CLI not found. Install it first:" -ForegroundColor Red
    Write-Host "   https://devcenter.heroku.com/articles/heroku-cli" -ForegroundColor Yellow
    exit 1
}

# Check if user is logged in
try {
    $whoami = heroku auth:whoami 2>$null
    Write-Host "[OK] Logged in as: $whoami" -ForegroundColor Green
} catch {
    Write-Host "[INFO] Not logged in. Opening Heroku login..." -ForegroundColor Yellow
    heroku login
}

# Get app name
$APP_NAME = Read-Host "Enter Heroku app name (or press Enter for auto-generated)"

if ([string]::IsNullOrWhiteSpace($APP_NAME)) {
    Write-Host "[INFO] Creating Heroku app (Heroku will generate a name)..." -ForegroundColor Cyan
    heroku create
    $APP_INFO = heroku apps:info -s
    $APP_NAME = ($APP_INFO | Select-String "^name=").ToString().Split("=")[1]
} else {
    Write-Host "[INFO] Creating Heroku app: $APP_NAME" -ForegroundColor Cyan
    heroku create $APP_NAME -ErrorAction SilentlyContinue
}

Write-Host "[OK] App: $APP_NAME`n" -ForegroundColor Green

# Add PostgreSQL
Write-Host "[INFO] Adding PostgreSQL database..." -ForegroundColor Cyan
heroku addons:create heroku-postgresql:hobby-dev --app=$APP_NAME -ErrorAction SilentlyContinue
Write-Host "[OK] PostgreSQL configured`n" -ForegroundColor Green

# Add Redis
Write-Host "[INFO] Adding Redis cache..." -ForegroundColor Cyan
heroku addons:create heroku-redis:premium-0 --app=$APP_NAME -ErrorAction SilentlyContinue
Write-Host "[OK] Redis configured`n" -ForegroundColor Green

# Generate secure keys
Write-Host "[INFO] Generating secure keys..." -ForegroundColor Cyan
$JWT_SECRET = [System.BitConverter]::ToString([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32)).Replace("-", "").ToLower()
$ENCRYPTION_KEY = [System.BitConverter]::ToString([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(16)).Replace("-", "").ToLower()
$MASTER_KEY = [System.BitConverter]::ToString([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32)).Replace("-", "").ToLower()

# Set environment variables
Write-Host "[INFO] Setting environment variables..." -ForegroundColor Cyan
heroku config:set `
  NODE_ENV=production `
  JWT_SECRET=$JWT_SECRET `
  ENCRYPTION_KEY=$ENCRYPTION_KEY `
  MASTER_KEY=$MASTER_KEY `
  --app=$APP_NAME

Write-Host "[OK] Environment variables configured`n" -ForegroundColor Green

# Configure API keys (optional)
$response = Read-Host "Do you have external API keys to configure? (y/n)"
if ($response -eq 'y' -or $response -eq 'Y') {
    $DEEPL_KEY = Read-Host "Enter DeepL API key (or press Enter to skip)"
    if (![string]::IsNullOrWhiteSpace($DEEPL_KEY)) {
        heroku config:set DEEPL_API_KEY=$DEEPL_KEY --app=$APP_NAME
    }
    
    $NOAA_KEY = Read-Host "Enter NOAA API key (or press Enter to skip)"
    if (![string]::IsNullOrWhiteSpace($NOAA_KEY)) {
        heroku config:set NOAA_API_KEY=$NOAA_KEY --app=$APP_NAME
    }
}
Write-Host ""

# Add Heroku git remote
Write-Host "[INFO] Configuring git remote..." -ForegroundColor Cyan
heroku git:remote -a $APP_NAME
Write-Host "[OK] Git remote configured`n" -ForegroundColor Green

# Deploy
Write-Host "[INFO] Deploying application to Heroku..." -ForegroundColor Cyan
Write-Host "This may take 2-5 minutes...`n" -ForegroundColor Yellow
git push heroku main

Write-Host ""
Write-Host "=================================================="
Write-Host "DEPLOYMENT SUCCESS"
Write-Host "==================================================`n" -ForegroundColor Green
Write-Host "Your app is live at:" -ForegroundColor Green
Write-Host "https://$APP_NAME.herokuapp.com`n" -ForegroundColor Cyan
Write-Host "Next steps:" -ForegroundColor Green
Write-Host "1. heroku open                    (Open in browser)" -ForegroundColor White
Write-Host "2. heroku logs --tail             (Watch logs)" -ForegroundColor White
Write-Host "3. heroku run npm run migrate     (Run migrations)" -ForegroundColor White
Write-Host ""
Write-Host "Your ResilientEcho app is now live!" -ForegroundColor Magenta
Write-Host ""
