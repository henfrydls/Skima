import { useState, useEffect } from 'react';
import { invalidatePreload } from '../../lib/dataPreload';
import { createPortal } from 'react-dom';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
    <div className="modal-overlay z-50">
      <div className="bg-surface rounded-lg shadow-xl w-full max-w-sm mx-4 animate-scale-in">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-medium text-gray-800">
            {isEdit ? 'Edit Category' : 'New Category'}
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
              Name *
            </label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="Innovation & Design"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Abbreviation *
            </label>
            <input
              type="text"
              value={formData.abrev}
              onChange={(e) => setFormData({ ...formData, abrev: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="Innovation"
              required
            />
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
              {isEdit ? 'Save' : 'Create'}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

// Category Row Component (uses @dnd-kit/sortable for smooth cursor)
function CategoryRow({ category, skillCount, onEdit, onDelete, onRestore }) {
  const isArchived = category.isActive === false;
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const baseTransform = CSS.Translate.toString(transform);
  const style = {
    transform: isDragging
      ? `${baseTransform} rotate(-1.5deg)`
      : baseTransform,
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        flex items-center gap-3 p-4 bg-surface rounded-lg shadow-sm border group relative
        ${isDragging ? '' : 'transition-all duration-200'}
        ${isArchived ? 'bg-gray-50' : ''}
        ${isDragging
          ? 'shadow-2xl border-primary border z-50 ring-1 ring-primary'
          : 'border-gray-100 hover:shadow-md'
        }
      `}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="text-gray-400 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity touch-none"
      >
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
            Archived
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
          className="p-2 hover:bg-gray-100 rounded transition-colors"
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
                    Edit
                  </button>
                  <hr className="my-1 border-gray-100" />
                  <button
                    onClick={() => { onDelete(category); setShowMenu(false); }}
                    className="w-full px-4 py-2 text-left text-sm text-critical hover:bg-critical/5 flex items-center gap-2"
                  >
                    <Trash2 size={14} />
                    Archive
                  </button>
                </>
              ) : (
                <button
                  onClick={() => { onRestore(category); setShowMenu(false); }}
                  className="w-full px-4 py-2 text-left text-sm text-competentDark hover:bg-competent/10 flex items-center gap-2"
                >
                  <RotateCcw size={14} />
                  Restore
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
    <div className="modal-overlay z-50">
      <div className="bg-surface rounded-lg shadow-xl w-full max-w-md mx-4 animate-scale-in">
        <div className="flex items-center gap-3 p-4 border-b border-gray-100 bg-warning/5">
          <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center">
            <AlertTriangle size={20} className="text-warning" />
          </div>
          <div>
            <h2 className="text-lg font-medium text-gray-800">Archive Category</h2>
            <p className="text-sm text-gray-500">This action will affect multiple items</p>
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
            Are you sure you want to archive <strong>"{category.nombre}"</strong>?
          </p>
          
          {affectedSkills.length > 0 ? (
            <div className="bg-gray-50 rounded-lg p-3 max-h-40 overflow-y-auto">
              <p className="text-sm font-medium text-gray-600 mb-2">
                {affectedSkills.length} skill{affectedSkills.length !== 1 ? 's' : ''} affected:
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
              This category has no associated skills, but it will be hidden from the main list.
            </p>
          )}

          <p className="text-sm text-gray-500">
            Archived items will not appear in Team Matrix, evaluations, or role profiles.
            You can restore them from "Show archived".
          </p>
        </div>

        <div className="flex justify-end gap-3 p-4 border-t border-gray-100">
          <Button
            variant="secondary"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={onConfirm}
            isLoading={isLoading}
          >
            Archive all ({affectedSkills.length + 1} items)
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
        setError('Error loading categories');
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
        invalidatePreload();
        setShowModal(false);
      } catch (_err) {
        setError('Error creating category');
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
        invalidatePreload();
        setShowModal(false);
        setEditingCategory(null);
      } catch (_err) {
        setError('Error updating category');
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
      toast.success('Archive undone');
    };

    // 3. Show Toast
    toast.custom((t) => (
      <ToastUndo 
        t={t}
        // message={`"${category.nombre}" archivada`}
        message="Category archived"
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
            if (!res.ok) {
              if (res.status === 403) {
                const body = await res.json().catch(() => ({}));
                if (body.error === 'DEMO_MODE') {
                  toast.error('This action is not available in demo mode.');
                  setCategories(prevCategories);
                  setSkills(prevSkills);
                  return;
                }
              }
              throw new Error('Failed');
            }
            invalidatePreload();
         } catch {
            toast.error('Error syncing archive');
            setCategories(prevCategories);
            setSkills(prevSkills);
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
        invalidatePreload();
      } catch (_err) {
        setError('Error restoring category');
      }
    });
  };



  // Handle login success
  const handleLoginSuccess = (token) => {
    login(token);
    setShowLoginModal(false);
  };

  // ===== DRAG AND DROP REORDER (@dnd-kit/sortable) =====
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = categories.findIndex(c => c.id === active.id);
    const newIndex = categories.findIndex(c => c.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newCategories = arrayMove(categories, oldIndex, newIndex);
    setCategories(newCategories);

    // Persist to API
    const order = newCategories.map(c => c.id);
    fetch(`${API_BASE}/api/categories/reorder`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getHeaders()
      },
      body: JSON.stringify({ order })
    }).then(() => invalidatePreload())
      .catch(err => console.error('Error saving order:', err));
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
      <>
        <EmptyState 
          icon={FolderPlus}
          title="No categories yet"
          description="Categories help organize skills by topic area. Create your first category to get started."
          actionLabel="Create Category"
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
            placeholder="Search category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <p className="text-sm text-gray-500 hidden sm:block">
            {filteredCategories.length} {filteredCategories.length !== 1 ? 'categories' : 'category'}
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
            {showArchived ? 'Hide archived' : 'Show archived'}
          </button>
          
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <Plus size={18} />
            New Category
          </button>
        </div>
      </div>

      {/* Categories List */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={filteredCategories.map(c => c.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {filteredCategories.map((category) => (
              <CategoryRow
                key={category.id}
                category={category}
                skillCount={getSkillCount(category.id)}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onRestore={handleRestore}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

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
