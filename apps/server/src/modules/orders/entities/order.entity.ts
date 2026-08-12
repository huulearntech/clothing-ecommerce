import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { OrderStatus } from '../../../common/enums';
import { User } from '../../users/entities/user.entity';
import { Voucher } from '../../vouchers/entities/voucher.entity';
import { OrderItem } from './order-item.entity';
import { Payment } from './payment.entity';
import { Shipment } from './shipment.entity';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_number', unique: true })
  orderNumber: string;

  @Column({ name: 'user_id', nullable: true })
  userId?: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'voucher_id', nullable: true })
  voucherId?: string;

  @ManyToOne(() => Voucher, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'voucher_id' })
  voucher?: Voucher;

  @Column({ type: 'varchar', default: OrderStatus.PENDING })
  status: OrderStatus;

  @Column({ name: 'subtotal_amount', type: 'decimal', precision: 10, scale: 2 })
  subtotalAmount: number;

  @Column({
    name: 'discount_amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  discountAmount: number;

  @Column({
    name: 'shipping_fee',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  shippingFee: number;

  @Column({
    name: 'tax_amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  taxAmount: number;

  @Column({ name: 'total_amount', type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @Column({ name: 'shipping_address_snapshot', type: 'json' })
  shippingAddressSnapshot: Record<string, any>;

  @Column({ name: 'billing_address_snapshot', type: 'json', nullable: true })
  billingAddressSnapshot: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: OrderItem[];

  @OneToOne(() => Payment, (payment) => payment.order, { cascade: true })
  payment: Payment;

  @OneToMany(() => Shipment, (shipment) => shipment.order, { cascade: true })
  shipments: Shipment[];
}
