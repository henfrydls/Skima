import { useState } from 'react';
import { 
  GripVertical, 
  Plus, 
  MoreVertical, 
  Edit3, 
  Trash2,
  X,
  Check,
  FolderPlus
} from 'lucide-react';
import { CATEGORIES, SKILLS } from '../../data/mockData';

/**
 * CategoriesTab — Gestión de Categorías
 * 
 * Features:
 * - Drag & Drop para reordenar
 * - Color picker por categoría
 * - Contador de skills
 * - CRUD de categorías
 */

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

// Create Category Modal
function CreateCategoryModal({ isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState({
    nombre: '',
    color: PRESET_COLORS[0]
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.nombre) {
      onSave(formData);
      setFormData({ nombre: '', color: PRESET_COLORS[0] });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-surface rounded-lg shadow-xl w-full max-w-sm mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-medium text-gray-800">Nueva Categoría</h2>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color
            </label>
            <div className="flex gap-2">
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: c })}
                  className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                    formData.color === c ? 'border-gray-800 scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

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

// Category Row Component
function CategoryRow({ category, skillCount, index, onColorChange, onDelete, onDragStart, onDragOver, onDrop }) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={(e) => onDrop(e, index)}
      className="flex items-center gap-3 p-4 bg-surface rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-move group"
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
          style={{ backgroundColor: category.color || PRESET_COLORS[0] }}
        />
        <ColorPicker
          color={category.color}
          onChange={(color) => onColorChange(category.id, color)}
          isOpen={showColorPicker}
          onClose={() => setShowColorPicker(false)}
        />
      </div>

      {/* Name */}
      <span className="flex-1 font-medium text-gray-800">{category.nombre}</span>

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
                onClick={() => setShowMenu(false)}
              >
                <Edit3 size={14} />
                Editar
              </button>
              <hr className="my-1 border-gray-100" />
              <button
                onClick={() => { onDelete(category.id); setShowMenu(false); }}
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
  const [categories, setCategories] = useState(CATEGORIES.map(c => ({
    ...c,
    color: PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)]
  })));
  const [skills] = useState(SKILLS);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);

  // Get skill count per category
  const getSkillCount = (categoryId) => {
    return skills.filter(s => s.categoria === categoryId).length;
  };

  // Drag handlers
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newCategories = [...categories];
    const [removed] = newCategories.splice(draggedIndex, 1);
    newCategories.splice(index, 0, removed);
    setCategories(newCategories);
    setDraggedIndex(index);
  };

  const handleDrop = (e, index) => {
    e.preventDefault();
    setDraggedIndex(null);
    // TODO: Save new order to backend
  };

  // CRUD handlers
  const handleColorChange = (id, color) => {
    setCategories(categories.map(c => c.id === id ? { ...c, color } : c));
  };

  const handleDelete = (id) => {
    const skillCount = getSkillCount(id);
    if (skillCount > 0) {
      alert(`No puedes eliminar esta categoría porque tiene ${skillCount} skills asociadas.`);
      return;
    }
    if (confirm('¿Eliminar esta categoría?')) {
      setCategories(categories.filter(c => c.id !== id));
    }
  };

  const handleCreate = (data) => {
    const newCategory = {
      ...data,
      id: `cat-${Date.now()}`
    };
    setCategories([...categories, newCategory]);
  };

  // Empty state
  if (categories.length === 0) {
    return (
      <>
        <EmptyState onCreateClick={() => setShowCreateModal(true)} />
        <CreateCategoryModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSave={handleCreate}
        />
      </>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Arrastra para reordenar
        </p>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 text-sm font-medium"
        >
          <Plus size={18} />
          Nueva
        </button>
      </div>

      {/* Categories List */}
      <div className="space-y-2">
        {categories.map((category, index) => (
          <CategoryRow
            key={category.id}
            category={category}
            skillCount={getSkillCount(category.id)}
            index={index}
            onColorChange={handleColorChange}
            onDelete={handleDelete}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          />
        ))}
      </div>

      {/* Create Modal */}
      <CreateCategoryModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={handleCreate}
      />
    </div>
  );
}
