import { apiClient } from './api';
import type {
  AuthResponse,
  LoginPayload,
  RegisterPayload,
  User,
} from './types';

const TOKEN_KEY = 'access_token';
const USER_KEY = 'currentUser';

export const authService = {
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>('/auth/login', payload);
    authService.setSession(data.accessToken, data.user);
    return data;
  },

  register: async (payload: RegisterPayload): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>('/auth/register', payload);
    authService.setSession(data.accessToken, data.user);
    return data;
  },

  getProfile: async (): Promise<User> => {
    const { data } = await apiClient.get<User>('/auth/me');
    localStorage.setItem(USER_KEY, JSON.stringify(data));
    return data;
  },

  logout: (): void => {
    authService.clearSession();
  },

  setSession: (accessToken: string, user: User): void => {
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  clearSession: (): void => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem(USER_KEY);
    if (!userStr) return null;
    try {
      return JSON.parse(userStr) as User;
    } catch {
      return null;
    }
  },

  getToken: (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem(TOKEN_KEY);
  },
};
