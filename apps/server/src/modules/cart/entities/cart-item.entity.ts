import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Cart } from './cart.entity';
import { ProductVariant } from '../../catalog/entities/product-variant.entity';

@Entity('cart_items')
export class CartItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'cart_id' })
  cartId: string;

  @ManyToOne(() => Cart, (cart) => cart.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cart_id' })
  cart: Cart;

  @Column({ name: 'variant_id' })
  variantId: string;

  @ManyToOne(() => ProductVariant, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'variant_id' })
  variant: ProductVariant;

  @Column({ default: 1 })
  quantity: number;
}
