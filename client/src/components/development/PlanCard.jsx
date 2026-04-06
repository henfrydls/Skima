import { useNavigate } from 'react-router-dom';
import { Target, Calendar, CheckCircle2 } from 'lucide-react';
import { PLAN_STATUS_BADGES } from '../../lib/developmentConstants';

/**
 * PlanCard - Card for development plan list
 * Shows status, title, collaborator, date range, goal count, progress
 */
export default function PlanCard({ plan }) {
  const navigate = useNavigate();

  const status = PLAN_STATUS_BADGES[plan.status] || PLAN_STATUS_BADGES.draft;
  const goals = plan.goals || [];
  const countableActions = goals.reduce((sum, g) => sum + (g.actions?.filter(a => a.status !== 'skipped').length || 0), 0);
  const completedActions = goals.reduce(
    (sum, g) => sum + (g.actions?.filter(a => a.status === 'completed').length || 0), 0
  );
  const progress = countableActions > 0 ? Math.round((completedActions / countableActions) * 100) : 0;

  const collaboratorName = plan.collaborator?.nombre || plan.collaborator?.name;

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  return (
    <div
      className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 cursor-pointer hover-lift transition-all duration-200"
      onClick={() => navigate(`/development/${plan.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/development/${plan.id}`); } }}
      aria-label={`View development plan: ${plan.title}`}
    >
      <div className="space-y-3">
        {/* Status badge */}
        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
          {status.label}
        </span>

        {/* Title */}
        <h3 className="font-medium text-lg text-gray-900 truncate">{plan.title}</h3>

        {/* Collaborator */}
        {collaboratorName && (
          <p className="text-sm text-gray-500">{collaboratorName}</p>
        )}

        {/* Date range / Completion date */}
        {plan.status === 'completed' && plan.completedAt ? (
          <p className="flex items-center gap-1.5 text-xs text-gray-400">
            <CheckCircle2 size={12} className="text-emerald-500" />
            {formatDate(plan.startDate)}{plan.startDate ? ' - ' : ''}{formatDate(plan.completedAt)}
          </p>
        ) : (plan.startDate || plan.endDate) ? (
          <p className="flex items-center gap-1.5 text-xs text-gray-400">
            <Calendar size={12} />
            {plan.startDate && plan.endDate
              ? `${formatDate(plan.startDate)} - ${formatDate(plan.endDate)}`
              : plan.startDate
                ? `Started ${formatDate(plan.startDate)}`
                : `Due ${formatDate(plan.endDate)}`
            }
          </p>
        ) : null}

        {/* Goal count */}
        <div className="flex items-center gap-1.5 text-sm text-gray-600">
          <Target size={14} />
          {goals.length} {goals.length === 1 ? 'goal' : 'goals'}
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
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
