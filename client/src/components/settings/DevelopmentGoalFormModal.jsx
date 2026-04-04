import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import Button from '../common/Button';
import GapSuggestions from '../development/GapSuggestions';

/**
 * GoalFormModal - Create or edit a development goal
 * Props:
 * - goal: existing goal (null for create)
 * - collaboratorId: for gap suggestions
 * - skills: available skills list
 * - onClose, onSubmit
 */
export default function GoalFormModal({ goal = null, collaboratorId, skills = [], onClose, onSubmit }) {
  const isEdit = !!goal;
  const [saving, setSaving] = useState(false);

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
      targetLevel: parseInt(form.targetLevel, 10),
    };
    await onSubmit(payload);
    setSaving(false);
  };

  const inputClass = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors';
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
              <select name="skillId" value={form.skillId} onChange={handleChange} className={inputClass}>
                <option value="">None</option>
                {skills.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Target Level</label>
              <select name="targetLevel" value={form.targetLevel} onChange={handleChange} className={inputClass}>
                {[1, 2, 3, 4, 5].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>Priority</label>
            <select name="priority" value={form.priority} onChange={handleChange} className={inputClass}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
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
