import { IsOptional, IsString, IsEnum, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { GenderCategory } from '../../../common/enums';

export enum ProductSortOption {
  NAME_ASC = 'name-asc',
  NAME_DESC = 'name-desc',
  PRICE_ASC = 'price-asc',
  PRICE_DESC = 'price-desc',
  RATING = 'rating',
}

export class GetProductsFilterDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(GenderCategory)
  gender?: GenderCategory;

  @IsOptional()
  @IsString()
  categorySlug?: string;

  @IsOptional()
  @IsString()
  size?: string;

  @IsOptional()
  @IsString()
  colorName?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @IsEnum(ProductSortOption)
  sort?: ProductSortOption;
}
