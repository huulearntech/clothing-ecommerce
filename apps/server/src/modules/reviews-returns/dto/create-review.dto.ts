import {
  IsUUID,
  IsInt,
  Min,
  Max,
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { FitFeedback } from '../../../common/enums';

export class CreateReviewDto {
  @IsUUID()
  productId: string;

  @IsUUID()
  userId: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsEnum(FitFeedback)
  fitFeedback?: FitFeedback;

  @IsOptional()
  @IsBoolean()
  isVerifiedPurchase?: boolean;
}
