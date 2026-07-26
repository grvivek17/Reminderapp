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
      // If the token is a giant JWT from the old Keycloak setup, clear it
      if (token.length > 100) {
        localStorage.removeItem('reminder_app_token');
        setCurrentUser(null);
      } else {
        setCurrentUser({
          id: 'mock-' + token,
          email: token,
          name: token.split('@')[0],
        });
      }
    }
    
    /* 
    if (isInitialized.current) return;
    isInitialized.current = true;
    ...
    */
  }, []);

  const login = async () => {
    // TEMPORARY: Mock login
    const email = window.prompt("Enter email to sign in as (e.g. user1@example.com):", "mockuser@example.com");
    if (!email) return; // user cancelled

    localStorage.setItem('reminder_app_token', email);
    setCurrentUser({
      id: 'mock-' + email,
      email: email,
      name: email.split('@')[0],
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
