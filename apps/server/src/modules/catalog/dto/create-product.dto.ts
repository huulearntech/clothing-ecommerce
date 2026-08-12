import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsUUID,
  IsArray,
  ValidateNested,
  IsInt,
  Min,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { GenderCategory } from '../../../common/enums';

export class ProductVariantInputDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsString()
  sku: string;

  @IsString()
  size: string;

  @IsString()
  colorName: string;

  @IsOptional()
  @IsString()
  colorHex?: string;

  @IsOptional()
  @IsNumber()
  priceOverride?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  stockQuantity?: number;

  @IsOptional()
  @IsInt()
  weightGrams?: number;
}

export class ProductImageInputDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsString()
  imageUrl: string;

  @IsOptional()
  @IsString()
  altText?: string;

  @IsOptional()
  @IsInt()
  displayOrder?: number;

  @IsOptional()
  @IsBoolean()
  isThumbnail?: boolean;
}

export class CreateProductDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsNumber()
  basePrice: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  materialComposition?: string;

  @IsOptional()
  @IsString()
  careInstructions?: string;

  @IsOptional()
  @IsEnum(GenderCategory)
  gender?: GenderCategory;

  @IsOptional()
  @IsUUID()
  brandId?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  categoryIds?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductVariantInputDto)
  variants?: ProductVariantInputDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductImageInputDto)
  images?: ProductImageInputDto[];
}
