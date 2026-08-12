import { IsUUID, IsInt, Min, IsOptional, IsString } from 'class-validator';

export class AddToCartDto {
  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsString()
  sessionToken?: string;

  @IsUUID()
  variantId: string;

  @IsInt()
  @Min(1)
  quantity: number;
}
