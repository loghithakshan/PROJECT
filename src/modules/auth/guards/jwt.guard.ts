import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

/**
 * ===== JWT AUTH GUARD =====
 * Validates JWT token in Authorization header
 * 
 * Usage in controller:
 * @UseGuards(JwtAuthGuard)
 * @ApiBearerAuth()
 * async myRoute(@Req() req) { }
 * 
 * Token format: "Bearer <jwt_token>"
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);

    if (!token) {
      this.logger.warn('No token provided');
      throw new UnauthorizedException('No token provided');
    }

    try {
      // Verify token signature + expiration
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get('JWT_SECRET'),
      });

      // Attach user to request for use in controller
      request.user = payload;
      this.logger.debug(`Token verified for user ${payload.userId}`);
      return true;
    } catch (error) {
      this.logger.warn(`Token verification failed: ${error.message}`);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  /**
   * Extract token from "Bearer <token>" format
   */
  private extractToken(request: any): string | undefined {
    const authHeader = request.headers?.authorization;
    if (!authHeader) return undefined;

    const [scheme, token] = authHeader.split(' ');
    if (scheme !== 'Bearer') return undefined;

    return token;
  }
}
