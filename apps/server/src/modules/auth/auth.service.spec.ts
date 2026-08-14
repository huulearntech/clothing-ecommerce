import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../../common/enums';
import * as argon2 from 'argon2';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: jest.Mocked<Pick<UsersService, 'findByEmail' | 'findByVerificationToken' | 'create' | 'update' | 'findOne'>>;
  let jwtService: jest.Mocked<Pick<JwtService, 'signAsync'>>;
  let mailService: jest.Mocked<Pick<MailService, 'sendActivationEmail'>>;

  const createMockUser = (overrides: Partial<User> = {}): User => ({
    id: 'user-uuid-1',
    email: 'test@example.com',
    passwordHash: '$argon2id$hashed-password',
    firstName: 'Test',
    lastName: 'User',
    phone: '0123456789',
    role: UserRole.CUSTOMER,
    isActive: true,
    isEmailVerified: true,
    verificationToken: null,
    verificationTokenExpiresAt: null,
    createdAt: new Date('2025-01-01'),
    addresses: [],
    profile: null as never,
    ...overrides,
  });

  beforeEach(async () => {
    const mockUsersService = {
      findByEmail: jest.fn(),
      findByVerificationToken: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findOne: jest.fn(),
    };

    const mockJwtService = {
      signAsync: jest.fn(),
    };

    const mockMailService = {
      sendActivationEmail: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: MailService, useValue: mockMailService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
    mailService = module.get(MailService);
  });

  describe('register', () => {
    it('should create a user with isActive=false and isEmailVerified=false, and send activation email', async () => {
      const registerDto = {
        email: 'new@example.com',
        password: 'securePassword123',
        firstName: 'Jane',
        lastName: 'Doe',
      };

      const createdUser = createMockUser({
        email: registerDto.email,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        isActive: false,
        isEmailVerified: false,
        verificationToken: 'some-token',
      });

      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockResolvedValue(createdUser);
      mailService.sendActivationEmail.mockResolvedValue(undefined);

      const result = await authService.register(registerDto);

      expect(result.message).toBe(
        'Registration successful! Please check your email to activate your account.',
      );

      // Verify the user was created with correct flags
      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: registerDto.email,
          isActive: false,
          isEmailVerified: false,
          verificationToken: expect.stringMatching(/.+/),
          verificationTokenExpiresAt: expect.any(Date),
        }),
      );

      // Verify activation email was sent
      expect(mailService.sendActivationEmail).toHaveBeenCalledWith(
        registerDto.email,
        'Jane Doe',
        expect.stringMatching(/.+/),
      );
    });

    it('should throw ConflictException if email already exists', async () => {
      usersService.findByEmail.mockResolvedValue(createMockUser());

      await expect(
        authService.register({
          email: 'test@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should throw UnauthorizedException with generic message when user does not exist', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        authService.login({ email: 'unknown@example.com', password: 'pass' }),
      ).rejects.toThrow(
        new UnauthorizedException('Invalid credentials'),
      );
    });

    it('should throw UnauthorizedException with verification message when email is not verified', async () => {
      const unverifiedUser = createMockUser({
        isEmailVerified: false,
        isActive: false,
      });
      usersService.findByEmail.mockResolvedValue(unverifiedUser);

      await expect(
        authService.login({ email: unverifiedUser.email, password: 'pass' }),
      ).rejects.toThrow(
        new UnauthorizedException(
          'Please verify your email address before signing in. Check your inbox for the activation link.',
        ),
      );
    });

    it('should throw UnauthorizedException when account is deactivated (verified but not active)', async () => {
      const deactivatedUser = createMockUser({
        isEmailVerified: true,
        isActive: false,
      });
      usersService.findByEmail.mockResolvedValue(deactivatedUser);

      await expect(
        authService.login({ email: deactivatedUser.email, password: 'pass' }),
      ).rejects.toThrow(
        new UnauthorizedException('Invalid credentials'),
      );
    });

    it('should throw UnauthorizedException when password is wrong', async () => {
      const hashedPassword = await argon2.hash('correctPassword');
      const user = createMockUser({ passwordHash: hashedPassword });
      usersService.findByEmail.mockResolvedValue(user);

      await expect(
        authService.login({ email: user.email, password: 'wrongPassword' }),
      ).rejects.toThrow(
        new UnauthorizedException('Invalid credentials'),
      );
    });

    it('should return access token and sanitized user on successful login', async () => {
      const hashedPassword = await argon2.hash('correctPassword');
      const user = createMockUser({
        passwordHash: hashedPassword,
        isActive: true,
        isEmailVerified: true,
      });
      usersService.findByEmail.mockResolvedValue(user);
      jwtService.signAsync.mockResolvedValue('jwt-token-123');

      const result = await authService.login({
        email: user.email,
        password: 'correctPassword',
      });

      expect(result.accessToken).toBe('jwt-token-123');
      expect(result.user).not.toHaveProperty('passwordHash');
      expect(result.user.email).toBe(user.email);

      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: user.id,
        email: user.email,
        role: user.role,
      });
    });
  });

  describe('verifyEmail', () => {
    it('should activate account when token is valid and not expired', async () => {
      const user = createMockUser({
        isActive: false,
        isEmailVerified: false,
        verificationToken: 'valid-token',
        verificationTokenExpiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
      });
      usersService.findByVerificationToken.mockResolvedValue(user);
      usersService.update.mockResolvedValue({
        ...user,
        isActive: true,
        isEmailVerified: true,
        verificationToken: null,
        verificationTokenExpiresAt: null,
      });

      const result = await authService.verifyEmail({ token: 'valid-token' });

      expect(result.message).toBe(
        'Account activated successfully! You can now log in.',
      );
      expect(usersService.update).toHaveBeenCalledWith(user.id, {
        isActive: true,
        isEmailVerified: true,
        verificationToken: null,
        verificationTokenExpiresAt: null,
      });
    });

    it('should throw BadRequestException when token does not exist', async () => {
      usersService.findByVerificationToken.mockResolvedValue(null);

      await expect(
        authService.verifyEmail({ token: 'nonexistent-token' }),
      ).rejects.toThrow(
        new BadRequestException('Invalid or expired activation token.'),
      );
    });

    it('should throw BadRequestException when token is expired', async () => {
      const user = createMockUser({
        isActive: false,
        isEmailVerified: false,
        verificationToken: 'expired-token',
        verificationTokenExpiresAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
      });
      usersService.findByVerificationToken.mockResolvedValue(user);

      await expect(
        authService.verifyEmail({ token: 'expired-token' }),
      ).rejects.toThrow(
        new BadRequestException(
          'Activation token has expired. Please request a new activation email.',
        ),
      );
    });
  });

  describe('resendVerification', () => {
    it('should generate new token and send activation email for unverified user', async () => {
      const user = createMockUser({
        isEmailVerified: false,
        isActive: false,
      });
      usersService.findByEmail.mockResolvedValue(user);
      usersService.update.mockResolvedValue(user);
      mailService.sendActivationEmail.mockResolvedValue(undefined);

      const result = await authService.resendVerification({
        email: user.email,
      });

      expect(result.message).toBe(
        'If the email is registered and unverified, a new activation link has been sent.',
      );
      expect(usersService.update).toHaveBeenCalledWith(
        user.id,
        expect.objectContaining({
          verificationToken: expect.stringMatching(/.+/),
          verificationTokenExpiresAt: expect.any(Date),
        }),
      );
      expect(mailService.sendActivationEmail).toHaveBeenCalledWith(
        user.email,
        'Test User',
        expect.stringMatching(/.+/),
      );
    });

    it('should not send email for already verified user, but still return success message', async () => {
      const user = createMockUser({ isEmailVerified: true });
      usersService.findByEmail.mockResolvedValue(user);

      const result = await authService.resendVerification({
        email: user.email,
      });

      expect(result.message).toBe(
        'If the email is registered and unverified, a new activation link has been sent.',
      );
      expect(usersService.update).not.toHaveBeenCalled();
      expect(mailService.sendActivationEmail).not.toHaveBeenCalled();
    });

    it('should not leak information for non-existent email', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      const result = await authService.resendVerification({
        email: 'nobody@example.com',
      });

      expect(result.message).toBe(
        'If the email is registered and unverified, a new activation link has been sent.',
      );
      expect(usersService.update).not.toHaveBeenCalled();
      expect(mailService.sendActivationEmail).not.toHaveBeenCalled();
    });
  });

  describe('getProfile', () => {
    it('should return user without passwordHash', async () => {
      const user = createMockUser();
      usersService.findOne.mockResolvedValue(user);

      const result = await authService.getProfile(user.id);

      expect(result).not.toHaveProperty('passwordHash');
      expect(result.email).toBe(user.email);
    });
  });
});
