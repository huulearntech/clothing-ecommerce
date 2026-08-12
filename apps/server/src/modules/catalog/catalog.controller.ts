import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateVariantDto } from './dto/create-variant.dto';
import { GenerateBatchSkusDto } from './dto/generate-sku.dto';
import { GetProductsFilterDto } from './dto/get-products-filter.dto';

@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Post('brands')
  createBrand(@Body() dto: CreateBrandDto) {
    return this.catalogService.createBrand(dto);
  }

  @Get('brands')
  findAllBrands() {
    return this.catalogService.findAllBrands();
  }

  @Post('categories')
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.catalogService.createCategory(dto);
  }

  @Get('categories')
  findAllCategories() {
    return this.catalogService.findAllCategories();
  }

  @Post('collections')
  createCollection(@Body() dto: CreateCollectionDto) {
    return this.catalogService.createCollection(dto);
  }

  @Get('collections')
  findAllCollections() {
    return this.catalogService.findAllCollections();
  }

  @Post('products')
  createProduct(@Body() dto: CreateProductDto) {
    return this.catalogService.createProduct(dto);
  }

  @Get('products')
  findAllProducts(@Query() filterDto: GetProductsFilterDto) {
    return this.catalogService.findAllProducts(filterDto);
  }

  @Get('products/:id')
  findOneProduct(@Param('id', ParseUUIDPipe) id: string) {
    return this.catalogService.findOneProduct(id);
  }

  @Patch('products/:id')
  updateProduct(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.catalogService.updateProduct(id, dto);
  }

  @Delete('products/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteProduct(@Param('id', ParseUUIDPipe) id: string) {
    return this.catalogService.deleteProduct(id);
  }

  @Post('variants')
  createVariant(@Body() dto: CreateVariantDto) {
    return this.catalogService.createVariant(dto);
  }

  @Post('generate-skus')
  generateSkus(@Body() dto: GenerateBatchSkusDto) {
    return this.catalogService.generateBatchSkus(dto);
  }
}

