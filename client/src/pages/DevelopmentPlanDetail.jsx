import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Target, CheckCircle2, Clock, Calendar } from 'lucide-react';
import { CardSkeleton } from '../components/common';
import { GoalAccordion } from '../components/development';
import { API_BASE } from '../lib/apiBase';

const STATUS_BADGES = {
  draft: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200', label: 'Draft' },
  active: { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/20', label: 'Active' },
  completed: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Completed' },
  cancelled: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200', label: 'Cancelled' },
};

/**
 * DevelopmentPlanDetail - Read-only detail view for a single development plan
 * Shows progress, goals (accordion), and actions.
 * All CRUD operations are handled in Settings > Development tab.
 */
export default function DevelopmentPlanDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPlan = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/development-plans/${id}`);
      if (!res.ok) throw new Error('Plan not found');
      const data = await res.json();
      setPlan(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  // --- Computed progress ---
  const goals = plan?.goals || [];
  const totalActions = goals.reduce((sum, g) => sum + (g.actions?.length || 0), 0);
  const completedActions = goals.reduce(
    (sum, g) => sum + (g.actions?.filter(a => a.status === 'completed').length || 0), 0
  );
  const overallProgress = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const daysRemaining = plan?.endDate
    ? Math.max(0, Math.ceil((new Date(plan.endDate) - new Date()) / (1000 * 60 * 60 * 24)))
    : null;

  // --- Loading / Error ---
  if (loading) {
    return (
      <div className="min-h-full bg-gray-50 -m-6 p-6 space-y-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-32" />
        <div className="h-8 bg-gray-200 rounded w-64" />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="min-h-full bg-gray-50 -m-6 p-6 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-medium text-slate-800 mb-2">Plan not found</h2>
          <button onClick={() => navigate('/development')} className="text-primary hover:underline text-sm">
            Back to Development Plans
          </button>
        </div>
      </div>
    );
  }

  const status = STATUS_BADGES[plan.status] || STATUS_BADGES.draft;

  return (
    <div className="min-h-full bg-gray-50 -m-6 p-6 space-y-6 animate-fade-in">
      {/* Back link */}
      <button
        onClick={() => navigate('/development')}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary transition-colors"
      >
        <ChevronLeft size={16} /> Development
      </button>

      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-light text-slate-800">{plan.title}</h1>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
            {status.label}
          </span>
        </div>
        {plan.collaborator && (
          <p className="text-sm text-gray-500">{plan.collaborator.nombre || plan.collaborator.name}</p>
        )}
        {plan.description && (
          <p className="text-sm text-gray-400 mt-1">{plan.description}</p>
        )}
        {/* Date info */}
        {plan.status === 'completed' && plan.completedAt ? (
          <p className="flex items-center gap-1.5 text-xs text-gray-400 mt-2">
            <CheckCircle2 size={14} className="text-emerald-500" />
            {formatDate(plan.startDate)}{plan.startDate ? ' - ' : ''}{formatDate(plan.completedAt)}
          </p>
        ) : (plan.startDate || plan.endDate) ? (
          <p className="flex items-center gap-1.5 text-xs text-gray-400 mt-2">
            <Calendar size={14} />
            {plan.startDate && plan.endDate
              ? `${formatDate(plan.startDate)} - ${formatDate(plan.endDate)}`
              : plan.startDate
                ? `Started ${formatDate(plan.startDate)}`
                : `Due ${formatDate(plan.endDate)}`
            }
          </p>
        ) : null}
      </div>

      {/* Progress section */}
      <div className="bg-white rounded-lg shadow-sm p-5">
        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 uppercase tracking-wide">Overall Progress</span>
            <span className="text-sm font-medium text-gray-700">{overallProgress}%</span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <Target size={16} className="text-primary" />
            <div>
              <p className="text-sm font-medium text-gray-700">
                {goals.filter(g => g.actions?.every(a => a.status === 'completed') && g.actions?.length > 0).length}/{goals.length}
              </p>
              <p className="text-xs text-gray-400">Goals</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-competent" />
            <div>
              <p className="text-sm font-medium text-gray-700">{completedActions}/{totalActions}</p>
              <p className="text-xs text-gray-400">Actions</p>
            </div>
          </div>
          {daysRemaining !== null && (
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-amber-500" />
              <div>
                <p className="text-sm font-medium text-gray-700">{daysRemaining}</p>
                <p className="text-xs text-gray-400">Days left</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Goals section */}
      <div>
        <h2 className="text-sm font-medium text-gray-700 mb-3">Goals</h2>

        {goals.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-lg border border-dashed border-gray-200">
            <Target size={32} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm text-gray-400">No goals yet. Add goals in Settings &rarr; Development.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {goals.map(goal => (
              <GoalAccordion
                key={goal.id}
                goal={goal}
                readOnly
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
