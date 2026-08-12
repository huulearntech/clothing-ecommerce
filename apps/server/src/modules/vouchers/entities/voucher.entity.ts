import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DiscountType } from '../../../common/enums/index';
import { VoucherType } from '../vouchers.enum';

@Entity('vouchers')
export class Voucher {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', default: VoucherType.COUPON })
  type: VoucherType;

  @Column({ type: 'varchar', default: DiscountType.PERCENTAGE })
  discountType: DiscountType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  discountValue: number;

  @Column({
    name: 'max_discount_amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  maxDiscountAmount: number;

  @Column({
    name: 'min_order_amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  minOrderAmount: number;

  @Column({ name: 'min_item_quantity', type: 'int', default: 0 })
  minItemQuantity: number;

  @Column({ name: 'usage_limit', type: 'int', nullable: true })
  usageLimit: number;

  @Column({ name: 'usage_count', type: 'int', default: 0 })
  usageCount: number;

  @Column({ name: 'per_user_limit', type: 'int', default: 1 })
  perUserLimit: number;

  @Column({ name: 'start_date', type: 'timestamp', nullable: true })
  startDate: Date;

  @Column({ name: 'end_date', type: 'timestamp', nullable: true })
  endDate: Date;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
