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
export class FedexService implements IShippingCarrier {
  async calculateRate(request: ShippingRateRequest): Promise<ShippingRateResponse[]> {
    const weight = request.weightInKg || 1.0;
    
    return [
      {
        carrierName: 'FedEx',
        serviceName: 'FedEx Home Delivery',
        serviceCode: 'FEDEX_GROUND',
        cost: Number((12.5 + weight * 2.0).toFixed(2)),
        estimatedDays: 3,
      },
      {
        carrierName: 'FedEx',
        serviceName: 'FedEx 2Day',
        serviceCode: 'FEDEX_2DAY',
        cost: Number((24.0 + weight * 3.5).toFixed(2)),
        estimatedDays: 2,
      },
      {
        carrierName: 'FedEx',
        serviceName: 'FedEx Priority Overnight',
        serviceCode: 'FEDEX_OVERNIGHT',
        cost: Number((45.0 + weight * 5.0).toFixed(2)),
        estimatedDays: 1,
      },
    ];
  }

  async createShipment(request: CreateShipmentPayload): Promise<ShipmentResult> {
    const trackingNumber = `FDX-${Math.floor(100000000000 + Math.random() * 900000000000)}`;

    return {
      carrierName: 'FedEx',
      serviceName: request.serviceName || 'FedEx Home Delivery',
      trackingNumber,
      labelUrl: `https://www.fedex.com/labels/${trackingNumber}.pdf`,
      estimatedDeliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    };
  }

  async trackShipment(trackingNumber: string): Promise<TrackingInfo> {
    return {
      carrierName: 'FedEx',
      trackingNumber,
      status: 'IN_TRANSIT',
      estimatedDelivery: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      events: [
        {
          timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
          location: 'FedEx Origin Facility, Memphis TN',
          description: 'Shipment information sent to FedEx',
        },
      ],
    };
  }
}
