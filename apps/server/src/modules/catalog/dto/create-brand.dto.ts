import { IsString, IsOptional } from 'class-validator';

export class CreateBrandDto {
  @IsString()
  name: string;

  @IsString()
  slug: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
