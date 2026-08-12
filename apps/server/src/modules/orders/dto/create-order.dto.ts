import {
  IsUUID,
  IsOptional,
  IsObject,
  IsArray,
  ArrayMinSize,
  ValidateNested,
  IsNumber,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOrderItemDto {
  @IsUUID()
  variantId: string;

  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateOrderDto {
  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsUUID()
  voucherId?: string;

  @IsObject()
  shippingAddress: Record<string, any>;

  @IsOptional()
  @IsObject()
  billingAddress?: Record<string, any>;

  @IsArray()
  @ArrayMinSize(1, { message: 'Order must contain at least one item' })
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}
