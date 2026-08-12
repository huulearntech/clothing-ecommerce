import { apiClient } from './api';
import { authService } from './auth.service';
import type { Cart, AddToCartPayload } from './types';

const SESSION_KEY = 'cart_session_token';
const USER_KEY = 'currentUser';

export function getCartSessionIdentifier(): { userId?: string; sessionToken?: string } {
  const userStr = localStorage.getItem(USER_KEY);
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user?.id) {
        return { userId: user.id };
      }
    } catch {
      // Ignore JSON parse errors
    }
  }

  let sessionToken = localStorage.getItem(SESSION_KEY);
  if (!sessionToken) {
    sessionToken =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : 'session_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem(SESSION_KEY, sessionToken);
  }
  return { sessionToken };
}

export const cartService = {
  // Cart operations
  getCart: async (params?: {
    userId?: string;
    sessionToken?: string;
  }): Promise<Cart> => {
    const identifier = getCartSessionIdentifier();
    const queryParams = { ...identifier, ...params };
    const { data } = await apiClient.get<Cart>('/cart', { params: queryParams });
    return data;
  },

  addItem: async (payload: AddToCartPayload): Promise<Cart> => {
    const currentUser = authService.getCurrentUser();
    if (currentUser?.role === 'ADMIN') {
      throw new Error('Admin users are not allowed to add items to cart.');
    }
    const identifier = getCartSessionIdentifier();
    const body = { ...identifier, ...payload };
    const { data } = await apiClient.post<Cart>('/cart/items', body);
    return data;
  },

  updateItemQuantity: async (
    itemId: string,
    quantity: number,
  ): Promise<void> => {
    await apiClient.patch(`/cart/items/${itemId}`, { quantity });
  },

  removeItem: async (itemId: string): Promise<void> => {
    await apiClient.delete(`/cart/items/${itemId}`);
  },

  removeItems: async (itemIds: string[]): Promise<{ deleted: number }> => {
    const { data } = await apiClient.post<{ deleted: number }>(
      '/cart/items/remove-batch',
      { itemIds },
    );
    return data;
  },
};
