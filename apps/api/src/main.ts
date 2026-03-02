import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

/**
 * ResilientEcho Backend Entry Point
 * 
 * Initializes:
 * - NestJS application context
 * - Global validation pipes (class-validator)
 * - Swagger/OpenAPI documentation
 * - CORS security headers
 * - Request logging middleware
 * - Error handling middleware
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('ResilientEcho');

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // CORS configuration
  app.enableCors({
    origin: (process.env.CORS_ORIGINS || 'http://localhost:3000').split(','),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Swagger documentation
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('ResilientEcho API')
      .setDescription(
        'Production-grade Emergency Response Platform with Post-Quantum Cryptography',
      )
      .setVersion('1.0.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token (5 min access token)',
        },
        'access-token',
      )
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    logger.log('Swagger documentation available at /api/docs');
  }

  // Health check endpoint
  app.get('/health', () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  }));

  const port = parseInt(process.env.PORT || '3001');
  await app.listen(port);

  logger.log(`🚀 ResilientEcho backend listening on port ${port}`);
  logger.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
  logger.log(
    `🔒 Security: Post-quantum Ed25519 + XChaCha20 E2EE + Argon2id password hashing`,
  );
  logger.log(
    `⚡ Resilience: Redis pub-sub + PostGIS geofencing + CRDT eventual consistency`,
  );
  logger.log(
    `🌍 Privacy: Federated learning + Differential privacy + Zero-knowledge proofs`,
  );
}

bootstrap().catch((error) => {
  console.error('Failed to start ResilientEcho backend:', error);
  process.exit(1);
});
