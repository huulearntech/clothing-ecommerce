import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { FitFeedback } from '../../../common/enums';
import { Product } from '../../catalog/entities/product.entity';
import { User } from '../../users/entities/user.entity';

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'product_id' })
  productId: string;

  @ManyToOne(() => Product, (product) => product.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, (user) => user.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'int' })
  rating: number;

  @Column({ nullable: true })
  title: string;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @Column({ type: 'varchar', default: FitFeedback.TRUE_TO_SIZE })
  fitFeedback: FitFeedback;

  @Column({ name: 'is_verified_purchase', default: false })
  isVerifiedPurchase: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
