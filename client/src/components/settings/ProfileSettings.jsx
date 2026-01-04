import { useState, useEffect } from 'react';
import { Building2, User, Lock, Save, Loader2, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { useConfig } from '../../contexts/ConfigContext';

/**
 * ProfileSettings - Admin profile management card
 * 
 * Allows updating company name, admin name, and password
 */

export default function ProfileSettings() {
  const { companyName, adminName, refetchConfig } = useConfig();
  
  const [formData, setFormData] = useState({
    companyName: '',
    adminName: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [hasPassword, setHasPassword] = useState(false);

  // Initialize form with current values
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      companyName: companyName || '',
      adminName: adminName || ''
    }));
    
    // Check if password exists
    fetch('/api/config')
      .then(res => res.json())
      .then(data => setHasPassword(data.hasPassword))
      .catch(console.error);
  }, [companyName, adminName]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate password confirmation
    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    setIsLoading(true);

    try {
      const body = {
        companyName: formData.companyName,
        adminName: formData.adminName
      };

      // Only send password data if changing password
      if (formData.newPassword) {
        body.adminPassword = formData.newPassword;
        if (hasPassword) {
          body.currentPassword = formData.currentPassword;
        }
      }

      const response = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error updating config');
      }

      toast.success('Perfil actualizado correctamente');
      
      // Clear password fields
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
      
      setHasPassword(data.hasPassword);
      
      // Refresh global config
      if (refetchConfig) {
        refetchConfig();
      }
    } catch (err) {
      console.error('Update error:', err);
      toast.error(err.message || 'Error al actualizar el perfil');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center gap-2">
        <User className="text-primary" size={20} />
        Perfil de Administrador
      </h3>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Company Name */}
        <div>
          <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1.5">
            Nombre de la Organización
          </label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              id="companyName"
              value={formData.companyName}
              onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg 
                       focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
                       text-gray-900 text-sm"
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Admin Name */}
        <div>
          <label htmlFor="adminName" className="block text-sm font-medium text-gray-700 mb-1.5">
            Nombre del Administrador
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              id="adminName"
              value={formData.adminName}
              onChange={(e) => setFormData(prev => ({ ...prev, adminName: e.target.value }))}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg 
                       focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
                       text-gray-900 text-sm"
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Password Section */}
        <div className="pt-4 border-t border-gray-100">
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <Lock size={14} />
            Cambiar Contraseña
            {!hasPassword && (
              <span className="text-xs text-gray-400 font-normal">(Sin contraseña configurada)</span>
            )}
          </h4>

          {/* Current Password (only if password exists) */}
          {hasPassword && (
            <div className="mb-3">
              <label htmlFor="currentPassword" className="block text-xs text-gray-500 mb-1">
                Contraseña Actual
              </label>
              <input
                type="password"
                id="currentPassword"
                value={formData.currentPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg 
                         focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
                         text-gray-900 text-sm"
                disabled={isLoading}
              />
            </div>
          )}

          {/* New Password */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="newPassword" className="block text-xs text-gray-500 mb-1">
                Nueva Contraseña
              </label>
              <input
                type="password"
                id="newPassword"
                value={formData.newPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg 
                         focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
                         text-gray-900 text-sm"
                disabled={isLoading}
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-xs text-gray-500 mb-1">
                Confirmar Contraseña
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={formData.confirmPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg 
                         focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
                         text-gray-900 text-sm"
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg
                     hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                Guardando...
              </>
            ) : (
              <>
                <Save size={16} />
                Guardar Cambios
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
