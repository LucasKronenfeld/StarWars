import axiosInstance from './axios';

export interface AdminCatalogStarshipDto {
  id: number;
  name: string;
  manufacturer?: string;
  starshipClass?: string;
  isActive: boolean;
  swapiUrl?: string;
}

export interface PagedResponse<T> {
  items: T[];
  totalCount: number;
}

export interface AdminCatalogQuery {
  includeInactive?: boolean;
  search?: string;
  sort?: string;
  dir?: string;
  page?: number;
  pageSize?: number;
}

export const adminApi = {
  getCatalogStarships: async (query?: AdminCatalogQuery): Promise<PagedResponse<AdminCatalogStarshipDto>> => {
    const response = await axiosInstance.get('/api/admin/catalog/starships', { params: query });
    return response.data;
  },

  retireStarship: async (id: number): Promise<void> => {
    await axiosInstance.patch(`/api/admin/catalog/starships/${id}/retire`);
  },

  activateStarship: async (id: number): Promise<void> => {
    await axiosInstance.patch(`/api/admin/catalog/starships/${id}/activate`);
  },

  // Production-safe catalog sync (no wipe)
  syncCatalog: async (): Promise<any> => {
    const response = await axiosInstance.post('/api/admin/sync-catalog');
    return response.data;
  },

  // Development-only: wipe and reseed (requires dev environment)
  devWipeReseed: async (seedKey?: string): Promise<any> => {
    const response = await axiosInstance.post('/api/admin/dev-wipe-reseed', null, {
      headers: seedKey ? { 'X-SEED-KEY': seedKey } : {},
    });
    return response.data;
  },

  // Get environment info
  getEnvironment: async (): Promise<{ environment: string; isDevelopment: boolean }> => {
    const response = await axiosInstance.get('/api/admin/environment');
    return response.data;
  },
};
