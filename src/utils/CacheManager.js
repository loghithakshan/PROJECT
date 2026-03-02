/**
 * Advanced Custom Caching System
 * Multi-tier caching with LRU eviction, cache invalidation strategies
 */

class CacheManager {
  constructor(maxSize = 1000, ttl = 3600000) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.defaultTTL = ttl;
    this.hits = 0;
    this.misses = 0;
    this.accessQueue = [];
  }

  /**
   * Get item from cache with LRU tracking
   */
  get(key) {
    if (!this.cache.has(key)) {
      this.misses++;
      return null;
    }

    const item = this.cache.get(key);
    
    // Check if expired
    if (item.expiresAt && item.expiresAt < Date.now()) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    // Update LRU
    this.hits++;
    this._updateAccessTime(key);
    return item.value;
  }

  /**
   * Set item in cache with automatic TTL
   */
  set(key, value, ttl = this.defaultTTL) {
    // Check cache size and evict if necessary
    if (this.cache.size >= this.maxSize) {
      this._evictLRU();
    }

    this.cache.set(key, {
      value,
      createdAt: Date.now(),
      expiresAt: ttl ? Date.now() + ttl : null,
      accessCount: 0
    });

    this._updateAccessTime(key);
  }

  /**
   * Delete item from cache
   */
  delete(key) {
    return this.cache.delete(key);
  }

  /**
   * Invalidate pattern (e.g., 'user:*')
   */
  invalidatePattern(pattern) {
    const regex = new RegExp(`^${pattern.replace('*', '.*')}$`);
    let count = 0;

    for (const [key] of this.cache) {
      if (regex.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }

    return count;
  }

  /**
   * Clear all cache
   */
  clear() {
    this.cache.clear();
    this.accessQueue = [];
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hits: this.hits,
      misses: this.misses,
      hitRate: this.hits / (this.hits + this.misses) || 0
    };
  }

  /**
   * Cleanup expired entries
   */
  cleanup() {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, item] of this.cache) {
      if (item.expiresAt && item.expiresAt < now) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * Update access time for LRU
   */
  _updateAccessTime(key) {
    const index = this.accessQueue.indexOf(key);
    if (index > -1) {
      this.accessQueue.splice(index, 1);
    }
    this.accessQueue.push(key);
  }

  /**
   * Evict least recently used item
   */
  _evictLRU() {
    if (this.accessQueue.length > 0) {
      const lruKey = this.accessQueue.shift();
      this.cache.delete(lruKey);
    }
  }
}

module.exports = CacheManager;
