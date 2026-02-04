import axiosInstance from './axios';

export interface NamedItem {
  id: number;
  name: string;
}

export interface PlanetListItem {
  id: number;
  name: string;
  climate?: string;
  terrain?: string;
  population?: number;
}

export interface PlanetDetails {
  id: number;
  name: string;
  rotationPeriod?: number;
  orbitalPeriod?: number;
  diameter?: number;
  climate?: string;
  gravity?: string;
  terrain?: string;
  surfaceWater?: number;
  population?: number;
  films: NamedItem[];
  residents: NamedItem[];
}

export const planetsApi = {
  getAll: async (): Promise<PlanetListItem[]> => {
    const response = await axiosInstance.get('/api/Planets');
    return response.data;
  },
  getById: async (id: number): Promise<PlanetDetails> => {
    const response = await axiosInstance.get(`/api/Planets/${id}`);
    return response.data;
  },
};
