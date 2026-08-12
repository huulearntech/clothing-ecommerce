import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { ReturnStatus } from '../../../common/enums';
import { Order } from '../../orders/entities/order.entity';
import { User } from '../../users/entities/user.entity';
import { ReturnItem } from './return-item.entity';

@Entity('return_requests')
export class ReturnRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_id' })
  orderId: string;

  @ManyToOne(() => Order, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', default: ReturnStatus.REQUESTED })
  status: ReturnStatus;

  @Column({
    name: 'refund_amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  refundAmount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => ReturnItem, (item) => item.returnRequest, { cascade: true })
  items: ReturnItem[];
}
