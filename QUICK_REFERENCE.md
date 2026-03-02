# ResilientEcho Backend - Quick Reference Card

**Print this card or save it on your phone for quick lookups during development.**

---

## 🚀 QUICK START (5 Minutes)

```bash
# Option 1: Linux/Mac
bash backend/start.sh

# Option 2: Windows PowerShell
.\backend\start.ps1

# Option 3: Windows CMD
backend\run-setup.bat

# Option 4: Manual
cd backend
npm install
docker-compose up -d
npx prisma migrate dev
npm run start:dev

# Expected: Backend running at http://localhost:3000
```

---

## 🔌 API ENDPOINTS

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| **POST** | `/api/v1/auth/register` | ❌ | Create account |
| **POST** | `/api/v1/auth/login` | ❌ | Get ZK challenge |
| **POST** | `/api/v1/auth/zk-verify` | ❌ | Verify challenge → JWT |
| **POST** | `/api/v1/auth/refresh` | ❌ | Refresh access token |
| **GET** | `/api/v1/auth/me` | ✅ | Get current user |
| **POST** | `/api/v1/auth/logout` | ✅ | Logout & revoke |
| **GET** | `/health` | ❌ | Service health |

**Test with cURL:**
```bash
# Register
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@example.com",
    "password":"SecurePassword123!",
    "firstName":"John",
    "lastName":"Doe"
  }'

# Get current user
curl -X GET http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

---

## 🔐 AUTHENTICATION FLOW

```
1. Register or Login
   POST /api/v1/auth/register or /api/v1/auth/login
   ↓
2. Receive Challenge
   { userId, challenge }
   ↓
3. Sign Challenge (Ed25519)
   signature = sign(challenge, privateKey)
   ↓
4. Verify Challenge
   POST /api/v1/auth/zk-verify
   { userId, challenge, signature }
   ↓
5. Receive JWT Tokens
   { accessToken (15 min), refreshToken (7 days) }
   ↓
6. Use Access Token
   Authorization: Bearer <accessToken>
```

---

## 💾 DATABASE ACCESS

**PostgreSQL CLI:**
```bash
psql -U postgres -d resilient_echo_dev -h localhost
```

**pgAdmin (Browser GUI):**
- URL: http://localhost:5050
- User: admin@pgadmin.org
- Password: admin

**Prisma Studio (Visual Editor):**
```bash
npx prisma studio
# Opens: http://localhost:5555
```

**Database URL:**
```
postgresql://postgres:postgres@localhost:5432/resilient_echo_dev
```

---

## 📦 PROJECT STRUCTURE

```
backend/
├── src/config/              ← Configuration (app, db, crypto, etc)
├── src/modules/auth/        ← Authentication logic
├── src/shared/              ← Shared crypto utilities
├── src/database/            ← Database service
├── prisma/                  ← Database schema & migrations
├── test/                    ← End-to-end tests
├── Dockerfile               ← Production image
├── docker-compose.yml       ← Dev environment
├── .env                     ← Local environment (DO NOT COMMIT)
└── Documentation/           ← Guides (README, SECURITY, etc)
```

---

## 🧪 TESTING

```bash
# Run all tests
npm run test

# Run unit tests only
npm run test auth.service

# Run E2E tests
npm run test:e2e

# Run with coverage
npm run test -- --coverage

# Watch mode (re-run on change)
npm run test -- --watch

# View coverage
open coverage/index.html
```

---

## 🛠️ DEVELOPMENT COMMANDS

```bash
# Start development server
npm run start:dev

# Build for production
npm run build

# Run production build
npm run start:prod

# Format code
npm run format

# Lint code
npm run lint

# Database migrations
npx prisma migrate dev      # Create migration
npx prisma migrate deploy   # Apply migration
npx prisma migrate reset    # Reset to fresh DB (DANGEROUS)

# View database schema
npx prisma db push         # Apply schema changes
npx prisma studio         # Visual editor
npx prisma generate       # Generate Prisma client
```

---

## 🔑 ENVIRONMENT VARIABLES

```bash
# Server
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/db

# Authentication
JWT_SECRET=dev-secret
JWT_EXPIRATION=15m
REFRESH_TOKEN_SECRET=dev-refresh
REFRESH_TOKEN_EXPIRATION=7d

# Security
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
LOG_LEVEL=debug

# Redis (optional caching)
REDIS_HOST=localhost
REDIS_PORT=6379

# TLS/SSL (optional)
TLS_CERT_PATH=./certs/cert.pem
TLS_KEY_PATH=./certs/key.pem
```

---

## 🔒 SECURITY ESSENTIALS

**Password Requirements:**
- Minimum 12 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character (!@#$%^&*)

**Rate Limiting:**
- 5 failed login attempts → 15 minute account lockout
- Per user (tracked by email)

**Token Expiration:**
- Access token: 15 minutes
- Refresh token: 7 days
- Check tokens before using

**Headers (Auto-added):**
- `X-Content-Type-Options: nosniff` (prevent MIME sniffing)
- `X-Frame-Options: DENY` (prevent clickjacking)
- `Strict-Transport-Security: max-age=31536000` (force HTTPS)
- `Content-Security-Policy` (prevent XSS)

---

## 🚨 ERROR CODES

```
200 - OK
201 - Created
204 - No Content
400 - Bad Request (validation error)
401 - Unauthorized (invalid credentials)
403 - Forbidden (insufficient permissions)
404 - Not Found
409 - Conflict (duplicate email)
429 - Too Many Requests (rate limited)
500 - Internal Server Error
```

---

## 📊 CRYPTO CONFIGURATION

| Algorithm | Use Case | Config |
|-----------|----------|--------|
| **Argon2id** | Password hashing | 3 iter, 64MB, 4x parallel |
| **Ed25519** | Digital signatures | 256-bit keys |
| **XChaCha20-Poly1305** | Encryption at rest | 24-byte nonce |
| **SHA256** | Data integrity | Standard hashing |
| **HMAC-SHA256** | Message authentication | Keyed hash |

---

## 🔍 DEBUGGING TIPS

**Check logs:**
```bash
docker-compose logs -f backend     # View backend logs
docker-compose logs -f postgres    # View database logs
docker-compose logs -f redis       # View cache logs
```

**Inspect running services:**
```bash
docker-compose ps                  # List running containers
docker-compose exec backend sh     # Shell into backend
docker-compose exec postgres psql  # PostgreSQL shell
```

**Check database:**
```bash
# Connect to database
psql postgresql://postgres:postgres@localhost/resilient_echo_dev

# Basic queries
\dt                    # List tables
SELECT COUNT(*) FROM "User";  # Count users
SELECT * FROM "User" LIMIT 5; # View users
```

**Network debugging:**
```bash
# Check if API responds
curl -v http://localhost:3000/health

# Check database connectivity
nc -zv localhost 5432

# Check Redis connectivity
redis-cli ping
```

---

## 📚 KEY DOCUMENTATION

| Document | Purpose | Read Time |
|----------|---------|-----------|
| [README.md](README.md) | Complete setup guide | 15 min |
| [QUICK_START.md](QUICK_START.md) | Lightning launch | 5 min |
| [TESTING.md](TESTING.md) | Testing strategy | 20 min |
| [INTEGRATION.md](INTEGRATION.md) | Frontend/mobile API | 30 min |
| [SECURITY.md](SECURITY.md) | Threat model & hardening | 40 min |
| [PERFORMANCE.md](PERFORMANCE.md) | Optimization guide | 30 min |
| [MODULE_DEVELOPMENT.md](MODULE_DEVELOPMENT.md) | Build new modules | 25 min |

---

## 🚀 BUILD FOR PRODUCTION

```bash
# 1. Build Docker image
docker build -t resilient-echo:latest .

# 2. Run container
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e DATABASE_URL=postgresql://... \
  -e JWT_SECRET=<production-secret> \
  resilient-echo:latest

# 3. With docker-compose
docker-compose -f docker-compose.prod.yml up -d
```

---

## ✅ PRE-DEPLOYMENT CHECKLIST

- [ ] Tests passing: `npm run test`
- [ ] E2E tests passing: `npm run test:e2e`
- [ ] Linting passing: `npm run lint`
- [ ] No security issues: `npm audit`
- [ ] Database migrations applied
- [ ] Environment variables set
- [ ] TLS certificates installed
- [ ] Health checks passing
- [ ] API docs accessible
- [ ] Backups configured
- [ ] Monitoring enabled
- [ ] Alerts configured

---

## 🆘 COMMON ISSUES & FIXES

**"Port 3000 already in use"**
```bash
# Kill process using port 3000
lsof -ti:3000 | xargs kill -9
# Or change in .env: PORT=3001
```

**"Database connection failed"**
```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Restart it
docker-compose down
docker-compose up -d postgres
```

**"npm ERR! ERR! code EACCES"**
```bash
# Fix node_modules permissions
rm -rf node_modules package-lock.json
npm install
```

**"Module not found" errors**
```bash
# Rebuild TypeScript
npm run build

# Clear cache
npm run test -- --clearCache
```

**Tests timeout**
```bash
# Increase timeout in jest.config.js
testTimeout: 60000,

# Or increase for specific test
jest.setTimeout(10000);
```

---

## 📞 SUPPORT

**Documentation**: See `/backend` directory
**Issues**: Create GitHub issue with error logs
**Security**: Email security@resilient-echo.com
**Help**: Check TESTING.md → Troubleshooting section

---

## 📖 USEFUL LINKS

- [NestJS Docs](https://docs.nestjs.com)
- [Prisma Docs](https://www.prisma.io/docs)
- [Jest Docs](https://jestjs.io)
- [PostgreSQL Docs](https://www.postgresql.org/docs)
- [JWT.io](https://jwt.io)
- [Argon2 Paper](https://github.com/P-H-C/phc-winner-argon2)
- [Ed25519 Spec](https://ed25519.cr.yp.to)

---

**Last Updated**: 2024
**Status**: ✅ Production Ready
**Version**: 1.0-final

---

*Print this page or save to phone for quick reference during development!*
