import { useState, useEffect } from 'react';
import { 
  GripVertical, 
  Plus, 
  MoreVertical, 
  Edit3, 
  Trash2,
  X,
  FolderPlus,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import LoginModal from '../auth/LoginModal';

/**
 * CategoriesTab — Gestión de Categorías (Connected to API)
 * 
 * Features:
 * - Fetches categories from /api/categories
 * - CRUD with auth protection
 * - Login modal on 401
 */

const API_BASE = '/api';

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

  return (
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
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
              {isLoading && <Loader2 size={16} className="animate-spin" />}
              {isEdit ? 'Guardar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Category Row Component
function CategoryRow({ category, skillCount, onEdit, onDelete }) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="flex items-center gap-3 p-4 bg-surface rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-all group">
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
        <span className="font-medium text-gray-800">{category.nombre}</span>
        <span className="text-sm text-gray-400 ml-2">({category.abrev})</span>
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
                Eliminar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Empty State
function EmptyState({ onCreateClick }) {
  return (
    <div className="text-center py-16">
      <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <FolderPlus size={36} className="text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-800 mb-2">
        No hay categorías
      </h3>
      <p className="text-gray-500 mb-6 max-w-sm mx-auto">
        Las categorías ayudan a organizar las skills por área temática.
      </p>
      <button
        onClick={onCreateClick}
        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 mx-auto"
      >
        <Plus size={18} />
        Crear primera categoría
      </button>
    </div>
  );
}

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

  // Fetch categories and skills
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [catRes, skillRes] = await Promise.all([
          fetch(`${API_BASE}/categories`),
          fetch(`${API_BASE}/skills`)
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
  }, []);

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
        const res = await fetch(`${API_BASE}/categories`, {
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
      } catch (err) {
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
        const res = await fetch(`${API_BASE}/categories/${editingCategory.id}`, {
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
      } catch (err) {
        setError('Error actualizando categoría');
      } finally {
        setIsSaving(false);
      }
    });
  };

  // Delete category
  const handleDelete = async (category) => {
    const skillCount = getSkillCount(category.id);
    if (skillCount > 0) {
      alert(`No puedes eliminar esta categoría porque tiene ${skillCount} skills asociadas.`);
      return;
    }
    
    if (!confirm('¿Eliminar esta categoría?')) return;
    
    return withAuth(async () => {
      try {
        const res = await fetch(`${API_BASE}/categories/${category.id}`, {
          method: 'DELETE',
          headers: getHeaders()
        });
        
        if (res.status === 401) {
          setShowLoginModal(true);
          return;
        }
        
        if (!res.ok) throw new Error('Error deleting category');
        
        setCategories(categories.filter(c => c.id !== category.id));
      } catch (err) {
        setError('Error eliminando categoría');
      }
    });
  };

  // Edit handler
  const handleEdit = (category) => {
    setEditingCategory(category);
    setShowModal(true);
  };

  // Handle login success
  const handleLoginSuccess = (token) => {
    login(token);
    setShowLoginModal(false);
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
        <EmptyState onCreateClick={() => setShowModal(true)} />
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {categories.length} categoría{categories.length !== 1 ? 's' : ''}
        </p>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 text-sm font-medium"
        >
          <Plus size={18} />
          Nueva
        </button>
      </div>

      {/* Categories List */}
      <div className="space-y-2">
        {categories.map((category) => (
          <CategoryRow
            key={category.id}
            category={category}
            skillCount={getSkillCount(category.id)}
            onEdit={handleEdit}
            onDelete={handleDelete}
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
    </div>
  );
}
