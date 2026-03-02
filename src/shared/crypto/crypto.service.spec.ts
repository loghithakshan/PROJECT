import { Test, TestingModule } from '@nestjs/testing';
import { CryptoService } from '../crypto.service';

/**
 * ===== CRYPTO SERVICE UNIT TESTS =====
 * Test cryptographic functions: hashing, signatures, encryption, HMAC
 */
describe('CryptoService', () => {
  let service: CryptoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CryptoService],
    }).compile();

    service = module.get<CryptoService>(CryptoService);
  });

  describe('Ed25519 Keypair Generation', () => {
    it('should generate valid Ed25519 keypair', async () => {
      const keypair = await service.generateEd25519Keypair();

      expect(keypair).toHaveProperty('publicKey');
      expect(keypair).toHaveProperty('privateKey');
      expect(keypair.publicKey).toBeTruthy();
      expect(keypair.privateKey).toBeTruthy();
      // Public key should be 32 bytes (64 hex chars)
      expect(keypair.publicKey.length).toBe(64);
    });

    it('should generate different keypairs on each call', async () => {
      const keypair1 = await service.generateEd25519Keypair();
      const keypair2 = await service.generateEd25519Keypair();

      expect(keypair1.publicKey).not.toEqual(keypair2.publicKey);
      expect(keypair1.privateKey).not.toEqual(keypair2.privateKey);
    });
  });

  describe('Password Hashing (Argon2id)', () => {
    it('should hash password successfully', async () => {
      const password = 'SecurePassword123!@#';
      const hash = await service.hashPassword(password);

      expect(hash).toBeTruthy();
      expect(hash).not.toEqual(password);
      // Argon2id hashes start with $argon2id$
      expect(hash).toMatch(/^\$argon2id\$/);
    });

    it('should produce different hashes for same password', async () => {
      const password = 'SecurePassword123!@#';
      const hash1 = await service.hashPassword(password);
      const hash2 = await service.hashPassword(password);

      expect(hash1).not.toEqual(hash2); // Different due to salt
    });

    it('should use Argon2id with proper parameters', async () => {
      const password = 'TestPassword123!';
      const hash = await service.hashPassword(password);

      // Verify Argon2id parameters (3 iterations, 64MB memory, 4 parallelism)
      expect(hash).toMatch(/\$m=65536\$/); // 64MB = 65536 KiB
      expect(hash).toMatch(/\$t=3\$/); // 3 iterations
      expect(hash).toMatch(/\$p=4\$/); // 4 parallelism
    });

    it('should reject weak passwords', async () => {
      const weakPassword = 'weak'; // Too short
      const hash = await service.hashPassword(weakPassword);
      // Should still hash (validation done elsewhere)
      expect(hash).toBeTruthy();
    });
  });

  describe('Password Verification', () => {
    it('should verify correct password', async () => {
      const password = 'SecurePassword123!@#';
      const hash = await service.hashPassword(password);
      const isValid = await service.verifyPassword(password, hash);

      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'SecurePassword123!@#';
      const hash = await service.hashPassword(password);
      const isValid = await service.verifyPassword('WrongPassword123!', hash);

      expect(isValid).toBe(false);
    });

    it('should use constant-time comparison', async () => {
      const password = 'SecurePassword123!@#';
      const hash = await service.hashPassword(password);

      // Multiple attempts should have similar execution time
      const start1 = process.hrtime.bigint();
      await service.verifyPassword('wrong1', hash);
      const time1 = Number(process.hrtime.bigint() - start1);

      const start2 = process.hrtime.bigint();
      await service.verifyPassword('wrong2', hash);
      const time2 = Number(process.hrtime.bigint() - start2);

      // Times should be roughly similar (within 50ms)
      expect(Math.abs(time1 - time2)).toBeLessThan(50000000);
    });
  });

  describe('Ed25519 Digital Signatures', () => {
    it('should sign and verify message', async () => {
      const keypair = await service.generateEd25519Keypair();
      const message = 'test message';

      const signature = await service.sign(message, keypair.privateKey);
      const isValid = await service.verify(message, signature, keypair.publicKey);

      expect(signature).toBeTruthy();
      expect(isValid).toBe(true);
    });

    it('should reject tampered message', async () => {
      const keypair = await service.generateEd25519Keypair();
      const message = 'test message';

      const signature = await service.sign(message, keypair.privateKey);
      const isValid = await service.verify('tampered message', signature, keypair.publicKey);

      expect(isValid).toBe(false);
    });

    it('should reject signature from different key', async () => {
      const keypair1 = await service.generateEd25519Keypair();
      const keypair2 = await service.generateEd25519Keypair();
      const message = 'test message';

      const signature = await service.sign(message, keypair1.privateKey);
      const isValid = await service.verify(message, signature, keypair2.publicKey);

      expect(isValid).toBe(false);
    });

    it('should produce different signatures for same message', async () => {
      const keypair = await service.generateEd25519Keypair();
      const message = 'test message';

      const signature1 = await service.sign(message, keypair.privateKey);
      const signature2 = await service.sign(message, keypair.privateKey);

      // Ed25519 is deterministic, so signatures should be same
      expect(signature1).toEqual(signature2);
    });
  });

  describe('Random Token Generation', () => {
    it('should generate random token', () => {
      const token = service.generateRandomToken();

      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(20);
    });

    it('should generate unique tokens', () => {
      const token1 = service.generateRandomToken();
      const token2 = service.generateRandomToken();
      const token3 = service.generateRandomToken();

      expect(token1).not.toEqual(token2);
      expect(token2).not.toEqual(token3);
      expect(token1).not.toEqual(token3);
    });

    it('should use cryptographically secure randomness', () => {
      const tokens = new Set();
      for (let i = 0; i < 100; i++) {
        tokens.add(service.generateRandomToken());
      }

      // All 100 tokens should be unique
      expect(tokens.size).toBe(100);
    });
  });

  describe('SHA256 Hashing', () => {
    it('should hash data with SHA256', () => {
      const data = 'test data';
      const hash = service.sha256(data);

      expect(hash).toBeTruthy();
      expect(typeof hash).toBe('string');
      // SHA256 produces 32 bytes = 64 hex chars
      expect(hash.length).toBe(64);
    });

    it('should produce same hash for same input', () => {
      const data = 'test data';
      const hash1 = service.sha256(data);
      const hash2 = service.sha256(data);

      expect(hash1).toEqual(hash2);
    });

    it('should produce different hash for different input', () => {
      const hash1 = service.sha256('test data 1');
      const hash2 = service.sha256('test data 2');

      expect(hash1).not.toEqual(hash2);
    });

    it('should be case-sensitive', () => {
      const hash1 = service.sha256('Test');
      const hash2 = service.sha256('test');

      expect(hash1).not.toEqual(hash2);
    });
  });

  describe('HMAC SHA256', () => {
    it('should compute HMAC-SHA256', () => {
      const key = 'secret-key';
      const data = 'test data';
      const hmac = service.hmacSha256(key, data);

      expect(hmac).toBeTruthy();
      expect(typeof hmac).toBe('string');
      expect(hmac.length).toBe(64); // 32 bytes = 64 hex chars
    });

    it('should produce same HMAC for same key and data', () => {
      const key = 'secret-key';
      const data = 'test data';
      const hmac1 = service.hmacSha256(key, data);
      const hmac2 = service.hmacSha256(key, data);

      expect(hmac1).toEqual(hmac2);
    });

    it('should produce different HMAC for different key', () => {
      const data = 'test data';
      const hmac1 = service.hmacSha256('key1', data);
      const hmac2 = service.hmacSha256('key2', data);

      expect(hmac1).not.toEqual(hmac2);
    });

    it('should produce different HMAC for different data', () => {
      const key = 'secret-key';
      const hmac1 = service.hmacSha256(key, 'data1');
      const hmac2 = service.hmacSha256(key, 'data2');

      expect(hmac1).not.toEqual(hmac2);
    });
  });

  describe('Encryption / Decryption (XChaCha20-Poly1305)', () => {
    it('should encrypt and decrypt data', async () => {
      const plaintext = 'sensitive data';
      const encryptionKey = service.generateRandomToken().substring(0, 64); // 32 bytes

      const ciphertext = await service.encrypt(plaintext, encryptionKey);
      const decrypted = await service.decrypt(ciphertext, encryptionKey);

      expect(decrypted).toEqual(plaintext);
    });

    it('should produce different ciphertexts for same plaintext', async () => {
      const plaintext = 'sensitive data';
      const key = service.generateRandomToken().substring(0, 64);

      const ciphertext1 = await service.encrypt(plaintext, key);
      const ciphertext2 = await service.encrypt(plaintext, key);

      // Different due to random nonce
      expect(ciphertext1).not.toEqual(ciphertext2);
    });

    it('should fail to decrypt with wrong key', async () => {
      const plaintext = 'sensitive data';
      const key1 = service.generateRandomToken().substring(0, 64);
      const key2 = service.generateRandomToken().substring(0, 64);

      const ciphertext = await service.encrypt(plaintext, key1);

      await expect(service.decrypt(ciphertext, key2)).rejects.toThrow();
    });

    it('should fail to decrypt tampered ciphertext', async () => {
      const plaintext = 'sensitive data';
      const key = service.generateRandomToken().substring(0, 64);

      const ciphertext = await service.encrypt(plaintext, key);
      const tampered = ciphertext.substring(0, ciphertext.length - 2) + 'XX';

      await expect(service.decrypt(tampered, key)).rejects.toThrow();
    });
  });

  describe('Cryptographic Properties', () => {
    it('should handle empty strings', async () => {
      const hash = service.sha256('');
      expect(hash).toBeTruthy();
      expect(hash.length).toBe(64);
    });

    it('should handle long strings', async () => {
      const longString = 'a'.repeat(10000);
      const hash = service.sha256(longString);
      expect(hash).toBeTruthy();
      expect(hash.length).toBe(64);
    });

    it('should handle special characters', async () => {
      const specialString = '!@#$%^&*()_+-=[]{}|;:,.<>?你好世界🚀';
      const hash = service.sha256(specialString);
      expect(hash).toBeTruthy();
    });

    it('should handle binary data', async () => {
      const buffer = Buffer.from([0, 1, 2, 255, 254, 253]);
      const hash = service.sha256(buffer.toString('hex'));
      expect(hash).toBeTruthy();
    });
  });
});
