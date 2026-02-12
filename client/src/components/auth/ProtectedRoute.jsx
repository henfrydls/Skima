import { useAuth } from '../../contexts/AuthContext';
import { useConfig } from '../../contexts/ConfigContext';
import { API_BASE } from '../../lib/apiBase';
import LoginModal from '../auth/LoginModal';
import { useState, useEffect } from 'react';

/**
 * ProtectedRoute - Wrapper for routes that require authentication
 *
 * If no password is configured:
 * - Auto-authenticates (no login needed)
 *
 * If user is not authenticated:
 * - Shows login modal
 * - After successful login, shows the protected content
 *
 * If user is authenticated:
 * - Shows the children (protected content)
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, login } = useAuth();
  const { config } = useConfig();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [autoLogging, setAutoLogging] = useState(false);

  // Auto-authenticate when no password is configured
  useEffect(() => {
    if (!isAuthenticated && config && !config.hasPassword && !autoLogging) {
      setAutoLogging(true);
      fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })
        .then(r => r.json())
        .then(data => {
          if (data.token) login(data.token);
        })
        .catch(() => {})
        .finally(() => setAutoLogging(false));
    }
  }, [isAuthenticated, config, login, autoLogging]);

  // Handle successful login from modal
  const handleLoginSuccess = (token) => {
    login(token);
    setShowLoginModal(false);
    // isAuthenticated will update on next render via useAuth
  };

  // If authenticated, show protected content immediately
  if (isAuthenticated) {
    return children;
  }

  // Not authenticated - show access restricted with login option
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-medium text-gray-800 mb-4">
          Acceso Restringido
        </h2>
        <p className="text-gray-500 mb-6">
          Esta sección requiere autenticación.
        </p>
        <button
          onClick={() => setShowLoginModal(true)}
          className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          Iniciar Sesión
        </button>
      </div>
      
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)}
        onSuccess={handleLoginSuccess}
      />
    </div>
  );
}

