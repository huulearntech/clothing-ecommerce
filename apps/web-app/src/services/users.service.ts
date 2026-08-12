import { apiClient } from './api';
import type {
  User,
  Address,
  CustomerProfile,
  CreateUserPayload,
  UpdateUserPayload,
  CreateAddressPayload,
  UpsertProfilePayload,
} from './types';

export const usersService = {
  createUser: async (payload: CreateUserPayload): Promise<User> => {
    const { data } = await apiClient.post<User>('/users', payload);
    return data;
  },

  getAllUsers: async (): Promise<User[]> => {
    const { data } = await apiClient.get<User[]>('/users');
    return data;
  },

  getUserById: async (id: string): Promise<User> => {
    const { data } = await apiClient.get<User>(`/users/${id}`);
    return data;
  },

  updateUser: async (id: string, payload: UpdateUserPayload): Promise<User> => {
    const { data } = await apiClient.patch<User>(`/users/${id}`, payload);
    return data;
  },

  addAddress: async (
    userId: string,
    payload: CreateAddressPayload,
  ): Promise<Address> => {
    const { data } = await apiClient.post<Address>(
      `/users/${userId}/addresses`,
      payload,
    );
    return data;
  },

  upsertProfile: async (
    userId: string,
    payload: UpsertProfilePayload,
  ): Promise<CustomerProfile> => {
    const { data } = await apiClient.post<CustomerProfile>(
      `/users/${userId}/profile`,
      payload,
    );
    return data;
  },
};
