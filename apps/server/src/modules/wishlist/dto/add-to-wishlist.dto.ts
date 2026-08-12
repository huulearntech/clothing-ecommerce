import { IsUUID, IsOptional, IsString } from 'class-validator';

export class AddToWishlistDto {
  @IsUUID()
  userId: string;

  @IsUUID()
  productId: string;

  @IsOptional()
  @IsString()
  variantId?: string;
}
