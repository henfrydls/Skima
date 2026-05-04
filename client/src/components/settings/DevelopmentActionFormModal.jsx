import { useState } from 'react';
import useFocusTrap from '../../hooks/useFocusTrap';
import { createPortal } from 'react-dom';
import { X, Briefcase, Users, GraduationCap, BookOpen } from 'lucide-react';
import Button from '../common/Button';

const ACTION_TYPES = [
  { id: 'experience', label: 'Experience (70%)', icon: Briefcase, desc: 'On-the-job learning' },
  { id: 'social', label: 'Social (20%)', icon: Users, desc: 'Mentoring, coaching, feedback' },
  { id: 'formal', label: 'Formal (10%)', icon: GraduationCap, desc: 'Courses, certifications' },
  { id: 'self_directed', label: 'Self-directed', icon: BookOpen, desc: 'Reading, practice' },
];

/**
 * ActionFormModal - Create or edit a development action
 */
export default function ActionFormModal({ action = null, onClose, onSubmit }) {
  const isEdit = !!action;
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: action?.title || '',
    actionType: action?.actionType || 'experience',
    description: action?.description || '',
    dueDate: action?.dueDate?.slice(0, 10) || '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    const payload = {
      ...form,
      dueDate: form.dueDate || null,
    };
    await onSubmit(payload);
    setSaving(false);
  };

  useFocusTrap();

  const inputClass = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors';
  const labelClass = 'block text-xs text-gray-400 uppercase tracking-wide mb-1';

  return createPortal(
    <div className="modal-overlay z-50 p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 id="modal-title" className="text-lg font-semibold text-gray-900">
            {isEdit ? 'Edit Action' : 'Add Action'}
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
              placeholder="e.g. Complete React Testing course"
              required
            />
          </div>

          {/* Type selector */}
          <div>
            <label className={labelClass}>Type</label>
            <div className="grid grid-cols-2 gap-2">
              {ACTION_TYPES.map(t => {
                const Icon = t.icon;
                const selected = form.actionType === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, actionType: t.id }))}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm text-left transition-colors ${
                      selected
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon size={14} />
                    <div>
                      <div className="font-medium text-xs">{t.label}</div>
                      <div className="text-xs text-gray-400">{t.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className={labelClass}>Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              className={inputClass}
              rows={2}
              placeholder="Optional details..."
            />
          </div>

          <div>
            <label className={labelClass}>Due Date</label>
            <input type="date" name="dueDate" value={form.dueDate} onChange={handleChange} className={inputClass} />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
            <Button type="submit" isLoading={saving} disabled={!form.title.trim()}>
              {isEdit ? 'Save Changes' : 'Add Action'}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
