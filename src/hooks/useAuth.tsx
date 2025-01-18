import React, { createContext, useContext, useState, ReactNode } from "react";
import axios from "axios";

interface Wallet {
  id: string;
  userId: string;
  symbol: string;
  address: string;
  createdAt: string;
  updatedAt: string;
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

  const login = async (email: string, password: string) => {
    try {
      console.log(`Logging in with URL: ${API.defaults.baseURL}/auth/login`);
      const response = await API.post('/auth/login', { email, password });
      const { user } = response.data;
      console.log(`Login successful: ${JSON.stringify(user)}`);
      setUser(user);
    } catch (error) {
      console.error('Login failed', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log(`Logging out with URL: ${API.defaults.baseURL}/auth/logout`);
      await API.post('/auth/logout');
      console.log('Logout successful');
      setUser(null);
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