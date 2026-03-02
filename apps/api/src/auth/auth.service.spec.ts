import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '@prisma/client';
import { generateEd25519Keypair, verifySignature, hashPassword } from '@core/crypto';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService, PrismaService],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('register', () => {
    it('should register user with Ed25519 public key', async () => {
      const { publicKey } = await generateEd25519Keypair();

      const result = await service.register({
        publicKeyEd25519: publicKey,
      });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.expiresIn).toBe(300);
    });

    it('should reject duplicate public keys', async () => {
      const { publicKey } = await generateEd25519Keypair();

      await service.register({ publicKeyEd25519: publicKey });

      try {
        await service.register({ publicKeyEd25519: publicKey });
        fail('Should throw BadRequestException');
      } catch (error) {
        expect(error.message).toContain('already exists');
      }
    });
  });

  describe('login with Fiat-Shamir ZKP', () => {
    it('should verify valid Ed25519 signature', async () => {
      const { publicKey, privateKey } = await generateEd25519Keypair();

      // Register user
      await service.register({ publicKeyEd25519: publicKey });

      // Get challenge
      const challenge = await service.generateLoginChallenge(publicKey);

      // Sign challenge with private key
      const signature = await verifySignature(challenge.nonce, privateKey, publicKey);

      expect(signature).toBe(true);
    });

    it('should reject invalid signature', async () => {
      const { publicKey } = await generateEd25519Keypair();
      const { publicKey: otherPublicKey } = await generateEd25519Keypair();

      await service.register({ publicKeyEd25519: publicKey });

      try {
        await service.login({
          publicKeyEd25519: publicKey,
          nonce: 'invalid_nonce',
          signature: 'invalid_signature',
        });
        fail('Should throw UnauthorizedException');
      } catch (error) {
        expect(error.message).toContain('Nonce expired');
      }
    });
  });

  describe('rate limiting', () => {
    it('should lock account after 5 failed attempts', async () => {
      const { publicKey } = await generateEd25519Keypair();

      await service.register({ publicKeyEd25519: publicKey });

      // Attempt 5 failed logins
      for (let i = 0; i < 5; i++) {
        try {
          await service.login({
            publicKeyEd25519: publicKey,
            nonce: `nonce_${i}`,
            signature: 'invalid',
          });
        } catch (error) {
          // Expected
        }
      }

      // 6th attempt should be locked
      try {
        await service.login({
          publicKeyEd25519: publicKey,
          nonce: 'nonce_6',
          signature: 'invalid',
        });
        fail('Should throw locked account error');
      } catch (error) {
        expect(error.message).toContain('Too many failed');
      }
    });
  });

  describe('token refresh', () => {
    it('should issue new access token with refresh token', async () => {
      const { publicKey } = await generateEd25519Keypair();

      const loginResult = await service.register({ publicKeyEd25519: publicKey });

      const refreshResult = await service.refreshToken(loginResult.refreshToken);

      expect(refreshResult).toHaveProperty('accessToken');
      expect(refreshResult.expiresIn).toBe(300);
    });
  });
});
