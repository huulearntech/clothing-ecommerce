import { apiClient } from './api';
import type {
  Brand,
  Category,
  Collection,
  Product,
  ProductVariant,
  GetProductsFilterParams,
  CreateBrandPayload,
  CreateCategoryPayload,
  CreateCollectionPayload,
  CreateProductPayload,
  CreateVariantPayload,
  GenerateBatchSkusPayload,
} from './types';

export const catalogService = {
  // Brands
  createBrand: async (payload: CreateBrandPayload): Promise<Brand> => {
    const { data } = await apiClient.post<Brand>('/catalog/brands', payload);
    return data;
  },
  getBrands: async (): Promise<Brand[]> => {
    const { data } = await apiClient.get<Brand[]>('/catalog/brands');
    return data;
  },

  // Categories
  createCategory: async (payload: CreateCategoryPayload): Promise<Category> => {
    const { data } = await apiClient.post<Category>(
      '/catalog/categories',
      payload,
    );
    return data;
  },
  getCategories: async (): Promise<Category[]> => {
    const { data } = await apiClient.get<Category[]>('/catalog/categories');
    return data;
  },

  // Collections
  createCollection: async (
    payload: CreateCollectionPayload,
  ): Promise<Collection> => {
    const { data } = await apiClient.post<Collection>(
      '/catalog/collections',
      payload,
    );
    return data;
  },
  getCollections: async (): Promise<Collection[]> => {
    const { data } = await apiClient.get<Collection[]>('/catalog/collections');
    return data;
  },

  // Products
  createProduct: async (payload: CreateProductPayload | Partial<Product>): Promise<Product> => {
    const { data } = await apiClient.post<Product>(
      '/catalog/products',
      payload,
    );
    return data;
  },
  getProducts: async (params?: GetProductsFilterParams): Promise<Product[]> => {
    const { data } = await apiClient.get<Product[]>('/catalog/products', { params });
    return data;
  },
  getProductById: async (id: string): Promise<Product> => {
    const { data } = await apiClient.get<Product>(`/catalog/products/${id}`);
    return data;
  },
  updateProduct: async (
    id: string,
    payload: Partial<Product>,
  ): Promise<Product> => {
    const { data } = await apiClient.patch<Product>(
      `/catalog/products/${id}`,
      payload,
    );
    return data;
  },
  deleteProduct: async (id: string): Promise<void> => {
    await apiClient.delete(`/catalog/products/${id}`);
  },

  // Product Variants
  createVariant: async (
    payload: CreateVariantPayload,
  ): Promise<ProductVariant> => {
    const { data } = await apiClient.post<ProductVariant>(
      '/catalog/variants',
      payload,
    );
    return data;
  },
  generateSkus: async (payload: GenerateBatchSkusPayload): Promise<string[]> => {
    const { data } = await apiClient.post<string[]>('/catalog/generate-skus', payload);
    return data;
  },
};

