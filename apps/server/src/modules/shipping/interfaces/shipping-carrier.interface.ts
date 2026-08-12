export interface ShippingAddress {
  street: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
}

export interface Dimensions {
  length: number;
  width: number;
  height: number;
}

export interface ShippingRateRequest {
  originAddress?: ShippingAddress;
  destinationAddress: ShippingAddress;
  weightInKg: number;
  dimensions?: Dimensions;
  itemCount?: number;
}

export interface ShippingRateResponse {
  carrierName: string;
  serviceName: string;
  serviceCode: string;
  cost: number;
  estimatedDays: number;
}

export interface CreateShipmentPayload {
  orderId: string;
  originAddress?: ShippingAddress;
  destinationAddress: ShippingAddress;
  weightInKg: number;
  dimensions?: Dimensions;
  carrierName?: string;
  serviceName?: string;
}

export interface ShipmentResult {
  carrierName: string;
  serviceName: string;
  trackingNumber: string;
  labelUrl?: string;
  estimatedDeliveryDate?: Date;
}

export interface TrackingInfo {
  carrierName: string;
  trackingNumber: string;
  status: string;
  estimatedDelivery?: Date;
  events: Array<{
    timestamp: Date;
    location: string;
    description: string;
  }>;
}

export abstract class AbstractShippingCarrier {
  abstract calculateRate(request: ShippingRateRequest): Promise<ShippingRateResponse[]>;
  abstract createShipment(request: CreateShipmentPayload): Promise<ShipmentResult>;
  abstract trackShipment(trackingNumber: string): Promise<TrackingInfo>;
}

export type IShippingCarrier = AbstractShippingCarrier;
