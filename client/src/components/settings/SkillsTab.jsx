import { useState, useEffect, useCallback } from 'react';
import { invalidatePreload } from '../../lib/dataPreload';
import { useSearchParams } from 'react-router-dom';
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
  AlertCircle,
  Check,
  Search
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import LoginModal from '../auth/LoginModal';
import ConfirmModal from '../common/ConfirmModal';
import EmptyState from '../common/EmptyState';
import ToastUndo from '../common/ToastUndo';
import Button from '../common/Button';
import { getCategoryColor } from '../../lib/categoryColors';

/**
 * SkillsTab — Skills Management by Category (Connected to API)
 */

import { API_BASE } from '../../lib/apiBase';

// Edit Skill Modal with Rubric
function EditSkillModal({ skill, categories, isOpen, onClose, onSave, isLoading, defaultCategoryId = null }) {
  const [formData, setFormData] = useState({
    nombre: '',
    categoriaId: categories[0]?.id || ''
  });
  const [catDropdownOpen, setCatDropdownOpen] = useState(false);

  useEffect(() => {
    if (skill) {
      setFormData({
        nombre: skill.nombre,
        categoriaId: skill.categoriaId || categories[0]?.id
      });
    } else {
      setFormData({
        nombre: '',
        categoriaId: defaultCategoryId || categories[0]?.id || ''
      });
    }
  }, [skill, isOpen, categories, defaultCategoryId]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.nombre && formData.categoriaId) {
      onSave(formData);
    }
  };

  return createPortal(
    <div className="modal-overlay z-[100]">
      <div className="bg-surface rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-visible animate-scale-in">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 sticky top-0 bg-surface">
          <h2 className="text-lg font-medium text-gray-800">
            {skill ? 'Edit Skill' : 'New Skill'}
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
              Skill name *
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
              Category *
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setCatDropdownOpen(!catDropdownOpen)}
                className="w-full flex items-center justify-between px-3 py-2 border border-gray-200 rounded-lg bg-white hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors text-sm"
              >
                <span className="text-gray-700 font-medium">
                  {categories.find(c => c.id === formData.categoriaId)?.nombre || 'Select category'}
                </span>
                <ChevronDown size={16} className={`text-gray-400 transition-transform ${catDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {catDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-[110]" onClick={() => setCatDropdownOpen(false)} />
                  <div className="absolute left-0 top-full mt-1 w-full bg-surface rounded-lg shadow-xl border border-gray-100 py-1 z-[120] max-h-52 overflow-y-auto">
                    {categories.map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => { setFormData({ ...formData, categoriaId: cat.id }); setCatDropdownOpen(false); }}
                        className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between transition-colors
                          ${formData.categoriaId === cat.id ? 'bg-primary/5 text-primary font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                      >
                        {cat.nombre}
                        {formData.categoriaId === cat.id && <Check size={14} className="text-primary" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isLoading}
            >
              {skill ? 'Save' : 'Create'}
            </Button>
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
          <span
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: getCategoryColor(category.id) }}
          />
          <span className="font-medium text-gray-800">{category.nombre}</span>
        </div>
        {/* Skill Count Badge - matching CategoriesTab */}
        <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
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
            Add skill to this category
          </button>
        </div>
      )}
    </div>
  );
}

// Main Component
export default function SkillsTab({ isActive = false }) {
  const [, setSearchParams] = useSearchParams();
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
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, skill: null });

  // Filter categories and skills based on search
  const filteredCategories = categories.filter(category => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    
    // Check if category name matches
    if (category.nombre.toLowerCase().includes(query)) return true;
    
    // Check if any skill in this category matches
    const categorySkills = skills.filter(s => s.categoriaId === category.id);
    return categorySkills.some(s => s.nombre.toLowerCase().includes(query));
  });

  const getFilteredSkills = (categoryId) => {
    const query = searchQuery.toLowerCase();
    let relevantSkills = skills.filter(s => s.categoriaId === categoryId);
    
    if (searchQuery) {
      // If category name matches, show all skills in it. 
      // Otherwise, only show skills that match the query.
      const categoryMatches = categories.find(c => c.id === categoryId)?.nombre.toLowerCase().includes(query);
      
      if (!categoryMatches) {
        relevantSkills = relevantSkills.filter(s => s.nombre.toLowerCase().includes(query));
      }
    }
    return relevantSkills;
  };

  // Fetch data function
  const fetchData = async () => {
    try {
      // Don't set loading true if refreshing in background to avoid flicker,
      // unless it's the initial load
      if (categories.length === 0) setIsLoading(true);
      
      const [catRes, skillRes] = await Promise.all([
        fetch(`${API_BASE}/api/categories`),
        fetch(`${API_BASE}/api/skills`)
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
      setError('Error loading data');
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
        const res = await fetch(`${API_BASE}/api/skills`, {
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
        invalidatePreload();
        setIsModalOpen(false);
        toast.success('Skill created successfully');
      } catch (err) {
        toast.error('Error creating skill');
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
        const res = await fetch(`${API_BASE}/api/skills/${editingSkill.id}`, {
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
        invalidatePreload();
        setIsModalOpen(false);
        setEditingSkill(null);
        toast.success('Skill updated successfully');
      } catch (err) {
        toast.error('Error updating skill');
      } finally {
        setIsSaving(false);
      }
    });
  };

  const executeDelete = async (skill) => {
      try {
        const res = await fetch(`${API_BASE}/api/skills/${skill.id}`, {
          method: 'DELETE',
          headers: getHeaders()
        });
        if (!res.ok) {
          if (res.status === 403) {
            const body = await res.json().catch(() => ({}));
            if (body.error === 'DEMO_MODE') {
              toast.error('This action is not available in demo mode.');
              fetchData();
              return;
            }
          }
          throw new Error('Failed');
        }
        invalidatePreload();
      } catch (err) {
        toast.error('Error syncing deletion');
        // force fetch to reset
        fetchData();
      }
  };

  // Delete with Double Safety
  const executeDeleteSkill = (skill) => {
    // 1. Optimistic Remove
    const previousSkills = [...skills];
    setSkills(skills.filter(s => s.id !== skill.id));
    
    // 2. Ref-like tracking for cancellation
    let isUndone = false;
    
    const handleUndo = () => {
      isUndone = true;
      setSkills(previousSkills);
      toast.success('Action undone');
    };
    
    toast.custom((t) => (
      <ToastUndo 
        t={t}
        message={`"${skill.nombre}" deleted`}
        onUndo={handleUndo}
        duration={4000}
      />
    ), { duration: 4000, id: `del-${skill.id}` });
    
    // 3. Delayed API Call
    setTimeout(() => {
      // If we are still "deleted" (meaning undo wasn't called impacting state logic)
      if(!isUndone) {
         executeDelete(skill);
      }
    }, 4100); 
  };
  


  const handleDeleteClick = (skill) => {
    setDeleteModal({ isOpen: true, skill });
  };
  
  const handleConfirmDelete = () => {
      if (deleteModal.skill) {
          executeDeleteSkill(deleteModal.skill);
          setDeleteModal({ isOpen: false, skill: null });
      }
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
          Retry
        </button>
      </div>
    );
  }

  // Empty state
  if (categories.length === 0) {
    return (
      <EmptyState
        icon={Layers}
        title="Create categories first"
        description="Skills are organized within categories. You need to create at least one category before adding skills."
        actionLabel="Go to Categories"
        onAction={() => setSearchParams({ tab: 'categorias' })}
      />
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
            placeholder="Search skill or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-500 hidden sm:block">
            {categories.length} categories • {skills.length} skills
          </div>
          <button
            onClick={() => { setEditingSkill(null); setNewSkillCategory(null); setIsModalOpen(true); }}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <Plus size={18} />
            New Skill
          </button>
        </div>
      </div>

      {/* Categories Accordion */}
      <div className="space-y-3">
        {filteredCategories.map((category) => (
          <CategoryAccordion
            key={category.id}
            category={category}
            skills={getFilteredSkills(category.id)}
            onEditSkill={handleEditSkill}
            onAddSkill={handleAddSkill}
            onDeleteSkill={handleDeleteClick}
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
        defaultCategoryId={newSkillCategory}
      />
      {/* ConfirmModal removed - using Toast Undo */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={handleLoginSuccess}
      />
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
        onConfirm={handleConfirmDelete}
        title="Delete Skill"
        message={`Are you sure you want to delete "${deleteModal.skill?.nombre}"? This action can be temporarily undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
