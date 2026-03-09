import { useAuth } from '../../contexts/AuthContext';
import { useConfig } from '../../contexts/ConfigContext';
import LoginModal from '../auth/LoginModal';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * ProtectedRoute - Wrapper for routes that require authentication
 *
 * If no password is configured:
 * - Shows loader while auto-login completes (handled by AuthContext)
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

  // Handle successful login from modal
  const handleLoginSuccess = (token) => {
    login(token);
    setShowLoginModal(false);
  };

  // If authenticated, show protected content immediately
  if (isAuthenticated) {
    return children;
  }

  // Show loader while auto-login is in progress (no password configured)
  if (config && !config.hasPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  // Not authenticated - show access restricted with login option
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-medium text-gray-800 mb-4">
          Access Denied
        </h2>
        <p className="text-gray-500 mb-6">
          This section requires authentication.
        </p>
        <button
          onClick={() => setShowLoginModal(true)}
          className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          Sign In
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
