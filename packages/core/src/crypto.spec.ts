import {
  generateEd25519Keypair,
  encryptMessage,
  decryptMessage,
  hashPassword,
  verifyPassword,
  sign,
  verifySignature,
  generateFiatShamirChallenge,
  addLaplaceNoise,
} from '@core/crypto';

describe('Cryptography Module', () => {
  describe('Ed25519 keys', () => {
    it('should generate valid Ed25519 keypair', async () => {
      const { publicKey, privateKey } = await generateEd25519Keypair();

      expect(publicKey).toHaveLength(64); // 32 bytes hex
      expect(privateKey).toHaveLength(64);
    });
  });

  describe('XChaCha20-Poly1305 E2EE', () => {
    it('should encrypt and decrypt message', async () => {
      const plaintext = 'URGENT: Flood warning in downtown area!';
      const { publicKey } = await generateEd25519Keypair();

      const { ciphertext, nonce } = await encryptMessage(plaintext, publicKey);

      expect(ciphertext).toBeDefined();
      expect(nonce).toHaveLength(48); // 24 bytes hex

      const decrypted = await decryptMessage(ciphertext, nonce, publicKey);
      expect(decrypted).toBe(plaintext);
    });

    it('should fail on tampered ciphertext', async () => {
      const plaintext = 'Message';
      const { publicKey } = await generateEd25519Keypair();

      const { ciphertext, nonce } = await encryptMessage(plaintext, publicKey);

      // Tamper with ciphertext
      const tampered = ciphertext.slice(0, -2) + 'XX';

      try {
        await decryptMessage(tampered, nonce, publicKey);
        fail('Should throw authentication error');
      } catch (error) {
        expect(error.message).toContain('Authentication');
      }
    });
  });

  describe('Argon2id password hashing', () => {
    it('should hash and verify password', async () => {
      const password = 'SuperSecurePassword123!';

      const hash = await hashPassword(password);

      const valid = await verifyPassword(password, hash);
      expect(valid).toBe(true);
    });

    it('should reject invalid password', async () => {
      const password = 'SuperSecurePassword123!';
      const wrongPassword = 'WrongPassword';

      const hash = await hashPassword(password);

      const valid = await verifyPassword(wrongPassword, hash);
      expect(valid).toBe(false);
    });
  });

  describe('Ed25519 digital signatures', () => {
    it('should sign and verify message', async () => {
      const message = 'CRITICAL: Earthquake detected M7.2';
      const { privateKey, publicKey } = await generateEd25519Keypair();

      const signature = await sign(message, privateKey);

      const valid = await verifySignature(message, signature, publicKey);
      expect(valid).toBe(true);
    });

    it('should reject tampered message', async () => {
      const message = 'Original message';
      const { privateKey, publicKey } = await generateEd25519Keypair();

      const signature = await sign(message, privateKey);

      const valid = await verifySignature('Tampered message', signature, publicKey);
      expect(valid).toBe(false);
    });
  });

  describe('Fiat-Shamir ZKP challenges', () => {
    it('should generate valid challenge with expiration', () => {
      const challenge = generateFiatShamirChallenge();

      expect(challenge).toHaveProperty('challenge');
      expect(challenge).toHaveProperty('timestamp');
      expect(challenge).toHaveProperty('expiresAt');
      expect(challenge.expiresAt).toBeGreaterThan(challenge.timestamp);
    });
  });

  describe('Differential privacy', () => {
    it('should add Laplace noise to values', () => {
      const value = 100;
      const epsilon = 0.1;

      const noisy = addLaplaceNoise(value, epsilon);

      expect(typeof noisy).toBe('number');
      // Value should be within reasonable distance (depends on randomness)
      expect(Math.abs(noisy - value)).toBeLessThan(1000); // Loose bounds
    });

    it('should preserve approximate statistical properties', () => {
      const values = Array(100).fill(100);
      const epsilon = 0.1;

      const noisyValues = values.map((v) => addLaplaceNoise(v, epsilon));
      const mean = noisyValues.reduce((a, b) => a + b) / noisyValues.length;

      expect(Math.abs(mean - 100)).toBeLessThan(50); // Approximately 100
    });
  });
});
