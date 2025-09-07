// frontend/src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import config from '../config';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

// Configurar axios con la URL base
axios.defaults.baseURL = config.API_BASE_URL;
axios.defaults.timeout = config.DEFAULT_TIMEOUT;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Configurar axios con el token
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Verificar token al cargar la app
  useEffect(() => {
    const verifyToken = async () => {
      if (token) {
        try {
          const response = await axios.get('/api/auth/verificar-token');
          setUser(response.data.user);
        } catch (error) {
          console.error('Token inválido:', error);
          logout();
        }
      }
      setLoading(false);
    };

    verifyToken();
  }, [token]);

  // Login
  const login = async (email, password) => {
    try {
      const response = await axios.post('/api/auth/login', {
        email,
        password
      });

      const { token: newToken, user: userData } = response.data;
      
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('token', newToken);
      
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Error al iniciar sesión';
      return { success: false, error: message };
    }
  };

  // Logout
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
  };

  // Verificar si está autenticado
  const isAuthenticated = !!user;

  // Verificar permisos (función helper)
  const hasPermission = (permission) => {
    if (!user) return false;
    if (user.rol === 'propietario') return true;
    return user.permisos?.includes(permission) || false;
  };

  const value = {
    user,
    login,
    logout,
    loading,
    isAuthenticated,
    hasPermission,
    token
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};