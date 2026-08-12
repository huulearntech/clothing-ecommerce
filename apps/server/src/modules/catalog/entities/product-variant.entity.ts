import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Product } from './product.entity';
import { ProductImage } from './product-image.entity';

@Entity('product_variants')
export class ProductVariant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'product_id' })
  productId: string;

  @ManyToOne(() => Product, (product) => product.variants, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ unique: true })
  sku: string;

  @Column()
  size: string;

  @Column({ name: 'color_name' })
  colorName: string;

  @Column({ name: 'color_hex', nullable: true })
  colorHex: string;

  @Column({
    name: 'price_override',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  priceOverride: number;

  @Column({ name: 'stock_quantity', default: 0 })
  stockQuantity: number;

  @Column({ name: 'weight_grams', nullable: true })
  weightGrams: number;

  @OneToMany(() => ProductImage, (image) => image.variant)
  images: ProductImage[];
}
