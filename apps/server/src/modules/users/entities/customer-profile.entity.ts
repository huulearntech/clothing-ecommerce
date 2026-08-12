import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { GenderPreference } from '../../../common/enums';
import { User } from './user.entity';

@Entity('customer_profiles')
export class CustomerProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', unique: true })
  userId: string;

  @OneToOne(() => User, (user) => user.profile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', nullable: true })
  genderPreference: GenderPreference;

  @Column({ name: 'preferred_top_size', nullable: true })
  preferredTopSize: string;

  @Column({ name: 'preferred_bottom_size', nullable: true })
  preferredBottomSize: string;

  @Column({ name: 'preferred_shoe_size', nullable: true })
  preferredShoeSize: string;

  @Column({ name: 'newsletter_subscribed', default: false })
  newsletterSubscribed: boolean;
}
