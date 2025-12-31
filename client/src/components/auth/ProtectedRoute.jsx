import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoginModal from '../auth/LoginModal';
import { useState, useEffect } from 'react';

/**
 * ProtectedRoute - Wrapper for routes that require authentication
 * 
 * If user is not authenticated:
 * - Shows login modal
 * - After successful login, shows the protected content
 * 
 * If user is authenticated:
 * - Shows the children (protected content)
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showLoginModal, setShowLoginModal] = useState(!isAuthenticated);
  const [justLoggedIn, setJustLoggedIn] = useState(false);

  // When authentication state changes after login, show the content
  useEffect(() => {
    if (isAuthenticated && justLoggedIn) {
      // Navigate to settings (or stay on current protected route)
      navigate(location.pathname, { replace: true });
      setJustLoggedIn(false);
    }
  }, [isAuthenticated, justLoggedIn, navigate, location.pathname]);

  // Handle successful login
  const handleLoginSuccess = () => {
    setJustLoggedIn(true);
    setShowLoginModal(false);
  };

  // If not authenticated, show login modal
  if (!isAuthenticated) {
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

  // If authenticated, show protected content
  return children;
}
