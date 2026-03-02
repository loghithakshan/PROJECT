/**
 * Advanced Custom Database Connection Manager
 * Connection pooling, retry logic, and circuit breaker pattern
 */
const mongoose = require('mongoose');
const { EventEmitter } = require('events');

class DatabaseManager extends EventEmitter {
  constructor() {
    super();
    this.connections = {};
    this.retryConfig = {
      maxRetries: 5,
      retryDelay: 1000,
      backoffMultiplier: 2
    };
    this.circuitBreaker = {
      failures: 0,
      threshold: 5,
      timeout: 60000,
      state: 'CLOSED'
    };
    this.metrics = {
      connections: 0,
      queries: 0,
      avgResponseTime: 0,
      errors: 0
    };
  }

  /**
   * Connect to MongoDB with resilience patterns
   */
  async connectMongoDB(uri, options = {}) {
    if (this.circuitBreaker.state === 'OPEN') {
      throw new Error('Circuit breaker OPEN - Cannot connect');
    }

    const mergedOptions = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 20,
      minPoolSize: 5,
      socketTimeoutMS: 45000,
      ...options
    };

    let lastError;
    let delay = this.retryConfig.retryDelay;

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        const connection = await this._attemptConnection(uri, mergedOptions);
        this.circuitBreaker.failures = 0;
        this.circuitBreaker.state = 'CLOSED';
        this.connections.mongoose = connection;
        this._setupConnectionMonitoring(connection);
        this.emit('connected', 'mongodb');
        return connection;
      } catch (error) {
        lastError = error;
        this.circuitBreaker.failures++;
        
        if (attempt < this.retryConfig.maxRetries) {
          await this._sleep(delay);
          delay *= this.retryConfig.backoffMultiplier;
        }
      }
    }

    this.circuitBreaker.state = 'OPEN';
    this.metrics.errors++;
    throw lastError;
  }

  /**
   * Advanced PostgreSQL connection with queue management
   */
  async connectPostgreSQL(connectionString, options = {}) {
    const Pool = require('pg').Pool;
    
    const poolConfig = {
      connectionString,
      max: 30,
      min: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      statement_timeout: 30000,
      query_timeout: 30000,
      ...options
    };

    try {
      const pool = new Pool(poolConfig);

      // Custom query execution with metrics
      pool._originalQuery = pool.query;
      pool.query = this._createMetricsWrapper(pool._originalQuery, pool);

      // Error handling
      pool.on('error', (error) => {
        console.error('PostgreSQL Pool Error:', error);
        this.metrics.errors++;
      });

      const client = await pool.connect();
      client.release();
      this.connections.postgres = pool;
      this.metrics.connections++;
      this.emit('connected', 'postgresql');
      return pool;
    } catch (error) {
      this.metrics.errors++;
      throw error;
    }
  }

  /**
   * Advanced Redis connection with automatic retry
   */
  async connectRedis(url, options = {}) {
    const redis = require('redis');

    const client = redis.createClient({
      url: url || 'redis://localhost:6379',
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) return new Error('Max retries exceeded');
          return Math.min(retries * 50, 500);
        }
      },
      ...options
    });

    client.on('error', (error) => {
      console.error('Redis Error:', error);
      this.metrics.errors++;
    });

    client.on('connect', () => {
      this.metrics.connections++;
      this.emit('connected', 'redis');
    });

    await client.connect();
    this.connections.redis = client;
    return client;
  }

  /**
   * Custom metrics wrapper for query monitoring
   */
  _createMetricsWrapper(originalQuery, pool) {
    return async (...args) => {
      const startTime = Date.now();
      try {
        const result = await originalQuery.apply(pool, args);
        this.metrics.queries++;
        const duration = Date.now() - startTime;
        this._updateAvgResponseTime(duration);
        return result;
      } catch (error) {
        this.metrics.errors++;
        throw error;
      }
    };
  }

  /**
   * Setup connection monitoring and health checks
   */
  _setupConnectionMonitoring(connection) {
    connection.on('connected', () => console.log('MongoDB connected'));
    connection.on('error', (error) => {
      this.metrics.errors++;
      console.error('MongoDB error:', error);
    });
    connection.on('disconnected', () => {
      console.warn('MongoDB disconnected');
    });
  }

  /**
   * Helper to attempt connection
   */
  _attemptConnection(uri, options) {
    return mongoose.connect(uri, options);
  }

  /**
   * Update rolling average response time
   */
  _updateAvgResponseTime(duration) {
    const totalQueries = this.metrics.queries;
    this.metrics.avgResponseTime = 
      (this.metrics.avgResponseTime * (totalQueries - 1) + duration) / totalQueries;
  }

  /**
   * Sleep helper for retry delays
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get health metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      circuitBreaker: this.circuitBreaker,
      connections: Object.keys(this.connections)
    };
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    try {
      if (this.connections.mongoose) {
        await this.connections.mongoose.disconnect();
      }
      if (this.connections.postgres) {
        await this.connections.postgres.end();
      }
      if (this.connections.redis) {
        await this.connections.redis.quit();
      }
      console.log('All connections closed gracefully');
    } catch (error) {
      console.error('Error during shutdown:', error);
    }
  }
}

module.exports = new DatabaseManager();
