import { IsEmail, IsString, MinLength, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * ===== AUTH DTOs (Data Transfer Objects) =====
 * Validated request/response schemas
 */

/**
 * Register request
 */
export class RegisterDto {
  @ApiProperty({ example: 'user@example.com', description: 'User email address' })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'SecurePassword123!',
    description: 'Password (min 12 chars, mixed case, number, special)',
  })
  @IsString()
  @MinLength(12)
  password: string;

  @ApiProperty({ example: 'John Doe', required: false })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({ example: 'Doe', required: false })
  @IsOptional()
  @IsString()
  lastName?: string;
}

/**
 * Login request (password verification)
 */
export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePassword123!' })
  @IsString()
  password: string;
}

/**
 * ZK Challenge request (password-less auth)
 */
export class ZKChallengeDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  userId: string;
}

/**
 * ZK Verification request (sign challenge with private key)
 */
export class ZKVerifyDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  userId: string;

  @ApiProperty({ example: 'a1b2c3d4...', description: 'Challenge hex string' })
  @IsString()
  challenge: string;

  @ApiProperty({
    example: 'sig_hex_...',
    description: 'Ed25519 signature of challenge (hex)',
  })
  @IsString()
  signature: string;
}

/**
 * Refresh token request
 */
export class RefreshTokenDto {
  @ApiProperty({
    example: 'eyJhbGc...',
    description: 'Refresh token (from /login or cookie)',
    required: false,
  })
  @IsOptional()
  @IsString()
  refreshToken?: string;
}

/**
 * Logout request
 */
export class LogoutDto {
  @ApiProperty({
    example: 'true',
    required: false,
    description: 'Logout from all devices',
  })
  @IsOptional()
  allDevices?: boolean;
}

/**
 * Auth response with tokens
 */
export class AuthResponseDto {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ description: 'JWT access token (expires 15m)' })
  accessToken: string;

  @ApiProperty({ description: 'JWT refresh token (expires 7d)' })
  refreshToken: string;

  @ApiProperty({ required: false })
  expiresIn?: string;
}

/**
 * Current user response
 */
export class UserProfileDto {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ example: 'user', enum: ['user', 'responder', 'admin'] })
  role: 'user' | 'responder' | 'admin';

  @ApiProperty({ description: 'Ed25519 public key (hex)' })
  publicKey: string;
}

export * from './index';
