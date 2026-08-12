import { Module, DynamicModule, Provider } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShippingService } from './shipping.service';
import { ShippingController } from './shipping.controller';
import { ShippingListener } from './shipping.listener';
import { ShippingZone } from './entities/shipping-zone.entity';
import { ShippingMethod } from './entities/shipping-method.entity';
import { Shipment } from '../orders/entities/shipment.entity';
import { StandardCarrierService } from './carriers/standard-carrier.service';
import { FedexService } from './carriers/fedex.service';
import { UpsService } from './carriers/ups.service';

export interface ShippingModuleOptions {
  defaultCarrier?: 'standard' | 'fedex' | 'ups';
}

@Module({})
export class ShippingModule {
  static register(options?: ShippingModuleOptions): DynamicModule {
    const carrierType = options?.defaultCarrier || (process.env.SHIPPING_CARRIER_PROVIDER as any) || 'standard';

    let carrierClass: any = StandardCarrierService;
    if (carrierType === 'fedex') {
      carrierClass = FedexService;
    } else if (carrierType === 'ups') {
      carrierClass = UpsService;
    }

    const carrierProvider: Provider = {
      provide: 'SHIPPING_CARRIER',
      useClass: carrierClass,
    };

    return {
      module: ShippingModule,
      imports: [
        TypeOrmModule.forFeature([ShippingZone, ShippingMethod, Shipment]),
      ],
      controllers: [ShippingController],
      providers: [
        carrierProvider,
        ShippingService,
        ShippingListener,
        StandardCarrierService,
        FedexService,
        UpsService,
      ],
      exports: [ShippingService],
    };
  }
}
