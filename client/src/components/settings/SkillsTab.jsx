import { useState } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  Edit3, 
  X,
  Layers
} from 'lucide-react';
import { SKILLS, CATEGORIES } from '../../data/mockData';

/**
 * SkillsTab — Gestión de Skills por Categoría
 * 
 * Features:
 * - Accordion por categoría
 * - Lista de skills expandible
 * - Modal para editar skill con rúbrica
 * - Agregar skill inline
 */

// Edit Skill Modal with Rubric
function EditSkillModal({ skill, categories, isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState(skill || {
    nombre: '',
    categoria: categories[0]?.id || '',
    rubrica: {
      nivel1: '',
      nivel3: '',
      nivel5: ''
    }
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-surface rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
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

        {/* Form */}
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
              Categoría
            </label>
            <select
              value={formData.categoria}
              onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.nombre}</option>
              ))}
            </select>
          </div>

          {/* Rubric Section */}
          <div className="pt-4 border-t border-gray-100">
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <Layers size={16} />
              Definir Rúbrica de Evaluación
            </h3>
            
            <div className="space-y-4">
              {/* Level 1 */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-600">Nivel 1 — Principiante</span>
                  <div className="flex gap-0.5">
                    <span className="w-2 h-2 rounded-full bg-critical" />
                    <span className="w-2 h-2 rounded-full bg-gray-200" />
                    <span className="w-2 h-2 rounded-full bg-gray-200" />
                    <span className="w-2 h-2 rounded-full bg-gray-200" />
                    <span className="w-2 h-2 rounded-full bg-gray-200" />
                  </div>
                </div>
                <textarea
                  value={formData.rubrica?.nivel1 || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    rubrica: { ...formData.rubrica, nivel1: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                  rows={2}
                  placeholder="Conoce conceptos básicos. Requiere guía constante."
                />
              </div>

              {/* Level 3 */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-600">Nivel 3 — Competente</span>
                  <div className="flex gap-0.5">
                    <span className="w-2 h-2 rounded-full bg-warning" />
                    <span className="w-2 h-2 rounded-full bg-warning" />
                    <span className="w-2 h-2 rounded-full bg-warning" />
                    <span className="w-2 h-2 rounded-full bg-gray-200" />
                    <span className="w-2 h-2 rounded-full bg-gray-200" />
                  </div>
                </div>
                <textarea
                  value={formData.rubrica?.nivel3 || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    rubrica: { ...formData.rubrica, nivel3: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                  rows={2}
                  placeholder="Aplica herramientas correctamente. Trabaja de forma autónoma."
                />
              </div>

              {/* Level 5 */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-600">Nivel 5 — Experto</span>
                  <div className="flex gap-0.5">
                    <span className="w-2 h-2 rounded-full bg-competent" />
                    <span className="w-2 h-2 rounded-full bg-competent" />
                    <span className="w-2 h-2 rounded-full bg-competent" />
                    <span className="w-2 h-2 rounded-full bg-competent" />
                    <span className="w-2 h-2 rounded-full bg-competent" />
                  </div>
                </div>
                <textarea
                  value={formData.rubrica?.nivel5 || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    rubrica: { ...formData.rubrica, nivel5: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                  rows={2}
                  placeholder="Referente en la materia. Entrena a otros."
                />
              </div>
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
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Category Accordion Component
function CategoryAccordion({ category, skills, onEditSkill, onAddSkill }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const categorySkills = skills.filter(s => s.categoria === category.id);

  return (
    <div className="bg-surface rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
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

      {/* Skills List */}
      {isExpanded && (
        <div className="border-t border-gray-100 animate-fade-in">
          {categorySkills.map(skill => (
            <div
              key={skill.id}
              className="flex items-center justify-between px-4 py-3 pl-12 hover:bg-gray-50 transition-colors group"
            >
              <span className="text-sm text-gray-700">• {skill.nombre}</span>
              <button
                onClick={() => onEditSkill(skill)}
                className="p-1 hover:bg-gray-100 rounded transition-colors opacity-0 group-hover:opacity-100"
              >
                <Edit3 size={14} className="text-gray-500" />
              </button>
            </div>
          ))}

          {/* Add Skill Button */}
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
export default function SkillsTab() {
  const [categories] = useState(CATEGORIES);
  const [skills, setSkills] = useState(SKILLS);
  const [editingSkill, setEditingSkill] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSkillCategory, setNewSkillCategory] = useState(null);

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

  const handleSaveSkill = (skillData) => {
    if (editingSkill) {
      // Update existing
      setSkills(skills.map(s => s.id === editingSkill.id ? { ...s, ...skillData } : s));
    } else {
      // Create new
      const newSkill = {
        ...skillData,
        id: `skill-${Date.now()}`,
        categoria: newSkillCategory || skillData.categoria
      };
      setSkills([...skills, newSkill]);
    }
  };

  const totalSkills = skills.length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          {categories.length} categorías • {totalSkills} skills totales
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
        {categories.map((category, index) => (
          <CategoryAccordion
            key={category.id}
            category={category}
            skills={skills}
            onEditSkill={handleEditSkill}
            onAddSkill={handleAddSkill}
          />
        ))}
      </div>

      {/* Edit/Create Modal */}
      <EditSkillModal
        skill={editingSkill}
        categories={categories}
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingSkill(null); setNewSkillCategory(null); }}
        onSave={handleSaveSkill}
      />
    </div>
  );
}
