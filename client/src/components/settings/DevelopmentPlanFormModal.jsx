import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import Button from '../common/Button';
import CollaboratorSelect from './CollaboratorSelect.jsx';
import { API_BASE } from '../../lib/apiBase';

/**
 * PlanFormModal - Create or edit a development plan
 * Props:
 * - plan: existing plan object (null for create)
 * - onClose: close handler
 * - onSubmit: (formData) => Promise
 */
export default function PlanFormModal({ plan = null, onClose, onSubmit }) {
  const isEdit = !!plan;
  const [collaborators, setCollaborators] = useState([]);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: plan?.title || '',
    description: plan?.description || '',
    collaboratorId: plan?.collaboratorId || '',
    status: plan?.status || 'draft',
    startDate: plan?.startDate?.slice(0, 10) || '',
    endDate: plan?.endDate?.slice(0, 10) || '',
  });

  useEffect(() => {
    fetch(`${API_BASE}/api/collaborators`)
      .then(res => res.ok ? res.json() : [])
      .then(data => setCollaborators(data))
      .catch(() => {});
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.collaboratorId) return;
    setSaving(true);
    const payload = {
      ...form,
      collaboratorId: parseInt(form.collaboratorId, 10),
      startDate: form.startDate || null,
      endDate: form.endDate || null,
    };
    await onSubmit(payload);
    setSaving(false);
  };

  const inputClass = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors';
  const selectClass = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none cursor-pointer transition-colors';
  const labelClass = 'block text-xs text-gray-400 uppercase tracking-wide mb-1';

  return createPortal(
    <div className="modal-overlay z-50 p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? 'Edit Plan' : 'New Development Plan'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className={labelClass}>Title *</label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              className={inputClass}
              placeholder="e.g. Q2 Growth Plan"
              required
            />
          </div>

          <div>
            <label className={labelClass}>Collaborator *</label>
            <CollaboratorSelect
              collaborators={collaborators}
              value={form.collaboratorId ? parseInt(form.collaboratorId, 10) : null}
              onChange={(id) => setForm(prev => ({ ...prev, collaboratorId: id || '' }))}
              disabled={isEdit}
            />
          </div>

          <div>
            <label className={labelClass}>Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              className={inputClass}
              rows={3}
              placeholder="Optional plan description..."
            />
          </div>

          {isEdit && (
            <div>
              <label className={labelClass}>Status</label>
              <select name="status" value={form.status} onChange={handleChange} className={selectClass}>
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Start Date</label>
              <input type="date" name="startDate" value={form.startDate} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>End Date</label>
              <input type="date" name="endDate" value={form.endDate} onChange={handleChange} className={inputClass} />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
            <Button type="submit" isLoading={saving} disabled={!form.title.trim() || !form.collaboratorId}>
              {isEdit ? 'Save Changes' : 'Create Plan'}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
