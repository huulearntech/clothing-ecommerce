import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { ShippingMethod } from './shipping-method.entity';

@Entity('shipping_zones')
export class ShippingZone {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string; // e.g. "North America", "Domestic (US)", "Europe"

  @Column('text', { array: true, default: [] })
  countries: string[]; // ISO country codes e.g. ['US', 'CA']

  @Column('text', { array: true, default: [] })
  postalCodes: string[]; // Postal code patterns or prefixes

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(() => ShippingMethod, (method) => method.zone, { cascade: true })
  methods: ShippingMethod[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
