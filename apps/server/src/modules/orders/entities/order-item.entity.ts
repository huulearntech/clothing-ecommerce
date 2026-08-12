import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Order } from './order.entity';
import { ProductVariant } from '../../catalog/entities/product-variant.entity';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_id' })
  orderId: string;

  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ name: 'variant_id', nullable: true })
  variantId: string;

  @ManyToOne(() => ProductVariant, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'variant_id' })
  variant: ProductVariant;

  @Column({ name: 'product_name_snapshot' })
  productNameSnapshot: string;

  @Column({ name: 'sku_snapshot' })
  skuSnapshot: string;

  @Column({ name: 'size_snapshot' })
  sizeSnapshot: string;

  @Column({ name: 'color_snapshot' })
  colorSnapshot: string;

  @Column({ name: 'unit_price', type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;

  @Column()
  quantity: number;

  @Column({ name: 'total_price', type: 'decimal', precision: 10, scale: 2 })
  totalPrice: number;
}
