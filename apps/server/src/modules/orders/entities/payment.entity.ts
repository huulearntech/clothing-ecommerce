import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { PaymentGateway, PaymentStatus } from '../../../common/enums';
import { Order } from './order.entity';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_id', unique: true })
  orderId: string;

  @OneToOne(() => Order, (order) => order.payment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ type: 'varchar', default: PaymentGateway.STRIPE })
  paymentGateway: PaymentGateway;

  @Column({ name: 'transaction_id', nullable: true })
  transactionId: string;

  @Column({ type: 'varchar', default: PaymentStatus.AUTHORIZED })
  status: PaymentStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @CreateDateColumn({ name: 'paid_at' })
  paidAt: Date;
}
