import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Category } from './entities/category.entity';
import { Variant } from './entities/variant.entity';
import { ProductService } from './product.service';
import { CategoryService } from './category.service';
import { VariantService } from './variant.service';
import { ProductController } from './product.controller';
import { CategoryController } from './category.controller';
import { VariantController } from './variant.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Product, Category, Variant])],
  controllers: [ProductController, CategoryController, VariantController],
  providers: [ProductService, CategoryService, VariantService],
  exports: [ProductService, CategoryService, VariantService],
})
export class ProductsModule {}
