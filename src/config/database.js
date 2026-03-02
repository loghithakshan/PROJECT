const mongoose = require('mongoose');
const { Pool } = require('pg');
const redis = require('redis');
const logger = require('../utils/logger');

let mongoConnection;
let pgConnection;
let redisClient;

const connectMongoDB = async () => {
  try {
    mongoConnection = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    logger.info('MongoDB connected successfully');
    return mongoConnection;
  } catch (error) {
    logger.error('MongoDB connection failed:', error);
    throw error;
  }
};

const connectPostgreSQL = async () => {
  try {
    pgConnection = new Pool({
      connectionString: process.env.POSTGRESQL_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Test connection
    const client = await pgConnection.connect();
    client.release();
    logger.info('PostgreSQL connected successfully');
    return pgConnection;
  } catch (error) {
    logger.error('PostgreSQL connection failed:', error);
    throw error;
  }
};

const connectRedis = async () => {
  try {
    redisClient = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 50, 500)
      }
    });

    redisClient.on('error', (err) => logger.error('Redis client error:', err));
    redisClient.on('connect', () => logger.info('Redis connected successfully'));

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    logger.error('Redis connection failed:', error);
    throw error;
  }
};

const connectDatabases = async () => {
  try {
    await connectMongoDB();
    await connectPostgreSQL();
    await connectRedis();
    logger.info('All databases connected successfully');
  } catch (error) {
    logger.error('Database connection error:', error);
    throw error;
  }
};

const getMongoConnection = () => mongoConnection;
const getPostgreSQLConnection = () => pgConnection;
const getRedisClient = () => redisClient;

// Export functions for graceful disconnection
const disconnect = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      logger.info('MongoDB disconnected');
    }
    if (pgConnection) {
      await pgConnection.end();
      logger.info('PostgreSQL disconnected');
    }
    if (redisClient) {
      await redisClient.quit();
      logger.info('Redis disconnected');
    }
  } catch (error) {
    logger.error('Error during disconnect:', error);
  }
};

module.exports = {
  connectDatabases,
  getMongoConnection,
  getPostgreSQLConnection,
  getRedisClient,
  disconnect
};
