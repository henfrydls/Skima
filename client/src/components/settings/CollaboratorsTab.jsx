import { useState, useEffect } from 'react';
import { invalidatePreload } from '../../lib/dataPreload';
import { createPortal } from 'react-dom';
import { 
  Search, 
  Plus, 
  MoreVertical, 
  Edit3, 
  Eye, 
  Trash2,
  X,
  Check,
  UserPlus,
  AlertCircle,
  Briefcase,
  Archive,
  RotateCcw
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE } from '../../lib/apiBase';
import ConfirmModal from '../common/ConfirmModal';
import EmptyState from '../common/EmptyState';
import ToastUndo from '../common/ToastUndo';
import toast from 'react-hot-toast';


/**
 * CollaboratorsTab — CRUD de Colaboradores
 * 
 * Features:
 * - Tabla con inline editing
 * - Búsqueda y filtrado
 * - Modal para crear nuevo
 * - Action menu para editar/eliminar
 */

// Empty State component removed (using shared)

// Create Modal Component
function CreateCollaboratorModal({ isOpen, onClose, onSave, roleProfiles = {} }) {
  const [formData, setFormData] = useState({
    nombre: '',
    rol: '',
    email: ''
  });
  const [showOptional, setShowOptional] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.nombre && formData.rol) {
      onSave(formData);
      setFormData({ nombre: '', rol: '', email: '' });
      onClose();
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-surface rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-medium text-gray-800">Nuevo Colaborador</h2>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre completo *
            </label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="María González"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rol / Posición *
            </label>
            <select
              value={formData.rol}
              onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
              required
            >
              <option value="">Seleccionar rol...</option>
              {Object.keys(roleProfiles).map(rol => (
                <option key={rol} value={rol}>{rol}</option>
              ))}
            </select>
            {Object.keys(roleProfiles).length === 0 && (
              <p className="mt-1 text-xs text-warning flex items-center gap-1">
                <AlertCircle size={12} />
                No hay perfiles creados. Ve a la pestaña Perfiles primero.
              </p>
            )}
          </div>

          {/* Optional Fields Toggle */}
          <button
            type="button"
            onClick={() => setShowOptional(!showOptional)}
            className="text-sm text-primary hover:underline"
          >
            {showOptional ? 'Ocultar campos opcionales' : 'Mostrar campos opcionales'}
          </button>

          {showOptional && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email (opcional)
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="maria@empresa.com"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Crear
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

// Editable Cell Component
function EditableCell({ value, onSave, isEditing, onStartEdit, onCancelEdit }) {
  const [editValue, setEditValue] = useState(value);

  const handleSave = () => {
    onSave(editValue);
    onCancelEdit();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') onCancelEdit();
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          autoFocus
          className="flex-1 px-2 py-1 border border-primary rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>
    );
  }

  return (
    <span 
      onClick={onStartEdit}
      className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded transition-colors inline-block"
      title="Click para editar"
    >
      {value}
    </span>
  );
}

// Role Select Dropdown Cell
function RoleSelectCell({ value, availableRoles, roleProfiles, onSave, onNavigateToProfiles, disabled = false }) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Show all unique roles: from collaborators + from defined profiles
  const allRoles = [...new Set([...availableRoles, ...Object.keys(roleProfiles)])].filter(Boolean).sort();

  
  const handleSelect = (role) => {
    if (role === '__NEW__') {
      onNavigateToProfiles();
    } else {
      onSave(role);
    }
    setIsOpen(false);
  };

  const hasProfile = roleProfiles[value] && Object.values(roleProfiles[value]).some(v => v !== 'N');

  if (disabled) {
    return (
      <span className="font-medium text-gray-500 cursor-not-allowed" title="No se puede editar rol de usuario desactivado">
        {value}
      </span>
    );
  }

  return (
    <div className={`relative ${isOpen ? 'z-50' : ''}`}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-100 transition-colors text-left"
      >
        <span className="font-medium text-gray-800">{value}</span>
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>


      {/* Dropdown */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 top-full mt-1 bg-surface rounded-lg shadow-xl border border-gray-100 py-1 z-20 min-w-[180px] max-h-60 overflow-y-auto">
            {allRoles.map(role => {
              const isSelected = role === value;
              return (
                <button
                  type="button"
                  key={role}
                  onClick={(e) => { e.preventDefault(); handleSelect(role); }}
                  className={`
                    w-full px-4 py-2 text-left text-sm flex items-center justify-between transition-colors
                    ${isSelected ? 'bg-primary/10 text-primary font-medium' : 'text-gray-700 hover:bg-gray-50'}
                  `}
                >
                  <span>{role}</span>
                  {isSelected && <Check size={14} className="text-primary" />}
                </button>
              );
            })}
            
            {/* Separator */}
            <hr className="my-1 border-gray-100" />
            
            {/* Create new profile option */}
            <button
              onClick={() => handleSelect('__NEW__')}
              className="w-full px-4 py-2 text-left text-sm text-primary hover:bg-primary/5 flex items-center gap-2 font-medium"
            >
              <Briefcase size={14} />
              Nuevo perfil...
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// Collaborator Row Component
// CollaboratorRow Component
// CollaboratorRow Component
function CollaboratorRow({ collaborator, onUpdate, onDelete, onRestore, roleProfiles = {}, availableRoles = [], onNavigate, index, totalCount }) {
  const [editingField, setEditingField] = useState(null);
  const [showMenu, setShowMenu] = useState(false);

  const isArchived = collaborator.isActive === false;
  // Determine if menu should open upwards (if in last 2 rows and list is long enough)
  const openUpwards = totalCount > 4 && index >= totalCount - 2;

  const initials = collaborator.nombre
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleFieldSave = (field, value) => {
    onUpdate(collaborator.id, { ...collaborator, [field]: value });
  };

  return (
    <tr className={`hover:bg-gray-50 transition-colors group ${isArchived ? 'bg-gray-50' : ''}`}>
      {/* Avatar + Name */}
      <td className={`px-4 py-3 ${isArchived ? 'opacity-50' : ''}`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium text-sm ${isArchived ? 'bg-gray-200 text-gray-500' : 'bg-primary/10 text-primary'}`}>
            {initials}
          </div>
          <div className="flex flex-col">
            <EditableCell
                value={collaborator.nombre}
                onSave={(value) => !isArchived && handleFieldSave('nombre', value)}
                isEditing={!isArchived && editingField === 'nombre'}
                onStartEdit={() => !isArchived && setEditingField('nombre')}
                onCancelEdit={() => setEditingField(null)}
            />
            {isArchived && <span className="text-[10px] uppercase font-bold text-gray-400">Desactivado</span>}
          </div>
        </div>
      </td>

      {/* Role with Profile Status */}
      <td className={`px-4 py-3 ${isArchived ? 'opacity-50' : ''}`}>
        <RoleSelectCell
          value={collaborator.rol}
          availableRoles={availableRoles}
          roleProfiles={roleProfiles}
          onSave={(value) => handleFieldSave('rol', value)}
          onNavigateToProfiles={(role) => onNavigate('perfiles', { rol: role || collaborator.rol })}
          disabled={isArchived}
        />
      </td>

      {/* Stats - Skills evaluadas vs definidas en perfil */}
      <td className={`px-4 py-3 text-sm text-gray-500 ${isArchived ? 'opacity-50' : ''}`}>
        {(() => {
          const evaluatedCount = Object.keys(collaborator.skills || {}).length;
          const roleProfile = roleProfiles[collaborator.rol] || {};
          // Count skills that are defined (not 'N') in the role profile
          const definedInProfile = Object.values(roleProfile).filter(v => v !== 'N').length;
          
          if (definedInProfile === 0) {
            return (
              <button
                onClick={() => onNavigate('perfiles', { rol: collaborator.rol })}
                className="text-xs text-warning hover:text-warning/80 flex items-center gap-1 transition-colors"
                title="Click para definir el perfil de este rol"
              >
                <Briefcase size={12} />
                Definir
              </button>
            );
          }

          
          return (
            <span 
              className="bg-gray-100 px-2 py-1 rounded text-xs cursor-help"
              title={`${evaluatedCount} skills evaluadas de ${definedInProfile} requeridas por el perfil del puesto "${collaborator.rol}"`}
            >
              {evaluatedCount}/{definedInProfile} skills
            </span>
          );
        })()}
      </td>

      {/* Última Evaluación */}
      <td className={`px-4 py-3 text-sm text-gray-500 ${isArchived ? 'opacity-50' : ''}`}>
        {collaborator.lastEvaluated ? (
          <span className="text-gray-600">
            {new Date(collaborator.lastEvaluated).toLocaleDateString('es-ES', { 
              day: '2-digit', 
              month: 'short', 
              year: 'numeric' 
            })}
          </span>
        ) : (
          <span className="text-gray-400 italic">Sin evaluar</span>
        )}
      </td>

      {/* Promedio */}
      <td className={`px-4 py-3 ${isArchived ? 'opacity-50' : ''}`}>
        {collaborator.promedio > 0 ? (
          <span className={`
            text-sm font-medium px-2 py-1 rounded
            ${collaborator.promedio >= 4.5 ? 'bg-indigo-100 text-indigo-700' : 
              collaborator.promedio >= 3.5 ? 'bg-blue-100 text-blue-700' : 
              collaborator.promedio >= 2.5 ? 'bg-amber-100 text-amber-700' : 
              'bg-red-100 text-red-700'}
          `}>
            {collaborator.promedio.toFixed(1)}
          </span>
        ) : (
          <span className="text-gray-400">--</span>
        )}
      </td>

      {/* Actions */}
      <td className="px-4 py-3 text-right relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-2 hover:bg-gray-100 rounded transition-colors"
        >
          <MoreVertical size={18} className="text-gray-500" />
        </button>

        {showMenu && (
          <>
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setShowMenu(false)}
            />
            <div className={`absolute right-4 z-20 min-w-[160px] bg-surface rounded-lg shadow-lg border border-gray-100 py-1 ${openUpwards ? 'bottom-full mb-1 origin-bottom-right' : 'top-full mt-1 origin-top-right'}`}>
              <button
                onClick={() => { 
                    if (isArchived) return;
                    setEditingField('nombre'); 
                    setShowMenu(false); 
                }}
                disabled={isArchived}
                className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${isArchived ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50'}`}
              >
                <Edit3 size={14} />
                Editar completo
              </button>
              <button
                onClick={() => {
                  onNavigate('evaluaciones', { collaboratorId: collaborator.id, view: 'history' });
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Eye size={14} />
                Ver evaluaciones
              </button>
              <hr className="my-1 border-gray-100" />
              
              {isArchived ? (
                <button
                    onClick={() => { onRestore(collaborator); setShowMenu(false); }}
                    className="w-full px-4 py-2 text-left text-sm text-primary hover:bg-primary/5 flex items-center gap-2 font-medium"
                >
                    <RotateCcw size={14} />
                    Restaurar
                </button>
              ) : (
                <button
                    onClick={() => { onDelete(collaborator.id, collaborator.nombre); setShowMenu(false); }}
                    className="w-full px-4 py-2 text-left text-sm text-critical hover:bg-critical/5 flex items-center gap-2"
                >
                    <Trash2 size={14} />
                    Desactivar
                </button>
              )}
            </div>
          </>
        )}
      </td>
    </tr>
  );
}



// Main Component
export default function CollaboratorsTab({ onNavigate, isActive, dataVersion = 0 }) {
  const { authFetch } = useAuth();
  const [collaborators, setCollaborators] = useState([]);
  const [roleProfiles, setRoleProfiles] = useState({});
  const [totalSkillsCount, setTotalSkillsCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // State for delete confirmation
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, name: '' });
  
  const [isLoading, setIsLoading] = useState(true); // Prevent empty state flash

  // Fetch data (role profiles, collaborators, skills count)
  // Refetches when dataVersion changes (triggered by role profile rename)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/data?includeArchived=true`); // Need updated API/Data logic or separate fetch?
        // /api/data usually returns active only. Ideally we should use /api/collaborators?includeArchived=true if /api/data doesn't support it.
        // But the previous code used /api/data. 
        // Let's stick to /api/collaborators for now to be safe, OR rely on my backend change to /api/collaborators.
        // Wait, /api/data is the main dashboard endpoint. I haven't updated /api/data to return archived collaborators. 
        // I updated /api/data to FILTER active collaborators (lines 48+).
        // So fetching /api/data will NOT return archived collaborators.
        // I should fetch collaborators separately or update /api/data.
        // Fetching separately is safer.
        
        const [dataRes, collabRes] = await Promise.all([
             fetch(`${API_BASE}/api/data`),
             fetch(`${API_BASE}/api/collaborators?includeArchived=true`)
        ]);
        
        const dataJson = await dataRes.json();
        const collabsJson = await collabRes.json();

        setRoleProfiles(dataJson.roleProfiles || {});
        setTotalSkillsCount(dataJson.skills?.length || 0);

        // Merge: Use dashboardData (active with stats) + archived from full list
        const activeMap = new Map(dataJson.collaborators.map(c => [c.id, c]));
        
        const mergedCollaborators = collabsJson.map(c => {
             const activeWithStats = activeMap.get(c.id);
             if (activeWithStats) return activeWithStats;
             return { ...c, skills: {}, promedio: 0, isActive: false }; // Fallback for archived
        });
        
        setCollaborators(mergedCollaborators);
        
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [dataVersion]); 

  // Filter collaborators
  const filteredCollaborators = collaborators
    .filter(c => {
      // 1. Archive Filter
      // Note: c.isActive might be undefined for those from /api/data (default true)
      // Archived ones check: c.isActive === false
      const isActive = c.isActive !== false; 
      if (!showArchived && !isActive) return false;
      
      // 2. Search
      return (
        c.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.rol.toLowerCase().includes(searchQuery.toLowerCase())
      );
    })
    .sort((a, b) => {
      // 1. Sort by Status (Active first)
      // isActive might be undefined for old records, treat as true
      const aActive = a.isActive !== false;
      const bActive = b.isActive !== false;
      
      // If A is active and B is inactive, A comes first (-1)
      if (aActive && !bActive) return -1;
      // If A is inactive and B is active, B comes first (1)
      if (!aActive && bActive) return 1;
      
      // 2. Sort Alphabetically
      return a.nombre.localeCompare(b.nombre);
    });

  // Get unique roles from all collaborators (for dropdown)
  const uniqueRoles = [...new Set(collaborators.map(c => c.rol))].filter(Boolean);

  // Handlers
  const handleCreate = async (newCollab) => {

    try {
      const response = await authFetch('/api/collaborators', {
        method: 'POST',
        body: JSON.stringify(newCollab)
      });
      
      if (!response.ok) throw new Error('Error saving collaborator');
      
      const created = await response.json();
      // Initialize with empty skills/promedio for UI stability until refresh
      const createdWithUIProps = {
        ...created,
        skills: {},
        promedio: 0
      };
      
      setCollaborators([createdWithUIProps, ...collaborators]);
      invalidatePreload();
      toast.success('Colaborador creado');
    } catch (err) {
      if (err.message === 'SESSION_EXPIRED') return; // Modal will handle this
      console.error('Error creating:', err);
      toast.error('Error al crear colaborador');
    }
  };

  const handleUpdate = async (id, updated) => {

    
    // Store original state for rollback
    const originalCollaborators = [...collaborators];
    const originalItem = collaborators.find(c => c.id === id);
    
    // Optimistic update
    setCollaborators(prev => prev.map(c => c.id === id ? updated : c));
    
    try {
      const response = await authFetch(`/api/collaborators/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updated)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update');
      }
      invalidatePreload();
    } catch (err) {
      if (err.message === 'SESSION_EXPIRED') {
        // Rollback since auth failed
        setCollaborators(originalCollaborators);
        return; // Modal will handle this
      }
      
      // Rollback optimistic update on any error
      console.error('Error updating:', err);
      setCollaborators(originalCollaborators);
      toast.error(`Error al actualizar "${originalItem?.nombre || 'colaborador'}". Cambios revertidos.`);
    }
  };


  // Delete (Soft) Implementation
  const executeDelete = (id, name) => {
    // 1. Optimistic Update
    const prevCollaborators = [...collaborators];
    
    // Mark as inactive locally instead of removing? Or remove if !showArchived?
    // Let's follow CategoriesTab pattern: Mark as inactive.
    setCollaborators(collaborators.map(c => 
      c.id === id ? { ...c, isActive: false } : c
    ));

    // 2. Undo Handler
    let isUndone = false;
    const handleUndo = () => {
       isUndone = true;
       setCollaborators(prevCollaborators);
       toast.success('Desactivación deshecha');
    };
    
    // 3. Show Toast
    toast.custom((t) => (
      <ToastUndo 
        t={t}
        message={`"${name}" desactivado`}
        onUndo={handleUndo}
        duration={4000}
      />
    ), { duration: 4000, id: `del-collab-${id}` });

    // 4. Delayed API Call
    setTimeout(async () => {
      if (!isUndone) {
         try {
            const response = await authFetch(`/api/collaborators/${id}`, {
               method: 'DELETE'
            });
            if (!response.ok) throw new Error('Error deleting');
            invalidatePreload();
         } catch(err) {
             if (err.message !== 'SESSION_EXPIRED') {
                toast.error('Error sincronizando desactivación');
                setCollaborators(prevCollaborators); // Revert
             }
         }
      }
    }, 4100);
  };
  
  // Restore Implementation
  const executeRestore = async (collab) => {
     // Optimistic
     const prevCollaborators = [...collaborators];
     setCollaborators(collaborators.map(c => 
        c.id === collab.id ? { ...c, isActive: true } : c
     ));
     
     try {
        const response = await authFetch(`/api/collaborators/${collab.id}/restore`, {
            method: 'PUT'
        });
        if (!response.ok) throw new Error('Failed');
        invalidatePreload();
        toast.success('Colaborador restaurado');
     } catch (err) {
        setCollaborators(prevCollaborators);
        toast.error('Error restaurando colaborador');
     }
  };

  // Click Handler for Delete - Opens Modal (Double Safety)
  const handleDeleteClick = (id, name) => {
     setDeleteModal({ isOpen: true, id, name });
  };
  
  const confirmDelete = () => {
     if (deleteModal.id) {
        executeDelete(deleteModal.id, deleteModal.name);
        setDeleteModal({ isOpen: false, id: null, name: '' });
     }
  };
  



  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Empty state (only show AFTER loading is complete)
  if (collaborators.length === 0) {
    return (
      <>
        <EmptyState
          icon={UserPlus}
          title="No hay colaboradores aún"
          description="Agrega a los miembros del equipo que evaluarás."
          actionLabel="Crear uno"
          onAction={() => setShowCreateModal(true)}
        />
        <CreateCollaboratorModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSave={handleCreate}
          roleProfiles={roleProfiles}
        />
      </>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar colaborador..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <p className="text-sm text-gray-500 hidden sm:block">
            {filteredCollaborators.length} colaborador{filteredCollaborators.length !== 1 ? 'es' : ''}
          </p>
          <div className="h-4 w-px bg-gray-300 mx-2 hidden sm:block"></div>

          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-all ${
              showArchived 
                ? 'bg-gray-200 text-gray-700' 
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            <Archive size={14} />
            {showArchived ? 'Ocultar inactivos' : 'Ver inactivos'}
          </button>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <Plus size={18} />
            Nuevo Colaborador
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Nombre
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Rol
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Skills
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Última Evaluación
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Promedio
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredCollaborators.map((collab, index) => (
              <CollaboratorRow
                key={collab.id}
                collaborator={collab}
                onUpdate={handleUpdate}
                onDelete={handleDeleteClick}
                onRestore={executeRestore}
                roleProfiles={roleProfiles}
                availableRoles={uniqueRoles}
                onNavigate={onNavigate}
                totalSkillsCount={totalSkillsCount}
                index={index}
                totalCount={filteredCollaborators.length}
              />
            ))}
          </tbody>
        </table>

        {filteredCollaborators.length === 0 && searchQuery && (
          <div className="p-8 text-center text-gray-500">
            No se encontraron resultados para "{searchQuery}"
          </div>
        )}
      </div>

      {/* Create Modal */}
      <CreateCollaboratorModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={handleCreate}
        roleProfiles={roleProfiles}
      />
      
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
        onConfirm={confirmDelete}
        title="Desactivar Colaborador"
        message={`¿Estás seguro que deseas desactivar a ${deleteModal.name}? Esta acción se puede deshacer temporalmente.`}
        confirmText="Desactivar"
        variant="danger"
      />
      

    </div>
  );
}
