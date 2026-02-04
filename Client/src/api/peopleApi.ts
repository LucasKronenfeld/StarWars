import axiosInstance from './axios';

export interface NamedItem {
  id: number;
  name: string;
}

export interface PersonListItem {
  id: number;
  name: string;
  gender?: string;
  birthYear?: string;
}

export interface PersonDetails {
  id: number;
  name: string;
  height?: number;
  mass?: number;
  hairColor?: string;
  skinColor?: string;
  eyeColor?: string;
  birthYear?: string;
  gender?: string;
  homeworld?: NamedItem;
  films: NamedItem[];
  starships: NamedItem[];
  vehicles: NamedItem[];
  species: NamedItem[];
}

export const peopleApi = {
  getAll: async (): Promise<PersonListItem[]> => {
    const response = await axiosInstance.get('/api/People');
    return response.data;
  },
  getById: async (id: number): Promise<PersonDetails> => {
    const response = await axiosInstance.get(`/api/People/${id}`);
    return response.data;
  },
};
