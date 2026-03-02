import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../database/prisma.service';

/**
 * ===== JWT STRATEGY =====
 * Passport strategy for JWT validation
 * 
 * Automatically called by @UseGuards(JwtAuthGuard)
 * Validates token signature + extracts payload
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  /**
   * Validate token payload
   * Called after JWT signature verification
   */
  async validate(payload: any) {
    // Verify user still exists and is active
    const user = await this.prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user || user.status === 'BANNED') {
      throw new UnauthorizedException('User not found or banned');
    }

    // Return user object (attached to request.user)
    return {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      publicKey: payload.publicKey,
    };
  }
}
