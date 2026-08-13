import { apiClient } from './api';
import type {
  Order,
  Payment,
  Shipment,
  OrderStatus,
  CreateOrderPayload,
  CreatePaymentPayload,
  CreateShipmentPayload,
  CalculateOrderSummaryPayload,
  OrderSummaryResponse,
} from './types';

export const ordersService = {
  createOrder: async (payload: CreateOrderPayload): Promise<Order> => {
    const { data } = await apiClient.post<Order>('/orders', payload);
    return data;
  },

  calculateOrderSummary: async (
    payload: CalculateOrderSummaryPayload,
  ): Promise<OrderSummaryResponse> => {
    const { data } = await apiClient.post<OrderSummaryResponse>(
      '/orders/calculate-summary',
      payload,
    );
    return data;
  },

  getAllOrders: async (): Promise<Order[]> => {
    const { data } = await apiClient.get<Order[]>('/orders');
    return data;
  },

  getOrdersByUserId: async (userId: string): Promise<Order[]> => {
    const { data } = await apiClient.get<Order[]>(`/orders/user/${userId}`);
    return data;
  },

  getOrderById: async (id: string): Promise<Order> => {
    const { data } = await apiClient.get<Order>(`/orders/${id}`);
    return data;
  },

  updateOrderStatus: async (
    id: string,
    status: OrderStatus,
  ): Promise<Order> => {
    const { data } = await apiClient.patch<Order>(`/orders/${id}/status`, {
      status,
    });
    return data;
  },

  createPayment: async (payload: CreatePaymentPayload): Promise<Payment> => {
    const { data } = await apiClient.post<Payment>(
      '/orders/payments',
      payload,
    );
    return data;
  },

  createShipment: async (payload: CreateShipmentPayload): Promise<Shipment> => {
    const { data } = await apiClient.post<Shipment>(
      '/orders/shipments',
      payload,
    );
    return data;
  },

  confirmDelivery: async (orderId: string, userId: string): Promise<Order> => {
    const { data } = await apiClient.post<Order>(
      `/orders/${orderId}/confirm-delivery`,
      { userId },
    );
    return data;
  },
};
