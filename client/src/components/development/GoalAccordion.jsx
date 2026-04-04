import { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Trash2, Edit2, Target } from 'lucide-react';
import ActionRow from './ActionRow';

const PRIORITY_COLORS = {
  high: 'bg-critical',
  medium: 'bg-warning',
  low: 'bg-gray-300',
};

/**
 * GoalAccordion - Expandable goal card with nested actions
 * Shows title, skill badge, priority, progress, and expandable action list
 * When readOnly=true, hides all edit/delete/add controls
 */
export default function GoalAccordion({ goal, onEdit, onDelete, onAddAction, onUpdateAction, onDeleteAction, readOnly = false }) {
  const [expanded, setExpanded] = useState(false);

  const actions = goal.actions || [];
  const completedActions = actions.filter(a => a.status === 'completed').length;
  const progress = actions.length > 0 ? (completedActions / actions.length) * 100 : 0;

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header - always visible */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Expand chevron */}
        <span className="text-gray-400 flex-shrink-0">
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </span>

        {/* Priority dot */}
        <span
          className={`w-2 h-2 rounded-full flex-shrink-0 ${PRIORITY_COLORS[goal.priority] || PRIORITY_COLORS.medium}`}
          title={`${goal.priority || 'medium'} priority`}
        />

        {/* Title */}
        <span className="font-medium text-sm text-gray-800 flex-1 truncate">
          {goal.title}
        </span>

        {/* Skill badge */}
        {goal.skill && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary font-medium">
            <Target size={10} />
            {goal.skill.name}
          </span>
        )}

        {/* Progress */}
        <span className="text-xs text-gray-400 flex-shrink-0 w-16 text-right">
          {completedActions}/{actions.length}
        </span>

        {/* Mini progress bar */}
        <div className="w-16 h-1.5 bg-gray-100 rounded-full flex-shrink-0 overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-gray-100 px-4 py-3">
          {/* Description */}
          {goal.description && (
            <p className="text-sm text-gray-500 mb-3">{goal.description}</p>
          )}

          {/* Goal actions (edit/delete) - hidden in read-only mode */}
          {!readOnly && (
            <div className="flex items-center gap-2 mb-3">
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(goal); }}
                className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-primary transition-colors"
              >
                <Edit2 size={12} /> Edit Goal
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(goal); }}
                className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-critical transition-colors"
              >
                <Trash2 size={12} /> Delete
              </button>
            </div>
          )}

          {/* Actions list */}
          {actions.length > 0 ? (
            <div className="space-y-1">
              {actions.map(action => (
                <ActionRow
                  key={action.id}
                  action={action}
                  onUpdate={onUpdateAction}
                  onDelete={onDeleteAction}
                  readOnly={readOnly}
                />
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 italic py-2">No actions yet</p>
          )}

          {/* Add action button - hidden in read-only mode */}
          {!readOnly && (
            <button
              onClick={(e) => { e.stopPropagation(); onAddAction(goal); }}
              className="mt-2 inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
            >
              <Plus size={14} /> Add Action
            </button>
          )}
        </div>
      )}
    </div>
  );
}
