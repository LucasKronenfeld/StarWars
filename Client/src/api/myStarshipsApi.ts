import axiosInstance from './axios';

export interface MyStarshipListItemDto {
  id: number;
  name: string;
  model?: string;
  manufacturer?: string;
  starshipClass?: string;
  costInCredits?: number;
  length?: number;
  crew?: number;
  passengers?: number;
  cargoCapacity?: number;
  consumables?: string;
  hyperdriveRating?: number;
  mglt?: number;
  baseStarshipId?: number;
  pilotId?: number;
  pilotName?: string;
}

export interface MyStarshipDetailDto extends MyStarshipListItemDto {
  isActive: boolean;
}

export interface PagedResponse<T> {
  items: T[];
  totalCount: number;
}

export interface MyStarshipsQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  manufacturer?: string;
  class?: string;
  costMin?: number;
  costMax?: number;
  lengthMin?: number;
  lengthMax?: number;
  crewMin?: number;
  crewMax?: number;
  passengerMin?: number;
  passengerMax?: number;
  cargoMin?: number;
  cargoMax?: number;
  pilotId?: number;
  sortBy?: string;
  sortDir?: string;
}

export interface CreateMyStarshipRequest {
  name: string;
  model?: string;
  manufacturer?: string;
  starshipClass?: string;
  costInCredits?: number;
  length?: number;
  crew?: number;
  passengers?: number;
  cargoCapacity?: number;
  hyperdriveRating?: number;
  mglt?: number;
  maxAtmospheringSpeed?: string;
  consumables?: string;
  pilotId?: number;
}

export interface UpdateMyStarshipRequest extends CreateMyStarshipRequest {}

export const myStarshipsApi = {
  list: async (query?: MyStarshipsQuery): Promise<PagedResponse<MyStarshipListItemDto>> => {
    const response = await axiosInstance.get('/api/My-Starships', { params: query });
    return response.data;
  },

  getById: async (id: number): Promise<MyStarshipDetailDto> => {
    const response = await axiosInstance.get(`/api/My-Starships/${id}`);
    return response.data;
  },

  create: async (data: CreateMyStarshipRequest): Promise<{ id: number }> => {
    const response = await axiosInstance.post('/api/My-Starships', data);
    return response.data;
  },

  update: async (id: number, data: UpdateMyStarshipRequest): Promise<void> => {
    await axiosInstance.put(`/api/My-Starships/${id}`, data);
  },

  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/api/My-Starships/${id}`);
  },
};
