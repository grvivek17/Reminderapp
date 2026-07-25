import React, { createContext, useState, useEffect, useRef } from 'react';
import Keycloak from 'keycloak-js';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [keycloak, setKeycloak] = useState(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    // Guess Keycloak URL based on current host if env variable is missing
    const defaultKcUrl = window.location.hostname === 'localhost' 
      ? 'http://localhost:8081' 
      : `http://${window.location.hostname}:8081`;

    const kc = new Keycloak({
      url: import.meta.env.VITE_KEYCLOAK_URL || defaultKcUrl,
      realm: import.meta.env.VITE_KEYCLOAK_REALM || 'master',
      clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'reminder-app',
    });

    kc.init({ onLoad: 'check-sso', checkLoginIframe: false }).then((authenticated) => {
      setKeycloak(kc);
      if (authenticated) {
        localStorage.setItem('reminder_app_token', kc.token);
        setCurrentUser({
          id: kc.tokenParsed.sub,
          email: kc.tokenParsed.email || kc.tokenParsed.preferred_username,
          name: kc.tokenParsed.name || kc.tokenParsed.given_name || 'User',
        });
        
        // Setup token refresh
        kc.onTokenExpired = () => {
          kc.updateToken(30).then((refreshed) => {
            if (refreshed) {
              localStorage.setItem('reminder_app_token', kc.token);
            }
          }).catch(() => {
            kc.logout();
          });
        };
      }
    }).catch((err) => {
      console.error('Keycloak initialization error:', err);
    }).finally(() => {
      setLoading(false);
    });
    
    // Listen for unauthorized events from api.js
    const handleAuthExpired = () => {
      kc.logout();
      setCurrentUser(null);
    };
    window.addEventListener('auth-expired', handleAuthExpired);
    return () => window.removeEventListener('auth-expired', handleAuthExpired);
  }, []);

  const login = () => {
    if (keycloak) keycloak.login();
  };

  const signup = () => {
    if (keycloak) keycloak.register();
  };

  const logout = () => {
    localStorage.removeItem('reminder_app_token');
    setCurrentUser(null);
    if (keycloak) keycloak.logout();
  };

  return (
    <AuthContext.Provider value={{ currentUser, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
