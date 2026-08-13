import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { ShipmentStatus } from '../../../common/enums';
import { Order } from './order.entity';

@Entity('shipments')
export class Shipment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_id' })
  orderId: string;

  @ManyToOne(() => Order, (order) => order.shipments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column()
  carrier: string;

  @Column({ name: 'tracking_number' })
  trackingNumber: string;

  @Column({ type: 'varchar', default: ShipmentStatus.LABEL_CREATED })
  status: ShipmentStatus;

  @Column({ name: 'estimated_delivery_date', type: 'timestamp', nullable: true })
  estimatedDeliveryDate: Date | null;

  @CreateDateColumn({ name: 'shipped_at' })
  shippedAt: Date;

  @Column({ name: 'delivered_at', type: 'timestamp', nullable: true })
  deliveredAt: Date | null;
}
