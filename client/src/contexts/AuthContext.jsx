import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { API_BASE } from '../lib/apiBase';

const AuthContext = createContext(null);

/**
 * AuthProvider - Manages authentication state across the app
 * 
 * Provides:
 * - token: Current JWT token (or null)
 * - isAuthenticated: boolean
 * - sessionExpired: boolean (true when 401 detected)
 * - login: (token) => void
 * - logout: () => void
 * - getHeaders: () => headers object with Authorization
 * - authFetch: Wrapper around fetch that intercepts 401s
 */
export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    return localStorage.getItem('auth_token') || null;
  });
  const [sessionExpired, setSessionExpired] = useState(false);

  const login = (newToken) => {
    setToken(newToken);
    setSessionExpired(false);
    localStorage.setItem('auth_token', newToken);
  };

  const logout = useCallback(() => {
    setToken(null);
    setSessionExpired(false);
    localStorage.removeItem('auth_token');
  }, []);

  const getHeaders = useCallback(() => {
    return token 
      ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      : { 'Content-Type': 'application/json' };
  }, [token]);

  /**
   * authFetch - Wrapper around fetch that intercepts 401 errors
   * Usage: const response = await authFetch('/api/endpoint', { method: 'POST', body: ... })
   */
  const authFetch = useCallback(async (url, options = {}) => {
    const headers = {
      ...getHeaders(),
      ...(options.headers || {})
    };
    
    const fullUrl = url.startsWith('/') ? `${API_BASE}${url}` : url;
    const response = await fetch(fullUrl, { ...options, headers });
    
    // Intercept 401 - Session Expired
    if (response.status === 401) {
      setSessionExpired(true);
      throw new Error('SESSION_EXPIRED');
    }
    
    return response;
  }, [getHeaders]);

  // Verify token on mount only (not on every token change)
  useEffect(() => {
    const initialToken = localStorage.getItem('auth_token');
    if (initialToken) {
      fetch(`${API_BASE}/api/auth/verify`, {
        headers: { 'Authorization': `Bearer ${initialToken}` }
      })
        .then(res => res.json())
        .then(data => {
          if (!data.authenticated) {
            logout();
          }
        })
        .catch(() => logout());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount


  // Cross-tab session sync
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'auth_token') {
        setToken(e.newValue);
        if (!e.newValue) {
          setSessionExpired(false); // Another tab logged out
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const value = {
    token,
    isAuthenticated: !!token,
    sessionExpired,
    login,
    logout,
    getHeaders,
    authFetch
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
