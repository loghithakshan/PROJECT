/**
 * Advanced Rate Limiting System
 * Sliding window, token bucket algorithm, distributed rate limiting
 */

class RateLimiter {
  constructor() {
    this.stores = new Map(); // Per-user stores
    this.globalStore = new Map(); // Global rate limiting
    this.strategies = {
      slidingWindow: this.slidingWindow.bind(this),
      tokenBucket: this.tokenBucket.bind(this),
      fixedWindow: this.fixedWindow.bind(this)
    };
  }

  /**
   * Sliding window rate limiting
   */
  slidingWindow(key, limit, windowMs) {
    if (!this.stores.has(key)) {
      this.stores.set(key, {
        requests: [],
        strategy: 'slidingWindow'
      });
    }

    const store = this.stores.get(key);
    const now = Date.now();
    const windowStart = now - windowMs;

    // Remove old requests outside window
    store.requests = store.requests.filter(time => time > windowStart);

    if (store.requests.length >= limit) {
      return {
        allowed: false,
        remaining: 0,
        resetIn: store.requests[0] + windowMs - now
      };
    }

    store.requests.push(now);

    return {
      allowed: true,
      remaining: limit - store.requests.length,
      resetIn: windowMs
    };
  }

  /**
   * Token bucket rate limiting
   */
  tokenBucket(key, capacity, refillRate, refillIntervalMs) {
    if (!this.stores.has(key)) {
      this.stores.set(key, {
        tokens: capacity,
        lastRefill: Date.now(),
        strategy: 'tokenBucket',
        capacity,
        refillRate,
        refillIntervalMs
      });
    }

    const store = this.stores.get(key);
    const now = Date.now();
    const timePassed = now - store.lastRefill;
    const intervalsElapsed = Math.floor(timePassed / refillIntervalMs);

    if (intervalsElapsed > 0) {
      store.tokens = Math.min(
        capacity,
        store.tokens + (intervalsElapsed * refillRate)
      );
      store.lastRefill = now - (timePassed % refillIntervalMs);
    }

    if (store.tokens >= 1) {
      store.tokens--;
      return {
        allowed: true,
        remaining: Math.floor(store.tokens),
        resetIn: refillIntervalMs
      };
    }

    return {
      allowed: false,
      remaining: 0,
      resetIn: Math.ceil((refillIntervalMs - (timePassed % refillIntervalMs)) / 1000)
    };
  }

  /**
   * Fixed window rate limiting
   */
  fixedWindow(key, limit, windowMs) {
    if (!this.stores.has(key)) {
      this.stores.set(key, {
        count: 0,
        windowStart: Date.now(),
        strategy: 'fixedWindow'
      });
    }

    const store = this.stores.get(key);
    const now = Date.now();

    // Check if window has expired
    if (now - store.windowStart >= windowMs) {
      store.count = 0;
      store.windowStart = now;
    }

    if (store.count >= limit) {
      return {
        allowed: false,
        remaining: 0,
        resetIn: Math.ceil((store.windowStart + windowMs - now) / 1000)
      };
    }

    store.count++;

    return {
      allowed: true,
      remaining: limit - store.count,
      resetIn: Math.ceil((store.windowStart + windowMs - now) / 1000)
    };
  }

  /**
   * Global rate limiting (across all users)
   */
  checkGlobalLimit(limit, windowMs) {
    const key = 'global';
    const now = Date.now();

    if (!this.globalStore.has(key)) {
      this.globalStore.set(key, { requests: [] });
    }

    const store = this.globalStore.get(key);
    store.requests = store.requests.filter(time => time > now - windowMs);

    if (store.requests.length >= limit) {
      return { allowed: false, remaining: 0 };
    }

    store.requests.push(now);
    return { allowed: true, remaining: limit - store.requests.length };
  }

  /**
   * Check if key is rate limited
   */
  isLimited(key, strategy = 'slidingWindow', ...args) {
    if (this.strategies[strategy]) {
      return this.strategies[strategy](key, ...args);
    }
    throw new Error(`Unknown rate limiting strategy: ${strategy}`);
  }

  /**
   * Reset rate limit for key
   */
  reset(key) {
    this.stores.delete(key);
  }

  /**
   * Reset all rate limits
   */
  resetAll() {
    this.stores.clear();
    this.globalStore.clear();
  }

  /**
   * Get rate limit stats for key
   */
  getStats(key) {
    return this.stores.get(key) || null;
  }

  /**
   * Cleanup old entries
   */
  cleanup() {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, store] of this.stores) {
      if (store.strategy === 'slidingWindow') {
        const oldLength = store.requests.length;
        store.requests = store.requests.filter(time => time > now - 3600000); // 1 hour
        if (oldLength !== store.requests.length) cleaned++;
      }
    }

    return cleaned;
  }
}

module.exports = new RateLimiter();
