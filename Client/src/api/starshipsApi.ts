import axiosInstance from './axios';

export interface StarshipListItemDto {
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
}

export interface NamedItemDto {
  id: number;
  name: string;
}

export interface StarshipDetailsDto {
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
  hyperdriveRating?: number;
  mglt?: number;
  maxAtmospheringSpeed?: string;
  consumables?: string;
  films: NamedItemDto[];
  pilots: NamedItemDto[];
}

export interface RangeDto<T> {
  min?: T;
  max?: T;
}

export interface StarshipFiltersDto {
  manufacturers: string[];
  classes: string[];
  costInCredits: RangeDto<number>;
  length: RangeDto<number>;
  crew: RangeDto<number>;
  passengers: RangeDto<number>;
  cargoCapacity: RangeDto<number>;
}

export interface PagedResponse<T> {
  items: T[];
  totalCount: number;
}

export interface StarshipsQuery {
  // Text filters
  search?: string;
  class?: string;       // starshipClass filter
  manufacturer?: string;
  
  // Numeric range filters
  minCost?: number;
  maxCost?: number;
  minLength?: number;
  maxLength?: number;
  minCrew?: number;
  maxCrew?: number;
  minPassengers?: number;
  maxPassengers?: number;
  minCargoCapacity?: number;
  maxCargoCapacity?: number;
  
  // Sorting
  sort?: string;  // name, model, manufacturer, class, cost, length, crew, passengers, cargo
  dir?: string;   // asc, desc
  
  // Pagination
  page?: number;
  pageSize?: number;
}

export interface ForkStarshipRequest {
  name?: string;        // Optional override name
  addToFleet?: boolean; // Default: true
}

export interface ForkStarshipResponse {
  id: number;           // New user starship id
  baseStarshipId: number; // Original catalog id
}

export const starshipsApi = {
  list: async (query?: StarshipsQuery): Promise<PagedResponse<StarshipListItemDto>> => {
    const response = await axiosInstance.get('/api/Starships', { params: query });
    return response.data;
  },

  getById: async (id: number): Promise<StarshipDetailsDto> => {
    const response = await axiosInstance.get(`/api/Starships/${id}`);
    return response.data;
  },

  getFilters: async (): Promise<StarshipFiltersDto> => {
    const response = await axiosInstance.get('/api/Starships/filters');
    return response.data;
  },

  fork: async (id: number, request?: ForkStarshipRequest): Promise<ForkStarshipResponse> => {
    const response = await axiosInstance.post(`/api/Starships/${id}/fork`, request || {});
    return response.data;
  },
};
