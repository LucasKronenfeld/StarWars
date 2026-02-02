import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import { authApi } from '../api/authApi';

export interface User {
  userId: string;
  email: string;
  roles: string[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Hydrate user from token on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode<any>(token);
        const roles = Array.isArray(decoded.role) ? decoded.role : (decoded.role ? [decoded.role] : []);
        setUser({
          userId: decoded.sub,
          email: decoded.email,
          roles,
        });
      } catch (error) {
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authApi.login({ email, password });
    localStorage.setItem('token', response.token);

    const decoded = jwtDecode<any>(response.token);
    const roles = Array.isArray(decoded.role) ? decoded.role : (decoded.role ? [decoded.role] : []);
    setUser({
      userId: decoded.sub,
      email: decoded.email,
      roles,
    });
  };

  const register = async (email: string, password: string) => {
    const response = await authApi.register({ email, password });
    localStorage.setItem('token', response.token);

    const decoded = jwtDecode<any>(response.token);
    const roles = Array.isArray(decoded.role) ? decoded.role : (decoded.role ? [decoded.role] : []);
    setUser({
      userId: decoded.sub,
      email: decoded.email,
      roles,
    });
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        isAdmin: user?.roles.includes('Admin') ?? false,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
