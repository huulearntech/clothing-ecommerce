import { IsEnum, IsOptional, IsString, IsBoolean } from 'class-validator';
import { GenderPreference } from '../../../common/enums';

export class CreateCustomerProfileDto {
  @IsOptional()
  @IsEnum(GenderPreference)
  genderPreference?: GenderPreference;

  @IsOptional()
  @IsString()
  preferredTopSize?: string;

  @IsOptional()
  @IsString()
  preferredBottomSize?: string;

  @IsOptional()
  @IsString()
  preferredShoeSize?: string;

  @IsOptional()
  @IsBoolean()
  newsletterSubscribed?: boolean;
}
