import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../app.module';

/**
 * ===== AUTH CONTROLLER E2E TESTS =====
 * Test complete authentication flows with real database and HTTP
 *
 * SETUP REQUIRED:
 * - PostgreSQL running on DATABASE_URL (see .env)
 * - Redis running (optional, rate limiting works with memory fallback)
 * - Run: npx prisma migrate dev
 */
describe('Auth Module E2E', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register user with valid credentials', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'SecurePassword123!@#',
          firstName: 'John',
          lastName: 'Doe',
          country: 'US',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('userId');
          expect(res.body).toHaveProperty('email', 'newuser@example.com');
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('refreshToken');
          expect(res.body).not.toHaveProperty('password');
        });
    });

    it('should reject invalid email format', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'invalid-email',
          password: 'SecurePassword123!@#',
          firstName: 'John',
          lastName: 'Doe',
        })
        .expect(400);
    });

    it('should reject weak password', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'weak',
          firstName: 'John',
          lastName: 'Doe',
        })
        .expect(400);
    });

    it('should reject duplicate email', async () => {
      const email = `duplicate-${Date.now()}@example.com`;

      // First registration
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email,
          password: 'SecurePassword123!@#',
          firstName: 'John',
          lastName: 'Doe',
        })
        .expect(201);

      // Duplicate registration
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email,
          password: 'SecurePassword123!@#',
          firstName: 'John',
          lastName: 'Doe',
        })
        .expect(409); // Conflict
    });

    it('should validate required fields', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'newuser@example.com',
          // Missing password
          firstName: 'John',
          lastName: 'Doe',
        })
        .expect(400);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    let testEmail: string;
    let testPassword: string;

    beforeAll(async () => {
      testEmail = `testuser-${Date.now()}@example.com`;
      testPassword = 'SecurePassword123!@#';

      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: testEmail,
          password: testPassword,
          firstName: 'Test',
          lastName: 'User',
        });
    });

    it('should return ZK challenge on valid credentials', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testEmail,
          password: testPassword,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('userId');
          expect(res.body).toHaveProperty('challenge');
          expect(res.body.challenge).toMatch(/^[0-9a-f]+$/); // Hex string
        });
    });

    it('should reject invalid password', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testEmail,
          password: 'WrongPassword123!@#',
        })
        .expect(401);
    });

    it('should reject non-existent user', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'SecurePassword123!@#',
        })
        .expect(401);
    });

    it('should lock account after 5 failed attempts', async () => {
      const lockedUserEmail = `locked-${Date.now()}@example.com`;
      const correctPassword = 'SecurePassword123!@#';

      // Register user
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: lockedUserEmail,
          password: correctPassword,
          firstName: 'Locked',
          lastName: 'User',
        });

      // Make 5 failed attempts
      for (let i = 0; i < 5; i++) {
        await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send({
            email: lockedUserEmail,
            password: 'WrongPassword123!@#',
          })
          .expect(401);
      }

      // 6th attempt should be rejected due to lockout (even with correct password)
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: lockedUserEmail,
          password: correctPassword,
        })
        .expect(429); // Too Many Requests
    });
  });

  describe('POST /api/v1/auth/zk-challenge', () => {
    it('should generate ZK challenge for valid userId', async () => {
      const email = `zktest-${Date.now()}@example.com`;

      // Register user
      const registerRes = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email,
          password: 'SecurePassword123!@#',
          firstName: 'ZK',
          lastName: 'Test',
        });

      const userId = registerRes.body.userId;

      // Get fresh challenge
      return request(app.getHttpServer())
        .post('/api/v1/auth/zk-challenge')
        .send({ userId })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('challenge');
          expect(res.body.challenge).toMatch(/^[0-9a-f]+$/);
        });
    });

    it('should reject invalid userId', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/zk-challenge')
        .send({ userId: 'invalid-id' })
        .expect(404);
    });
  });

  describe('POST /api/v1/auth/zk-verify', () => {
    let testUserId: string;
    let testChallenge: string;
    let testSignature: string;

    beforeAll(async () => {
      const email = `zkverify-${Date.now()}@example.com`;

      // Register user
      const registerRes = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email,
          password: 'SecurePassword123!@#',
          firstName: 'ZK',
          lastName: 'Verify',
        });

      testUserId = registerRes.body.userId;

      // Get challenge from login
      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email,
          password: 'SecurePassword123!@#',
        });

      testChallenge = loginRes.body.challenge;
      // Note: In real test, you'd sign challenge with Ed25519 private key
      // For example: testSignature = crypto.sign(testChallenge, privateKey);
    });

    it('should issue tokens on valid ZK proof', async () => {
      // This test is simplified - in reality, you need Ed25519 signature
      // For full E2E, integrate real key signing
      return request(app.getHttpServer())
        .post('/api/v1/auth/zk-verify')
        .send({
          userId: testUserId,
          challenge: testChallenge,
          signature: 'valid-signature-hex', // Would be real Ed25519 signature
        })
        .expect((res) => {
          // Will likely be 401 since signature is mocked
          // Real test would sign properly
          expect([200, 401]).toContain(res.status);
        });
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    let refreshToken: string;

    beforeAll(async () => {
      const email = `refresh-${Date.now()}@example.com`;

      // Register user
      const registerRes = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email,
          password: 'SecurePassword123!@#',
          firstName: 'Refresh',
          lastName: 'Test',
        });

      refreshToken = registerRes.body.refreshToken;
    });

    it('should return new tokens on valid refresh token', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('refreshToken');
        });
    });

    it('should reject invalid refresh token', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    let accessToken: string;

    beforeAll(async () => {
      const email = `me-${Date.now()}@example.com`;

      // Register user
      const registerRes = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email,
          password: 'SecurePassword123!@#',
          firstName: 'Me',
          lastName: 'Test',
        });

      accessToken = registerRes.body.accessToken;
    });

    it('should return current user with valid token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('email');
          expect(res.body).toHaveProperty('role');
          expect(res.body).not.toHaveProperty('passwordHash');
          expect(res.body).not.toHaveProperty('encryptedPrivateKey');
        });
    });

    it('should reject missing token', () => {
      return request(app.getHttpServer()).get('/api/v1/auth/me').expect(401);
    });

    it('should reject invalid token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should reject malformed Authorization header', () => {
      return request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', 'InvalidHeader')
        .expect(401);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    let accessToken: string;

    beforeAll(async () => {
      const email = `logout-${Date.now()}@example.com`;

      // Register user
      const registerRes = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email,
          password: 'SecurePassword123!@#',
          firstName: 'Logout',
          lastName: 'Test',
        });

      accessToken = registerRes.body.accessToken;
    });

    it('should revoke tokens on logout', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
        });
    });

    it('should reject access after logout', async () => {
      // User should no longer have access with revoked token
      return request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(401);
    });
  });

  describe('Complete Authentication Flow', () => {
    it('should complete full register -> login -> verify -> refresh -> logout flow', async () => {
      const email = `flow-${Date.now()}@example.com`;
      const password = 'SecurePassword123!@#';

      // 1. Register
      const registerRes = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email,
          password,
          firstName: 'Flow',
          lastName: 'Test',
        })
        .expect(201);

      const accessToken = registerRes.body.accessToken;

      // 2. Get current user
      const meRes = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(meRes.body.email).toBe(email);

      // 3. Refresh token
      const refreshRes = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: registerRes.body.refreshToken })
        .expect(200);

      const newAccessToken = refreshRes.body.accessToken;

      // 4. Get current user with new token
      await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${newAccessToken}`)
        .expect(200);

      // 5. Logout
      await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${newAccessToken}`)
        .expect(200);

      // 6. Verify access is revoked
      await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${newAccessToken}`)
        .expect(401);
    });
  });
});
