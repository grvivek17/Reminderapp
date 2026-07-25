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

    // Use Nginx host (same origin) for Keycloak since it proxies /realms, /resources, etc.
    const defaultKcUrl = window.location.origin;

    const kc = new Keycloak({
      url: import.meta.env.VITE_KEYCLOAK_URL || defaultKcUrl,
      realm: import.meta.env.VITE_KEYCLOAK_REALM || 'master',
      clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'reminder-app',
    });
    
    // Always set the instance so the login button works (and shows Keycloak errors if misconfigured)
    setKeycloak(kc);

    kc.init({ onLoad: 'check-sso', checkLoginIframe: false }).then((authenticated) => {
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

  const login = async () => {
    try {
      if (keycloak) {
        await keycloak.login();
      } else {
        alert("Keycloak is still loading, please wait a second and try again.");
      }
    } catch (err) {
      console.error("Login failed:", err);
      alert("Error starting login redirect. Creating a fresh instance to redirect... " + err);
      // Fallback: manually trigger a redirect if the instance is dead
      const defaultKcUrl = window.location.origin;
      const kc = new Keycloak({
        url: import.meta.env.VITE_KEYCLOAK_URL || defaultKcUrl,
        realm: import.meta.env.VITE_KEYCLOAK_REALM || 'master',
        clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'reminder-app',
      });
      kc.login();
    }
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
