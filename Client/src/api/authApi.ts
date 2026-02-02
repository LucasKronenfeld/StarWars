import axiosInstance from './axios';

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
}

export interface MeResponse {
  userId: string;
  email: string;
}

export const authApi = {
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await axiosInstance.post('/api/Auth/register', data);
    return response.data;
  },

  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await axiosInstance.post('/api/Auth/login', data);
    return response.data;
  },

  me: async (): Promise<MeResponse> => {
    const response = await axiosInstance.get('/api/Auth/me');
    return response.data;
  },
};
