import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Address } from './entities/address.entity';
import { CustomerProfile } from './entities/customer-profile.entity';
import * as argon2 from 'argon2';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateAddressDto } from './dto/create-address.dto';
import { CreateCustomerProfileDto } from './dto/create-customer-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,
    @InjectRepository(CustomerProfile)
    private readonly profileRepository: Repository<CustomerProfile>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const { password, ...userData } = createUserDto;
    const passwordHash = password ? await argon2.hash(password) : '';
    const user = this.userRepository.create({
      ...userData,
      passwordHash,
    });
    return this.userRepository.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
      relations: { addresses: true, profile: true },
    });
  }

  async findByVerificationToken(verificationToken: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { verificationToken },
    });
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      relations: { addresses: true, profile: true },
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: { addresses: true, profile: true },
    });
    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    Object.assign(user, updateUserDto);
    return this.userRepository.save(user);
  }

  async addAddress(
    userId: string,
    createAddressDto: CreateAddressDto,
  ): Promise<Address> {
    await this.findOne(userId);
    const address = this.addressRepository.create({
      ...createAddressDto,
      userId,
    });
    return this.addressRepository.save(address);
  }

  async upsertProfile(
    userId: string,
    dto: CreateCustomerProfileDto,
  ): Promise<CustomerProfile> {
    await this.findOne(userId);
    let profile = await this.profileRepository.findOne({ where: { userId } });
    if (!profile) {
      profile = this.profileRepository.create({ userId, ...dto });
    } else {
      Object.assign(profile, dto);
    }
    return this.profileRepository.save(profile);
  }
}
