import { useState } from 'react';
import { Check, Square, Briefcase, Users, GraduationCap, BookOpen, Calendar, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE } from '../../lib/apiBase';

const ACTION_TYPES = {
  experience: { label: 'Experience', bg: 'bg-blue-50', text: 'text-blue-700', icon: Briefcase },
  social: { label: 'Social', bg: 'bg-purple-50', text: 'text-purple-700', icon: Users },
  formal: { label: 'Formal', bg: 'bg-green-50', text: 'text-green-700', icon: GraduationCap },
  self_directed: { label: 'Self-directed', bg: 'bg-amber-50', text: 'text-amber-700', icon: BookOpen },
};

/**
 * ActionRow - Single action item with checkbox toggle
 * Displays action type badge, title, due date, and delete button
 * When readOnly=true, hides checkbox toggle and delete button
 */
export default function ActionRow({ action, onUpdate, onDelete, readOnly = false }) {
  const { authFetch } = useAuth();
  const [toggling, setToggling] = useState(false);

  const isCompleted = action.status === 'completed';
  const typeConfig = ACTION_TYPES[action.actionType] || ACTION_TYPES.experience;
  const TypeIcon = typeConfig.icon;

  const handleToggle = async () => {
    if (readOnly) return;
    if (toggling) return;
    setToggling(true);
    try {
      const newStatus = isCompleted ? 'not_started' : 'completed';
      const res = await authFetch(`${API_BASE}/api/development-actions/${action.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update action');
      const updated = await res.json();
      onUpdate(updated);
    } catch (err) {
      if (err.message !== 'SESSION_EXPIRED') {
        toast.error('Failed to update action');
      }
    } finally {
      setToggling(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex items-center gap-3 py-2 px-3 rounded-lg group hover:bg-gray-50 transition-colors">
      {/* Checkbox - interactive in edit mode, static indicator in read-only */}
      {readOnly ? (
        <span className="flex-shrink-0">
          {isCompleted ? (
            <Check size={18} className="text-competent" />
          ) : (
            <Square size={18} className="text-gray-300" />
          )}
        </span>
      ) : (
        <button
          onClick={handleToggle}
          disabled={toggling}
          aria-label={`Mark "${action.title}" as ${action.status === 'completed' ? 'incomplete' : 'complete'}`}
          className="flex-shrink-0 text-gray-400 hover:text-primary transition-colors disabled:opacity-50"
        >
          {isCompleted ? (
            <Check size={18} className="text-competent" />
          ) : (
            <Square size={18} />
          )}
        </button>
      )}

      {/* Type badge */}
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${typeConfig.bg} ${typeConfig.text}`}>
        <TypeIcon size={12} />
        {typeConfig.label}
      </span>

      {/* Title + inline completion date */}
      <span className={`flex-1 text-sm ${isCompleted ? 'line-through text-gray-500' : 'text-gray-700'}`}>
        {action.title}
        {isCompleted && action.completedAt && (
          <span className="no-underline inline-flex items-center ml-2 text-xs text-gray-400 font-normal" style={{ textDecoration: 'none' }}>
            &middot; {formatDate(action.completedAt)}
          </span>
        )}
      </span>

      {/* Due date for non-completed actions */}
      {!isCompleted && action.dueDate && (
        <span className="flex items-center gap-1 text-xs text-gray-400">
          <Calendar size={12} />
          {formatDate(action.dueDate)}
        </span>
      )}

      {/* Delete - hidden in read-only mode */}
      {!readOnly && (
        <button
          onClick={() => onDelete(action)}
          className="flex-shrink-0 text-gray-300 hover:text-critical transition-colors opacity-0 group-hover:opacity-100"
          title="Delete action"
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
}
