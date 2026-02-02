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

  seed: async (catalogOnly?: boolean, seedKey?: string): Promise<any> => {
    const response = await axiosInstance.post('/api/admin/seed', null, {
      params: { catalogOnly },
      headers: seedKey ? { 'X-SEED-KEY': seedKey } : {},
    });
    return response.data;
  },
};
