import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { randomBytes } from 'crypto';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  async register(registerDto: RegisterDto): Promise<{ message: string }> {
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }

    const verificationToken = randomBytes(32).toString('hex');
    const verificationTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const user = await this.usersService.create({
      ...registerDto,
      isActive: false,
      isEmailVerified: false,
      verificationToken,
      verificationTokenExpiresAt,
    });

    const fullName = `${user.firstName} ${user.lastName}`.trim();
    await this.mailService.sendActivationEmail(
      user.email,
      fullName,
      verificationToken,
    );

    return {
      message:
        'Registration successful! Please check your email to activate your account.',
    };
  }

  async verifyEmail(dto: VerifyEmailDto): Promise<{ message: string }> {
    const user = await this.usersService.findByVerificationToken(dto.token);
    if (!user) {
      throw new BadRequestException('Invalid or expired activation token.');
    }

    if (
      user.verificationTokenExpiresAt &&
      user.verificationTokenExpiresAt < new Date()
    ) {
      throw new BadRequestException(
        'Activation token has expired. Please request a new activation email.',
      );
    }

    await this.usersService.update(user.id, {
      isActive: true,
      isEmailVerified: true,
      verificationToken: null,
      verificationTokenExpiresAt: null,
    });

    return {
      message: 'Account activated successfully! You can now log in.',
    };
  }

  async resendVerification(
    dto: ResendVerificationDto,
  ): Promise<{ message: string }> {
    const user = await this.usersService.findByEmail(dto.email);

    if (user && !user.isEmailVerified) {
      const verificationToken = randomBytes(32).toString('hex');
      const verificationTokenExpiresAt = new Date(
        Date.now() + 24 * 60 * 60 * 1000,
      );

      await this.usersService.update(user.id, {
        verificationToken,
        verificationTokenExpiresAt,
      });

      const fullName = `${user.firstName} ${user.lastName}`.trim();
      await this.mailService.sendActivationEmail(
        user.email,
        fullName,
        verificationToken,
      );
    }

    return {
      message:
        'If the email is registered and unverified, a new activation link has been sent.',
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    let isPasswordValid = false;
    try {
      if (user.passwordHash && user.passwordHash.startsWith('$')) {
        isPasswordValid = await argon2.verify(
          user.passwordHash,
          loginDto.password,
        );
      } else {
        // Fallback for unhashed legacy/seed passwords and auto-upgrade to argon2 hash
        isPasswordValid = user.passwordHash === loginDto.password;
        if (isPasswordValid) {
          const newHash = await argon2.hash(loginDto.password);
          await this.usersService.update(user.id, { passwordHash: newHash });
        }
      }
    } catch {
      isPasswordValid = false;
    }

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = await this.generateToken(user);

    const { passwordHash: _, ...sanitizedUser } = user;
    return {
      accessToken,
      user: sanitizedUser,
    };
  }

  async getProfile(userId: string): Promise<Omit<User, 'passwordHash'>> {
    const user = await this.usersService.findOne(userId);
    const { passwordHash: _, ...sanitizedUser } = user;
    return sanitizedUser;
  }

  private async generateToken(user: User): Promise<string> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    return this.jwtService.signAsync(payload);
  }
}
