import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('task2_jwt_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.getCurrentUser();
        if (res.success) {
          setUser(res.user);
        } else {
          logout();
        }
      } catch (err) {
        console.error('Auth verification error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [token]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await api.login(email, password);
      if (res.success) {
        localStorage.setItem('task2_jwt_token', res.token);
        setToken(res.token);
        setUser(res.user);
        setLoading(false);
        return { success: true, role: res.user.role };
      } else {
        setLoading(false);
        return { success: false, error: res.error };
      }
    } catch (err) {
      setLoading(false);
      return { success: false, error: 'Network error or backend offline.' };
    }
  };

  const register = async (name, email, password, role) => {
    setLoading(true);
    try {
      const res = await api.register(name, email, password, role);
      if (res.success) {
        localStorage.setItem('task2_jwt_token', res.token);
        setToken(res.token);
        setUser(res.user);
        setLoading(false);
        return { success: true, role: res.user.role };
      } else {
        setLoading(false);
        return { success: false, error: res.error };
      }
    } catch (err) {
      setLoading(false);
      return { success: false, error: 'Network error or backend offline.' };
    }
  };

  const logout = () => {
    localStorage.removeItem('task2_jwt_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
