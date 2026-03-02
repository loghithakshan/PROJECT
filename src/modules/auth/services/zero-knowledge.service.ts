import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import * as ed25519 from '@noble/ed25519';

/**
 * ===== ZERO-KNOWLEDGE PROOF SERVICE =====
 * Implements Fiat-Shamir challenges for password-less authentication
 * 
 * Protocol:
 * 1. Server generates random challenge (32 bytes)
 * 2. Client signs challenge with private key (Ed25519)
 * 3. Server verifies signature with public key (no password transmission)
 */
@Injectable()
export class ZeroKnowledgeService {
  private readonly logger = new Logger(ZeroKnowledgeService.name);
  private challenges: Map<string, { challenge: string; expiresAt: number }> = new Map();
  private readonly CHALLENGE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(private configService: ConfigService) {
    // Cleanup expired challenges every minute
    setInterval(() => this.cleanupExpiredChallenges(), 60 * 1000);
  }

  /**
   * Generate Fiat-Shamir challenge for user
   * Challenge is random 32-byte hex string
   */
  generateChallenge(userId: string): string {
    const challenge = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + this.CHALLENGE_TTL;

    this.challenges.set(userId, { challenge, expiresAt });
    this.logger.debug(`Challenge generated for user ${userId}`);

    return challenge;
  }

  /**
   * Verify ZK response: validateSignature(challenge, signature, publicKey)
   * 
   * Ed25519 verification is deterministic + constant-time
   * Returns true only if:
   * - Challenge exists and not expired
   * - Signature is valid Ed25519 signature of challenge
   */
  async verifyResponse(
    userId: string,
    challenge: string,
    signature: string,
    publicKey: string,
  ): Promise<boolean> {
    try {
      // 1. Fetch stored challenge
      const stored = this.challenges.get(userId);
      if (!stored) {
        this.logger.warn(`No challenge found for user ${userId}`);
        return false;
      }

      // 2. Check expiration
      if (stored.expiresAt < Date.now()) {
        this.challenges.delete(userId);
        this.logger.warn(`Challenge expired for user ${userId}`);
        return false;
      }

      // 3. Verify challenge matches
      if (stored.challenge !== challenge) {
        this.logger.warn(`Challenge mismatch for user ${userId}`);
        return false;
      }

      // 4. Verify Ed25519 signature (constant-time, deterministic)
      const isValid = await ed25519.verify(
        Buffer.from(signature, 'hex'),
        Buffer.from(challenge, 'hex'),
        Buffer.from(publicKey, 'hex'),
      );

      if (isValid) {
        // 5. Clear challenge after successful verification
        this.challenges.delete(userId);
        this.logger.log(`ZK challenge verified for user ${userId}`);
      } else {
        this.logger.warn(`Invalid signature for user ${userId}`);
      }

      return isValid;
    } catch (error) {
      this.logger.error('ZK verification error:', error.message);
      return false;
    }
  }

  /**
   * Cleanup expired challenges (called periodically)
   */
  private cleanupExpiredChallenges() {
    const now = Date.now();
    let deleted = 0;

    for (const [userId, data] of this.challenges) {
      if (data.expiresAt < now) {
        this.challenges.delete(userId);
        deleted += 1;
      }
    }

    if (deleted > 0) {
      this.logger.debug(`Cleaned up ${deleted} expired challenges`);
    }
  }

  /**
   * Get active challenge count (for monitoring)
   */
  getActiveChallengessCount(): number {
    return this.challenges.size;
  }
}
