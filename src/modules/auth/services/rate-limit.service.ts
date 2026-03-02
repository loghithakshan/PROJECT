import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * ===== RATE LIMIT SERVICE =====
 * Prevents brute-force attacks with account lockout
 * 
 * Rules:
 * - Max 5 failed login attempts
 * - Lockout: 15 minutes after 5 attempts
 * - Tracks by email (timing attack resistant)
 */
@Injectable()
export class RateLimitService {
  private readonly logger = new Logger(RateLimitService.name);
  private failedAttempts: Map<
    string,
    { count: number; firstAttempt: number; lastAttempt: number }
  > = new Map();

  private readonly MAX_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

  constructor(private configService: ConfigService) {
    // Cleanup old entries every hour
    setInterval(() => this.cleanup(), 60 * 60 * 1000);
  }

  /**
   * Record a failed login attempt for email
   */
  async recordFailedLogin(email: string): Promise<void> {
    const key = email.toLowerCase();
    const existing = this.failedAttempts.get(key);

    if (existing) {
      existing.count += 1;
      existing.lastAttempt = Date.now();
    } else {
      this.failedAttempts.set(key, {
        count: 1,
        firstAttempt: Date.now(),
        lastAttempt: Date.now(),
      });
    }

    this.logger.warn(`Failed login attempt for ${email} (attempt: ${this.failedAttempts.get(key).count})`);
  }

  /**
   * Check if account is currently locked
   */
  async isAccountLocked(email: string): Promise<boolean> {
    const key = email.toLowerCase();
    const attempts = this.failedAttempts.get(key);

    if (!attempts) return false;
    if (attempts.count < this.MAX_ATTEMPTS) return false;

    const timeSinceLock = Date.now() - attempts.firstAttempt;
    const isLocked = timeSinceLock < this.LOCKOUT_DURATION_MS;

    if (!isLocked) {
      // Lockout expired, clear attempts
      this.failedAttempts.delete(key);
      this.logger.log(`Account lockout expired for ${email}`);
    }

    return isLocked;
  }

  /**
   * Clear failed attempts for email (after successful login)
   */
  async clearFailedAttempts(email: string): Promise<void> {
    const key = email.toLowerCase();
    this.failedAttempts.delete(key);
    this.logger.log(`Cleared failed attempts for ${email}`);
  }

  /**
   * Get remaining time until lockout expires (ms)
   * Returns 0 if not locked
   */
  getRemainingLockoutTime(email: string): number {
    const key = email.toLowerCase();
    const attempts = this.failedAttempts.get(key);

    if (!attempts || attempts.count < this.MAX_ATTEMPTS) return 0;

    const elapsed = Date.now() - attempts.firstAttempt;
    const remaining = Math.max(0, this.LOCKOUT_DURATION_MS - elapsed);

    return remaining;
  }

  /**
   * Cleanup old entries (memory cleanup every hour)
   */
  private cleanup(): void {
    const now = Date.now();
    let deleted = 0;

    for (const [email, data] of this.failedAttempts) {
      // Keep entries for 1 hour after last attempt
      if (now - data.lastAttempt > 60 * 60 * 1000) {
        this.failedAttempts.delete(email);
        deleted += 1;
      }
    }

    if (deleted > 0) {
      this.logger.debug(`Cleanup: removed ${deleted} expired rate limit entries`);
    }
  }

  /**
   * Get current lockout stats (for monitoring)
   */
  getStats() {
    return {
      totalTracked: this.failedAttempts.size,
      locked: Array.from(this.failedAttempts.values()).filter(
        a => a.count >= this.MAX_ATTEMPTS,
      ).length,
    };
  }
}
