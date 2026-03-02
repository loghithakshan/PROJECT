import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from '../../database/prisma.module';
import { CryptoModule } from '../../shared/crypto/crypto.module';
import { AuthService } from './services/auth.service';
import { AuthController } from './controllers/auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt.guard';
import { ZeroKnowledgeService } from './services/zero-knowledge.service';
import { RateLimitService } from './services/rate-limit.service';

/**
 * ===== AUTH MODULE (Post-Quantum Secure) =====
 * Handles: JWT tokens, Argon2id password hashing, Ed25519 signing,
 * Zero-knowledge proof challenges, rate limiting, immutable audit logs
 */
@Module({
  imports: [
    ConfigModule.forRoot(),
    PrismaModule,
    CryptoModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRATION') || '15m',
          algorithm: 'HS256',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    AuthService,
    JwtStrategy,
    JwtAuthGuard,
    ZeroKnowledgeService,
    RateLimitService,
  ],
  controllers: [AuthController],
  exports: [AuthService, JwtAuthGuard],
})
export class AuthModule {}
