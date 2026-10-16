import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../api/client';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: {
    email: string;
    password: string;
    displayName: string;
    currency?: string;
    currencySymbol?: string;
    monthlySalary?: number;
    openingBalance?: number;
  }) => Promise<void>;
  logout: () => Promise<void>;
  completeOnboarding: (data: any) => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = async () => {
    try {
      const res = await api.get<{ user: User }>('/auth/me');
      setUser(res.user);
    } catch {
      setUser(null);
      api.setToken(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post<{ token: string; user: User }>('/auth/login', { email, password });
    if (res.token) {
      api.setToken(res.token);
    }
    setUser(res.user);
  };

  const signup = async (data: any) => {
    const res = await api.post<{ token: string; user: User }>('/auth/signup', data);
    if (res.token) {
      api.setToken(res.token);
    }
    setUser(res.user);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      api.setToken(null);
      setUser(null);
    }
  };

  const completeOnboarding = async (data: any) => {
    const res = await api.post<{ user: User }>('/auth/onboarding', data);
    setUser(res.user);
  };

  const refreshUser = async () => {
    await fetchCurrentUser();
  };

  const updateProfile = async (data: Partial<User>) => {
    const res = await api.put<{ user: User }>('/auth/profile', data);
    setUser(res.user);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        logout,
        completeOnboarding,
        refreshUser,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
