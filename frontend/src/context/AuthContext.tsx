import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api/client';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  walletBalance: number;
  showAuthModal: boolean;
  authMode: 'login' | 'register';
  setShowAuthModal: (show: boolean) => void;
  setAuthMode: (mode: 'login' | 'register') => void;
  login: (username: string, password: string) => Promise<void>;
  register: (
    username: string,
    email: string,
    password: string,
    initialCapital?: number
  ) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateBalance: (balance: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('stocksim_token'));
  const [loading, setLoading] = useState<boolean>(true);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  const refreshUser = async () => {
    if (!localStorage.getItem('stocksim_token')) {
      setUser(null);
      setWalletBalance(0);
      setLoading(false);
      return;
    }

    try {
      const userData = await api.getMe();
      setUser(userData);
      if (userData.wallet_balance !== undefined) {
        setWalletBalance(Number(userData.wallet_balance));
      }
    } catch (err: any) {
      console.warn('Failed to load profile with stored token:', err.message);
      // If unauthorized, clear token
      if (err.status === 401) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, [token]);

  const login = async (username: string, password: string) => {
    const res = await api.login(username, password);
    localStorage.setItem('stocksim_token', res.access_token);
    setToken(res.access_token);
    setUser(res.user);
    if (res.user.wallet_balance !== undefined) {
      setWalletBalance(Number(res.user.wallet_balance));
    }
    setShowAuthModal(false);
  };

  const register = async (
    username: string,
    email: string,
    password: string,
    initialCapital?: number
  ) => {
    // 1. Call register
    await api.register(username, email, password, initialCapital);
    // 2. Automatically log in to get token & set session
    await login(username, password);
  };

  const logout = () => {
    localStorage.removeItem('stocksim_token');
    setToken(null);
    setUser(null);
    setWalletBalance(0);
  };

  const updateBalance = (balance: number) => {
    setWalletBalance(balance);
    if (user) {
      setUser({ ...user, wallet_balance: balance });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        walletBalance,
        showAuthModal,
        authMode,
        setShowAuthModal,
        setAuthMode,
        login,
        register,
        logout,
        refreshUser,
        updateBalance,
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
