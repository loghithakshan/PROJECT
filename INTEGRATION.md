# Integration Guide - ResilientEcho Backend

Guide for frontend, mobile, and future module integration with the ResilientEcho backend.

## API Overview

**Base URL**: `http://localhost:3000/api/v1` (dev) | `https://api.resilient-echo.com/api/v1` (prod)

**Authentication**: JWT Bearer tokens in Authorization header
```
Authorization: Bearer <access_token>
```

**Response Format**: All responses are JSON
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": { /* response data */ },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Authentication Endpoints

### 1. Register User
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!@#",
  "firstName": "John",
  "lastName": "Doe",
  "country": "US",
  "phone": "+1-555-0123"
}
```

**Response (201 Created):**
```json
{
  "statusCode": 201,
  "message": "User registered successfully",
  "data": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "role": "USER",
    "publicKey": "ed25519_public_key_hex"
  }
}
```

**Validation Rules:**
- Email: Valid format, unique, < 255 chars
- Password: Min 12 chars, uppercase, lowercase, number, symbol
- FirstName/LastName: Required, < 100 chars
- Country: ISO 3166-1 code (e.g., "US", "GB")
- Phone: Optional, E.164 format preferred

---

### 2. Login User
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!@#"
}
```

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Login challenge generated",
  "data": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "challenge": "a1b2c3d4e5f6...",
    "challengeTTL": 300
  }
}
```

**Flow:**
1. Frontend receives challenge
2. Frontend signs challenge with user's Ed25519 private key
3. Frontend sends signature to `/zk-verify` endpoint

**Error Responses:**
- `401 Unauthorized`: Invalid credentials
- `429 Too Many Requests`: Account locked (after 5 failed attempts)

---

### 3. Zero-Knowledge Verification
```http
POST /api/v1/auth/zk-verify
Content-Type: application/json

{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "challenge": "a1b2c3d4e5f6...",
  "signature": "signature_hex_from_ed25519_signing"
}
```

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "ZK challenge verified successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "expiresIn": 900
  }
}
```

---

### 4. Get Current User
```http
GET /api/v1/auth/me
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Current user retrieved",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "USER",
    "status": "ACTIVE",
    "publicKey": "ed25519_public_key_hex",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

---

### 5. Refresh Token
```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 900
  }
}
```

---

### 6. Logout
```http
POST /api/v1/auth/logout
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Logged out successfully",
  "data": {}
}
```

---

## Frontend Implementation

### JavaScript/TypeScript Client

```typescript
// auth.service.ts
export class AuthService {
  private readonly API_URL = 'http://localhost:3000/api/v1';
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await fetch(`${this.API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Registration failed: ${response.statusText}`);
    }

    const result = await response.json();
    this.accessToken = result.data.accessToken;
    this.refreshToken = result.data.refreshToken;
    return result.data;
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await fetch(`${this.API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    return (await response.json()).data;
  }

  async verifyZKChallenge(
    userId: string,
    challenge: string,
    signature: string,
  ): Promise<TokenResponse> {
    const response = await fetch(`${this.API_URL}/auth/zk-verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, challenge, signature }),
    });

    if (!response.ok) {
      throw new Error('ZK verification failed');
    }

    const result = await response.json();
    this.accessToken = result.data.accessToken;
    this.refreshToken = result.data.refreshToken;
    return result.data;
  }

  async getCurrentUser(): Promise<User> {
    const response = await fetch(`${this.API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${this.accessToken}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user');
    }

    return (await response.json()).data;
  }

  async logout(): Promise<void> {
    await fetch(`${this.API_URL}/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.accessToken}` },
    });

    this.accessToken = null;
    this.refreshToken = null;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  setTokens(access: string, refresh: string): void {
    this.accessToken = access;
    this.refreshToken = refresh;
  }
}
```

### React Component Example

```typescript
// LoginPage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthService } from '@services/auth.service';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const authService = new AuthService();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Step 1: Login and get challenge
      const loginResponse = await authService.login(email, password);

      // Step 2: Sign challenge with Ed25519 private key
      // Note: Private key should be retrieved from secure storage
      const privateKey = localStorage.getItem('privateKey'); // ⚠️ For demo only
      const signature = await signChallenge(loginResponse.challenge, privateKey);

      // Step 3: Verify ZK challenge
      await authService.verifyZKChallenge(
        loginResponse.userId,
        loginResponse.challenge,
        signature,
      );

      // Step 4: Redirect to dashboard
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h1>Login</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      {error && <p className="error">{error}</p>}
    </div>
  );
};
```

---

## Mobile (React Native) Integration

```typescript
// src/services/api.ts
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_URL = 'https://api.resilient-echo.com/api/v1';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// Automatically add auth token to requests
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = await SecureStore.getItemAsync('refreshToken');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken,
          });
          const { accessToken } = response.data.data;
          await SecureStore.setItemAsync('accessToken', accessToken);
          error.config.headers.Authorization = `Bearer ${accessToken}`;
          return axios(error.config);
        } catch (refreshError) {
          // Refresh failed, redirect to login
          return Promise.reject(refreshError);
        }
      }
    }
    return Promise.reject(error);
  },
);

export default api;
```

---

## Future Module Integration

### Pattern for New Modules

Each module should follow this structure:

```typescript
// src/modules/[module]/[module].module.ts
import { Module } from '@nestjs/common';
import { [Module]Service } from './[module].service';
import { [Module]Controller } from './[module].controller';

@Module({
  imports: [PrismaModule, CryptoModule],
  providers: [[Module]Service],
  controllers: [[Module]Controller],
  exports: [[Module]Service],
})
export class [Module]Module {}
```

### API Endpoint Pattern

```typescript
// src/modules/[module]/[module].controller.ts
import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { JwtGuard } from '@common/guards/jwt.guard';
import { [Module]Service } from './[module].service';

@Controller('api/v1/[module]')
export class [Module]Controller {
  constructor(private readonly service: [Module]Service) {}

  @Post()
  @UseGuards(JwtGuard)
  async create(@Body() data: CreateDto) {
    return this.service.create(data);
  }

  @Get()
  @UseGuards(JwtGuard)
  async list() {
    return this.service.list();
  }
}
```

### Example: HazardOracle Module

```typescript
// src/modules/hazard-oracle/hazard-oracle.controller.ts
@Controller('api/v1/hazards')
export class HazardOracleController {
  constructor(private readonly hazardService: HazardOracleService) {}

  @Get('/active')
  @UseGuards(JwtGuard)
  async getActiveHazards(@Query('location') location: string) {
    return this.hazardService.getHazardsNear(location);
  }

  @Post('/report')
  @UseGuards(JwtGuard)
  async reportHazard(@Body() report: HazardReportDto) {
    return this.hazardService.createHazardReport(report);
  }

  @Get('/stats')
  @UseGuards(JwtGuard)
  async getStatistics() {
    return this.hazardService.getStatistics();
  }
}
```

---

## Error Handling

### Standard Error Response
```json
{
  "statusCode": 400,
  "message": "Validation error",
  "error": "Bad Request",
  "details": {
    "email": ["Email must be a valid email address"],
    "password": ["Password must contain at least one uppercase letter"]
  }
}
```

### HTTP Status Codes
- `200 OK`: Request succeeded
- `201 Created`: Resource created
- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Missing/invalid credentials
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource already exists (duplicate email)
- `429 Too Many Requests`: Rate limit exceeded (account lockout)
- `500 Internal Server Error`: Server error

---

## Rate Limiting & Account Lockout

**Login Rate Limiting:**
- Max: 5 failed attempts per user
- Lockout: 15 minutes
- Tracked: Per email address
- Storage: Redis (fallback to memory)

**Frontend should:**
1. Disable login button after 5 failed attempts
2. Show countdown timer until lockout expires
3. Display message: "Account locked. Try again in 15 minutes."

---

## WebSocket Integration (Future)

For real-time alerts, future AlertBroadcaster module will expose WebSocket:

```typescript
// Connect to WebSocket
const ws = new WebSocket('wss://api.resilient-echo.com/ws');

ws.onopen = () => {
  // Send auth token
  ws.send(JSON.stringify({
    type: 'AUTH',
    token: accessToken,
  }));
};

ws.onmessage = (event) => {
  const alert = JSON.parse(event.data);
  // Handle alert: { type, severity, location, message }
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};
```

---

## Security Best Practices

### Frontend
✅ Store tokens in memory (not localStorage for XSS protection)
✅ Use httpOnly cookies for refresh tokens (if possible)
✅ Refresh access token before expiry
✅ Clear tokens on logout
✅ Validate SSL/TLS certificate in production
✅ Implement CSRF protection for state-changing requests

### Private Key Management
✅ Generate Ed25519 keypair on secure device
✅ Store private key in secure enclave/keychain (mobile)
✅ Never transmit private key to server
✅ Sign challenges locally only
✅ Rotate keys periodically

### Data Transmission
✅ Always use HTTPS/TLS in production
✅ Use CORS headers to restrict cross-origin requests
✅ Validate and sanitize all inputs
✅ Never log sensitive data (passwords, tokens)
✅ Implement certificate pinning (mobile)

---

## Testing Integration

### Mock Backend for Frontend Development

```typescript
// __mocks__/api.ts
export const mockAuthService = {
  register: jest.fn().mockResolvedValue({
    userId: '123',
    accessToken: 'mock-token',
    refreshToken: 'mock-refresh',
  }),
  login: jest.fn().mockResolvedValue({
    userId: '123',
    challenge: 'mock-challenge',
  }),
  verifyZKChallenge: jest.fn().mockResolvedValue({
    accessToken: 'mock-token',
    refreshToken: 'mock-refresh',
  }),
};
```

---

## Deployment Endpoints

**Development**: `http://localhost:3000/api/v1`
**Staging**: `https://staging-api.resilient-echo.com/api/v1`
**Production**: `https://api.resilient-echo.com/api/v1`

Update endpoints in:
- React: `src/config/api.config.ts`
- React Native: `src/config/api.config.ts` or via environment
- Tests: `.env.test` file

---

## Monitor & Troubleshooting

### Check Backend Health
```bash
curl -X GET http://localhost:3000/health
# Response: { "status": "ok", "timestamp": "2024-01-15T10:30:00Z" }
```

### View API Docs
Navigate to: `http://localhost:3000/docs` (Swagger UI)

### Check Logs
```bash
docker-compose logs -f backend
```

---

## Next Steps

1. ✅ Start frontend development using auth endpoints
2. ✅ Implement Ed25519 signing in frontend (use TweetNaCl.js or libsodium.js)
3. ✅ Build HazardOracleModule in parallel
4. ✅ Integrate WebSocket for real-time alerts
5. ✅ Add E2E tests with Cypress/Playwright
6. ✅ Deploy to staging environment

---

**Integration Ready**: Backend fully functional and documented for team integration.
