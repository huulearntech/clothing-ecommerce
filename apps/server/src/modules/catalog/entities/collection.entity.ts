import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { Season } from '../../../common/enums';
import { Product } from './product.entity';

@Entity('collections')
export class Collection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'varchar', default: Season.ALL_SEASON })
  season: Season;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @ManyToMany(() => Product, (product) => product.collections)
  products: Product[];
}
