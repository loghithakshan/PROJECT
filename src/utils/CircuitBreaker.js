/**
 * Advanced Circuit Breaker Pattern Implementation
 * Prevents cascading failures in distributed systems
 */

class CircuitBreaker {
  constructor(options = {}) {
    this.name = options.name || 'CircuitBreaker';
    this.failureThreshold = options.failureThreshold || 5;
    this.successThreshold = options.successThreshold || 2;
    this.timeout = options.timeout || 60000; // 60 seconds
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.metrics = {
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      lastError: null,
      lastErrorTime: null
    };
    this.consecutiveFailures = 0;
    this.consecutiveSuccesses = 0;
    this.openedAt = null;
  }

  /**
   * Execute function through circuit breaker
   */
  async execute(fn) {
    this.metrics.totalCalls++;

    if (this.state === 'OPEN') {
      if (Date.now() - this.openedAt > this.timeout) {
        this.state = 'HALF_OPEN';
        this.consecutiveSuccesses = 0;
      } else {
        throw new Error(`Circuit breaker is OPEN - ${this.name}`);
      }
    }

    try {
      const result = await fn();
      this._recordSuccess();
      return result;
    } catch (error) {
      this._recordFailure(error);
      throw error;
    }
  }

  /**
   * Record successful execution
   */
  _recordSuccess() {
    this.metrics.successfulCalls++;
    this.consecutiveFailures = 0;

    if (this.state === 'HALF_OPEN') {
      this.consecutiveSuccesses++;
      if (this.consecutiveSuccesses >= this.successThreshold) {
        this._close();
      }
    }
  }

  /**
   * Record failed execution
   */
  _recordFailure(error) {
    this.metrics.failedCalls++;
    this.metrics.lastError = error.message;
    this.metrics.lastErrorTime = new Date();
    this.consecutiveSuccesses = 0;
    this.consecutiveFailures++;

    if (this.consecutiveFailures >= this.failureThreshold) {
      this._open();
    }
  }

  /**
   * Open the circuit breaker
   */
  _open() {
    this.state = 'OPEN';
    this.openedAt = Date.now();
    console.warn(`Circuit breaker ${this.name} is now OPEN`);
  }

  /**
   * Close the circuit breaker
   */
  _close() {
    this.state = 'CLOSED';
    this.consecutiveFailures = 0;
    this.consecutiveSuccesses = 0;
    console.info(`Circuit breaker ${this.name} is now CLOSED`);
  }

  /**
   * Get circuit breaker status
   */
  getStatus() {
    return {
      name: this.name,
      state: this.state,
      metrics: this.metrics,
      consecutiveFailures: this.consecutiveFailures,
      consecutiveSuccesses: this.consecutiveSuccesses
    };
  }

  /**
   * Reset circuit breaker
   */
  reset() {
    this.state = 'CLOSED';
    this.consecutiveFailures = 0;
    this.consecutiveSuccesses = 0;
    this.metrics = {
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      lastError: null,
      lastErrorTime: null
    };
  }
}

/**
 * Circuit Breaker Manager for managing multiple breakers
 */
class CircuitBreakerManager {
  constructor() {
    this.breakers = new Map();
  }

  /**
   * Create or get circuit breaker
   */
  get(name, options = {}) {
    if (!this.breakers.has(name)) {
      this.breakers.set(name, new CircuitBreaker({ name, ...options }));
    }
    return this.breakers.get(name);
  }

  /**
   * Execute with circuit breaker
   */
  async execute(name, fn, options = {}) {
    const breaker = this.get(name, options);
    return breaker.execute(fn);
  }

  /**
   * Get all breaker statuses
   */
  getAllStatuses() {
    const statuses = [];
    for (const [name, breaker] of this.breakers) {
      statuses.push(breaker.getStatus());
    }
    return statuses;
  }

  /**
   * Reset all breakers
   */
  resetAll() {
    for (const breaker of this.breakers.values()) {
      breaker.reset();
    }
  }

  /**
   * Get breaker by name
   */
  getBreaker(name) {
    return this.breakers.get(name);
  }
}

module.exports = {
  CircuitBreaker,
  CircuitBreakerManager: new CircuitBreakerManager()
};
