import {
  IsUUID,
  IsEnum,
  IsString,
  IsNumber,
  IsOptional,
} from 'class-validator';
import { PaymentGateway, PaymentStatus } from '../../../common/enums';

export class CreatePaymentDto {
  @IsUUID()
  orderId: string;

  @IsEnum(PaymentGateway)
  paymentGateway: PaymentGateway;

  @IsOptional()
  @IsString()
  transactionId?: string;

  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @IsNumber()
  amount: number;
}
