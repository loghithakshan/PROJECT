import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard } from './jwt-auth.guard';

/**
 * Auth Module: Zero-Trust Authentication Foundation
 * 
 * Exports:
 * - AuthService: Business logic for registration, login, ZKP challenges
 * - JwtAuthGuard: @UseGuards(JwtAuthGuard) protects endpoints
 * - HttpModule: Fetch external APIs (if needed)
 * 
 * Configuration:
 * - JWT_SECRET: Short-lived token signing key (5 min TTL)
 * - JWT_REFRESH_SECRET: Long-lived token signing key (7 day TTL)
 * - Redis: Cache for nonces, challenges, rate-limiting
 */
@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
      signOptions: {
        expiresIn: '5m',
        algorithm: 'HS256',
      },
    }),
  ],
  providers: [AuthService, JwtStrategy, JwtAuthGuard],
  controllers: [AuthController],
  exports: [AuthService, JwtAuthGuard],
})
export class AuthModule {}
