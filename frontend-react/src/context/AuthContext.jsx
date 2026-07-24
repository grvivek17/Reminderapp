import React, { createContext, useState, useEffect } from 'react';
import { api } from '../utils/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check local storage for existing session
    const storedUser = localStorage.getItem('reminder_app_user');
    const token = localStorage.getItem('reminder_app_token');
    
    if (storedUser && token) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Failed to parse user from local storage');
      }
    }
    setLoading(false);

    // Listen for unauthorized events from api.js
    const handleAuthExpired = () => {
      setCurrentUser(null);
    };
    window.addEventListener('auth-expired', handleAuthExpired);
    return () => window.removeEventListener('auth-expired', handleAuthExpired);
  }, []);

  const login = async (email, password) => {
    const res = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    localStorage.setItem('reminder_app_token', res.token);
    localStorage.setItem('reminder_app_user', JSON.stringify(res.user));
    setCurrentUser(res.user);
  };

  const signup = async (name, email, password) => {
    const res = await api('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password })
    });
    localStorage.setItem('reminder_app_token', res.token);
    localStorage.setItem('reminder_app_user', JSON.stringify(res.user));
    setCurrentUser(res.user);
  };

  const logout = () => {
    localStorage.removeItem('reminder_app_token');
    localStorage.removeItem('reminder_app_user');
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{ currentUser, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
