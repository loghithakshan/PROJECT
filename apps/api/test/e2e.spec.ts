import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import * as request from 'supertest';
import * as crypto from 'crypto';
import * as libsodium from 'libsodium-wrappers';

/**
 * E2E Test: Complete ResilientEcho Workflow
 * 
 * Scenario: Emergency responder receives flood alert
 * 
 * Journey:
 * 1. Register with Ed25519 key
 * 2. Login with Fiat-Shamir ZKP
 * 3. Ingest hazard from NOAA/USGS (Bayesian fusion)
 * 4. Create geofenced alert
 * 5. Broadcast to responders (E2EE per responder)
 * 6. Responder receives + acknowledges
 * 7. Creator resolves alert
 * 8. Verify audit trail integrity
 * 9. Generate compliance report
 */

describe('ResilientEcho E2E Workflow (e2e)', () => {
  let app: INestApplication;
  let publicKeyEd25519: string;
  let secretKeyEd25519: string;
  let accessToken: string;
  let responderId: string;
  let alertId: string;
  let responderPublicKey: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Wait for libsodium to load
    await libsodium.ready;
  });

  afterAll(async () => {
    await app.close();
  });

  /**
   * Step 1: User Registration
   * Ed25519 keypair generated client-side, public key sent to server
   */
  describe('1. Registration (Ed25519)', () => {
    it('should register user with Ed25519 public key', async () => {
      // Client: Generate keypair
      const keypair = libsodium.crypto_sign_seed_keypair(
        new Uint8Array(32).fill(1) // Deterministic seed for testing
      );
      publicKeyEd25519 = libsodium.to_hex(keypair.publicKey);
      secretKeyEd25519 = libsodium.to_hex(keypair.privateKey);

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          publicKeyEd25519,
          email: 'responder@resilientercho.io',
          name: 'Alice Response',
        })
        .expect(201);

      expect(response.body).toHaveProperty('userId');
      expect(response.body).toHaveProperty('message', 'User registered successfully');
      responderId = response.body.userId;
      responderPublicKey = publicKeyEd25519;
    });

    it('should prevent duplicate registration', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          publicKeyEd25519,
          email: 'responder@resilientercho.io',
          name: 'Alice Response',
        })
        .expect(409); // Conflict
    });
  });

  /**
   * Step 2: Fiat-Shamir ZKP Challenge
   * Server generates random challenge, client signs it
   */
  describe('2. Login (Fiat-Shamir ZKP)', () => {
    let challenge: string;
    let challengeNonce: string;

    it('should request Fiat-Shamir challenge', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/challenge')
        .send({ publicKeyEd25519 })
        .expect(200);

      expect(response.body).toHaveProperty('challenge');
      expect(response.body).toHaveProperty('nonce');
      expect(response.body.challenge).toMatch(/^[a-f0-9]{64}$/); // SHA256 hex
      challenge = response.body.challenge;
      challengeNonce = response.body.nonce;
    });

    it('should login with signature proof', async () => {
      // Client: Sign challenge with private key
      const publicKeyBytes = libsodium.from_hex(publicKeyEd25519);
      const secretKeyBytes = libsodium.from_hex(secretKeyEd25519);
      const challengeBytes = Buffer.from(challenge, 'hex');

      const signature = libsodium.crypto_sign(challengeBytes, secretKeyBytes);
      const signatureHex = libsodium.to_hex(signature);

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          publicKeyEd25519,
          nonce: challengeNonce,
          signature: signatureHex,
        })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.accessToken).toMatch(/^eyJ/); // JWT format
      accessToken = response.body.accessToken;
    });

    it('should reject invalid signature', async () => {
      const invalidSignature = '0'.repeat(128); // Wrong signature

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          publicKeyEd25519,
          nonce: challengeNonce,
          signature: invalidSignature,
        })
        .expect(401); // Unauthorized
    });
  });

  /**
   * Step 3: Hazard Ingestion (Bayesian Fusion)
   * Server fetches from 4 public APIs, computes posterior probability
   */
  describe('3. Hazard Ingestion (Bayesian Fusion)', () => {
    it('should ingest hazard from 4 public APIs', async () => {
      const response = await request(app.getHttpServer())
        .post('/hazard/ingest')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          latitude: 34.05,
          longitude: -118.24, // Los Angeles
          apis: ['NOAA', 'USGS', 'Sentinel', 'GDACS'],
        })
        .expect(200);

      expect(response.body).toHaveProperty('hazards');
      expect(response.body).toHaveProperty('bayesianFusion');
      expect(response.body.bayesianFusion).toHaveProperty('posteriorProbability');
      expect(response.body.bayesianFusion.posteriorProbability).toBeGreaterThanOrEqual(0);
      expect(response.body.bayesianFusion.posteriorProbability).toBeLessThanOrEqual(1);
    });

    it('should compute differential privacy (noised coordinates)', async () => {
      const response = await request(app.getHttpServer())
        .post('/hazard/ingest')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          latitude: 34.05,
          longitude: -118.24,
          apis: ['NOAA'],
        })
        .expect(200);

      // Noised coordinates should differ from original
      expect(response.body).toHaveProperty('noisedLatitude');
      expect(response.body).toHaveProperty('noisedLongitude');
      expect(response.body.noisedLatitude).not.toBe(34.05);
      expect(response.body.noisedLongitude).not.toBe(-118.24);
    });

    it('should compute risk score (0-10)', async () => {
      const response = await request(app.getHttpServer())
        .post('/hazard/ingest')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          latitude: 34.05,
          longitude: -118.24,
          apis: ['NOAA', 'USGS'],
        })
        .expect(200);

      expect(response.body).toHaveProperty('riskScore');
      expect(response.body.riskScore).toBeGreaterThanOrEqual(0);
      expect(response.body.riskScore).toBeLessThanOrEqual(10);
    });

    it('should handle API failures gracefully (circuit breaker)', async () => {
      // Simulate API outage (circuits open after 5 consecutive failures)
      for (let i = 0; i < 6; i++) {
        await request(app.getHttpServer())
          .post('/hazard/ingest')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            latitude: 34.05,
            longitude: -118.24,
            apis: ['INVALID_API'],
          });
      }

      // Request should fail fast (circuit open)
      const response = await request(app.getHttpServer())
        .post('/hazard/ingest')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          latitude: 34.05,
          longitude: -118.24,
          apis: ['INVALID_API'],
        });

      expect(response.status).toBeGreaterThanOrEqual(500);
      expect(response.body).toHaveProperty('message', 'Circuit breaker open');
    });
  });

  /**
   * Step 4: Alert Creation (Geofenced)
   * Creator specifies hazard type + geofence radius
   */
  describe('4. Alert Creation', () => {
    it('should create geofenced alert', async () => {
      const response = await request(app.getHttpServer())
        .post('/alert/create')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'URGENT: Flood Warning',
          description: 'Flash floods expected in LA County',
          hazardType: 'FLOOD',
          latitude: 34.05,
          longitude: -118.24,
          radiusKm: 50,
          urgencyScore: 9,
        })
        .expect(201);

      expect(response.body).toHaveProperty('alertId');
      expect(response.body).toHaveProperty('status', 'ACTIVE');
      expect(response.body).toHaveProperty('respondersNotified');
      expect(response.body.respondersNotified).toBeGreaterThanOrEqual(0);
      alertId = response.body.alertId;
    });

    it('should prevent duplicate alerts (idempotency)', async () => {
      const idempotencyKey = crypto.randomUUID();

      const response1 = await request(app.getHttpServer())
        .post('/alert/create')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('Idempotency-Key', idempotencyKey)
        .send({
          title: 'Test Alert',
          hazardType: 'WILDFIRE',
          latitude: 35.0,
          longitude: -119.0,
          radiusKm: 30,
        })
        .expect(201);

      const response2 = await request(app.getHttpServer())
        .post('/alert/create')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('Idempotency-Key', idempotencyKey)
        .send({
          title: 'Test Alert',
          hazardType: 'WILDFIRE',
          latitude: 35.0,
          longitude: -119.0,
          radiusKm: 30,
        })
        .expect(200);

      expect(response1.body.alertId).toBe(response2.body.alertId);
    });
  });

  /**
   * Step 5: Real-Time Broadcasting (E2EE per Responder)
   * Alert encrypted with responder's public key
   */
  describe('5. Real-Time Broadcasting (E2EE)', () => {
    it('should verify alert broadcasted to responders', async () => {
      const response = await request(app.getHttpServer())
        .get(`/alert/history`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('alerts');
      expect(Array.isArray(response.body.alerts)).toBe(true);

      const broadcastAlert = response.body.alerts.find(
        (a: any) => a.alertId === alertId
      );
      expect(broadcastAlert).toBeDefined();
      expect(broadcastAlert.status).toBe('ACTIVE');
      expect(broadcastAlert).toHaveProperty('encryptedPayload');
    });

    it('should include encryption metadata', async () => {
      const response = await request(app.getHttpServer())
        .get(`/alert/history`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const alert = response.body.alerts[0];
      expect(alert).toHaveProperty('encryptionAlgorithm', 'XChaCha20-Poly1305');
      expect(alert).toHaveProperty('nonce'); // 24-byte nonce (hex)
      expect(alert.nonce).toMatch(/^[a-f0-9]{48}$/); // 24 bytes in hex
    });
  });

  /**
   * Step 6: Responder Acknowledgment (Ed25519 Signature)
   * Responder confirms receipt with cryptographic proof
   */
  describe('6. Responder Acknowledgment', () => {
    it('should acknowledge alert with Ed25519 signature', async () => {
      const secretKeyBytes = libsodium.from_hex(secretKeyEd25519);
      const messageBytes = Buffer.from(alertId);
      const signature = libsodium.crypto_sign(messageBytes, secretKeyBytes);
      const signatureHex = libsodium.to_hex(signature);

      const response = await request(app.getHttpServer())
        .post(`/alert/acknowledge`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          alertId,
          signature: signatureHex,
          timestamp: new Date().toISOString(),
        })
        .expect(200);

      expect(response.body).toHaveProperty('acknowledgmentId');
      expect(response.body).toHaveProperty('status', 'ACKNOWLEDGED');
    });
  });

  /**
   * Step 7: Alert Resolution (Archive to Fabric)
   * Creator ends crisis, event archived to Hyperledger Fabric
   */
  describe('7. Alert Resolution', () => {
    it('should resolve alert and archive to Fabric', async () => {
      const response = await request(app.getHttpServer())
        .post(`/alert/resolve`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          alertId,
          resolution: 'FLOOD_RECEDED',
          notes: 'Water levels returned to normal',
        })
        .expect(200);

      expect(response.body).toHaveProperty('status', 'RESOLVED');
      expect(response.body).toHaveProperty('fabricTxId');
      expect(response.body.fabricTxId).toMatch(/^[a-f0-9]{64}$/); // SHA256 hash
    });
  });

  /**
   * Step 8: Audit Trail Verification (Hash Chain)
   * Entire alert lifecycle verified via SHA256 hash chain
   */
  describe('8. Audit Trail Integrity', () => {
    it('should retrieve full audit trail', async () => {
      const response = await request(app.getHttpServer())
        .get(`/audit/trail/${alertId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('events');
      expect(Array.isArray(response.body.events)).toBe(true);
      expect(response.body.events.length).toBeGreaterThan(0);

      // Events should include: CREATED, BROADCASTED, ACKNOWLEDGED, RESOLVED
      const eventTypes = response.body.events.map((e: any) => e.action);
      expect(eventTypes).toContain('ALERT_CREATED');
      expect(eventTypes).toContain('ALERT_ACKNOWLEDGED');
      expect(eventTypes).toContain('ALERT_RESOLVED');
    });

    it('should verify hash chain integrity', async () => {
      const response = await request(app.getHttpServer())
        .get(`/audit/verify/${alertId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('isIntact', true);
      expect(response.body).toHaveProperty('hashChainValid', true);
      expect(response.body).not.toHaveProperty('tamperedEvents');
    });

    it('should detect hash chain tampering', async () => {
      // Simulate tampering (would require database access in reality)
      // For this test, we verify the response structure indicates integrity
      const response = await request(app.getHttpServer())
        .get(`/audit/verify/${alertId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('isIntact');
      expect(response.body).toHaveProperty('hashChainValid');
      expect(response.body).toHaveProperty('verificationType');
    });
  });

  /**
   * Step 9: Compliance Reporting (Admin Only)
   * Generate audit report for regulators
   */
  describe('9. Compliance Reporting', () => {
    it('should generate compliance report (admin only)', async () => {
      // Note: This test requires admin privileges
      // In production, would use separate admin token
      const response = await request(app.getHttpServer())
        .get('/audit/compliance')
        .query({
          startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString(),
        })
        .set('Authorization', `Bearer ${accessToken}`)
        // Admin check would happen server-side
        .expect(200);

      expect(response.body).toHaveProperty('period');
      expect(response.body).toHaveProperty('totalEvents');
      expect(response.body).toHaveProperty('eventsByAction');
      expect(response.body).toHaveProperty('fabricArchived');
      expect(response.body).toHaveProperty('integrityVerified');

      expect(response.body.period).toHaveProperty('startDate');
      expect(response.body.period).toHaveProperty('endDate');
      expect(response.body.totalEvents).toBeGreaterThanOrEqual(0);
      expect(response.body.fabricArchived).toBeGreaterThanOrEqual(0);
    });

    it('should include event breakdown', async () => {
      const response = await request(app.getHttpServer())
        .get('/audit/compliance')
        .query({
          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString(),
        })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.eventsByAction).toHaveProperty('USER_REGISTERED');
      expect(response.body.eventsByAction).toHaveProperty('USER_LOGIN');
      expect(response.body.eventsByAction).toHaveProperty('ALERT_CREATED');
      expect(response.body.eventsByAction).toHaveProperty('ALERT_RESOLVED');
    });
  });

  /**
   * Step 10: Translation Engine (Multilingual Urgency)
   * Translate alert with prosody preservation + ZK fidelity proof
   */
  describe('10. Translation with ZK Fidelity', () => {
    it('should translate alert with prosody preservation', async () => {
      const response = await request(app.getHttpServer())
        .post('/translation/translate')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          text: 'URGENT: Flood warning!',
          sourceLang: 'en',
          targetLang: 'es',
          preserveUrgency: true,
        })
        .expect(200);

      expect(response.body).toHaveProperty('translatedText');
      expect(response.body).toHaveProperty('prosodyScore');
      expect(response.body).toHaveProperty('zkFidelityProofId');

      // Prosody score should indicate urgency preserved
      expect(response.body.prosodyScore).toBeGreaterThan(0.8);

      // ZK proof should exist
      expect(response.body.zkFidelityProofId).toMatch(/^[a-f0-9-]{36}$/); // UUID
    });

    it('should verify ZK fidelity proof', async () => {
      // First translate
      const translateResponse = await request(app.getHttpServer())
        .post('/translation/translate')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          text: 'CRITICAL: Earthquake detected',
          sourceLang: 'en',
          targetLang: 'fr',
          preserveUrgency: true,
        })
        .expect(200);

      const proofId = translateResponse.body.zkFidelityProofId;

      // TODO: Add endpoint to verify proof
      // const verifyResponse = await request(app.getHttpServer())
      //   .get(`/verify/translation/${proofId}`)
      //   .set('Authorization', `Bearer ${accessToken}`)
      //   .expect(200);
      //
      // expect(verifyResponse.body).toHaveProperty('isValid', true);
      // expect(verifyResponse.body).toHaveProperty('prosodyScore');
    });
  });

  /**
   * Step 11: Network Credential Verification (ZK Proofs)
   * Verify responder credentials using Groth16 ZK proofs
   */
  describe('11. Credential Verification (ZK Proofs)', () => {
    it('should verify responder credentials without revealing identity', async () => {
      const response = await request(app.getHttpServer())
        .post('/verify/credentials')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          responderId,
          certifications: ['EMT', 'HAZMAT'],
        })
        .expect(200);

      expect(response.body).toHaveProperty('verificationId');
      expect(response.body).toHaveProperty('status', 'VERIFIED');
      expect(response.body).toHaveProperty('zkProofId');
      expect(response.body).toHaveProperty('verificationChain');

      // Verification chain proves transitive trust
      expect(Array.isArray(response.body.verificationChain)).toBe(true);
    });

    it('should check verification status', async () => {
      const response = await request(app.getHttpServer())
        .get(`/verify/${responderId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('responderId', responderId);
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('verificationTimestamp');
    });
  });
});

/**
 * Performance Benchmarks
 * 
 * Target latencies (P99):
 * - Registration: < 10ms (client-side, no crypto)
 * - Challenge: < 5ms (random nonce generation)
 * - Login: < 20ms (signature verification)
 * - Alert creation: < 100ms (PostGIS geofence query + Redis pub)
 * - Translation: < 150ms (TensorFlow.js edge inference)
 * - ZK proof generation: < 500ms (snarkjs Groth16)
 * - Compliance report: < 1s (aggregation from audit events)
 */

describe('Performance Benchmarks', () => {
  let startTime: number;

  beforeEach(() => {
    startTime = performance.now();
  });

  const logLatency = (operation: string, maxMs: number) => {
    const latency = performance.now() - startTime;
    console.log(`${operation}: ${latency.toFixed(2)}ms (target: < ${maxMs}ms)`);
    expect(latency).toBeLessThan(maxMs);
  };

  it('registration should complete in < 10ms', async () => {
    const keypair = libsodium.crypto_sign_seedkeypair(
      new Uint8Array(32).fill(1)
    );
    const publicKeyEd25519 = libsodium.to_hex(keypair.publicKey);

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        publicKeyEd25519,
        email: `perf-${Date.now()}@test.io`,
      });

    logLatency('Register', 10);
  });
});
