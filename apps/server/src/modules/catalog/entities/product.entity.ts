import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  ManyToMany,
  JoinTable,
  JoinColumn,
} from 'typeorm';
import { GenderCategory } from '../../../common/enums';
import { Brand } from './brand.entity';
import { Category } from './category.entity';
import { Collection } from './collection.entity';
import { ProductVariant } from './product-variant.entity';
import { ProductImage } from './product-image.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'brand_id', nullable: true })
  brandId: string;

  @ManyToOne(() => Brand, (brand) => brand.products, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'brand_id' })
  brand: Brand;

  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({ name: 'base_price', type: 'decimal', precision: 10, scale: 2 })
  basePrice: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'material_composition', nullable: true })
  materialComposition: string;

  @Column({ name: 'care_instructions', type: 'text', nullable: true })
  careInstructions: string;

  @Column({ type: 'varchar', default: GenderCategory.UNISEX })
  gender: GenderCategory;

  @Column({ name: 'is_published', default: true })
  isPublished: boolean;

  @ManyToMany(() => Category, (category) => category.products, {
    cascade: true,
  })
  @JoinTable({
    name: 'product_category_mappings',
    joinColumn: { name: 'product_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'category_id', referencedColumnName: 'id' },
  })
  categories: Category[];

  @ManyToMany(() => Collection, (collection) => collection.products, {
    cascade: true,
  })
  @JoinTable({
    name: 'product_collections',
    joinColumn: { name: 'product_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'collection_id', referencedColumnName: 'id' },
  })
  collections: Collection[];

  @OneToMany(() => ProductVariant, (variant) => variant.product, {
    cascade: true,
  })
  variants: ProductVariant[];

  @OneToMany(() => ProductImage, (image) => image.product, { cascade: true })
  images: ProductImage[];
}
