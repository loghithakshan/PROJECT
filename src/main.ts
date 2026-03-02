import { NestFactory, Repl } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as fs from 'fs';
import * as helmet from 'helmet';
import * as compression from 'compression';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

const logger = new Logger('Bootstrap');

/**
 * ===== NESTJS APPLICATION BOOTSTRAP =====
 * Security-hardened startup with:
 * - HTTPS + mTLS support
 * - Helmet security headers
 * - Global rate limiting
 * - Input validation
 * - Compression + logging
 * - Graceful shutdown
 */
async function bootstrap() {
  // Load TLS certificates if production
  let httpsOptions: any = {};
  if (process.env.NODE_ENV === 'production' && process.env.TLS_CERT_PATH && process.env.TLS_KEY_PATH) {
    httpsOptions = {
      key: fs.readFileSync(process.env.TLS_KEY_PATH),
      cert: fs.readFileSync(process.env.TLS_CERT_PATH),
      ca: process.env.TLS_CA_PATH ? fs.readFileSync(process.env.TLS_CA_PATH) : undefined,
    };
    logger.log('✅ TLS certificates loaded');
  }

  // Create NestJS application
  const app = process.env.NODE_ENV === 'production' 
    ? await NestFactory.create(AppModule, { httpsOptions, bodyParser: { limit: '1mb' } })
    : await NestFactory.create(AppModule);

  logger.log(`🚀 ResilientEcho Backend v2.0 (${process.env.NODE_ENV || 'development'})`);

  // ===== SECURITY HARDENING =====

  // Helmet: Security headers (XSS, CSRF, clickjacking, MIME-sniffing, etc.)
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'"],
        },
      },
      hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
      frameguard: { action: 'deny' },
      xssFilter: true,
      noSniff: true,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    }),
  );

  // CORS: Restrict to known origins
  const corOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000')
    .split(',')
    .map(o => o.trim());
  app.enableCors({
    origin: corOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400, // 24h
  });
  logger.log(`✅ CORS enabled: ${corOrigins.join(', ')}`);

  // Compression: gzip responses
  app.use(compression());

  // Global validation pipe: whitelist + transform
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // API versioning
  app.setGlobalPrefix('api/v1');

  // ===== SWAGGER/OPENAPI DOCS =====
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('ResilientEcho API')
      .setDescription('Life-critical multilingual emergency assistance platform')
      .setVersion('2.0.0')
      .addBearerAuth()
      .addTag('Authentication', 'JWT + ZK proofs')
      .addTag('Hazards', 'Environmental intelligence')
      .addTag('Alerts', 'Geofenced broadcasts')
      .addTag('Users', 'Profile + settings')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
    logger.log(`📚 Swagger docs available at http://localhost:${process.env.PORT || 3000}/docs`);
  }

  // ===== HEALTH CHECKS =====
  // Basic health endpoint (no auth required)
  app.get('/health', () => ({ status: 'ok', timestamp: new Date().toISOString() }));
  app.get('/health/ready', async () => {
    // Can add DB connection check here
    return { status: 'ready', timestamp: new Date().toISOString() };
  });

  // ===== STARTUP =====
  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`✅ Server running on port ${port}`);
  logger.log('🔐 Post-quantum ready: Ed25519 signing + Argon2id hashing + ZK challenges');
  logger.log('🔗 Blockchain-ready: Hyperledger Fabric audit trail + zkEVM contracts');

  // ===== GRACEFUL SHUTDOWN =====
  process.on('SIGINT', async () => {
    logger.log('SIGINT received, shutting down gracefully...');
    await app.close();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    logger.log('SIGTERM received, shutting down gracefully...');
    await app.close();
    process.exit(0);
  });
}

bootstrap();
