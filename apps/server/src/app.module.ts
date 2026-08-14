import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { CartModule } from './modules/cart/cart.module';
import { WishlistModule } from './modules/wishlist/wishlist.module';
import { OrdersModule } from './modules/orders/orders.module';
import { ReviewsReturnsModule } from './modules/reviews-returns/reviews-returns.module';
import { OutboxModule } from './modules/outbox/outbox.module';
import { ImageStorageModule } from './modules/image_storage/image_storage.module';
import { RabbitMQModule } from './modules/rabbitmq/rabbitmq.module';

import { User } from './modules/users/entities/user.entity';
import { Address } from './modules/users/entities/address.entity';
import { CustomerProfile } from './modules/users/entities/customer-profile.entity';
import { Brand } from './modules/catalog/entities/brand.entity';
import { Category } from './modules/catalog/entities/category.entity';
import { Collection } from './modules/catalog/entities/collection.entity';
import { Product } from './modules/catalog/entities/product.entity';
import { ProductVariant } from './modules/catalog/entities/product-variant.entity';
import { ProductImage } from './modules/catalog/entities/product-image.entity';
import { Cart } from './modules/cart/entities/cart.entity';
import { CartItem } from './modules/cart/entities/cart-item.entity';
import { Wishlist } from './modules/wishlist/entities/wishlist.entity';
import { WishlistItem } from './modules/wishlist/entities/wishlist-item.entity';
import { Order } from './modules/orders/entities/order.entity';
import { OrderItem } from './modules/orders/entities/order-item.entity';
import { Payment } from './modules/orders/entities/payment.entity';
import { Shipment } from './modules/orders/entities/shipment.entity';
import { Review } from './modules/reviews-returns/entities/review.entity';
import { ReturnRequest } from './modules/reviews-returns/entities/return-request.entity';
import { ReturnItem } from './modules/reviews-returns/entities/return-item.entity';
import { Voucher } from './modules/vouchers/entities/voucher.entity';
import { VouchersModule } from './modules/vouchers/vouchers.module';
import { OutboxEntity } from './modules/outbox/outbox.entity';

import { ProductsModule } from './modules/products/products.module';
import { StatisticsModule } from './modules/statistics/statistics.module';
import { Product as ShopProduct } from './modules/products/entities/product.entity';
import { Category as ShopCategory } from './modules/products/entities/category.entity';
import { Variant as ShopVariant } from './modules/products/entities/variant.entity';
import { ShippingZone } from './modules/shipping/entities/shipping-zone.entity';
import { ShippingMethod } from './modules/shipping/entities/shipping-method.entity';
import { ShippingModule } from './modules/shipping/shipping.module';

import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),
        entities: [
          User,
          Address,
          CustomerProfile,
          Brand,
          Category,
          Collection,
          Product,
          ProductVariant,
          ProductImage,
          Cart,
          CartItem,
          Wishlist,
          WishlistItem,
          Order,
          OrderItem,
          Payment,
          Shipment,
          Review,
          ReturnRequest,
          ReturnItem,
          Voucher,
          ShopProduct,
          ShopCategory,
          ShopVariant,
          OutboxEntity,
          ShippingZone,
          ShippingMethod,
        ],
        synchronize: true,
      }),
    }),
    AuthModule,
    UsersModule,
    CatalogModule,
    CartModule,
    WishlistModule,
    OrdersModule,
    ReviewsReturnsModule,
    VouchersModule,
    ProductsModule,
    StatisticsModule,
    OutboxModule,
    RabbitMQModule,
    ShippingModule.register(),
    ImageStorageModule.register(),
  ],
})
export class AppModule {}
