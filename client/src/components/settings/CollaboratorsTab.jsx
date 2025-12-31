import { useState, useEffect } from 'react';
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
  Briefcase
} from 'lucide-react';
import { COLLABORATORS } from '../../data/mockData';

/**
 * CollaboratorsTab — CRUD de Colaboradores
 * 
 * Features:
 * - Tabla con inline editing
 * - Búsqueda y filtrado
 * - Modal para crear nuevo
 * - Action menu para editar/eliminar
 */

// Empty State Component
function EmptyState({ onCreateClick }) {
  return (
    <div className="text-center py-16">
      <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <UserPlus size={36} className="text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-800 mb-2">
        No hay colaboradores aún
      </h3>
      <p className="text-gray-500 mb-6 max-w-sm mx-auto">
        Agrega a los miembros del equipo que evaluarás. Puedes importar desde CSV o crear manualmente.
      </p>
      <div className="flex justify-center gap-3">
        <button
          onClick={onCreateClick}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
        >
          <Plus size={18} />
          Crear uno
        </button>
        <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
          Importar CSV
        </button>
      </div>
    </div>
  );
}

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

  return (
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
    </div>
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

// Collaborator Row Component
function CollaboratorRow({ collaborator, onUpdate, onDelete, roleProfiles = {} }) {
  const [editingField, setEditingField] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  
  // Check if role has a profile configured
  const hasRoleProfile = collaborator.rol && roleProfiles[collaborator.rol] && 
    Object.keys(roleProfiles[collaborator.rol]).length > 0;

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
    <tr className="hover:bg-gray-50 transition-colors group">
      {/* Avatar + Name */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium text-sm">
            {initials}
          </div>
          <EditableCell
            value={collaborator.nombre}
            onSave={(value) => handleFieldSave('nombre', value)}
            isEditing={editingField === 'nombre'}
            onStartEdit={() => setEditingField('nombre')}
            onCancelEdit={() => setEditingField(null)}
          />
        </div>
      </td>

      {/* Role with Profile Status */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <EditableCell
            value={collaborator.rol}
            onSave={(value) => handleFieldSave('rol', value)}
            isEditing={editingField === 'rol'}
            onStartEdit={() => setEditingField('rol')}
            onCancelEdit={() => setEditingField(null)}
          />
          {!hasRoleProfile && (
            <span 
              className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-warning/10 text-warning"
              title="Este rol no tiene un perfil de puesto configurado"
            >
              <AlertCircle size={12} />
              Sin perfil
            </span>
          )}
        </div>
      </td>

      {/* Stats */}
      <td className="px-4 py-3 text-sm text-gray-500">
        <span className="bg-gray-100 px-2 py-1 rounded text-xs">
          {Object.keys(collaborator.skills || {}).length} skills
        </span>
      </td>

      {/* Promedio */}
      <td className="px-4 py-3">
        <span className={`
          text-sm font-medium px-2 py-1 rounded
          ${collaborator.promedio >= 3.5 ? 'bg-competent/10 text-competent' : 
            collaborator.promedio >= 2.5 ? 'bg-warning/10 text-warning' : 
            'bg-critical/10 text-critical'}
        `}>
          {collaborator.promedio?.toFixed(1) || 'N/A'}
        </span>
      </td>

      {/* Actions */}
      <td className="px-4 py-3 text-right relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-2 hover:bg-gray-100 rounded transition-colors opacity-0 group-hover:opacity-100"
        >
          <MoreVertical size={18} className="text-gray-500" />
        </button>

        {showMenu && (
          <>
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setShowMenu(false)}
            />
            <div className="absolute right-4 top-full mt-1 bg-surface rounded-lg shadow-lg border border-gray-100 py-1 z-20 min-w-[160px]">
              <button
                onClick={() => { setEditingField('nombre'); setShowMenu(false); }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Edit3 size={14} />
                Editar completo
              </button>
              <button
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Eye size={14} />
                Ver evaluaciones
              </button>
              <hr className="my-1 border-gray-100" />
              <button
                onClick={() => { onDelete(collaborator.id); setShowMenu(false); }}
                className="w-full px-4 py-2 text-left text-sm text-critical hover:bg-critical/5 flex items-center gap-2"
              >
                <Trash2 size={14} />
                Desactivar
              </button>
            </div>
          </>
        )}
      </td>
    </tr>
  );
}

// Main Component
export default function CollaboratorsTab() {
  const [collaborators, setCollaborators] = useState(COLLABORATORS);
  const [roleProfiles, setRoleProfiles] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Fetch role profiles
  useEffect(() => {
    const fetchRoleProfiles = async () => {
      try {
        const response = await fetch('/api/data');
        const data = await response.json();
        setRoleProfiles(data.roleProfiles || {});
      } catch (err) {
        console.error('Error fetching role profiles:', err);
      }
    };
    fetchRoleProfiles();
  }, []);

  // Filter collaborators
  const filteredCollaborators = collaborators.filter(c =>
    c.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.rol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handlers
  const handleCreate = (newCollab) => {
    const created = {
      ...newCollab,
      id: `collab-${Date.now()}`,
      skills: {},
      promedio: 0
    };
    setCollaborators([created, ...collaborators]);
    // TODO: Toast notification
  };

  const handleUpdate = (id, updated) => {
    setCollaborators(collaborators.map(c => c.id === id ? updated : c));
  };

  const handleDelete = (id) => {
    if (confirm('¿Desactivar este colaborador?')) {
      setCollaborators(collaborators.filter(c => c.id !== id));
    }
  };

  // Empty state
  if (collaborators.length === 0) {
    return (
      <>
        <EmptyState onCreateClick={() => setShowCreateModal(true)} />
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
          <span className="text-sm text-gray-500">
            {filteredCollaborators.length} colaboradores
          </span>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <Plus size={18} />
            Nuevo
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
                Promedio
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredCollaborators.map((collab) => (
              <CollaboratorRow
                key={collab.id}
                collaborator={collab}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
                roleProfiles={roleProfiles}
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
    </div>
  );
}
