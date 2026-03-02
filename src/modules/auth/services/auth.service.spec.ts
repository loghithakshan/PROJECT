import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth.service';
import { PrismaService } from '../../../../database/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ZeroKnowledgeService } from '../zero-knowledge.service';
import { RateLimitService } from '../rate-limit.service';
import { CryptoService } from '../../../../shared/crypto/crypto.service';
import { ConflictException, UnauthorizedException } from '@nestjs/common';

/**
 * ===== AUTH SERVICE UNIT TESTS =====
 * Test user registration, login, token management, rate limiting
 */
describe('AuthService', () => {
  let service: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;
  let configService: ConfigService;
  let zkService: ZeroKnowledgeService;
  let rateLimitService: RateLimitService;
  let cryptoService: CryptoService;

  const mockUser = {
    id: '123',
    email: 'test@example.com',
    passwordHash: 'hashed_password',
    publicKey: 'ed25519_public_key',
    encryptedPrivateKey: 'encrypted_private_key',
    role: 'user',
    status: 'ACTIVE',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              create: jest.fn(),
            },
            session: {
              create: jest.fn(),
              findFirst: jest.fn(),
              updateMany: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key) => {
              const config = {
                JWT_SECRET: 'test-secret',
                JWT_EXPIRATION: '15m',
                REFRESH_TOKEN_SECRET: 'test-refresh-secret',
                REFRESH_TOKEN_EXPIRATION: '7d',
              };
              return config[key];
            }),
          },
        },
        {
          provide: ZeroKnowledgeService,
          useValue: {
            generateChallenge: jest.fn(),
            verifyResponse: jest.fn(),
          },
        },
        {
          provide: RateLimitService,
          useValue: {
            isAccountLocked: jest.fn(),
            recordFailedLogin: jest.fn(),
            clearFailedAttempts: jest.fn(),
          },
        },
        {
          provide: CryptoService,
          useValue: {
            generateEd25519Keypair: jest.fn(),
            hashPassword: jest.fn(),
            verifyPassword: jest.fn(),
            generateRandomToken: jest.fn(),
            sha256: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
    zkService = module.get<ZeroKnowledgeService>(ZeroKnowledgeService);
    rateLimitService = module.get<RateLimitService>(RateLimitService);
    cryptoService = module.get<CryptoService>(CryptoService);
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const registerDto = {
        email: 'newuser@example.com',
        password: 'SecurePassword123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);
      (cryptoService.generateEd25519Keypair as jest.Mock).mockResolvedValue({
        publicKey: 'public_key',
        privateKey: 'private_key',
      });
      (cryptoService.hashPassword as jest.Mock).mockResolvedValue('hashed_password');
      (cryptoService.generateRandomToken as jest.Mock).mockResolvedValue('verify_token');
      (prismaService.user.create as jest.Mock).mockResolvedValue({
        ...mockUser,
        email: registerDto.email,
      });
      (jwtService.sign as jest.Mock).mockReturnValue('jwt_token');

      const result = await service.register(registerDto);

      expect(result).toHaveProperty('userId');
      expect(result).toHaveProperty('email', registerDto.email);
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(prismaService.user.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if email already exists', async () => {
      const registerDto = {
        email: 'existing@example.com',
        password: 'SecurePassword123!',
      };

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
    });

    it('should validate password strength', async () => {
      const weakPassword = {
        email: 'test@example.com',
        password: 'weak', // Too short, no complexity
      };

      await expect(service.register(weakPassword)).rejects.toThrow();
    });
  });

  describe('login', () => {
    it('should return challenge on successful password verification', async () => {
      const loginDto = {
        email: mockUser.email,
        password: 'SecurePassword123!',
      };

      (rateLimitService.isAccountLocked as jest.Mock).mockResolvedValue(false);
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (cryptoService.verifyPassword as jest.Mock).mockResolvedValue(true);
      (rateLimitService.clearFailedAttempts as jest.Mock).mockResolvedValue(undefined);
      (zkService.generateChallenge as jest.Mock).mockReturnValue('challenge_hex');

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('userId');
      expect(result).toHaveProperty('challenge');
      expect(zkService.generateChallenge).toHaveBeenCalledWith(mockUser.id);
    });

    it('should throw UnauthorizedException on invalid password', async () => {
      const loginDto = {
        email: mockUser.email,
        password: 'WrongPassword123!',
      };

      (rateLimitService.isAccountLocked as jest.Mock).mockResolvedValue(false);
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (cryptoService.verifyPassword as jest.Mock).mockResolvedValue(false);
      (rateLimitService.recordFailedLogin as jest.Mock).mockResolvedValue(undefined);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      expect(rateLimitService.recordFailedLogin).toHaveBeenCalled();
    });

    it('should reject login if account is locked', async () => {
      const loginDto = {
        email: mockUser.email,
        password: 'SecurePassword123!',
      };

      (rateLimitService.isAccountLocked as jest.Mock).mockResolvedValue(true);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('verifyZKChallenge', () => {
    it('should issue JWT tokens on successful ZK verification', async () => {
      const zkVerifyDto = {
        userId: mockUser.id,
        challenge: 'challenge_hex',
        signature: 'signature_hex',
      };

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (zkService.verifyResponse as jest.Mock).mockResolvedValue(true);
      (jwtService.sign as jest.Mock).mockReturnValue('jwt_token');
      (prismaService.session.create as jest.Mock).mockResolvedValue({
        id: 'session_id',
        userId: mockUser.id,
      });

      const result = await service.verifyZKChallenge(zkVerifyDto);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('userId', mockUser.id);
    });

    it('should throw UnauthorizedException on failed ZK verification', async () => {
      const zkVerifyDto = {
        userId: mockUser.id,
        challenge: 'challenge_hex',
        signature: 'invalid_signature',
      };

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (zkService.verifyResponse as jest.Mock).mockResolvedValue(false);

      await expect(service.verifyZKChallenge(zkVerifyDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('refreshToken', () => {
    it('should return new JWT on valid refresh token', async () => {
      const refreshTokenDto = {
        refreshToken: 'valid_refresh_token',
      };

      const payload = { userId: mockUser.id };
      (jwtService.verify as jest.Mock).mockReturnValue(payload);
      (prismaService.session.findFirst as jest.Mock).mockResolvedValue({
        id: 'session_id',
        userId: mockUser.id,
        revokedAt: null,
      });
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (jwtService.sign as jest.Mock).mockReturnValue('new_jwt_token');

      const result = await service.refreshToken(refreshTokenDto);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should throw UnauthorizedException if refresh token is revoked', async () => {
      const refreshTokenDto = {
        refreshToken: 'revoked_refresh_token',
      };

      const payload = { userId: mockUser.id };
      (jwtService.verify as jest.Mock).mockReturnValue(payload);
      (prismaService.session.findFirst as jest.Mock).mockResolvedValue({
        id: 'session_id',
        revokedAt: new Date(), // Token is revoked
      });

      await expect(service.refreshToken(refreshTokenDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('should revoke all sessions for user', async () => {
      const userId = mockUser.id;
      const token = 'access_token';

      (prismaService.session.updateMany as jest.Mock).mockResolvedValue({
        count: 1,
      });

      const result = await service.logout(userId, token);

      expect(result).toHaveProperty('message');
      expect(prismaService.session.updateMany).toHaveBeenCalledWith(
        { where: { userId } },
        { revokedAt: expect.any(Date) },
      );
    });
  });
});
