import axiosInstance from './axios';

export interface NamedItem {
  id: number;
  name: string;
}

export interface FilmDetails {
  id: number;
  title: string;
  episodeId: number;
  openingCrawl: string | null;
  director: string | null;
  producer: string | null;
  releaseDate: string | null;
  characters: NamedItem[];
  planets: NamedItem[];
  starships: NamedItem[];
  vehicles: NamedItem[];
  species: NamedItem[];
}

export interface FilmListItem {
  id: number;
  title: string;
  episodeId: number;
  releaseDate: string | null;
}

export const filmsApi = {
  getAll: async (): Promise<FilmListItem[]> => {
    const response = await axiosInstance.get('/api/Films');
    return response.data;
  },
  getById: async (id: number): Promise<FilmDetails> => {
    const response = await axiosInstance.get(`/api/Films/${id}`);
    return response.data;
  },
};
