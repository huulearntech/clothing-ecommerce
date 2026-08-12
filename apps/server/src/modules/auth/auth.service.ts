import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }

    const user = await this.usersService.create(registerDto);
    const accessToken = await this.generateToken(user);

    const { passwordHash: _, ...sanitizedUser } = user;
    return {
      accessToken,
      user: sanitizedUser,
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
