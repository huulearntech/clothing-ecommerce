import { User } from '../../users/entities/user.entity';

export class AuthResponseDto {
  accessToken: string;
  user: Omit<User, 'passwordHash'>;
}
