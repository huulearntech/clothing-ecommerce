import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { IS_GUEST_ONLY_KEY } from '../decorators/guest-only.decorator';

@Injectable()
export class GuestOnlyGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isGuestOnly = this.reflector.getAllAndOverride<boolean>(
      IS_GUEST_ONLY_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (isGuestOnly === false) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (token) {
      try {
        const secret = process.env.JWT_SECRET || 'super-secret-jwt-key';
        await this.jwtService.verifyAsync(token, { secret });

        throw new ForbiddenException(
          'Already authenticated. Logged in users cannot access login or registration routes.',
        );
      } catch (err) {
        if (err instanceof ForbiddenException) {
          throw err;
        }
        // Token is invalid/expired, allow request to proceed
      }
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
