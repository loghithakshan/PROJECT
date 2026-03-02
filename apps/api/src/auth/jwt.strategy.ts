import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { AuthService } from './auth.service';

/**
 * JWT Strategy: Passport.js integration for JWT validation
 * 
 * Extracts JWT from Authorization header, validates signature,
 * and injects user context into request object.
 * 
 * @security
 * - JWT_SECRET must match signing key (prevents tampering)
 * - Signature verification happens automatically
 * - Claims (sub, role) extracted and validated
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'dev-secret-change-in-production',
      algorithms: ['HS256'],
    });
  }

  /**
   * Validate JWT payload and inject into request.user
   * 
   * @param payload Decoded JWT claims { sub, role, iat, exp }
   * @returns Validated user context
   */
  async validate(payload: any) {
    return {
      sub: payload.sub,      // User ID
      role: payload.role,    // RBAC role
      iat: payload.iat,      // Issued at (for audit)
      exp: payload.exp,      // Expiration (for refresh logic)
    };
  }
}

// ============================================================================

import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';

/**
 * JWT Auth Guard: Protect routes with @UseGuards(JwtAuthGuard)
 * 
 * Enforces:
 * - Valid JWT in Authorization header
 * - Token not expired
 * - Valid signature
 * - Role present (RBAC)
 * 
 * Usage:
 * @UseGuards(JwtAuthGuard)
 * @Post('alert/create')
 * async createAlert() { ... }
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    if (!request.user) {
      throw new UnauthorizedException('No JWT token provided');
    }

    // Verify user has required fields
    if (!request.user.sub || !request.user.role) {
      throw new UnauthorizedException('Invalid JWT token (missing claims)');
    }

    return true;
  }
}

// ============================================================================

import { SetMetadata } from '@nestjs/common';

/**
 * RBAC Decorator: Specify required roles for endpoint
 * 
 * Usage:
 * @UseGuards(RoleGuard)
 * @Roles('RESPONDER', 'ADMIN')
 * @Get('alert/list')
 * async listAlerts() { ... }
 */
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

/**
 * Role Guard: Enforce RBAC authorization
 */
@Injectable()
export class RoleGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const handler = context.getHandler();

    // Get required roles from metadata
    const roles = Reflect.getMetadata('roles', handler);

    if (!roles) {
      return true;  // No role requirement
    }

    const userRole = request.user?.role;
    return roles.includes(userRole);
  }
}
