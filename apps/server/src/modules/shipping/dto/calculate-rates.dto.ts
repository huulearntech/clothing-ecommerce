import { IsString, IsNumber, IsOptional, IsObject, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ShippingAddressDto {
  @IsString()
  street: string;

  @IsString()
  city: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsString()
  postalCode: string;

  @IsString()
  country: string;
}

export class DimensionsDto {
  @IsNumber()
  @Min(0)
  length: number;

  @IsNumber()
  @Min(0)
  width: number;

  @IsNumber()
  @Min(0)
  height: number;
}

export class CalculateRatesDto {
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  destinationAddress: ShippingAddressDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  originAddress?: ShippingAddressDto;

  @IsNumber()
  @Min(0.01)
  weightInKg: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => DimensionsDto)
  dimensions?: DimensionsDto;

  @IsOptional()
  @IsNumber()
  itemCount?: number;
}
