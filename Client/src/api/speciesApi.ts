import axiosInstance from './axios';

export interface NamedItem {
  id: number;
  name: string;
}

export interface SpeciesListItem {
  id: number;
  name: string;
  classification?: string;
  language?: string;
}

export interface SpeciesDetails {
  id: number;
  name: string;
  classification?: string;
  designation?: string;
  averageHeight?: string;
  skinColors?: string;
  hairColors?: string;
  eyeColors?: string;
  averageLifespan?: string;
  language?: string;
  homeworld?: NamedItem;
  films: NamedItem[];
  people: NamedItem[];
}

export const speciesApi = {
  getAll: async (): Promise<SpeciesListItem[]> => {
    const response = await axiosInstance.get('/api/Species');
    return response.data;
  },
  getById: async (id: number): Promise<SpeciesDetails> => {
    const response = await axiosInstance.get(`/api/Species/${id}`);
    return response.data;
  },
};
