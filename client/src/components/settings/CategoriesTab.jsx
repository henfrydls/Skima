import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Search,
  GripVertical, 
  Plus, 
  MoreVertical, 
  Edit3, 
  Trash2,
  X,
  FolderPlus,
  Loader2,
  AlertCircle,
  RotateCcw,
  Archive,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import LoginModal from '../auth/LoginModal';
import EmptyState from '../common/EmptyState';
import ToastUndo from '../common/ToastUndo';
import Button from '../common/Button';
import toast from 'react-hot-toast';

/**
 * CategoriesTab — Gestión de Categorías (Connected to API)
 * 
 * Features:
 * - Fetches categories from /api/categories
 * - CRUD with auth protection
 * - Login modal on 401
 */

import { API_BASE } from '../../lib/apiBase';

// Color Picker Popover
const PRESET_COLORS = [
  '#2d676e', // Primary (teal)
  '#a6ae3d', // Competent (olive)
  '#da8a0c', // Warning (ocre)
  '#ef4444', // Critical (red)
  '#6366f1', // Indigo
  '#8b5cf6', // Purple
];

function ColorPicker({ color, onChange, isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-10" onClick={onClose} />
      <div className="absolute left-0 top-full mt-1 bg-surface rounded-lg shadow-lg border border-gray-100 p-3 z-20">
        <div className="flex gap-2 mb-2">
          {PRESET_COLORS.map(c => (
            <button
              key={c}
              onClick={() => { onChange(c); onClose(); }}
              className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                color === c ? 'border-gray-800' : 'border-transparent'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>
    </>
  );
}

// Create/Edit Category Modal
function CategoryModal({ isOpen, onClose, onSave, category = null, isLoading }) {
  const [formData, setFormData] = useState({
    nombre: '',
    abrev: ''
  });

  useEffect(() => {
    if (category) {
      setFormData({ nombre: category.nombre, abrev: category.abrev || '' });
    } else {
      setFormData({ nombre: '', abrev: '' });
    }
  }, [category, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.nombre && formData.abrev) {
      onSave(formData);
    }
  };

  const isEdit = !!category;

  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-surface rounded-lg shadow-xl w-full max-w-sm mx-4">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-medium text-gray-800">
            {isEdit ? 'Editar Categoría' : 'Nueva Categoría'}
          </h2>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre *
            </label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="Innovación & Diseño"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Abreviatura *
            </label>
            <input
              type="text"
              value={formData.abrev}
              onChange={(e) => setFormData({ ...formData, abrev: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="Innovación"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              isLoading={isLoading}
            >
              {isEdit ? 'Guardar' : 'Crear'}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

// Category Row Component
function CategoryRow({ category, skillCount, onEdit, onDelete, onRestore, onDragStart, onDragOver, onDragEnd, onDrop, isDragging, isDragOver }) {
  const isArchived = category.isActive === false;
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div 
      className={`
        flex items-center gap-3 p-4 bg-surface rounded-lg shadow-sm border transition-all duration-200 group relative
        ${isArchived ? 'bg-gray-50' : ''}
        ${isDragging 
          ? 'opacity-100 scale-[1.02] -rotate-1 shadow-2xl border-primary border z-50 ring-1 ring-primary cursor-grabbing' 
          : 'border-gray-100 hover:shadow-md'
        }
        ${isDragOver && !isDragging
          ? 'border-primary border-2 border-dashed bg-primary/5 transform translate-x-2' 
          : ''
        }
      `}
      draggable
      onDragStart={(e) => onDragStart(e, category.id)}
      onDragOver={(e) => onDragOver(e, category.id)}
      onDragEnd={onDragEnd}
      onDrop={(e) => onDrop(e, category.id)}
    >
      {/* Drag Handle */}
      <div className="text-gray-400 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity">
        <GripVertical size={18} />
      </div>

      {/* Color Dot */}
      <div className="relative">
        <button
          onClick={() => setShowColorPicker(!showColorPicker)}
          className="w-4 h-4 rounded-full border border-gray-200 hover:scale-125 transition-transform"
          style={{ backgroundColor: PRESET_COLORS[category.id % PRESET_COLORS.length] }}
        />
        <ColorPicker
          color={PRESET_COLORS[category.id % PRESET_COLORS.length]}
          onChange={() => {}}
          isOpen={showColorPicker}
          onClose={() => setShowColorPicker(false)}
        />
      </div>

      {/* Name */}
      <div className="flex-1">
        <span className={`font-medium ${isArchived ? 'text-gray-500' : 'text-gray-800'}`}>{category.nombre}</span>
        <span className="text-sm text-gray-400 ml-2">({category.abrev})</span>
        {isArchived && (
          <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
            Archivado
          </span>
        )}
      </div>

      {/* Skill Count */}
      <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
        {skillCount} skills
      </span>

      {/* Actions */}
      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-2 hover:bg-gray-100 rounded transition-colors opacity-0 group-hover:opacity-100"
        >
          <MoreVertical size={18} className="text-gray-500" />
        </button>

        {showMenu && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
            <div className="absolute right-0 top-full mt-1 bg-surface rounded-lg shadow-lg border border-gray-100 py-1 z-20 min-w-[140px]">
              {!isArchived ? (
                <>
                  <button
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    onClick={() => { onEdit(category); setShowMenu(false); }}
                  >
                    <Edit3 size={14} />
                    Editar
                  </button>
                  <hr className="my-1 border-gray-100" />
                  <button
                    onClick={() => { onDelete(category); setShowMenu(false); }}
                    className="w-full px-4 py-2 text-left text-sm text-critical hover:bg-critical/5 flex items-center gap-2"
                  >
                    <Trash2 size={14} />
                    Archivar
                  </button>
                </>
              ) : (
                <button
                  onClick={() => { onRestore(category); setShowMenu(false); }}
                  className="w-full px-4 py-2 text-left text-sm text-competentDark hover:bg-competent/10 flex items-center gap-2"
                >
                  <RotateCcw size={14} />
                  Restaurar
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Confirm Archive Modal (for categories with skills)
function ConfirmArchiveModal({ isOpen, onClose, onConfirm, category, skills, isLoading }) {
  if (!isOpen || !category) return null;

  const affectedSkills = skills.filter(s => s.categoriaId === category.id);

  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-surface rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center gap-3 p-4 border-b border-gray-100 bg-warning/5">
          <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center">
            <AlertTriangle size={20} className="text-warning" />
          </div>
          <div>
            <h2 className="text-lg font-medium text-gray-800">Archivar Categoría</h2>
            <p className="text-sm text-gray-500">Esta acción afectará múltiples elementos</p>
          </div>
          <button 
            onClick={onClose}
            className="ml-auto p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <p className="text-gray-700">
            ¿Estás seguro que deseas archivar <strong>"{category.nombre}"</strong>?
          </p>
          
          {affectedSkills.length > 0 ? (
            <div className="bg-gray-50 rounded-lg p-3 max-h-40 overflow-y-auto">
              <p className="text-sm font-medium text-gray-600 mb-2">
                {affectedSkills.length} skill{affectedSkills.length !== 1 ? 's' : ''} afectada{affectedSkills.length !== 1 ? 's' : ''}:
              </p>
              <ul className="space-y-1">
                {affectedSkills.map(skill => (
                  <li key={skill.id} className="text-sm text-gray-600 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                    {skill.nombre}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              Esta categoría no tiene skills asociadas, pero se ocultará de la lista principal.
            </p>
          )}

          <p className="text-sm text-gray-500">
            Los elementos archivados no aparecerán en Team Matrix, evaluaciones ni perfiles de puesto. 
            Podrás restaurarlos desde "Ver archivados".
          </p>
        </div>

        <div className="flex justify-end gap-3 p-4 border-t border-gray-100">
          <Button
            variant="secondary"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            variant="danger"
            onClick={onConfirm}
            isLoading={isLoading}
          >
            Archivar todo ({affectedSkills.length + 1} items)
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// Empty State removed (using shared)

// Main Component
export default function CategoriesTab() {
  const { isAuthenticated, getHeaders, login } = useAuth();
  const [categories, setCategories] = useState([]);
  const [skills, setSkills] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [archiveConfirm, setArchiveConfirm] = useState({ show: false, category: null });
  const [searchQuery, setSearchQuery] = useState('');

  // Filter categories
  const filteredCategories = categories.filter(category => {
    // 1. Archive filter
    if (!showArchived && category.isActive === false) return false;
    // 2. Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        category.nombre.toLowerCase().includes(query) ||
        category.abrev?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  // Fetch categories and skills
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // Fetch ALL data (including archived) and filter client-side for smooth transitions
        const responseParam = '?includeArchived=true';
        const catUrl = `${API_BASE}/api/categories${responseParam}`;
        const skillUrl = `${API_BASE}/api/skills${responseParam}`;
        const [catRes, skillRes] = await Promise.all([
          fetch(catUrl),
          fetch(skillUrl)
        ]);

        
        if (!catRes.ok || !skillRes.ok) {
          throw new Error('Error fetching data');
        }
        
        const [catData, skillData] = await Promise.all([
          catRes.json(),
          skillRes.json()
        ]);
        
        setCategories(catData);
        setSkills(skillData);
      } catch (err) {
        setError('Error cargando categorías');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []); // Fetch once, filter locally for smooth toggle

  // Get skill count per category
  const getSkillCount = (categoryId) => {
    return skills.filter(s => s.categoriaId === categoryId).length;
  };

  // Handle auth-protected action
  const withAuth = async (action) => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return false;
    }
    return action();
  };

  // Create category
  const handleCreate = async (data) => {
    return withAuth(async () => {
      setIsSaving(true);
      try {
        const res = await fetch(`${API_BASE}/api/categories`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(data)
        });
        
        if (res.status === 401) {
          setShowLoginModal(true);
          return;
        }
        
        if (!res.ok) throw new Error('Error creating category');
        
        const newCategory = await res.json();
        setCategories([...categories, newCategory]);
        setShowModal(false);
      } catch (_err) {
        setError('Error creando categoría');
      } finally {
        setIsSaving(false);
      }
    });
  };

  // Update category
  const handleUpdate = async (data) => {
    if (!editingCategory) return;
    
    return withAuth(async () => {
      setIsSaving(true);
      try {
        const res = await fetch(`${API_BASE}/api/categories/${editingCategory.id}`, {
          method: 'PUT',
          headers: getHeaders(),
          body: JSON.stringify(data)
        });
        
        if (res.status === 401) {
          setShowLoginModal(true);
          return;
        }
        
        if (!res.ok) throw new Error('Error updating category');
        
        const updated = await res.json();
        setCategories(categories.map(c => c.id === updated.id ? updated : c));
        setShowModal(false);
        setEditingCategory(null);
      } catch (_err) {
        setError('Error actualizando categoría');
      } finally {
        setIsSaving(false);
      }
    });
  };

  // Delete/Archive category
  const handleDelete = async (category) => {
      // Always show confirmation modal for double safety
      setArchiveConfirm({ show: true, category });
  };

  // Execute the actual archive with Undo
  const executeArchive = (category) => {
    // 1. Optimistic Update (Archive locally)
    const prevCategories = [...categories];
    const prevSkills = [...skills];
    
    // Mark as archived
    setCategories(categories.map(c => 
      c.id === category.id ? { ...c, isActive: false } : c
    ));
    setSkills(skills.map(s => 
      s.categoriaId === category.id ? { ...s, isActive: false } : s
    ));
    
    setArchiveConfirm({ show: false, category: null });

    // 2. Undo Logic
    let isUndone = false;
    const handleUndo = () => {
      isUndone = true;
      setCategories(prevCategories);
      setSkills(prevSkills);
      toast.success('Archivado deshecho');
    };

    // 3. Show Toast
    toast.custom((t) => (
      <ToastUndo 
        t={t}
        // message={`"${category.nombre}" archivada`}
        message="Categoría archivada" 
        onUndo={handleUndo}
        duration={4000}
      />
    ), { duration: 4000, id: `arch-${category.id}` });

    // 4. Delayed API Call
    setTimeout(async () => {
      if (!isUndone) {
         try {
            const res = await fetch(`${API_BASE}/api/categories/${category.id}`, {
              method: 'DELETE',
              headers: getHeaders()
            });
            if (!res.ok) throw new Error('Failed');
         } catch {
            toast.error('Error sincronizando archivado');
            // Revert on error if needed, or force reload
         }
      }
    }, 4100);
  };

  // Edit handler
  const handleEdit = (category) => {
    setEditingCategory(category);
    setShowModal(true);
  };

  // Restore archived category
  const handleRestore = async (category) => {
    return withAuth(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/categories/${category.id}/restore`, {
          method: 'PUT',
          headers: getHeaders()
        });
        
        if (res.status === 401) {
          setShowLoginModal(true);
          return;
        }
        
        if (!res.ok) throw new Error('Error restoring category');
        
        // Update local state: mark category as active
        setCategories(categories.map(c => 
          c.id === category.id ? { ...c, isActive: true } : c
        ));
        
        // Also mark associated skills as active
        setSkills(skills.map(s => 
          s.categoriaId === category.id ? { ...s, isActive: true } : s
        ));
      } catch (_err) {
        setError('Error restaurando categoría');
      }
    });
  };



  // Handle login success
  const handleLoginSuccess = (token) => {
    login(token);
    setShowLoginModal(false);
  };

  // ===== DRAG AND DROP REORDER =====
  const [draggedId, setDraggedId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);

  const handleDragStart = (e, id) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
    
    // Create a transparent 1x1 pixel drag image to hide the browser's default preview
    // The visual feedback is handled by CSS (opacity, transform) on the dragged row
    const transparentImg = document.createElement('canvas');
    transparentImg.width = 1;
    transparentImg.height = 1;
    e.dataTransfer.setDragImage(transparentImg, 0, 0);
  };

  const handleDragOver = (e, overId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (overId === draggedId || draggedId === null) return;
    
    // Live reorder while dragging
    if (overId !== dragOverId) {
      setDragOverId(overId);
      
      // Reorder the array in real-time for visual feedback
      const oldIndex = categories.findIndex(c => c.id === draggedId);
      const newIndex = categories.findIndex(c => c.id === overId);
      
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        const newCategories = [...categories];
        const [moved] = newCategories.splice(oldIndex, 1);
        newCategories.splice(newIndex, 0, moved);
        setCategories(newCategories);
      }
    }
  };

  const handleDragEnd = () => {
    // Persist final order to API
    if (draggedId !== null) {
      const order = categories.map(c => c.id);
      fetch(`${API_BASE}/api/categories/reorder`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getHeaders()
        },
        body: JSON.stringify({ order })
      }).catch(err => console.error('Error saving order:', err));
    }
    
    setDraggedId(null);
    setDragOverId(null);
  };

  const handleDrop = (e, dropId) => {
    e.preventDefault();
    // The actual reorder already happened in handleDragOver
    // handleDragEnd will persist to API
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertCircle size={48} className="text-critical mb-4" />
        <p className="text-gray-700">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 text-primary hover:underline"
        >
          Reintentar
        </button>
      </div>
    );
  }

  // Empty state
  if (categories.length === 0) {
    return (
      <>
        <EmptyState 
          icon={FolderPlus}
          title="No hay categorías"
          description="Las categorías ayudan a organizar las skills por área temática. Crea tu primera categoría para empezar."
          actionLabel="Crear Categoría"
          onAction={() => setShowModal(true)} 
        />
        <CategoryModal
          isOpen={showModal}
          onClose={() => { setShowModal(false); setEditingCategory(null); }}
          onSave={handleCreate}
          isLoading={isSaving}
        />
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onSuccess={handleLoginSuccess}
        />
      </>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Row (Standardized) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar categoría..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <p className="text-sm text-gray-500 hidden sm:block">
            {filteredCategories.length} categoría{filteredCategories.length !== 1 ? 's' : ''}
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
            {showArchived ? 'Ocultar archivados' : 'Ver archivados'}
          </button>
          
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <Plus size={18} />
            Nueva Categoría
          </button>
        </div>
      </div>

      {/* Categories List */}
      <div className="space-y-2">

        {filteredCategories.map((category) => (
          <CategoryRow
            key={category.id}
            category={category}
            skillCount={getSkillCount(category.id)}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onRestore={handleRestore}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDrop={handleDrop}
            isDragging={draggedId === category.id}
            isDragOver={dragOverId === category.id}
          />
        ))}
      </div>

      {/* Modals */}
      <CategoryModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingCategory(null); }}
        onSave={editingCategory ? handleUpdate : handleCreate}
        category={editingCategory}
        isLoading={isSaving}
      />
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={handleLoginSuccess}
      />
      <ConfirmArchiveModal
        isOpen={archiveConfirm.show}
        onClose={() => setArchiveConfirm({ show: false, category: null })}
        onConfirm={() => executeArchive(archiveConfirm.category)}
        category={archiveConfirm.category}
        skills={skills}
        isLoading={isSaving}
      />
    </div>
  );

}
