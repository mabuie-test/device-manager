import axios from 'axios';
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
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: Record<string, unknown>) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
};

const AUTH_STORAGE_KEY = 'fluxobet.token';
const LEGACY_STORAGE_KEYS = ['betpulse.token'];

const getStoredToken = () => {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const stored = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      return stored;
    }
    for (const legacyKey of LEGACY_STORAGE_KEYS) {
      const legacy = window.localStorage.getItem(legacyKey);
      if (legacy) {
        window.localStorage.setItem(AUTH_STORAGE_KEY, legacy);
        window.localStorage.removeItem(legacyKey);
        return legacy;
      }
    }
    return null;
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
      window.localStorage.setItem(AUTH_STORAGE_KEY, value);
    } else {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  } catch (error) {
    console.warn('Não foi possível sincronizar o token com o storage', error);
  }
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const initialTokenValue = getStoredToken();

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(initialTokenValue);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(initialTokenValue));

  const performProfileFetch = useCallback(
    async (authToken: string) => {
      const response = await apiClient.get('/auth/me', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setProfile(response.data.profile);
    },
    []
  );

  const refreshProfile = useCallback(async () => {
    if (!token) return;
    try {
      await performProfileFetch(token);
    } catch (error) {
      console.warn('Falha ao actualizar o perfil', error);
      setProfile(null);
    }
  }, [token, performProfileFetch]);

  useEffect(() => {
    let cancelled = false;
    if (token) {
      persistToken(token);
      setIsLoading(true);
      performProfileFetch(token)
        .catch((error) => {
          console.warn('Erro ao validar sessão existente', error);
          if (!cancelled) {
            if (axios.isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 403)) {
              setToken(null);
              setProfile(null);
            }
          }
        })
        .finally(() => {
          if (!cancelled) {
            setIsLoading(false);
          }
        });
    } else {
      persistToken(null);
      setProfile(null);
      setIsLoading(false);
    }
    return () => {
      cancelled = true;
    };
  }, [token, performProfileFetch]);

  const login = useCallback(async (email: string, password: string) => {
    const response = await apiClient.post('/auth/login', { email, password });
    setToken(response.data.token);
    setProfile(response.data.profile);
    persistToken(response.data.token);
  }, []);

  const register = useCallback(async (payload: Record<string, unknown>) => {
    const response = await apiClient.post('/auth/register', payload);
    setToken(response.data.token);
    setProfile(response.data.profile);
    persistToken(response.data.token);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setProfile(null);
    persistToken(null);
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
      isLoading,
      login,
      register,
      logout,
      refreshProfile,
    }),
    [token, profile, isLoading, login, register, logout, refreshProfile]
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
