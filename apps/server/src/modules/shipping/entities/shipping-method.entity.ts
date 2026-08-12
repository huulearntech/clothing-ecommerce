import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ShippingZone } from './shipping-zone.entity';

export enum RateType {
  FLAT = 'FLAT',
  WEIGHT_BASED = 'WEIGHT_BASED',
  CALCULATED = 'CALCULATED',
}

@Entity('shipping_methods')
export class ShippingMethod {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'zone_id' })
  zoneId: string;

  @ManyToOne(() => ShippingZone, (zone) => zone.methods, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'zone_id' })
  zone: ShippingZone;

  @Column()
  name: string; // e.g. "Standard Ground", "Express 2-Day"

  @Column({ type: 'varchar', default: RateType.FLAT })
  rateType: RateType;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  baseCost: number;

  @Column({ name: 'cost_per_kg', type: 'decimal', precision: 10, scale: 2, default: 0 })
  costPerKg: number;

  @Column({ name: 'min_order_subtotal', type: 'decimal', precision: 10, scale: 2, nullable: true })
  minOrderSubtotal: number;

  @Column({ name: 'estimated_days', type: 'int', default: 3 })
  estimatedDays: number;

  @Column({ name: 'carrier_code', nullable: true })
  carrierCode: string; // e.g., 'fedex', 'ups', 'standard'

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
