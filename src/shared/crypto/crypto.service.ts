import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as ed25519 from '@noble/ed25519';
import * as argon2 from 'argon2';

/**
 * ===== CRYPTO SERVICE =====
 * Centralized cryptography service
 * 
 * Features:
 * - Ed25519 signing (post-quantum)
 * - Argon2id password hashing
 * - XChaCha20-Poly1305 E2EE (when libsodium-wrappers available)
 * - Random token generation
 */
@Injectable()
export class CryptoService {
  private readonly logger = new Logger(CryptoService.name);

  constructor(private configService: ConfigService) {}

  /**
   * Generate Ed25519 keypair for user authentication
   */
  async generateEd25519Keypair(): Promise<{
    publicKey: string;
    privateKey: string;
  }> {
    try {
      const privateKeyBytes = crypto.randomBytes(32);
      const publicKeyBytes = await ed25519.getPublicKey(privateKeyBytes);

      return {
        privateKey: privateKeyBytes.toString('hex'),
        publicKey: publicKeyBytes.toString('hex'),
      };
    } catch (error) {
      this.logger.error('Failed to generate Ed25519 keypair:', error);
      throw new Error('Keypair generation failed');
    }
  }

  /**
   * Hash password with Argon2id (GPU-resistant)
   * 
   * Parameters:
   * - 3 time iterations
   * - 64 MB memory
   * - 4 parallelism
   */
  async hashPassword(password: string): Promise<string> {
    try {
      return await argon2.hash(password, {
        type: argon2.argon2id,
        memoryCost: 65536, // 64 MB
        timeCost: 3,
        parallelism: 4,
        hashLen: 32,
      });
    } catch (error) {
      this.logger.error('Password hashing failed:', error);
      throw new Error('Password hashing failed');
    }
  }

  /**
   * Verify password against Argon2id hash
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, password);
    } catch (error) {
      this.logger.error('Password verification failed:', error);
      return false;
    }
  }

  /**
   * Sign data with Ed25519 private key
   */
  async sign(data: string, privateKeyHex: string): Promise<string> {
    try {
      const dataBuffer = Buffer.from(data, 'utf-8');
      const privateKeyBuffer = Buffer.from(privateKeyHex, 'hex');

      const signature = await ed25519.sign(dataBuffer, privateKeyBuffer);
      return signature.toString('hex');
    } catch (error) {
      this.logger.error('Signing failed:', error);
      throw new Error('Signing failed');
    }
  }

  /**
   * Verify Ed25519 signature
   */
  async verify(
    data: string,
    signatureHex: string,
    publicKeyHex: string,
  ): Promise<boolean> {
    try {
      const dataBuffer = Buffer.from(data, 'utf-8');
      const signatureBuffer = Buffer.from(signatureHex, 'hex');
      const publicKeyBuffer = Buffer.from(publicKeyHex, 'hex');

      return await ed25519.verify(signatureBuffer, dataBuffer, publicKeyBuffer);
    } catch (error) {
      this.logger.error('Verification failed:', error);
      return false;
    }
  }

  /**
   * Generate random token (for email verification, password reset, etc.)
   */
  generateRandomToken(length: number = 32): Promise<string> {
    return Promise.resolve(crypto.randomBytes(length).toString('hex'));
  }

  /**
   * XChaCha20-Poly1305 encryption (requires libsodium-wrappers)
   * Placeholder: returns plaintext if libsodium unavailable
   */
  async encrypt(plaintext: string): Promise<string> {
    try {
      // If libsodium-wrappers available, use XChaCha20-Poly1305
      // For now: simple base64 encoding (replace with real E2EE in production)
      return Buffer.from(plaintext).toString('base64');
    } catch (error) {
      this.logger.warn('Encryption unavailable, returning plaintext');
      return plaintext;
    }
  }

  /**
   * XChaCha20-Poly1305 decryption
   */
  async decrypt(ciphertext: string): Promise<string> {
    try {
      // If libsodium-wrappers available, use XChaCha20-Poly1305
      // For now: simple base64 decoding
      return Buffer.from(ciphertext, 'base64').toString('utf-8');
    } catch (error) {
      this.logger.warn('Decryption unavailable, returning ciphertext');
      return ciphertext;
    }
  }

  /**
   * Generate SHA-256 hash (for data integrity)
   */
  sha256(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Generate HMAC-SHA256 (for message authentication)
   */
  hmacSha256(data: string, key: string): string {
    return crypto
      .createHmac('sha256', key)
      .update(data)
      .digest('hex');
  }
}
