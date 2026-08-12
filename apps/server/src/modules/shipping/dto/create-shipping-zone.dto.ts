import { IsString, IsArray, IsOptional, IsBoolean } from 'class-validator';

export class CreateShippingZoneDto {
  @IsString()
  name: string;

  @IsArray()
  @IsString({ each: true })
  countries: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  postalCodes?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
