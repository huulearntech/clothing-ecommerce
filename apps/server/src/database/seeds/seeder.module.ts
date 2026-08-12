import { Injectable, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppModule } from '../../app.module';
import { User } from '../../modules/users/entities/user.entity';
import { Product } from '../../modules/catalog/entities/product.entity';
import { ProductVariant } from '../../modules/catalog/entities/product-variant.entity';
import { ProductImage } from '../../modules/catalog/entities/product-image.entity';
import { Category } from '../../modules/catalog/entities/category.entity';
import { Brand } from '../../modules/catalog/entities/brand.entity';
import { Collection } from '../../modules/catalog/entities/collection.entity';
import { UserSeederService } from './user-seeder.service';
import { ProductSeederService } from './product-seeder.service';

@Injectable()
export class SeederService {
  constructor(
    private readonly userSeeder: UserSeederService,
    private readonly productSeeder: ProductSeederService,
  ) { }

  async seedAll() {
    await this.userSeeder.seed();
    await this.productSeeder.seed();
  }
}

@Module({
  imports: [
    AppModule, // Imports database connections & configs
    TypeOrmModule.forFeature([
      User,
      Product,
      ProductVariant,
      ProductImage,
      Category,
      Brand,
      Collection,
    ]),
  ],
  providers: [UserSeederService, ProductSeederService, SeederService],
})
export class SeederModule { }
