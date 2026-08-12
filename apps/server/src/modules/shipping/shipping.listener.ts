import { Injectable, Logger } from '@nestjs/common';
import { ShippingService } from './shipping.service';

export interface OrderPlacedEvent {
  orderId: string;
  userId: string;
  shippingAddress: any;
  subtotalAmount?: number;
}

@Injectable()
export class ShippingListener {
  private readonly logger = new Logger(ShippingListener.name);

  constructor(private readonly shippingService: ShippingService) {}

  async handleOrderPlacedEvent(event: OrderPlacedEvent) {
    this.logger.log(`Processing automatic fulfillment for Order: ${event.orderId}`);
    try {
      const shipment = await this.shippingService.processFulfillment(
        event.orderId,
        event.shippingAddress,
      );
      this.logger.log(
        `Shipment created successfully for Order ${event.orderId}. Tracking #: ${shipment.trackingNumber}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process fulfillment for Order ${event.orderId}: ${error.message}`,
        error.stack,
      );
    }
  }
}
