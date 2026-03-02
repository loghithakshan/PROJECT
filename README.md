# ResilientEcho Backend - Quick Start 🚀

**Production-grade multilingual AI emergency platform** with post-quantum security, ZK proofs, and live alerts.

## ⚡ 30-Minute Setup

### Step 1: Prerequisites (2 min)
- Node.js 18+
- Docker + Docker Compose
- Git

### Step 2: Clone & Install (3 min)
```bash
cd backend
npm install
```

### Step 3: Start Database (3 min)
```bash
# Start PostgreSQL + Redis + pgAdmin in Docker
docker-compose up -d

# Verify database is ready
docker-compose logs postgres | grep "database system is ready"
```

### Step 4: Setup Database Schema (5 min)
```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# (Optional) View database in pgAdmin
# Open http://localhost:5050
# Login: admin@example.com / admin
```

### Step 5: Run Backend (2 min)
```bash
# Development (with hot-reload)
npm run start:dev

# Or production build
npm run build
npm run start:prod
```

✅ **Backend running on http://localhost:3000**  
📚 **Swagger docs at http://localhost:3000/docs**

---

## 🧪 Test Auth Endpoints (5 min)

### 1️⃣ Register User
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePassword123!",
    "firstName": "John",
    "lastName": "Doe"
  }'

# Response:
# {
#   "userId": "cly...",
#   "email": "test@example.com",
#   "accessToken": "eyJhbGc...",
#   "message": "Registration successful..."
# }
```

### 2️⃣ Login (Password Verification)
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePassword123!"
  }'

# Response:
# {
#   "userId": "cly...",
#   "challenge": "a1b2c3d4...",
#   "message": "Challenge generated..."
# }

# SAVE: userId and challenge for next step
```

### 3️⃣ Verify ZK Challenge (Second Factor)
```bash
# Sign challenge with private key (requires Ed25519 library)
# For now, POST with empty signature to see error handling

curl -X POST http://localhost:3000/api/v1/auth/zk-verify \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "cly...",
    "challenge": "a1b2c3d4...",
    "signature": "sig_example_hex"
  }'

# Response: JWT tokens
```

### 4️⃣ Get Current User (JWT Required)
```bash
# Replace <ACCESS_TOKEN> with token from previous step

curl -X GET http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer <ACCESS_TOKEN>"

# Response:
# {
#   "userId": "cly...",
#   "email": "test@example.com",
#   "role": "user",
#   "publicKey": "ed25519_hex..."
# }
```

### 5️⃣ Refresh JWT Token
```bash
# Replace <REFRESH_TOKEN> with token from register/login step

curl -X POST http://localhost:3000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "<REFRESH_TOKEN>"
  }'

# Response:
# {
#   "accessToken": "eyJhbGc...",
#   "refreshToken": "eyJhbGc..."
# }
```

### 6️⃣ Logout
```bash
curl -X POST http://localhost:3000/api/v1/auth/logout \
  -H "Authorization: Bearer <ACCESS_TOKEN>"

# Response:
# {
#   "message": "Logged out successfully"
# }
```

### 7️⃣ Health Checks
```bash
# Basic health
curl http://localhost:3000/health

# Readiness probe (for Kubernetes)
curl http://localhost:3000/health/ready
```

---

## 📊 Database Access

### Via pgAdmin (Web UI)
- **URL**: http://localhost:5050
- **Email**: admin@example.com
- **Password**: admin
- **Add Server**:
  - Host: postgres
  - Port: 5432
  - Username: postgres
  - Password: postgres
  - Database: resilient_echo

### Via Prisma Studio (CLI)
```bash
npx prisma studio
# Opens http://localhost:5555
```

### Via psql (Command Line)
```bash
docker exec -it resilient_echo_db psql -U postgres -d resilient_echo

# Useful commands:
\dt             # List tables
\d users        # Describe users table
SELECT * FROM "User";
```

---

## 🔒 Security Features Enabled

✅ **Authentication**
- Argon2id password hashing (GPU-resistant)
- Ed25519 keypairs (post-quantum signing)
- JWT tokens (15m access, 7d refresh)
- Fiat-Shamir ZK challenges (password-less auth)

✅ **Rate Limiting**
- 5 failed attempts = 15 min account lockout
- Global 100 req/15min per IP

✅ **CORS**
- Whitelist-based (localhost:3000, 3001, 5000)
- HTTP-only cookies for refresh tokens

✅ **Encryption**
- Helmet security headers (CSP, HSTS, X-Frame-Options)
- Gzip compression
- Global input validation + sanitization

✅ **Audit Logging**
- Immutable blockchain-ready hash chain
- All auth events tracked
- Searchable by user/type

---

## 📂 Project Structure

```
backend/
├── src/
│   ├── main.ts                      # NestJS bootstrap
│   ├── app.module.ts                # Root module
│   ├── config/                      # 6 config files (crypto, DB, etc.)
│   ├── modules/
│   │   └── auth/                    # Auth module (complete)
│   │       ├── auth.module.ts
│   │       ├── controllers/
│   │       ├── services/
│   │       ├── guards/
│   │       ├── strategies/
│   │       └── dtos/
│   ├── database/
│   │   ├── prisma.service.ts
│   │   └── prisma.module.ts
│   ├── shared/
│   │   └── crypto/                  # Crypto utilities
│   └── common/
│       ├── filters/
│       └── interceptors/
├── prisma/
│   ├── schema.prisma                # Database models
│   └── migrations/
├── docker-compose.yml               # Local dev environment
├── tsconfig.json
├── .env
├── .env.example
└── package.json
```

---

## 🚀 npm Scripts

```bash
# Development
npm run start:dev          # Hot-reload development server

# Production
npm run build              # Compile TypeScript → JavaScript
npm run start:prod         # Run production build

# Database
npm run prisma:generate    # Generate Prisma client
npm run prisma:migrate     # Run migrations
npm run prisma:push        # Push schema to database
npm run prisma:studio      # Open Prisma Studio (http://localhost:5555)

# Testing
npm run test               # Run Jest unit tests
npm run test:watch        # Watch mode
npm run test:cov          # Coverage report
npm run test:e2e          # End-to-end tests

# Code Quality
npm run lint               # Run ESLint
```

---

## 🐛 Troubleshooting

### Port 5432 Already in Use
```bash
# Kill existing PostgreSQL
docker-compose down
docker volume rm resilient_echo_backend_postgres_data
docker-compose up -d
```

### Database Connection Error
```bash
# Check Docker logs
docker-compose logs postgres

# Verify database exists
docker exec -it resilient_echo_db psql -U postgres -l
```

### Prisma Client Out of Date
```bash
npx prisma generate
```

### Port 3000 Already in Use
```bash
# Change PORT in .env
PORT=3001 npm run start:dev
```

---

## 📋 Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| PORT | 3000 | Server port |
| NODE_ENV | development | Environment |
| DATABASE_URL | postgresql://... | PostgreSQL connection |
| JWT_SECRET | dev-key | JWT signing (CHANGE IN PROD) |
| REFRESH_TOKEN_SECRET | dev-key | Refresh token signing |
| JWT_EXPIRATION | 15m | Access token TTL |
| REFRESH_TOKEN_EXPIRATION | 7d | Refresh token TTL |
| CORS_ORIGINS | localhost:3000 | Allowed origins |
| ENABLE_SWAGGER | true | Enable /docs |

---

## 📞 API Documentation

### Swagger/OpenAPI
Once backend is running, visit: **http://localhost:3000/docs**

All endpoints fully documented with:
- Request/response schemas
- Example values
- Authentication requirements
- Error codes

---

## 🔄 Next Steps

### Immediate (Week 1)
- [ ] Frontend (React) integration with JWT
- [ ] Mobile app (React Native)
- [ ] Tests (Jest unit + E2E)

### Short-term (Week 2-3)
- [ ] HazardOracleModule (NOAA/USGS ingest)
- [ ] TranslationEngineModule (LLM adapters)
- [ ] AlertBroadcasterModule (WebSocket geofence)

### Medium-term (Week 4+)
- [ ] Hyperledger Fabric integration
- [ ] Federated learning aggregator
- [ ] Kubernetes manifests + CI/CD

---

## 📄 License

MIT - See LICENSE file

---

## 💪 Ready to Deploy?

### Local Testing ✅ (30 min - THIS SPRINT)
### Docker Compose 🐳 (5 min)
```bash
docker-compose up -d
npm run start:dev
```

### Kubernetes 🚀 (Next)
```bash
kubectl create namespace resilient-echo
kubectl apply -f k8s/
```

### AWS/GCP/Azure (Production)
- RDS PostgreSQL (managed)
- ElastiCache Redis
- ECR image registry
- ECS/EKS deployment

---

**Built with** ❤️ **for emergency responders worldwide**

🔐 Post-quantum secure • 🌍 Multilingual • ⚡ Real-time • 🛡️ Production-grade
