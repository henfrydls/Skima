import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, User, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * SetupView - Initial onboarding screen
 * 
 * Full screen, no sidebar. Collects company name and admin name
 * to initialize the system.
 */

export default function SetupView({ onSetupComplete }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    companyName: '',
    adminName: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.companyName.trim() || !formData.adminName.trim()) {
      setError('Por favor completa todos los campos.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: formData.companyName.trim(),
          adminName: formData.adminName.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to setup');
      }

      toast.success('¡Configuración guardada!');
      
      // Notify parent that setup is complete
      if (onSetupComplete) {
        onSetupComplete(data);
      }
      
      // Navigate to dashboard
      navigate('/');
    } catch (err) {
      console.error('Setup error:', err);
      setError(err.message || 'Error al guardar la configuración.');
      toast.error('Error al guardar la configuración.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary/5 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo / Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-6">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-light text-gray-900 mb-2">
            Bienvenido a <span className="font-medium text-primary">Skills Matrix</span>
          </h1>
          <p className="text-gray-500">
            Configuremos tu espacio de trabajo local
          </p>
        </div>

        {/* Form Card */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          {/* Company Name Input */}
          <div className="mb-6">
            <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
              Nombre de la Organización
            </label>
            <div className="relative">
              <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                id="companyName"
                value={formData.companyName}
                onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                placeholder="Ej: Acme Corp"
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl 
                         focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
                         text-gray-900 placeholder:text-gray-400 transition-all"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Admin Name Input */}
          <div className="mb-6">
            <label htmlFor="adminName" className="block text-sm font-medium text-gray-700 mb-2">
              Tu Nombre (Administrador)
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                id="adminName"
                value={formData.adminName}
                onChange={(e) => setFormData(prev => ({ ...prev, adminName: e.target.value }))}
                placeholder="Ej: Ana Rodríguez"
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl 
                         focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
                         text-gray-900 placeholder:text-gray-400 transition-all"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-critical/5 border border-critical/20 rounded-xl text-critical text-sm">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !formData.companyName.trim() || !formData.adminName.trim()}
            className="w-full flex items-center justify-center gap-2 py-3 px-6 
                     bg-primary text-white font-medium rounded-xl
                     hover:bg-primary/90 transition-all duration-200
                     disabled:opacity-50 disabled:cursor-not-allowed
                     focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Configurando...
              </>
            ) : (
              <>
                Comenzar
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-8">
          Esta información se almacena localmente y puede ser modificada después.
        </p>
      </div>
    </div>
  );
}
