import { createPortal } from 'react-dom';
import { AlertTriangle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

/**
 * SessionExpiredModal - Shows when a 401 error is intercepted
 * Forces user to re-login - no "dismiss" option
 * 
 * Note: Uses window.location.href instead of useNavigate because
 * this component renders outside of RouterProvider context.
 */
export default function SessionExpiredModal() {
  const { sessionExpired, logout } = useAuth();

  if (!sessionExpired) return null;

  const handleLogin = () => {
    logout();
    // Redirect to root — app will show login modal via ProtectedRoute if needed
    window.location.href = '/';
  };

  return createPortal(
    <div className="modal-overlay z-[200]">
      <div className="bg-surface rounded-xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden animate-scale-in">
        {/* Header with warning color */}
        <div className="bg-warning/10 p-6 flex flex-col items-center">
          <div className="w-14 h-14 rounded-full bg-warning/20 flex items-center justify-center mb-3">
            <AlertTriangle className="w-7 h-7 text-warning" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Sesión Expirada</h2>
        </div>
        
        {/* Body */}
        <div className="p-6 text-center">
          <p className="text-gray-600 mb-6">
            Tu sesión ha expirado por inactividad o el token ya no es válido. 
            Por favor, inicia sesión nuevamente para continuar.
          </p>
          
          <button
            onClick={handleLogin}
            className="w-full px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium shadow-sm"
          >
            Iniciar Sesión
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

