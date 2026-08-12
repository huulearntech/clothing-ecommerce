import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { UserRole } from '../../../common/enums';
import { Address } from './address.entity';
import { CustomerProfile } from './customer-profile.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column({ name: 'first_name' })
  firstName: string;

  @Column({ name: 'last_name' })
  lastName: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ type: 'varchar', default: UserRole.CUSTOMER })
  role: UserRole;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => Address, (address) => address.user, { cascade: true })
  addresses: Address[];

  @OneToOne(() => CustomerProfile, (profile) => profile.user, { cascade: true })
  profile: CustomerProfile;
}
