import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Wishlist } from './wishlist.entity';
import { Product } from '../../catalog/entities/product.entity';
import { ProductVariant } from '../../catalog/entities/product-variant.entity';

@Entity('wishlist_items')
export class WishlistItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'wishlist_id' })
  wishlistId: string;

  @ManyToOne(() => Wishlist, (wishlist) => wishlist.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'wishlist_id' })
  wishlist: Wishlist;

  @Column({ name: 'product_id' })
  productId: string;

  @ManyToOne(() => Product, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ name: 'variant_id', nullable: true })
  variantId: string;

  @ManyToOne(() => ProductVariant, {
    onDelete: 'SET NULL',
    nullable: true,
    eager: true,
  })
  @JoinColumn({ name: 'variant_id' })
  variant: ProductVariant;
}
