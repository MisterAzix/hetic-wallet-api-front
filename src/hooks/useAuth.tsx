import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import axios from "axios";

interface Transaction {
  id: string;
  userId: string;
  walletId: string;
  blockNumber: number;
  transactionIndex: number;
  balance: number;
  date: string;
}

interface Wallet {
  id: string;
  userId: string;
  symbol: string;
  address: string;
  createdAt: string;
  updatedAt: string;
  transactions: Transaction[];
}

interface User {
  id: string;
  email: string;
  wallets: Wallet[];
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  withCredentials: true, 
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await API.post('/auth/login', { email, password });
      const { user } = response.data;
      setUser(user);
      localStorage.setItem("user", JSON.stringify(user));
    } catch (error) {
      console.error('Login failed', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await API.post('/auth/logout', {}, { withCredentials: true });
      setUser(null);
      localStorage.removeItem("user");
    } catch (error) {
      console.error('Logout failed', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};