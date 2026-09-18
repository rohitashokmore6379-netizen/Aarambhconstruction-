import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api.ts';
import { User } from '../types.ts';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('arambh_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('arambh_auth_token');
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function verifyToken() {
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await api.get('/auth/me');
        if (res.data.success) {
          setUser(res.data.user);
          localStorage.setItem('arambh_user', JSON.stringify(res.data.user));
        }
      } catch (err) {
        // Token invalid
        localStorage.removeItem('arambh_auth_token');
        localStorage.removeItem('arambh_user');
        setUser(null);
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    }

    verifyToken();
  }, [token]);

  const login = async (email: string, pass: string) => {
    try {
      const res = await api.post('/auth/login', { email, password: pass });
      if (res.data.success) {
        const { token: jwtToken, user: userData } = res.data;
        localStorage.setItem('arambh_auth_token', jwtToken);
        localStorage.setItem('arambh_user', JSON.stringify(userData));
        setToken(jwtToken);
        setUser(userData);
        return { success: true };
      }
      return { success: false, message: res.data.message || 'Login failed' };
    } catch (err: any) {
      return {
        success: false,
        message: err.response?.data?.message || err.message || 'Authentication error',
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('arambh_auth_token');
    localStorage.removeItem('arambh_user');
    setUser(null);
    setToken(null);
    window.location.href = '/admin/login';
  };

  const isAuthenticated = !!token && !!user;
  const isAdmin = user?.role === 'ROLE_ADMIN';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isAdmin,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
