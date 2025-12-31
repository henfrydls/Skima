import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Lock, Loader2, X, AlertCircle } from 'lucide-react';

/**
 * LoginModal - Simple password-based admin login
 * 
 * Props:
 * - isOpen: boolean - Whether modal is visible
 * - onClose: () => void - Called when modal closes
 * - onSuccess: (token: string) => void - Called with JWT token on successful login
 */
export default function LoginModal({ isOpen, onClose, onSuccess }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Error de autenticación');
        setIsLoading(false);
        return;
      }

      // Store token and notify parent
      localStorage.setItem('auth_token', data.token);
      onSuccess(data.token);
      setPassword('');
      onClose();
    } catch (_err) {
      setError('Error de conexión con el servidor');
    } finally {
      setIsLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 animate-fade-in">
      <div className="bg-surface rounded-xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-primary/5 px-6 py-4 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Lock size={20} className="text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-800">Acceso Admin</h2>
              <p className="text-xs text-gray-500">Ingresa la contraseña para continuar</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-critical/10 text-critical rounded-lg text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              placeholder="••••••••"
              autoFocus
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !password}
            className={`
              w-full py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2
              ${isLoading || !password 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-primary text-white hover:bg-primary/90 hover-lift'
              }
            `}
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Verificando...
              </>
            ) : (
              'Iniciar Sesión'
            )}
          </button>
        </form>

        {/* Footer hint */}
        <div className="px-6 pb-4">
          <p className="text-xs text-gray-400 text-center">
            Para desarrollo: contraseña por defecto es <code className="bg-gray-100 px-1 rounded">admin123</code>
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}
