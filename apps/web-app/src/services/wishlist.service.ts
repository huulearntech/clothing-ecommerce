import { apiClient } from './api';
import { authService } from './auth.service';
import type { Wishlist, AddToWishlistPayload } from './types';

export const wishlistService = {
  getWishlistByUserId: async (userId?: string): Promise<Wishlist> => {
    const activeUserId = userId || authService.getCurrentUser()?.id;
    if (!activeUserId) {
      return { id: '', userId: '', name: '', items: [] };
    }
    const { data } = await apiClient.get<Wishlist>(`/wishlist/user/${activeUserId}`);
    return data;
  },

  addToWishlist: async (
    payload: Partial<AddToWishlistPayload> & { productId: string },
  ): Promise<Wishlist> => {
    const currentUser = authService.getCurrentUser();
    if (currentUser?.role === 'ADMIN') {
      throw new Error('Admin users are not allowed to add items to wishlist.');
    }
    const activeUserId = payload.userId || currentUser?.id;
    if (!activeUserId) {
      throw new Error('User must be signed in to add items to wishlist.');
    }
    const body: AddToWishlistPayload = {
      userId: activeUserId,
      productId: payload.productId,
      variantId:
        payload.variantId && payload.variantId.trim() !== ''
          ? payload.variantId
          : undefined,
    };
    const { data } = await apiClient.post<Wishlist>('/wishlist/items', body);
    return data;
  },

  removeFromWishlist: async (itemId: string): Promise<void> => {
    await apiClient.delete(`/wishlist/items/${itemId}`);
  },
};
