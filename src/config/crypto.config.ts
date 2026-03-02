import { registerAs } from '@nestjs/config';

/**
 * Cryptography Configuration
 * Post-quantum ready E2EE, key derivation, signing
 * Uses: @noble/ed25519, libsodium-wrappers, xsalsa20-poly1305
 */

export default registerAs('crypto', () => ({
  // Master encryption key (KDF from ENV var)
  // NEVER hardcode in source; use HashiCorp Vault or AWS Secrets Manager
  masterKey: process.env.CRYPTO_MASTER_KEY || (() => {
    throw new Error('CRYPTO_MASTER_KEY not set in environment');
  })(),

  // Encryption algorithm
  encryption: {
    algorithm: 'xchacha20-poly1305', // AEAD cipher, post-quantum ready pending Kyber integration
    nonceLength: 24, // XChaCha20 uses 24-byte nonces
    tagLength: 16, // Poly1305 authentication tag
  },

  // Key derivation parameters
  keyDerivation: {
    algorithm: 'argon2id',
    timeComplexity: 3, // iterations
    memoryComplexity: 64, // MB
    parallelism: 4,
    saltLength: 32,
  },

  // Signing
  signing: {
    algorithm: 'ed25519', // EdDSA, deterministic, post-quantum friendly for transition
  },

  // Post-quantum planning
  postQuantum: {
    enabled: process.env.POST_QUANTUM_ENABLED === 'true',
    kyberLevel: 3, // Kyber-768 (moderate security)
  },

  // Key rotation
  keyRotation: {
    enabledAutoRotation: process.env.KEY_ROTATION_ENABLED === 'true',
    rotationIntervalDays: 90,
  },

  // Token (JWT) configuration
  tokens: {
    // Token expiry (short-lived)
    accessTokenTtl: '15m',
    refreshTokenTtl: '7d',
    zeroKnowledgeChallengeTimeout: 300, // 5 minutes
  },

  // Rate limiting on crypto operations
  rateLimit: {
    derivationsPerMinute: 100, // Slow down brute-force attacks
  },
}));
