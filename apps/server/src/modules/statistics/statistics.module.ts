import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatisticsController } from './statistics.controller';
import { StatisticsService } from './statistics.service';
import { Order } from '../orders/entities/order.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { Product } from '../catalog/entities/product.entity';
import { User } from '../users/entities/user.entity';
import { Category } from '../catalog/entities/category.entity';
import { ReturnRequest } from '../reviews-returns/entities/return-request.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, Product, User, Category, ReturnRequest]),
  ],
  controllers: [StatisticsController],
  providers: [StatisticsService],
  exports: [StatisticsService],
})
export class StatisticsModule {}
