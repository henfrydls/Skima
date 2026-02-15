import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, User, Lock, Save, Loader2, LogOut, AlertTriangle, Trash2, ChevronRight, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useConfig } from '../contexts/ConfigContext';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE } from '../lib/apiBase';

/**
 * ProfilePage - Dedicated profile management page
 * 
 * Extracted from Settings tab for better UX following SaaS patterns.
 * Includes danger zone for logout and reset options.
 */

export default function ProfilePage() {
  const navigate = useNavigate();
  const { companyName, adminName, refetchConfig } = useConfig();
  const { logout, authFetch } = useAuth();
  
  const [formData, setFormData] = useState({
    companyName: companyName || '',
    adminName: adminName || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [hasPassword, setHasPassword] = useState(false);
  const [showSecurity, setShowSecurity] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  // Check if password exists on mount
  useState(() => {
    fetch(`${API_BASE}/api/config`)
      .then(res => res.json())
      .then(data => setHasPassword(data.hasPassword))
      .catch(console.error);
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
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

      if (formData.newPassword) {
        body.adminPassword = formData.newPassword;
        if (hasPassword) {
          body.currentPassword = formData.currentPassword;
        }
      }

      const response = await fetch(`${API_BASE}/api/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error updating config');
      }

      toast.success('Perfil actualizado correctamente');
      
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
      
      setHasPassword(data.hasPassword);
      
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

  const handleLogout = () => {
    logout();
    toast.success('Sesión cerrada');
    navigate('/');
  };

  const handleResetDatabase = async () => {
    if (resetConfirmText !== 'BORRAR') return;
    setIsResetting(true);
    try {
      const response = await authFetch('/api/reset-database', {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Reset failed');
      logout();
      navigate('/setup');
    } catch (err) {
      console.error('Reset error:', err);
      toast.error('Error al resetear la base de datos');
    } finally {
      setIsResetting(false);
      setShowResetConfirm(false);
      setResetConfirmText('');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-light text-gray-900">Mi Perfil</h1>
        <p className="text-gray-500 mt-1">
          Administra tu información personal y credenciales
        </p>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
        {/* Organization Section */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide text-gray-400 mb-4">
            Organización
          </h3>
          
          <div className="space-y-4">
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
          </div>
        </div>

        {/* Security / Password Header & Toggle */}
        <div className="pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={() => setShowSecurity(!showSecurity)}
            className="group flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors w-full"
          >
            <ChevronRight 
              size={16} 
              className={`transform transition-transform duration-200 ${showSecurity ? 'rotate-90' : ''}`} 
            />
            <span className="font-medium group-hover:underline">
              Cambiar Contraseña / Opciones Avanzadas
            </span>
          </button>

          {/* Collapsible Security Section */}
          <div className={`grid transition-all duration-300 ease-in-out ${
            showSecurity ? 'grid-rows-[1fr] opacity-100 mt-4' : 'grid-rows-[0fr] opacity-0'
          }`}>
             <div className="overflow-hidden">
                <div className="bg-gray-50/50 p-4 rounded-lg border border-gray-100 space-y-4">
                  {/* Current Password (only if exists) */}
                  {hasPassword && (
                    <div>
                      <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1.5">
                        Contraseña Actual
                      </label>
                      <input
                        type="password"
                        id="currentPassword"
                        value={formData.currentPassword}
                        onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg 
                                 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
                                 text-gray-900 text-sm bg-white"
                        disabled={isLoading}
                      />
                    </div>
                  )}

                  {/* New Passwords */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1.5">
                        Nueva Contraseña
                      </label>
                      <input
                        type="password"
                        id="newPassword"
                        value={formData.newPassword}
                        onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg 
                                 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
                                 text-gray-900 text-sm bg-white"
                        disabled={isLoading}
                      />
                    </div>
                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1.5">
                        Confirmar Contraseña
                      </label>
                      <input
                        type="password"
                        id="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg 
                                 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
                                 text-gray-900 text-sm bg-white"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                </div>
             </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg
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

      {/* Danger Zone */}
      <div className="bg-white rounded-xl shadow-sm border border-critical/20 p-6">
        <h3 className="text-sm font-bold uppercase tracking-wide text-critical mb-4 flex items-center gap-2">
          <AlertTriangle size={14} />
          Zona de Peligro
        </h3>
        
        <div className="space-y-3">
          {/* Logout Button */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-700">Cerrar Sesión</p>
              <p className="text-xs text-gray-500">Salir de tu cuenta de administrador</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg
                       hover:bg-gray-100 transition-colors text-sm"
            >
              <LogOut size={14} />
              Cerrar Sesión
            </button>
          </div>

          {/* Reset Database (placeholder) */}
          <div className="flex items-center justify-between p-4 bg-critical/5 rounded-lg border border-critical/10">
            <div>
              <p className="text-sm font-medium text-gray-700">Resetear Base de Datos</p>
              <p className="text-xs text-gray-500">Eliminar todos los datos y empezar de cero</p>
            </div>
            <button
              onClick={() => setShowResetConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 border border-critical text-critical rounded-lg
                       hover:bg-critical/10 transition-colors text-sm"
            >
              <Trash2 size={14} />
              Resetear
            </button>
          </div>
        </div>
      </div>

      {/* Reset Database Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="text-lg font-medium text-critical flex items-center gap-2">
                <AlertTriangle size={18} />
                Resetear Base de Datos
              </h2>
              <button
                onClick={() => { setShowResetConfirm(false); setResetConfirmText(''); }}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-sm text-gray-600">
                Esta acción eliminará <strong>permanentemente</strong> todos los datos: colaboradores, evaluaciones, categorías, skills, perfiles de rol y configuración del sistema.
              </p>
              <p className="text-sm text-gray-600">
                Escribe <strong className="text-critical">BORRAR</strong> para confirmar.
              </p>
              <input
                type="text"
                value={resetConfirmText}
                onChange={(e) => setResetConfirmText(e.target.value)}
                placeholder="Escribe BORRAR"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-critical/20 focus:border-critical text-sm"
                autoFocus
              />
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => { setShowResetConfirm(false); setResetConfirmText(''); }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleResetDatabase}
                  disabled={resetConfirmText !== 'BORRAR' || isResetting}
                  className="flex items-center gap-2 px-4 py-2 bg-critical text-white rounded-lg
                           hover:bg-critical/90 transition-colors text-sm
                           disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isResetting ? (
                    <Loader2 className="animate-spin" size={14} />
                  ) : (
                    <Trash2 size={14} />
                  )}
                  Resetear
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
