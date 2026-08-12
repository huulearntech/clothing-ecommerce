import {
  IsUUID,
  IsArray,
  ValidateNested,
  IsString,
  IsOptional,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateReturnItemDto {
  @IsUUID()
  orderItemId: string;

  @IsString()
  reason: string;

  @IsOptional()
  @IsString()
  condition?: string;

  @IsOptional()
  @IsUUID()
  exchangeVariantId?: string;

  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateReturnRequestDto {
  @IsUUID()
  orderId: string;

  @IsUUID()
  userId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateReturnItemDto)
  items: CreateReturnItemDto[];
}
