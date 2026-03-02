require('dotenv').config();

const express = require('express');
const socketIo = require('socket.io');
const http = require('http');
const helmet = require('helmet');
const cors = require('cors');
const logger = require('./utils/logger');

// Advanced Systems
const DatabaseManager = require('./config/DatabaseManager');
const AuthenticationSystem = require('./config/AuthenticationSystem');
const CacheManager = require('./utils/CacheManager');
const ValidationEngine = require('./utils/ValidationEngine');
const RateLimiter = require('./utils/RateLimiter');
const SecurityManager = require('./utils/SecurityManager');
const EventPublisher = require('./utils/EventPublisher');
const RequestInterceptor = require('./utils/RequestInterceptor');
const CircuitBreakerManager = require('./utils/CircuitBreaker').CircuitBreakerManager;
const { Queue, PriorityQueue } = require('./utils/Queue');
const { MiddlewareStack, createAuthMiddleware, createRateLimitMiddleware, createLoggingMiddleware } = require('./utils/MiddlewareStack');

// Route dependencies
const authRoutes = require('./routes/auth');
const translationRoutes = require('./routes/translation');
const hazardRoutes = require('./routes/hazards');
const alertRoutes = require('./routes/alerts');
const responderRoutes = require('./routes/responders');
const messagingRoutes = require('./routes/messaging');
const ErrorHandler = require('./middleware/errorHandler');
const initializeRealtimeEvents = require('./config/socket');

// Initialize advanced systems
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST']
  }
});

// Cache initialization
const cache = new CacheManager(1000, 3600000);

// Queue initialization
const jobQueue = new PriorityQueue({ name: 'MainQueue', concurrency: 5 });
const alertQueue = new Queue({ name: 'AlertQueue', concurrency: 10 });

// Middleware stack builder
const middlewareStack = new MiddlewareStack();

// Security & Middleware Setup
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Advanced request logging with correlation ID
app.use((req, res, next) => {
  req.id = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  req.startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - req.startTime;
    logger.info(`[${req.id}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`, {
      ip: req.ip,
      userAgent: req.get('user-agent')
    });
  });

  next();
});

// Custom rate limiting middleware using advanced RateLimiter
app.use((req, res, next) => {
  const key = req.ip || req.connection.remoteAddress;
  const result = RateLimiter.isLimited(key, 'tokenBucket', 100, 1000, 60000);

  res.set('X-RateLimit-Limit', '100');
  res.set('X-RateLimit-Remaining', result.remaining);
  res.set('X-RateLimit-Reset', result.resetIn);

  if (!result.allowed) {
    return res.status(429).json({
      error: 'Too many requests',
      retryAfter: result.resetIn
    });
  }

  next();
});

// Health Check with advanced metrics
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Assisto Backend API',
    version: '2.0.0',
    uptime: process.uptime(),
    database: DatabaseManager.getMetrics(),
    cache: cache.getStats(),
    circuitBreakers: CircuitBreakerManager.getAllStatuses(),
    queue: jobQueue.getMetrics()
  });
});

// Metrics endpoint
app.get('/metrics', (req, res) => {
  res.json({
    database: DatabaseManager.getMetrics(),
    cache: cache.getStats(),
    rateLimit: RateLimiter.cleanup(),
    requestMetrics: RequestInterceptor.getMetrics(),
    queues: {
      jobQueue: jobQueue.getMetrics(),
      alertQueue: alertQueue.getMetrics()
    }
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/translate', translationRoutes);
app.use('/api/hazards', hazardRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/responders', responderRoutes);
app.use('/api/messages', messagingRoutes);

// Real-time Events
app.set('io', io);
app.set('cache', cache);
app.set('jobQueue', jobQueue);
app.set('alertQueue', alertQueue);
app.set('authSystem', AuthenticationSystem);
app.set('circuitBreaker', CircuitBreakerManager);

initializeRealtimeEvents(io);

// Setup event subscriptions
EventPublisher.subscribe('alert:created', (data) => {
  logger.info('New alert created:', data);
  io.emit('alert:broadcast', data);
}, 10);

EventPublisher.subscribe('hazard:detected', (data) => {
  logger.info('Hazard detected:', data);
  io.emit('hazard:alert', data);
}, 8);

// Error Handling with advanced classification and recovery strategies
app.use(ErrorHandler.notFoundHandler());
app.use(ErrorHandler.middleware());

// Database Connection & Server Start
const startServer = async () => {
  try {
    // Connect to databases with advanced manager
    await DatabaseManager.connectMongoDB(process.env.MONGODB_URI);
    await DatabaseManager.connectPostgreSQL(process.env.POSTGRESQL_URL);
    await DatabaseManager.connectRedis(process.env.REDIS_URL);

    logger.info('✅ All databases connected successfully');
    logger.info(`📊 Database Metrics:`, DatabaseManager.getMetrics());

    // Setup periodic cleanup tasks
    const cleanupInterval = setInterval(() => {
      cache.cleanup();
      RateLimiter.cleanup();
      AuthenticationSystem.cleanupExpiredTokens();
    }, 60000); // Every minute

    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      logger.info(`🚀 Advanced backend running on port ${PORT}`);
      logger.info(`🔒 Security: AES-256 encryption enabled`);
      logger.info(`⚡ Performance: Advanced caching and queuing active`);
      logger.info(`📡 Real-time: WebSocket async event system ready`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
    });

    // Periodic metrics logging
    const metricsInterval = setInterval(() => {
      logger.debug('System Health:', {
        cache: cache.getStats(),
        rateLimit: 'active',
        circuitBreakers: CircuitBreakerManager.getAllStatuses().map(cb => ({
          name: cb.name,
          state: cb.state
        })),
        queues: {
          jobQueue: jobQueue.getMetrics(),
          alertQueue: alertQueue.getMetrics()
        }
      });
    }, 300000); // Every 5 minutes

  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGINT', async () => {
  logger.info('🔴 Shutting down gracefully...');
  
  // Gracefully close server
  server.close(async () => {
    logger.info('✅ HTTP server closed');
    
    // Disconnect databases
    await DatabaseManager.shutdown();
    logger.info('✅ Database connections closed');
    
    // Clear caches
    cache.clear();
    logger.info('✅ Cache cleared');
    
    process.exit(0);
  });

  // Force exit after 30 seconds
  setTimeout(() => {
    logger.error('⚠️ Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
});

startServer();

module.exports = app;
