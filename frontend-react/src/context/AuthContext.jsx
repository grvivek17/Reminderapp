import React, { createContext, useState, useEffect, useRef } from 'react';
import Keycloak from 'keycloak-js';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [keycloak, setKeycloak] = useState(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    // TEMPORARY: Bypassing Keycloak auth
    setLoading(false);
    
    // Check if user is already logged in (mock)
    const token = localStorage.getItem('reminder_app_token');
    if (token) {
      setCurrentUser({
        id: 'mock-user-123',
        email: 'mockuser@example.com',
        name: 'Mock User',
      });
    }
    
    /* 
    if (isInitialized.current) return;
    isInitialized.current = true;
    ...
    */
  }, []);

  const login = async () => {
    // TEMPORARY: Mock login
    localStorage.setItem('reminder_app_token', 'mock_token_123');
    setCurrentUser({
      id: 'mock-user-123',
      email: 'mockuser@example.com',
      name: 'Mock User',
    });
  };

  const signup = () => {
    login();
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
