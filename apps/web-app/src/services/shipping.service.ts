import { apiClient } from './api';
import type {
  ShippingRateRequest,
  ShippingRateResponse,
  TrackingInfo,
} from './types';

export const shippingService = {
  getRates: async (
    payload: ShippingRateRequest,
  ): Promise<ShippingRateResponse[]> => {
    const { data } = await apiClient.post<ShippingRateResponse[]>(
      '/shipping/rates',
      payload,
    );
    return data;
  },

  trackShipment: async (trackingNumber: string): Promise<TrackingInfo> => {
    const { data } = await apiClient.get<TrackingInfo>(
      `/shipping/track/${trackingNumber}`,
    );
    return data;
  },
};
