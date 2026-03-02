#!/bin/bash
# Quick Start Script for ResilientEcho Backend

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║   ResilientEcho Backend - Quick Start v2.0                 ║"
echo "║   Post-Quantum Secure | Multilingual | Real-Time Alerts   ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}Step 1: Install Dependencies${NC}"
npm install
echo -e "${GREEN}✓ Dependencies installed${NC}\n"

echo -e "${BLUE}Step 2: Start Database (Docker)${NC}"
docker-compose up -d
echo -e "${GREEN}✓ PostgreSQL + Redis + pgAdmin started${NC}"
echo "  - PostgreSQL: localhost:5432"
echo "  - Redis: localhost:6379"
echo "  - pgAdmin: http://localhost:5050\n"

echo -e "${BLUE}Step 3: Generate Prisma Client${NC}"
npx prisma generate
echo -e "${GREEN}✓ Prisma client generated${NC}\n"

echo -e "${BLUE}Step 4: Run Database Migrations${NC}"
npx prisma migrate dev --name init
echo -e "${GREEN}✓ Database schema created${NC}\n"

echo -e "${BLUE}Step 5: Start Backend Server${NC}"
echo "Running: npm run start:dev"
echo "Backend will be available at: http://localhost:3000"
echo "Swagger docs: http://localhost:3000/docs"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop the server${NC}\n"

npm run start:dev
