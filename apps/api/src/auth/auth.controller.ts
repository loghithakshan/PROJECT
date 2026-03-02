import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterRequest, LoginRequest, TokenResponse } from '@core/types';

/**
 * Auth Controller: HTTP Endpoints for Zero-Trust Authentication
 * 
 * Endpoints:
 * POST /auth/register - Register new user with Ed25519 public key
 * POST /auth/login - Login with nonce signature
 * POST /auth/challenge - Get Fiat-Shamir challenge for signing
 * POST /auth/refresh - Refresh JWT access token
 * POST /auth/logout - Revoke tokens
 * GET  /auth/me - Get current user profile
 */
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * @route POST /auth/register
   * @description Register new user with Ed25519 public key
   *
   * @body {
   *   "publicKeyEd25519": "abc123...def456",  // 64 hex chars (32 bytes)
   *   "federatedDeviceHash": "device_hash"    // Optional: federated learning device ID
   * }
   *
   * @returns { accessToken, refreshToken, expiresIn }
   *
   * @security
   * - Public key is stored; private key never transmitted
   * - Client generates keypair locally (edge device)
   * - User ID assigned automatically via UUID
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerRequest: RegisterRequest): Promise<TokenResponse> {
    return this.authService.register(registerRequest);
  }

  /**
   * @route POST /auth/challenge
   * @description Get Fiat-Shamir ZKP challenge for signing
   *
   * Client must:
   * 1. Request challenge from this endpoint
   * 2. Sign challenge with their Ed25519 private key
   * 3. Submit signature in login request
   *
   * @query { publicKeyEd25519: string }
   *
   * @returns { nonce, expiresAt }
   *
   * @security
   * - Challenge valid for 5 minutes only
   * - One-time use (consumed after login)
   * - Fiat-Shamir variant prevents replay attacks
   */
  @Post('challenge')
  @HttpCode(HttpStatus.OK)
  async getLoginChallenge(@Body() body: { publicKeyEd25519: string }) {
    return this.authService.generateLoginChallenge(body.publicKeyEd25519);
  }

  /**
   * @route POST /auth/login
   * @description Login with Ed25519 signature of challenge
   *
   * @body {
   *   "publicKeyEd25519": "abc123...def456",
   *   "nonce": "challenge_from_previous_endpoint",
   *   "signature": "ed25519_signature_of_nonce"
   * }
   *
   * @returns { accessToken, refreshToken, expiresIn }
   *
   * @security
   * - Signature must be valid Ed25519 signature
   * - Rate limited: 5 failed attempts → 15 min lockout
   * - Timing-safe verification (prevents timing attacks)
   * - Nonce one-time use (prevents replay)
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginRequest: LoginRequest): Promise<TokenResponse> {
    return this.authService.login(loginRequest);
  }

  /**
   * @route POST /auth/refresh
   * @description Refresh access token using refresh token
   *
   * @body {
   *   "refreshToken": "long_lived_jwt_from_login"
   * }
   *
   * @returns { accessToken, refreshToken, expiresIn }
   *
   * @security
   * - Refresh token validated (can be revoked)
   * - New refresh token issued (refresh token rotation)
   * - Old refresh token invalidated after use
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() body: { refreshToken: string }): Promise<TokenResponse> {
    return this.authService.refreshToken(body.refreshToken);
  }

  /**
   * @route POST /auth/logout
   * @description Revoke all tokens for current user
   *
   * @security
   * - Requires valid access token
   * - Clears all active sessions
   * - Logged to audit ledger
   */
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Request() req: any): Promise<void> {
    const userId = req.user.sub;  // Extracted from JWT by guard
    return this.authService.logout(userId);
  }

  /**
   * @route GET /auth/me
   * @description Get current authenticated user profile
   *
   * @returns { id, publicKeyEd25519, role, status, createdAt }
   *
   * @security
   * - Requires valid access token
   * - Returns minimal user info (no private keys)
   */
  @Get('me')
  @HttpCode(HttpStatus.OK)
  async getCurrentUser(@Request() req: any) {
    const { sub: userId } = req.user;
    // TODO: Fetch and return user profile
    return {
      id: userId,
      role: req.user.role,
    };
  }
}
