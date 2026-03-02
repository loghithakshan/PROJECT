# ResilientEcho Backend - Quick Start (Windows PowerShell)
# Run: .\start.ps1 in PowerShell

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   ResilientEcho Backend - Quick Start v2.0 (Windows)     ║" -ForegroundColor Cyan
Write-Host "║   Post-Quantum Secure | Multilingual | Real-Time Alerts   ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Step 1: Install Dependencies
Write-Host "Step 1: Install Dependencies" -ForegroundColor Blue
npm install
Write-Host "✓ Dependencies installed" -ForegroundColor Green
Write-Host ""

# Step 2: Start Database
Write-Host "Step 2: Start Database (Docker)" -ForegroundColor Blue
docker-compose up -d
Write-Host "✓ PostgreSQL + Redis + pgAdmin started" -ForegroundColor Green
Write-Host "  - PostgreSQL: localhost:5432" -ForegroundColor Gray
Write-Host "  - Redis: localhost:6379" -ForegroundColor Gray
Write-Host "  - pgAdmin: http://localhost:5050" -ForegroundColor Gray
Write-Host ""

# Step 3: Generate Prisma Client
Write-Host "Step 3: Generate Prisma Client" -ForegroundColor Blue
npx prisma generate
Write-Host "✓ Prisma client generated" -ForegroundColor Green
Write-Host ""

# Step 4: Run Migrations
Write-Host "Step 4: Run Database Migrations" -ForegroundColor Blue
npx prisma migrate dev --name init
Write-Host "✓ Database schema created" -ForegroundColor Green
Write-Host ""

# Step 5: Start Backend
Write-Host "Step 5: Start Backend Server" -ForegroundColor Blue
Write-Host "Running: npm run start:dev" -ForegroundColor Yellow
Write-Host "Backend: http://localhost:3000" -ForegroundColor Yellow
Write-Host "Swagger: http://localhost:3000/docs" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host ""

npm run start:dev
