import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import Button from '../common/Button';
import GapSuggestions from '../development/GapSuggestions';
import { API_BASE } from '../../lib/apiBase';

/**
 * GoalFormModal - Create or edit a development goal
 * Props:
 * - goal: existing goal (null for create)
 * - collaboratorId: for gap suggestions
 * - skills: available skills list (from parent, may be empty)
 * - onClose, onSubmit
 */
export default function GoalFormModal({ goal = null, collaboratorId, skills: propSkills = [], categories: propCategories = [], onClose, onSubmit }) {
  const isEdit = !!goal;
  const [saving, setSaving] = useState(false);
  const [fetchedSkills, setFetchedSkills] = useState([]);
  const [fetchedCategories, setFetchedCategories] = useState([]);

  // Fetch skills if not provided via props
  useEffect(() => {
    if (propSkills.length > 0) return;
    const fetchSkills = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/data`);
        if (!res.ok) return;
        const data = await res.json();
        setFetchedSkills(data.skills || []);
        setFetchedCategories(data.categories || []);
      } catch {
        // Non-critical
      }
    };
    fetchSkills();
  }, [propSkills.length]);

  // Use prop data if available, otherwise fetched
  const skills = propSkills.length > 0 ? propSkills : fetchedSkills;
  const categories = propCategories.length > 0 ? propCategories : fetchedCategories;

  // Group skills by category for the dropdown
  const groupedSkills = useMemo(() => {
    if (categories.length === 0) return null;
    const catMap = {};
    categories.forEach(c => { catMap[c.id] = c.nombre; });
    const groups = {};
    skills.forEach(s => {
      const catName = catMap[s.categoria] || 'Other';
      if (!groups[catName]) groups[catName] = [];
      groups[catName].push(s);
    });
    return Object.keys(groups).length > 0 ? groups : null;
  }, [skills, categories]);

  const [form, setForm] = useState({
    title: goal?.title || '',
    description: goal?.description || '',
    skillId: goal?.skillId || '',
    targetLevel: goal?.targetLevel || 4,
    priority: goal?.priority || 'medium',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSuggestion = (suggestion) => {
    setForm(prev => ({
      ...prev,
      title: suggestion.title || `Improve ${suggestion.skillName}`,
      skillId: suggestion.skillId || prev.skillId,
      targetLevel: suggestion.targetLevel || 4,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    const payload = {
      ...form,
      skillId: form.skillId ? parseInt(form.skillId, 10) : null,
      targetLevel: parseFloat(form.targetLevel),
    };
    await onSubmit(payload);
    setSaving(false);
  };

  const inputClass = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors';
  const selectClass = 'w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none cursor-pointer';
  const labelClass = 'block text-xs text-gray-400 uppercase tracking-wide mb-1';

  return createPortal(
    <div className="modal-overlay z-50 p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? 'Edit Goal' : 'Add Goal'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className={labelClass}>Title *</label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              className={inputClass}
              placeholder="e.g. Master React Testing"
              required
            />
          </div>

          <div>
            <label className={labelClass}>Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              className={inputClass}
              rows={2}
              placeholder="Optional description..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Linked Skill</label>
              <select name="skillId" value={form.skillId} onChange={handleChange} className={selectClass}>
                <option value="">None</option>
                {groupedSkills ? (
                  Object.entries(groupedSkills).map(([catName, catSkills]) => (
                    <optgroup key={catName} label={catName}>
                      {catSkills.map(s => (
                        <option key={s.id} value={s.id}>{s.nombre}</option>
                      ))}
                    </optgroup>
                  ))
                ) : (
                  skills.map(s => (
                    <option key={s.id} value={s.id}>{s.nombre}</option>
                  ))
                )}
              </select>
            </div>
            <div>
              <label className={labelClass}>Target Level</label>
              <select name="targetLevel" value={form.targetLevel} onChange={handleChange} className={selectClass}>
                {[1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map(n => (
                  <option key={n} value={n}>{n.toFixed(1)}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>Priority</label>
            <select name="priority" value={form.priority} onChange={handleChange} className={selectClass}>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Gap suggestions */}
          {!isEdit && (
            <GapSuggestions collaboratorId={collaboratorId} onSelect={handleSuggestion} />
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
            <Button type="submit" isLoading={saving} disabled={!form.title.trim()}>
              {isEdit ? 'Save Changes' : 'Add Goal'}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
