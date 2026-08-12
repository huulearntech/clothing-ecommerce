import { IsUUID, IsString, IsOptional, IsEnum } from 'class-validator';
import { ShipmentStatus } from '../../../common/enums';

export class CreateShipmentDto {
  @IsUUID()
  orderId: string;

  @IsString()
  carrier: string;

  @IsString()
  trackingNumber: string;

  @IsOptional()
  @IsEnum(ShipmentStatus)
  status?: ShipmentStatus;
}
