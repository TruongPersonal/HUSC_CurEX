import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  // Setup api default auth header
  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('token', token);
      fetchMe();
    } else {
      delete api.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
      setUser(null);
      setLoading(false);
    }
  }, [token]);

  const fetchMe = async () => {
    try {
      const response = await api.get('/api/auth/me');
      setUser(response.data.user);
    } catch (error) {
      console.error('Lỗi lấy thông tin user:', error);
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async (credential) => {
    const response = await api.post('/api/auth/google', {
      credential
    });
    setToken(response.data.token);
    setUser(response.data.user);
    return response.data;
  };

  const loginLocal = async (username, password) => {
    const response = await api.post('/api/auth/login', {
      username,
      password
    });
    setToken(response.data.token);
    setUser(response.data.user);
    return response.data;
  };

  const logout = () => {
    setToken(null);
  };

  const value = {
    user,
    token,
    isAuthenticated: !!user,
    loading,
    loginWithGoogle,
    loginLocal,
    logout,
    setUser
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
