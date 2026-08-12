import { apiClient } from './api';
import type {
  Review,
  ReturnRequest,
  ReturnStatus,
  CreateReviewPayload,
  CreateReturnRequestPayload,
} from './types';

export const reviewsService = {
  createReview: async (payload: CreateReviewPayload): Promise<Review> => {
    const { data } = await apiClient.post<Review>('/reviews', payload);
    return data;
  },

  getReviewsByProduct: async (productId: string): Promise<Review[]> => {
    const { data } = await apiClient.get<Review[]>(
      `/reviews/product/${productId}`,
    );
    return data;
  },

  getAverageRating: async (
    productId: string,
  ): Promise<{ average: number; total: number }> => {
    const { data } = await apiClient.get<{ average: number; total: number }>(
      `/reviews/product/${productId}/rating`,
    );
    return data;
  },
};

export const returnsService = {
  createReturnRequest: async (
    payload: CreateReturnRequestPayload,
  ): Promise<ReturnRequest> => {
    const { data } = await apiClient.post<ReturnRequest>('/returns', payload);
    return data;
  },

  getAllReturnRequests: async (): Promise<ReturnRequest[]> => {
    const { data } = await apiClient.get<ReturnRequest[]>('/returns');
    return data;
  },

  getReturnRequestById: async (id: string): Promise<ReturnRequest> => {
    const { data } = await apiClient.get<ReturnRequest>(`/returns/${id}`);
    return data;
  },

  updateReturnStatus: async (
    id: string,
    status: ReturnStatus,
    refundAmount?: number,
  ): Promise<ReturnRequest> => {
    const { data } = await apiClient.patch<ReturnRequest>(
      `/returns/${id}/status`,
      { status, refundAmount },
    );
    return data;
  },
};
