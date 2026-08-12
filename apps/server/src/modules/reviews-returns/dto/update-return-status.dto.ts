import { IsEnum, IsOptional, IsNumber } from 'class-validator';
import { ReturnStatus } from '../../../common/enums';

export class UpdateReturnStatusDto {
  @IsEnum(ReturnStatus)
  status: ReturnStatus;

  @IsOptional()
  @IsNumber()
  refundAmount?: number;
}
