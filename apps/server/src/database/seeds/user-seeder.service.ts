import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as argon2 from 'argon2';
import { User } from '../../modules/users/entities/user.entity';
import { UserRole } from '../../common/enums';

@Injectable()
export class UserSeederService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async seed() {
    const adminEmail = 'admin@example.com';
    const adminUser = await this.userRepository.findOne({
      where: { email: adminEmail },
    });

    if (!adminUser) {
      await this.userRepository.save({
        email: adminEmail,
        passwordHash: await argon2.hash('admin'),
        firstName: 'Super',
        lastName: 'Admin',
        role: UserRole.ADMIN,
        isActive: true,
      });
      console.log('✅ Admin user seeded.');
    } else if (!adminUser.passwordHash.startsWith('$')) {
      adminUser.passwordHash = await argon2.hash('admin');
      await this.userRepository.save(adminUser);
      console.log('✅ Admin password updated with hashed password.');
    } else {
      console.log('ℹ️ Admin user already exists. Skipping...');
    }

    const mockUserId = 'c4b1e980-0000-0000-0000-000000000000';
    const mockCustomer = await this.userRepository.findOne({
      where: { id: mockUserId },
    });

    if (!mockCustomer) {
      await this.userRepository.save({
        id: mockUserId,
        email: 'john.doe@example.com',
        passwordHash: await argon2.hash('customer123'),
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1 (555) 234-5678',
        role: UserRole.CUSTOMER,
        isActive: true,
      });
      console.log('✅ Mock Customer user seeded.');
    } else if (!mockCustomer.passwordHash.startsWith('$')) {
      mockCustomer.passwordHash = await argon2.hash('customer123');
      await this.userRepository.save(mockCustomer);
      console.log('✅ Mock Customer password updated with hashed password.');
    } else {
      console.log('ℹ️ Mock Customer user already exists. Skipping...');
    }
  }
}
