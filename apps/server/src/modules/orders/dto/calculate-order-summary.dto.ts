import {
  IsUUID,
  IsOptional,
  IsString,
  IsArray,
  ArrayMinSize,
  ValidateNested,
  IsInt,
  Min,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CalculateOrderItemDto {
  @IsUUID()
  variantId: string;

  @IsInt()
  @Min(1)
  quantity: number;
}

export class CalculateOrderSummaryDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'Items list cannot be empty' })
  @ValidateNested({ each: true })
  @Type(() => CalculateOrderItemDto)
  items: CalculateOrderItemDto[];

  @IsOptional()
  @IsUUID()
  voucherId?: string;

  @IsOptional()
  @IsString()
  voucherCode?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  shippingCost?: number;
}

export interface OrderSummaryItemBreakdown {
  variantId: string;
  productName: string;
  size: string;
  colorName: string;
  imageUrl: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

export interface OrderSummaryResponse {
  subtotalAmount: number;
  discountAmount: number;
  shippingFee: number;
  taxAmount: number;
  totalAmount: number;
  totalItemQuantity: number;
  items: OrderSummaryItemBreakdown[];
  appliedVoucher?: {
    id: string;
    code: string;
    name: string;
    discountType: string;
    discountValue: number;
  } | null;
  voucherError?: string | null;
}
