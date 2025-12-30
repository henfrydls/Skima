import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

/**
 * AuthProvider - Manages authentication state across the app
 * 
 * Provides:
 * - token: Current JWT token (or null)
 * - isAuthenticated: boolean
 * - login: (token) => void
 * - logout: () => void
 * - getHeaders: () => headers object with Authorization
 */
export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    // Initialize from localStorage
    return localStorage.getItem('auth_token') || null;
  });

  const login = (newToken) => {
    setToken(newToken);
    localStorage.setItem('auth_token', newToken);
  };

  const logout = () => {
    setToken(null);
    localStorage.removeItem('auth_token');
  };

  const getHeaders = () => {
    return token 
      ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      : { 'Content-Type': 'application/json' };
  };

  // Verify token on mount
  useEffect(() => {
    if (token) {
      fetch('/api/auth/verify', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (!data.authenticated) {
            logout();
          }
        })
        .catch(() => logout());
    }
  }, []);

  const value = {
    token,
    isAuthenticated: !!token,
    login,
    logout,
    getHeaders
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
