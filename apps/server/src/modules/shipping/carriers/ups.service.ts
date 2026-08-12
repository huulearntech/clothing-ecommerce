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
export class UpsService implements IShippingCarrier {
  async calculateRate(request: ShippingRateRequest): Promise<ShippingRateResponse[]> {
    const weight = request.weightInKg || 1.0;

    return [
      {
        carrierName: 'UPS',
        serviceName: 'UPS Ground',
        serviceCode: 'UPS_GROUND',
        cost: Number((11.0 + weight * 1.8).toFixed(2)),
        estimatedDays: 3,
      },
      {
        carrierName: 'UPS',
        serviceName: 'UPS Next Day Air',
        serviceCode: 'UPS_NEXT_DAY',
        cost: Number((42.0 + weight * 4.8).toFixed(2)),
        estimatedDays: 1,
      },
    ];
  }

  async createShipment(request: CreateShipmentPayload): Promise<ShipmentResult> {
    const trackingNumber = `1Z999999${Math.floor(10000000 + Math.random() * 90000000)}`;

    return {
      carrierName: 'UPS',
      serviceName: request.serviceName || 'UPS Ground',
      trackingNumber,
      labelUrl: `https://www.ups.com/labels/${trackingNumber}.pdf`,
      estimatedDeliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    };
  }

  async trackShipment(trackingNumber: string): Promise<TrackingInfo> {
    return {
      carrierName: 'UPS',
      trackingNumber,
      status: 'ON_WAY',
      estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      events: [
        {
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
          location: 'UPS Customer Center, Louisville KY',
          description: 'Origin Scan',
        },
      ],
    };
  }
}
