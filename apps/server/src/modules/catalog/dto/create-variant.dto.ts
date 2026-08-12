import {
  IsString,
  IsNumber,
  IsOptional,
  IsUUID,
  IsInt,
  Min,
} from 'class-validator';

export class CreateVariantDto {
  @IsUUID()
  productId: string;

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
