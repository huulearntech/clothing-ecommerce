import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Product } from './product.entity';
import { ProductVariant } from './product-variant.entity';

@Entity('product_images')
export class ProductImage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'product_id' })
  productId: string;

  @ManyToOne(() => Product, (product) => product.images, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ name: 'variant_id', nullable: true })
  variantId: string;

  @ManyToOne(() => ProductVariant, (variant) => variant.images, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'variant_id' })
  variant: ProductVariant;

  @Column({ name: 'image_url' })
  imageUrl: string;

  @Column({ name: 'alt_text', nullable: true })
  altText: string;

  @Column({ name: 'display_order', default: 0 })
  displayOrder: number;

  @Column({ name: 'is_thumbnail', default: false })
  isThumbnail: boolean;
}
