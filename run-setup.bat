@echo off
REM ResilientEcho Backend - Auto Setup Script (Windows CMD)
REM Run from: backend\ directory
REM Usage: run-setup.bat

setlocal enabledelayedexpansion

color 0A
cls

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║                                                            ║
echo ║   ResilientEcho Backend - AUTOMATED SETUP (30 min)       ║
echo ║                                                            ║
echo ║   Post-Quantum Secure • Multilingual • Real-Time Alerts  ║
echo ║                                                            ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM Step 1: Check prerequisites
echo [1/5] Checking prerequisites...
node --version >nul 2>&1
if errorlevel 1 (
    color 0C
    echo ERROR: Node.js not installed. Install from https://nodejs.org
    pause
    exit /b 1
)
docker --version >nul 2>&1
if errorlevel 1 (
    color 0C
    echo ERROR: Docker not installed. Install from https://www.docker.com
    pause
    exit /b 1
)
color 0A
echo ✓ Prerequisites verified
echo.

REM Step 2: Install dependencies
echo [2/5] Installing dependencies (this may take 2-3 min)...
call npm install
if errorlevel 1 (
    color 0C
    echo ERROR: npm install failed
    pause
    exit /b 1
)
color 0A
echo ✓ Dependencies installed
echo.

REM Step 3: Start Docker
echo [3/5] Starting Docker containers...
call docker-compose up -d
if errorlevel 1 (
    color 0C
    echo ERROR: docker-compose up failed
    pause
    exit /b 1
)
color 0A
echo ✓ Docker containers started (PostgreSQL, Redis, pgAdmin)
echo.
timeout /t 5 /nobreak
echo.

REM Step 4: Initialize database
echo [4/5] Initializing database...
call npx prisma generate
call npx prisma migrate dev --name init < NUL
if errorlevel 1 (
    color 0C
    echo ERROR: Prisma migration failed
    pause
    exit /b 1
)
color 0A
echo ✓ Database schema created
echo.

REM Step 5: Start backend
echo [5/5] Starting ResilientEcho Backend...
color 0B
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║                 BACKEND LAUNCHING                         ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo   🚀 Backend: http://localhost:3000
echo   📚 Swagger: http://localhost:3000/docs
echo   🏥 Health:  http://localhost:3000/health
echo   📦 pgAdmin: http://localhost:5050
echo.
echo   CtRL+C to stop server
echo.
call npm run start:dev

endlocal
