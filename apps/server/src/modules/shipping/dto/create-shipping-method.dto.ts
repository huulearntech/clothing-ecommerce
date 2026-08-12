import { IsString, IsEnum, IsNumber, IsOptional, IsBoolean, Min } from 'class-validator';
import { RateType } from '../entities/shipping-method.entity';

export class CreateShippingMethodDto {
  @IsString()
  zoneId: string;

  @IsString()
  name: string;

  @IsEnum(RateType)
  rateType: RateType;

  @IsNumber()
  @Min(0)
  baseCost: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  costPerKg?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minOrderSubtotal?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  estimatedDays?: number;

  @IsOptional()
  @IsString()
  carrierCode?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
