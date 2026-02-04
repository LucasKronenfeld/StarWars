import axiosInstance from './axios';

export interface NamedItem {
  id: number;
  name: string;
}

export interface VehicleListItem {
  id: number;
  name: string;
  model?: string;
  manufacturer?: string;
  vehicleClass?: string;
}

export interface VehicleDetails {
  id: number;
  name: string;
  model?: string;
  manufacturer?: string;
  costInCredits?: string;
  length?: string;
  maxAtmospheringSpeed?: string;
  crew?: string;
  passengers?: string;
  cargoCapacity?: string;
  consumables?: string;
  vehicleClass?: string;
  films: NamedItem[];
  pilots: NamedItem[];
}

export const vehiclesApi = {
  getAll: async (): Promise<VehicleListItem[]> => {
    const response = await axiosInstance.get('/api/Vehicles');
    return response.data;
  },
  getById: async (id: number): Promise<VehicleDetails> => {
    const response = await axiosInstance.get(`/api/Vehicles/${id}`);
    return response.data;
  },
};
