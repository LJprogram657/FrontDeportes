'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService } from '../services/api';

interface User {
  id: number;
  username: string;
  email: string;
  is_admin: boolean;
  first_name?: string;
  last_name?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  register: (email: string, password: string, firstName?: string, lastName?: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Verificar autenticación al cargar
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = apiService.getCurrentUser();
        if (currentUser && apiService.isAuthenticated()) {
          // Verificar que el token siga siendo válido
          const isValid = await apiService.verifyToken();
          if (isValid) {
            setUser(currentUser);
          } else {
            // Token inválido, limpiar datos
            await apiService.logout();
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Error verificando autenticación:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await apiService.login({ email, password });
      
      if (response.success && response.user) {
        setUser(response.user);
        return { success: true, message: response.message };
      } else {
        return { success: false, message: response.message };
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error de conexión'
      };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    email: string,
    password: string,
    firstName?: string,
    lastName?: string
  ) => {
    try {
      setIsLoading(true);
      const response = await apiService.register({
        email,
        password,
        first_name: firstName,
        last_name: lastName
      });
      
      if (response.success && response.user) {
        setUser(response.user);
        return { success: true, message: response.message };
      } else {
        return { success: false, message: response.message };
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error de conexión'
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await apiService.logout();
      setUser(null);
    } catch (error) {
      console.error('Error en logout:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    try {
      const response = await apiService.updateProfile(data);
      
      if (response.success && response.user) {
        setUser(response.user);
        return { success: true, message: response.message };
      } else {
        return { success: false, message: response.message };
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error actualizando perfil'
      };
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};