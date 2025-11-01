import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiClient } from '../services/apiClient';

export type UserProfile = {
  id: string;
  email: string;
  role: 'admin' | 'player';
  phone: string;
  age: number;
  mpesa_number: string;
  balance: number;
  created_at: string;
  updated_at: string;
};

type AuthContextValue = {
  token: string | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: Record<string, unknown>) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
};

const getStoredToken = () => {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    return window.localStorage.getItem('betpulse.token');
  } catch (error) {
    console.warn('Não foi possível ler o token armazenado', error);
    return null;
  }
};

const persistToken = (value: string | null) => {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    if (value) {
      window.localStorage.setItem('betpulse.token', value);
    } else {
      window.localStorage.removeItem('betpulse.token');
    }
  } catch (error) {
    console.warn('Não foi possível sincronizar o token com o storage', error);
  }
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const refreshProfile = useCallback(async () => {
    if (!token) return;
    try {
      const response = await apiClient.get('/auth/me');
      setProfile(response.data.profile);
    } catch (error) {
      console.warn('Falha ao actualizar o perfil', error);
      setProfile(null);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      persistToken(token);
      void refreshProfile().catch((error) => {
        console.warn('Erro ao validar sessão existente', error);
        setToken(null);
      });
    } else {
      persistToken(null);
      setProfile(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const login = useCallback(async (email: string, password: string) => {
    const response = await apiClient.post('/auth/login', { email, password });
    setToken(response.data.token);
    setProfile(response.data.profile);
  }, []);

  const register = useCallback(async (payload: Record<string, unknown>) => {
    const response = await apiClient.post('/auth/register', payload);
    setToken(response.data.token);
    setProfile(response.data.profile);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setProfile(null);
  }, []);

  useEffect(() => {
    const interceptor = apiClient.interceptors.request.use((config) => {
      if (token) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${token}`,
        };
      }
      return config;
    });
    return () => {
      apiClient.interceptors.request.eject(interceptor);
    };
  }, [token]);

  const value = useMemo(
    () => ({
      token,
      profile,
      isAuthenticated: Boolean(token),
      isAdmin: profile?.role === 'admin',
      login,
      register,
      logout,
      refreshProfile,
    }),
    [token, profile, login, register, logout, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
}
