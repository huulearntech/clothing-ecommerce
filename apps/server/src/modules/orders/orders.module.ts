import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Payment } from './entities/payment.entity';
import { Shipment } from './entities/shipment.entity';
import { ProductVariant } from '../catalog/entities/product-variant.entity';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { OutboxModule } from '../outbox/outbox.module';

import { Voucher } from '../vouchers/entities/voucher.entity';
import { VouchersModule } from '../vouchers/vouchers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
      OrderItem,
      Payment,
      Shipment,
      ProductVariant,
      Voucher,
    ]),
    OutboxModule,
    VouchersModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
