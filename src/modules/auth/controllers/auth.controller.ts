import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Res,
  BadRequestException,
  HttpCode,
  HttpStatus,
  Logger,
  Get,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt.guard';
import { AuthService } from '../services/auth.service';
import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  ZKChallengeDto,
  ZKVerifyDto,
  LogoutDto,
} from '../dtos';
import { Request, Response } from 'express';

/**
 * ===== AUTH CONTROLLER =====
 * REST endpoints for authentication:
 * - POST /auth/register - Create new user
 * - POST /auth/login - Initiate login (password)
 * - POST /auth/zk-verify - Verify ZK challenge (second factor)
 * - POST /auth/refresh - Refresh JWT token
 * - POST /auth/logout - Revoke token
 * - GET /auth/me - Get current user
 */
@ApiTags('Authentication')
@Controller('api/v1/auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private authService: AuthService) {}

  /**
   * Register new user with email and password
   * 
   * Creates:
   * - User account with Argon2id hashed password
   * - Ed25519 keypair for ZK proofs
   * - Initial session
   * 
   * Returns: JWT access + refresh tokens
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.logger.log(`Register attempt: ${dto.email}`);
    const result = await this.authService.register(dto);

    // Set refresh token in HTTP-only cookie (secure transport)
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return {
      userId: result.userId,
      email: result.email,
      accessToken: result.accessToken,
      message: result.message,
    };
  }

  /**
   * Initiate login flow
   * 
   * Password verification step - generates ZK challenge for 2FA
   * 
   * Flow:
   * 1. Client sends email + password
   * 2. Server verifies password (Argon2id)
   * 3. Server generates Fiat-Shamir challenge
   * 4. Client signs challenge with private key
   * 5. Client sends back for verification (next endpoint)
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({
    status: 200,
    description: 'Challenge generated, proceed to /auth/zk-verify',
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 429, description: 'Account locked (too many attempts)' })
  async login(@Body() dto: LoginDto) {
    this.logger.log(`Login attempt: ${dto.email}`);
    return this.authService.login(dto);
  }

  /**
   * Verify Zero-Knowledge challenge (second factor)
   * 
   * Proof of password knowledge without transmission:
   * - Client signs challenge with private key (Ed25519)
   * - Server verifies signature with public key
   * - No password in this request
   * 
   * Returns: JWT tokens if signature valid
   */
  @Post('zk-verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify ZK challenge and complete login' })
  @ApiResponse({ status: 200, description: 'Authentication successful' })
  @ApiResponse({ status: 401, description: 'Invalid ZK response' })
  async verifyZKChallenge(
    @Body() dto: ZKVerifyDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!dto.signature || !dto.challenge) {
      throw new BadRequestException('Missing signature or challenge');
    }

    this.logger.log(`ZK verification: user ${dto.userId}`);
    const result = await this.authService.verifyZKChallenge(dto);

    // Set refresh token in HTTP-only cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return {
      userId: result.userId,
      accessToken: result.accessToken,
      expiresIn: result.expiresIn,
    };
  }

  /**
   * Request new ZK challenge for password-less re-auth
   * 
   * Allows users to login again without password
   * (using existing session + private key)
   */
  @Post('zk-challenge')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request ZK challenge for password-less auth' })
  @ApiResponse({ status: 200, description: 'Challenge generated' })
  async requestZKChallenge(@Body() dto: ZKChallengeDto) {
    return this.authService.requestZKChallenge(dto);
  }

  /**
   * Refresh JWT access token
   * 
   * Uses refresh token (stored in HTTP-only cookie or body)
   * Returns new access token + optional new refresh token
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get new access token using refresh token' })
  @ApiResponse({ status: 200, description: 'Token refreshed' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refresh(
    @Body() dto: RefreshTokenDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Fallback to cookie if body is empty
    const refreshToken = dto.refreshToken || (req.cookies?.refreshToken as string);
    if (!refreshToken) {
      throw new BadRequestException('Refresh token required');
    }

    const result = await this.authService.refreshToken({ refreshToken });

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return { accessToken: result.accessToken };
  }

  /**
   * Logout - revoke current token
   * 
   * Adds token to blacklist, clears session
   */
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout and revoke tokens' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const userId = (req.user as any).userId;
    const token = req.headers.authorization?.split(' ')[1];

    this.logger.log(`Logout: user ${userId}`);
    const result = await this.authService.logout(userId, token);

    res.clearCookie('refreshToken');
    return result;
  }

  /**
   * Get current authenticated user
   * 
   * Requires valid JWT in Authorization header
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCurrentUser(@Req() req: Request) {
    const user = req.user;
    return {
      userId: (user as any).userId,
      email: (user as any).email,
      role: (user as any).role,
      publicKey: (user as any).publicKey,
    };
  }
}
