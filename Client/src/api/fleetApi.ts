import axiosInstance from './axios';

export interface FleetItemDto {
  starshipId: number;
  name: string;
  manufacturer?: string;
  starshipClass?: string;
  quantity: number;
  nickname?: string;
  isCatalog: boolean;
  isActive: boolean;
}

export interface FleetDto {
  fleetId: number;
  items: FleetItemDto[];
}

export interface AddFleetItemRequest {
  starshipId: number;
  quantity?: number;
}

export interface UpdateFleetItemRequest {
  quantity: number;
  nickname?: string;
}

export const fleetApi = {
  get: async (): Promise<FleetDto> => {
    const response = await axiosInstance.get('/api/Fleet');
    return response.data;
  },

  addItem: async (data: AddFleetItemRequest): Promise<void> => {
    await axiosInstance.post('/api/Fleet/items', data);
  },

  updateItem: async (starshipId: number, data: UpdateFleetItemRequest): Promise<void> => {
    await axiosInstance.patch(`/api/Fleet/items/${starshipId}`, data);
  },

  removeItem: async (starshipId: number): Promise<void> => {
    await axiosInstance.delete(`/api/Fleet/items/${starshipId}`);
  },
};
