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
        console.log('JWT decoded:', decoded);
        // Try multiple claim name variations
        let roles: string[] = [];
        if (Array.isArray(decoded.role)) {
          roles = decoded.role;
        } else if (decoded.role) {
          roles = [decoded.role];
        } else if (Array.isArray(decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'])) {
          roles = decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
        } else if (decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']) {
          roles = [decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']];
        }
        console.log('Parsed roles:', roles);
        setUser({
          userId: decoded.sub,
          email: decoded.email,
          roles,
        });
      } catch (error) {
        console.error('JWT decode error:', error);
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authApi.login({ email, password });
    localStorage.setItem('token', response.token);

    const decoded = jwtDecode<any>(response.token);
    console.log('Login JWT decoded:', decoded);
    // Try multiple claim name variations
    let roles: string[] = [];
    if (Array.isArray(decoded.role)) {
      roles = decoded.role;
    } else if (decoded.role) {
      roles = [decoded.role];
    } else if (Array.isArray(decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'])) {
      roles = decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
    } else if (decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']) {
      roles = [decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']];
    }
    console.log('Login parsed roles:', roles);
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
    console.log('Register JWT decoded:', decoded);
    // Try multiple claim name variations
    let roles: string[] = [];
    if (Array.isArray(decoded.role)) {
      roles = decoded.role;
    } else if (decoded.role) {
      roles = [decoded.role];
    } else if (Array.isArray(decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'])) {
      roles = decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
    } else if (decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']) {
      roles = [decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']];
    }
    console.log('Register parsed roles:', roles);
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
