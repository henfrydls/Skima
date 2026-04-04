import { useNavigate } from 'react-router-dom';
import { Target, Calendar } from 'lucide-react';

const STATUS_BADGES = {
  draft: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Draft', bar: 'bg-gray-400' },
  active: { bg: 'bg-[#2d676e]/10', text: 'text-[#2d676e]', label: 'Active', bar: 'bg-[#2d676e]' },
  completed: { bg: 'bg-emerald-50', text: 'text-emerald-600', label: 'Completed', bar: 'bg-emerald-500' },
};

/**
 * PlanCard - Card for development plan list
 * Shows status, title, collaborator, date range, goal count, progress
 */
export default function PlanCard({ plan }) {
  const navigate = useNavigate();

  const status = STATUS_BADGES[plan.status] || STATUS_BADGES.draft;
  const goals = plan.goals || [];
  const totalActions = goals.reduce((sum, g) => sum + (g.actions?.length || 0), 0);
  const completedActions = goals.reduce(
    (sum, g) => sum + (g.actions?.filter(a => a.status === 'completed').length || 0), 0
  );
  const progress = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;

  const collaboratorName = plan.collaborator?.nombre || plan.collaborator?.name;

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  return (
    <div
      className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
      onClick={() => navigate(`/development/${plan.id}`)}
    >
      <div className="space-y-3">
        {/* Status badge */}
        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
          {status.label}
        </span>

        {/* Title */}
        <h3 className="font-semibold text-lg text-gray-900 truncate">{plan.title}</h3>

        {/* Collaborator */}
        {collaboratorName && (
          <p className="text-sm text-gray-500">{collaboratorName}</p>
        )}

        {/* Date range */}
        {(plan.startDate || plan.endDate) && (
          <p className="flex items-center gap-1.5 text-xs text-gray-400">
            <Calendar size={12} />
            {formatDate(plan.startDate)}{plan.endDate ? ` - ${formatDate(plan.endDate)}` : ''}
          </p>
        )}

        {/* Goal count */}
        <div className="flex items-center gap-1.5 text-sm text-gray-600">
          <Target size={14} />
          {goals.length} {goals.length === 1 ? 'goal' : 'goals'}
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${status.bar}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs font-medium text-gray-500 tabular-nums">{progress}%</span>
        </div>
      </div>
    </div>
  );
}
