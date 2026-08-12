import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Category } from './category.entity';
import { Variant } from './variant.entity';

@Entity('shop_products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true, nullable: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ nullable: true })
  image?: string;

  @Column({ type: 'float', default: 0 })
  rating: number;

  @Column({ default: 0 })
  totalSold: number;

  @Column({ default: 0 })
  stock: number;

  @Column({ default: true })
  isPublished: boolean;

  @Column({ name: 'category_id', nullable: true })
  categoryId?: number | null;

  @ManyToOne(() => Category, (category) => category.products, {
    nullable: true,
    onDelete: 'SET NULL',
    eager: true,
  })
  @JoinColumn({ name: 'category_id' })
  category?: Category | null;

  @OneToMany(() => Variant, (variant) => variant.product, {
    cascade: true,
  })
  variants: Variant[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
