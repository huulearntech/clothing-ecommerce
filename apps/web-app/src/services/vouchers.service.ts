import { apiClient } from './api';
import type {
  Voucher,
  CreateVoucherPayload,
  ApplyVoucherPayload,
  ApplyVoucherResult,
} from './types';

export const vouchersService = {
  // Voucher CRUD & Event Promotion APIs
  createVoucher: async (payload: CreateVoucherPayload): Promise<Voucher> => {
    const { data } = await apiClient.post<Voucher>('/vouchers', payload);
    return data;
  },

  getAllVouchers: async (): Promise<Voucher[]> => {
    const { data } = await apiClient.get<Voucher[]>('/vouchers');
    return data;
  },

  getActivePromotions: async (): Promise<Voucher[]> => {
    const { data } = await apiClient.get<Voucher[]>('/vouchers/promotions');
    return data;
  },

  getVoucherById: async (id: string): Promise<Voucher> => {
    const { data } = await apiClient.get<Voucher>(`/vouchers/${id}`);
    return data;
  },

  updateVoucher: async (
    id: string,
    payload: Partial<CreateVoucherPayload>,
  ): Promise<Voucher> => {
    const { data } = await apiClient.put<Voucher>(`/vouchers/${id}`, payload);
    return data;
  },

  deleteVoucher: async (id: string): Promise<void> => {
    await apiClient.delete(`/vouchers/${id}`);
  },

  validateAndApplyVoucher: async (
    payload: ApplyVoucherPayload,
  ): Promise<ApplyVoucherResult> => {
    const { data } = await apiClient.post<ApplyVoucherResult>(
      '/vouchers/validate',
      payload,
    );
    return data;
  },
};
