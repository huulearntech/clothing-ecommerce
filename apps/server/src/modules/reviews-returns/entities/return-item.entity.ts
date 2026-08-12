import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ReturnRequest } from './return-request.entity';
import { OrderItem } from '../../orders/entities/order-item.entity';
import { ProductVariant } from '../../catalog/entities/product-variant.entity';

@Entity('return_items')
export class ReturnItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'return_request_id' })
  returnRequestId: string;

  @ManyToOne(() => ReturnRequest, (req) => req.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'return_request_id' })
  returnRequest: ReturnRequest;

  @Column({ name: 'order_item_id' })
  orderItemId: string;

  @ManyToOne(() => OrderItem, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_item_id' })
  orderItem: OrderItem;

  @Column({ name: 'exchange_variant_id', nullable: true })
  exchangeVariantId: string;

  @ManyToOne(() => ProductVariant, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'exchange_variant_id' })
  exchangeVariant: ProductVariant;

  @Column()
  reason: string;

  @Column({ nullable: true })
  condition: string;

  @Column({ default: 1 })
  quantity: number;
}
