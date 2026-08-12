import { IsEnum, IsString, IsOptional, IsBoolean } from 'class-validator';
import { AddressType } from '../../../common/enums';

export class CreateAddressDto {
  @IsEnum(AddressType)
  addressType: AddressType;

  @IsString()
  recipientName: string;

  @IsString()
  streetLine1: string;

  @IsOptional()
  @IsString()
  streetLine2?: string;

  @IsString()
  city: string;

  @IsString()
  stateProvince: string;

  @IsString()
  postalCode: string;

  @IsString()
  country: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
