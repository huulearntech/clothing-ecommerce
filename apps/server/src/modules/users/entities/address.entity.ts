import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { AddressType } from '../../../common/enums';
import { User } from './user.entity';

@Entity('addresses')
export class Address {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, (user) => user.addresses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', default: AddressType.SHIPPING })
  addressType: AddressType;

  @Column({ name: 'recipient_name' })
  recipientName: string;

  @Column({ name: 'street_line1' })
  streetLine1: string;

  @Column({ name: 'street_line2', nullable: true })
  streetLine2: string;

  @Column()
  city: string;

  @Column({ name: 'state_province' })
  stateProvince: string;

  @Column({ name: 'postal_code' })
  postalCode: string;

  @Column()
  country: string;

  @Column({ name: 'is_default', default: false })
  isDefault: boolean;
}
