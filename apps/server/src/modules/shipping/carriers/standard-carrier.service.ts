import { Injectable } from '@nestjs/common';
import {
  IShippingCarrier,
  ShippingRateRequest,
  ShippingRateResponse,
  CreateShipmentPayload,
  ShipmentResult,
  TrackingInfo,
} from '../interfaces/shipping-carrier.interface';

@Injectable()
export class StandardCarrierService implements IShippingCarrier {
  async calculateRate(request: ShippingRateRequest): Promise<ShippingRateResponse[]> {
    const baseWeight = request.weightInKg || 1.0;
    const standardCost = Number((5.0 + baseWeight * 1.5).toFixed(2));
    const expressCost = Number((15.0 + baseWeight * 2.5).toFixed(2));

    return [
      {
        carrierName: 'Standard Shipping',
        serviceName: 'Standard Ground',
        serviceCode: 'STD_GROUND',
        cost: standardCost,
        estimatedDays: 4,
      },
      {
        carrierName: 'Standard Shipping',
        serviceName: 'Express Air',
        serviceCode: 'STD_EXPRESS',
        cost: expressCost,
        estimatedDays: 2,
      },
    ];
  }

  async createShipment(request: CreateShipmentPayload): Promise<ShipmentResult> {
    const randomId = Math.floor(100000 + Math.random() * 900000);
    const trackingNumber = `STD-${Date.now().toString().slice(-6)}-${randomId}`;

    return {
      carrierName: 'Standard Shipping',
      serviceName: request.serviceName || 'Standard Ground',
      trackingNumber,
      labelUrl: `https://shipping.example.com/labels/${trackingNumber}.pdf`,
      estimatedDeliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    };
  }

  async trackShipment(trackingNumber: string): Promise<TrackingInfo> {
    return {
      carrierName: 'Standard Shipping',
      trackingNumber,
      status: 'IN_TRANSIT',
      estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      events: [
        {
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
          location: 'Fulfillment Center (Warehouse A)',
          description: 'Package received and dispatched.',
        },
        {
          timestamp: new Date(),
          location: 'Regional Sorting Facility',
          description: 'Package processed at sorting hub.',
        },
      ],
    };
  }
}
