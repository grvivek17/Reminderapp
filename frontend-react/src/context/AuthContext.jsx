import React, { createContext, useState, useEffect } from 'react';
import { api } from '../utils/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('reminder_app_token');
      if (token) {
        try {
          // Verify token by fetching user profile
          const user = await api('/auth/me');
          setCurrentUser(user);
        } catch (err) {
          console.error("Token verification failed", err);
          localStorage.removeItem('reminder_app_token');
          setCurrentUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      localStorage.setItem('reminder_app_token', res.token);
      setCurrentUser(res.user);
    } catch (err) {
      alert(err.message || 'Login failed');
      throw err;
    }
  };

  const signup = async (name, email, password) => {
    try {
      const res = await api('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ name, email, password })
      });
      localStorage.setItem('reminder_app_token', res.token);
      setCurrentUser(res.user);
    } catch (err) {
      alert(err.message || 'Signup failed');
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('reminder_app_token');
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{ currentUser, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

