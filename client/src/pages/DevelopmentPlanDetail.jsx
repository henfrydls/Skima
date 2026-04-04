import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Edit2, Trash2, Plus, Target, CheckCircle2, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, CardSkeleton } from '../components/common';
import ConfirmModal from '../components/common/ConfirmModal';
import { GoalAccordion } from '../components/development';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE } from '../lib/apiBase';
import PlanFormModal from './DevelopmentPlanFormModal';
import GoalFormModal from './DevelopmentGoalFormModal';
import ActionFormModal from './DevelopmentActionFormModal';

const STATUS_BADGES = {
  draft: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Draft' },
  active: { bg: 'bg-primary/10', text: 'text-primary', label: 'Active' },
  completed: { bg: 'bg-competent/10', text: 'text-competent', label: 'Completed' },
};

/**
 * DevelopmentPlanDetail - Full detail view for a single development plan
 * Shows progress, goals (accordion), and inline action management
 */
export default function DevelopmentPlanDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { authFetch } = useAuth();

  const [plan, setPlan] = useState(null);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals
  const [showEditPlan, setShowEditPlan] = useState(false);
  const [showDeletePlan, setShowDeletePlan] = useState(false);
  const [goalModal, setGoalModal] = useState(null); // null | { mode: 'create' } | { mode: 'edit', goal }
  const [actionModal, setActionModal] = useState(null); // null | { mode: 'create', goalId } | { mode: 'edit', action }
  const [deleteTarget, setDeleteTarget] = useState(null); // { type: 'goal'|'action', item }
  const [deleting, setDeleting] = useState(false);

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
    // Fetch skills for goal form
    fetch(`${API_BASE}/api/data`)
      .then(r => r.ok ? r.json() : { skills: [] })
      .then(d => setSkills(d.skills || []))
      .catch(() => {});
  }, [fetchPlan]);

  // --- Plan CRUD ---
  const handleUpdatePlan = async (formData) => {
    try {
      const res = await authFetch(`${API_BASE}/api/development-plans/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error('Failed to update');
      toast.success('Plan updated');
      setShowEditPlan(false);
      fetchPlan();
    } catch (err) {
      if (err.message !== 'SESSION_EXPIRED') toast.error('Failed to update plan');
    }
  };

  const handleDeletePlan = async () => {
    setDeleting(true);
    try {
      const res = await authFetch(`${API_BASE}/api/development-plans/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      toast.success('Plan deleted');
      navigate('/development');
    } catch (err) {
      if (err.message !== 'SESSION_EXPIRED') toast.error('Failed to delete plan');
    } finally {
      setDeleting(false);
    }
  };

  // --- Goal CRUD ---
  const handleCreateGoal = async (formData) => {
    try {
      const res = await authFetch(`${API_BASE}/api/development-plans/${id}/goals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error('Failed to create goal');
      toast.success('Goal added');
      setGoalModal(null);
      fetchPlan();
    } catch (err) {
      if (err.message !== 'SESSION_EXPIRED') toast.error('Failed to create goal');
    }
  };

  const handleUpdateGoal = async (formData) => {
    try {
      const goalId = goalModal.goal.id;
      const res = await authFetch(`${API_BASE}/api/development-goals/${goalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error('Failed to update goal');
      toast.success('Goal updated');
      setGoalModal(null);
      fetchPlan();
    } catch (err) {
      if (err.message !== 'SESSION_EXPIRED') toast.error('Failed to update goal');
    }
  };

  // --- Action CRUD ---
  const handleCreateAction = async (formData) => {
    try {
      const goalId = actionModal.goalId;
      const res = await authFetch(`${API_BASE}/api/development-goals/${goalId}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error('Failed to create action');
      toast.success('Action added');
      setActionModal(null);
      fetchPlan();
    } catch (err) {
      if (err.message !== 'SESSION_EXPIRED') toast.error('Failed to create action');
    }
  };

  const handleUpdateAction = (updatedAction) => {
    // Optimistic update in local state
    setPlan(prev => ({
      ...prev,
      goals: prev.goals.map(g => ({
        ...g,
        actions: g.actions.map(a => a.id === updatedAction.id ? updatedAction : a),
      })),
    }));
  };

  // --- Delete goal or action ---
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const { type, item } = deleteTarget;
      const endpoint = type === 'goal'
        ? `${API_BASE}/api/development-goals/${item.id}`
        : `${API_BASE}/api/development-actions/${item.id}`;
      const res = await authFetch(endpoint, { method: 'DELETE' });
      if (!res.ok) throw new Error(`Failed to delete ${type}`);
      toast.success(`${type === 'goal' ? 'Goal' : 'Action'} deleted`);
      setDeleteTarget(null);
      fetchPlan();
    } catch (err) {
      if (err.message !== 'SESSION_EXPIRED') toast.error('Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  // --- Computed progress ---
  const goals = plan?.goals || [];
  const totalActions = goals.reduce((sum, g) => sum + (g.actions?.length || 0), 0);
  const completedActions = goals.reduce(
    (sum, g) => sum + (g.actions?.filter(a => a.status === 'completed').length || 0), 0
  );
  const overallProgress = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;

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
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-light text-slate-800">{plan.title}</h1>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
              {status.label}
            </span>
          </div>
          {plan.collaborator && (
            <p className="text-sm text-gray-500">{plan.collaborator.name}</p>
          )}
          {plan.description && (
            <p className="text-sm text-gray-400 mt-1">{plan.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setShowEditPlan(true)}>
            <Edit2 size={14} className="mr-1" /> Edit
          </Button>
          <Button variant="danger" size="sm" onClick={() => setShowDeletePlan(true)}>
            <Trash2 size={14} className="mr-1" /> Delete
          </Button>
        </div>
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
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-gray-700">Goals</h2>
          <Button size="sm" onClick={() => setGoalModal({ mode: 'create' })}>
            <Plus size={14} className="mr-1" /> Add Goal
          </Button>
        </div>

        {goals.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-lg border border-dashed border-gray-200">
            <Target size={32} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm text-gray-400">No goals yet. Add one to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {goals.map(goal => (
              <GoalAccordion
                key={goal.id}
                goal={goal}
                onEdit={(g) => setGoalModal({ mode: 'edit', goal: g })}
                onDelete={(g) => setDeleteTarget({ type: 'goal', item: g })}
                onAddAction={(g) => setActionModal({ mode: 'create', goalId: g.id })}
                onUpdateAction={handleUpdateAction}
                onDeleteAction={(a) => setDeleteTarget({ type: 'action', item: a })}
              />
            ))}
          </div>
        )}
      </div>

      {/* --- Modals --- */}

      {/* Edit Plan */}
      {showEditPlan && (
        <PlanFormModal
          plan={plan}
          onClose={() => setShowEditPlan(false)}
          onSubmit={handleUpdatePlan}
        />
      )}

      {/* Delete Plan */}
      <ConfirmModal
        isOpen={showDeletePlan}
        onClose={() => setShowDeletePlan(false)}
        onConfirm={handleDeletePlan}
        title="Delete Plan"
        message="This will permanently delete this plan and all its goals and actions."
        confirmText="Delete"
        isLoading={deleting}
      />

      {/* Goal Form */}
      {goalModal && (
        <GoalFormModal
          goal={goalModal.mode === 'edit' ? goalModal.goal : null}
          collaboratorId={plan.collaboratorId}
          skills={skills}
          onClose={() => setGoalModal(null)}
          onSubmit={goalModal.mode === 'edit' ? handleUpdateGoal : handleCreateGoal}
        />
      )}

      {/* Action Form */}
      {actionModal && (
        <ActionFormModal
          action={actionModal.mode === 'edit' ? actionModal.action : null}
          onClose={() => setActionModal(null)}
          onSubmit={handleCreateAction}
        />
      )}

      {/* Delete Goal/Action */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title={`Delete ${deleteTarget?.type === 'goal' ? 'Goal' : 'Action'}`}
        message={
          deleteTarget?.type === 'goal'
            ? 'This will delete this goal and all its actions.'
            : 'This action will be permanently deleted.'
        }
        confirmText="Delete"
        isLoading={deleting}
      />
    </div>
  );
}
