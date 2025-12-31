import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  Edit3, 
  X,
  Trash2,
  Layers,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import LoginModal from '../auth/LoginModal';

/**
 * SkillsTab — Gestión de Skills por Categoría (Connected to API)
 */

const API_BASE = '/api';

// Edit Skill Modal with Rubric
function EditSkillModal({ skill, categories, isOpen, onClose, onSave, isLoading }) {
  const [formData, setFormData] = useState({
    nombre: '',
    categoriaId: categories[0]?.id || ''
  });

  useEffect(() => {
    if (skill) {
      setFormData({ 
        nombre: skill.nombre, 
        categoriaId: skill.categoriaId || categories[0]?.id 
      });
    } else {
      setFormData({ 
        nombre: '', 
        categoriaId: categories[0]?.id || '' 
      });
    }
  }, [skill, isOpen, categories]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.nombre && formData.categoriaId) {
      onSave(formData);
    }
  };

  return (
  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] animate-fade-in">
      <div className="bg-surface rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 sticky top-0 bg-surface">
          <h2 className="text-lg font-medium text-gray-800">
            {skill ? 'Editar Skill' : 'Nueva Skill'}
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
              Nombre de la skill *
            </label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="Design Thinking"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoría *
            </label>
            <select
              value={formData.categoriaId}
              onChange={(e) => setFormData({ ...formData, categoriaId: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.nombre}</option>
              ))}
            </select>
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
              {skill ? 'Guardar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

// Category Accordion Component
function CategoryAccordion({ category, skills, onEditSkill, onAddSkill, onDeleteSkill }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const categorySkills = skills.filter(s => s.categoriaId === category.id);

  return (
    <div className="bg-surface rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {isExpanded ? (
            <ChevronDown size={18} className="text-gray-400" />
          ) : (
            <ChevronRight size={18} className="text-gray-400" />
          )}
          <span className="font-medium text-gray-800">{category.nombre}</span>
        </div>
        <span className="text-sm text-gray-500">
          {categorySkills.length} skills
        </span>
      </button>

      {isExpanded && (
        <div className="border-t border-gray-100 animate-fade-in">
          {categorySkills.map(skill => (
            <div
              key={skill.id}
              className="flex items-center justify-between px-4 py-3 pl-12 hover:bg-gray-50 transition-colors group"
            >
              <span className="text-sm text-gray-700">• {skill.nombre}</span>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => onEditSkill(skill)}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  <Edit3 size={14} className="text-gray-500" />
                </button>
                <button
                  onClick={() => onDeleteSkill(skill)}
                  className="p-1 hover:bg-critical/10 rounded transition-colors"
                >
                  <Trash2 size={14} className="text-critical" />
                </button>
              </div>
            </div>
          ))}

          <button
            onClick={() => onAddSkill(category.id)}
            className="w-full px-4 py-3 pl-12 text-left text-sm text-primary hover:bg-primary/5 transition-colors flex items-center gap-2"
          >
            <Plus size={14} />
            Agregar skill a esta categoría
          </button>
        </div>
      )}
    </div>
  );
}

// Main Component
export default function SkillsTab({ isActive = false }) {
  const { isAuthenticated, getHeaders, login } = useAuth();
  const [categories, setCategories] = useState([]);
  const [skills, setSkills] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingSkill, setEditingSkill] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSkillCategory, setNewSkillCategory] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch data function
  const fetchData = async () => {
    try {
      // Don't set loading true if refreshing in background to avoid flicker,
      // unless it's the initial load
      if (categories.length === 0) setIsLoading(true);
      
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
      setError('Error cargando datos');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, []);

  // Refetch when tab becomes active
  useEffect(() => {
    if (isActive) {
      fetchData();
    }
  }, [isActive]);

  // Auth wrapper
  const withAuth = async (action) => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return false;
    }
    return action();
  };

  const handleEditSkill = (skill) => {
    setEditingSkill(skill);
    setNewSkillCategory(null);
    setIsModalOpen(true);
  };

  const handleAddSkill = (categoryId) => {
    setEditingSkill(null);
    setNewSkillCategory(categoryId);
    setIsModalOpen(true);
  };

  // Create skill
  const handleCreateSkill = async (data) => {
    return withAuth(async () => {
      setIsSaving(true);
      try {
        const res = await fetch(`${API_BASE}/skills`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({
            ...data,
            categoriaId: newSkillCategory || data.categoriaId
          })
        });
        
        if (res.status === 401) {
          setShowLoginModal(true);
          return;
        }
        
        if (!res.ok) throw new Error('Error creating skill');
        
        const newSkill = await res.json();
        setSkills([...skills, newSkill]);
        setIsModalOpen(false);
      } catch (err) {
        setError('Error creando skill');
      } finally {
        setIsSaving(false);
      }
    });
  };

  // Update skill
  const handleUpdateSkill = async (data) => {
    if (!editingSkill) return;
    
    return withAuth(async () => {
      setIsSaving(true);
      try {
        const res = await fetch(`${API_BASE}/skills/${editingSkill.id}`, {
          method: 'PUT',
          headers: getHeaders(),
          body: JSON.stringify(data)
        });
        
        if (res.status === 401) {
          setShowLoginModal(true);
          return;
        }
        
        if (!res.ok) throw new Error('Error updating skill');
        
        const updated = await res.json();
        setSkills(skills.map(s => s.id === updated.id ? updated : s));
        setIsModalOpen(false);
        setEditingSkill(null);
      } catch (err) {
        setError('Error actualizando skill');
      } finally {
        setIsSaving(false);
      }
    });
  };

  // Delete skill
  const handleDeleteSkill = async (skill) => {
    if (!confirm(`¿Eliminar la skill "${skill.nombre}"?`)) return;
    
    return withAuth(async () => {
      try {
        const res = await fetch(`${API_BASE}/skills/${skill.id}`, {
          method: 'DELETE',
          headers: getHeaders()
        });
        
        if (res.status === 401) {
          setShowLoginModal(true);
          return;
        }
        
        if (!res.ok) throw new Error('Error deleting skill');
        
        setSkills(skills.filter(s => s.id !== skill.id));
      } catch (err) {
        setError('Error eliminando skill');
      }
    });
  };

  const handleSaveSkill = (data) => {
    if (editingSkill) {
      handleUpdateSkill(data);
    } else {
      handleCreateSkill(data);
    }
  };

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
      <div className="text-center py-16">
        <Layers size={48} className="mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-800 mb-2">
          Primero crea categorías
        </h3>
        <p className="text-gray-500">
          Las skills se organizan dentro de categorías.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          {categories.length} categorías • {skills.length} skills
        </div>
        <button
          onClick={() => { setEditingSkill(null); setNewSkillCategory(null); setIsModalOpen(true); }}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 text-sm font-medium"
        >
          <Plus size={18} />
          Nueva Skill
        </button>
      </div>

      {/* Categories Accordion */}
      <div className="space-y-3">
        {categories.map((category) => (
          <CategoryAccordion
            key={category.id}
            category={category}
            skills={skills}
            onEditSkill={handleEditSkill}
            onAddSkill={handleAddSkill}
            onDeleteSkill={handleDeleteSkill}
          />
        ))}
      </div>

      {/* Modals */}
      <EditSkillModal
        skill={editingSkill}
        categories={categories}
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingSkill(null); setNewSkillCategory(null); }}
        onSave={handleSaveSkill}
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
