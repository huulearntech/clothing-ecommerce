import { IsString, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { Season } from '../../../common/enums';

export class CreateCollectionDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsEnum(Season)
  season?: Season;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
