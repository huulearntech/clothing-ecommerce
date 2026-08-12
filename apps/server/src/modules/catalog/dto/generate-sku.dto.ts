import { IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class GenerateSkuItemDto {
  @IsOptional()
  @IsString()
  colorName?: string;

  @IsOptional()
  @IsString()
  size?: string;
}

export class GenerateBatchSkusDto {
  @IsOptional()
  @IsString()
  productName?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GenerateSkuItemDto)
  items: GenerateSkuItemDto[];
}
