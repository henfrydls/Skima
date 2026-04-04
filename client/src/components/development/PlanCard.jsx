import { useNavigate } from 'react-router-dom';
import { Target, Calendar } from 'lucide-react';
import Card from '../common/Card';

const STATUS_BADGES = {
  draft: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Draft' },
  active: { bg: 'bg-primary/10', text: 'text-primary', label: 'Active' },
  completed: { bg: 'bg-competent/10', text: 'text-competent', label: 'Completed' },
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
  const progress = totalActions > 0 ? (completedActions / totalActions) * 100 : 0;

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow duration-200"
      onClick={() => navigate(`/development/${plan.id}`)}
    >
      <div className="space-y-3">
        {/* Status badge */}
        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
          {status.label}
        </span>

        {/* Title */}
        <h3 className="font-semibold text-gray-800 truncate">{plan.title}</h3>

        {/* Collaborator */}
        {plan.collaborator && (
          <p className="text-sm text-gray-500">{plan.collaborator.name}</p>
        )}

        {/* Date range */}
        {(plan.startDate || plan.endDate) && (
          <p className="flex items-center gap-1 text-xs text-gray-400">
            <Calendar size={12} />
            {formatDate(plan.startDate)} {plan.endDate ? `- ${formatDate(plan.endDate)}` : ''}
          </p>
        )}

        {/* Goal count */}
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Target size={12} />
          {goals.length} {goals.length === 1 ? 'goal' : 'goals'}
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </Card>
  );
}
