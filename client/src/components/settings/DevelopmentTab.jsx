import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Target, ChevronDown, ChevronRight, Edit2, Trash2, Calendar, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE } from '../../lib/apiBase';
import Button from '../common/Button';
import EmptyState from '../common/EmptyState';
import ConfirmModal from '../common/ConfirmModal';
import LoginModal from '../auth/LoginModal';
import PlanFormModal from './DevelopmentPlanFormModal';
import GoalFormModal from './DevelopmentGoalFormModal';
import ActionFormModal from './DevelopmentActionFormModal';

const STATUS_BADGES = {
  draft: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200', label: 'Draft', bar: 'bg-gray-400' },
  active: { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/20', label: 'Active', bar: 'bg-primary' },
  completed: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Completed', bar: 'bg-emerald-500' },
  cancelled: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200', label: 'Cancelled', bar: 'bg-red-400' },
};

const PRIORITY_COLORS = {
  high: 'bg-critical',
  medium: 'bg-warning',
  low: 'bg-gray-300',
};

const ACTION_TYPE_BADGES = {
  experience: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Experience' },
  social: { bg: 'bg-purple-50', text: 'text-purple-700', label: 'Social' },
  formal: { bg: 'bg-green-50', text: 'text-green-700', label: 'Formal' },
  self_directed: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Self-directed' },
};

const ACTION_STATUS_OPTIONS = [
  { value: 'not_started', bg: 'bg-gray-100', text: 'text-gray-600', label: 'Not Started' },
  { value: 'in_progress', bg: 'bg-blue-50', text: 'text-blue-700', label: 'In Progress' },
  { value: 'completed', bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Completed' },
  { value: 'skipped', bg: 'bg-amber-50', text: 'text-amber-600', label: 'Skipped' },
];

const ACTION_STATUS_MAP = Object.fromEntries(ACTION_STATUS_OPTIONS.map(s => [s.value, s]));

/**
 * ActionStatusDropdown - Clickable status badge that opens a dropdown to change action status
 */
function ActionStatusDropdown({ action, onStatusChange }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);
  const dropdownRef = useRef(null);
  const current = ACTION_STATUS_MAP[action.status] || ACTION_STATUS_MAP.not_started;

  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      // Check both the button and the portal dropdown
      if (
        btnRef.current && !btnRef.current.contains(e.target) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    const handleKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const handleOpen = (e) => {
    e.stopPropagation();
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const dropdownHeight = 130;
      const spaceBelow = window.innerHeight - rect.bottom;
      if (spaceBelow < dropdownHeight) {
        setPos({ top: rect.top - dropdownHeight, left: rect.left });
      } else {
        setPos({ top: rect.bottom + 4, left: rect.left });
      }
    }
    setOpen(!open);
  };

  return (
    <div className="relative flex-shrink-0">
      <button
        ref={btnRef}
        type="button"
        onClick={handleOpen}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer transition-colors hover:ring-2 hover:ring-primary/20 ${current.bg} ${current.text}`}
        title="Change status"
      >
        {current.label}
        <ChevronDown size={10} />
      </button>
      {open && createPortal(
        <div
          ref={dropdownRef}
          className="fixed z-[9999] bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[130px]"
          style={{ top: pos.top, left: pos.left }}
        >
          {ACTION_STATUS_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                if (opt.value !== action.status) onStatusChange(action.id, opt.value);
              }}
              className={`w-full text-left px-3 py-1.5 text-xs font-medium transition-colors hover:bg-gray-50 ${opt.value === action.status ? `${opt.bg} ${opt.text}` : 'text-gray-600'}`}
            >
              {opt.label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}

/**
 * DevelopmentTab — Settings tab for IDP CRUD management
 *
 * Handles all creation, editing, and deletion of:
 * - Development Plans
 * - Development Goals (nested under plans)
 * - Development Actions (nested under goals)
 *
 * Follows the same pattern as CategoriesTab/EvaluationsTab.
 */
export default function DevelopmentTab({ isActive }) {
  const { authFetch } = useAuth();

  // Data
  const [plans, setPlans] = useState([]);
  const [skills, setSkills] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Expanded plan tracking
  const [expandedPlanId, setExpandedPlanId] = useState(null);
  const [expandedGoalId, setExpandedGoalId] = useState(null);

  // Auth modal
  const [showLogin, setShowLogin] = useState(false);

  // Plan modals
  const [planModal, setPlanModal] = useState(null); // null | { mode: 'create' } | { mode: 'edit', plan }
  const [deletePlanTarget, setDeletePlanTarget] = useState(null);

  // Goal modals
  const [goalModal, setGoalModal] = useState(null); // null | { mode: 'create', planId, collaboratorId } | { mode: 'edit', goal }
  const [deleteGoalTarget, setDeleteGoalTarget] = useState(null);

  // Action modals
  const [actionModal, setActionModal] = useState(null); // null | { mode: 'create', goalId } | { mode: 'edit', action }
  const [deleteActionTarget, setDeleteActionTarget] = useState(null);

  const [deleting, setDeleting] = useState(false);

  // --- Fetch ---
  const fetchPlans = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/development-plans`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      // Sort: active first, then cancelled, completed, draft last
      const statusOrder = { active: 0, cancelled: 1, completed: 2, draft: 3 };
      data.sort((a, b) => (statusOrder[a.status] ?? 1) - (statusOrder[b.status] ?? 1));
      setPlans(data);
    } catch {
      toast.error('Failed to load development plans');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSkills = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/data`);
      if (!res.ok) return;
      const data = await res.json();
      setSkills(data.skills || []);
      setCategories(data.categories || []);
    } catch {
      // Non-critical
    }
  }, []);

  useEffect(() => {
    if (isActive) {
      fetchPlans();
      fetchSkills();
    }
  }, [isActive, fetchPlans, fetchSkills]);

  // Refetch a single plan's detail (to get updated goals/actions)
  const refetchPlanDetail = async (planId) => {
    try {
      const res = await fetch(`${API_BASE}/api/development-plans/${planId}`);
      if (!res.ok) return;
      const detail = await res.json();
      setPlans(prev => prev.map(p => p.id === planId ? detail : p));
    } catch {
      // Fallback to full refetch
      fetchPlans();
    }
  };

  // --- Plan CRUD ---
  const handleCreatePlan = async (formData) => {
    try {
      const res = await authFetch(`${API_BASE}/api/development-plans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error('Failed to create plan');
      toast.success('Plan created');
      setPlanModal(null);
      fetchPlans();
    } catch (err) {
      if (err.message === 'SESSION_EXPIRED') {
        setShowLogin(true);
      } else {
        toast.error('Failed to create plan');
      }
    }
  };

  const handleUpdatePlan = async (formData) => {
    try {
      const planId = planModal.plan.id;
      const res = await authFetch(`${API_BASE}/api/development-plans/${planId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error('Failed to update');
      toast.success('Plan updated');
      setPlanModal(null);
      fetchPlans();
    } catch (err) {
      if (err.message === 'SESSION_EXPIRED') {
        setShowLogin(true);
      } else {
        toast.error('Failed to update plan');
      }
    }
  };

  const handleDeletePlan = async () => {
    if (!deletePlanTarget) return;
    setDeleting(true);
    try {
      const res = await authFetch(`${API_BASE}/api/development-plans/${deletePlanTarget.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      toast.success('Plan deleted');
      setDeletePlanTarget(null);
      if (expandedPlanId === deletePlanTarget.id) setExpandedPlanId(null);
      fetchPlans();
    } catch (err) {
      if (err.message === 'SESSION_EXPIRED') {
        setShowLogin(true);
      } else {
        toast.error('Failed to delete plan');
      }
    } finally {
      setDeleting(false);
    }
  };

  // --- Goal CRUD ---
  const handleCreateGoal = async (formData) => {
    try {
      const { planId } = goalModal;
      const res = await authFetch(`${API_BASE}/api/development-plans/${planId}/goals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error('Failed to create goal');
      toast.success('Goal added');
      setGoalModal(null);
      refetchPlanDetail(planId);
    } catch (err) {
      if (err.message === 'SESSION_EXPIRED') {
        setShowLogin(true);
      } else {
        toast.error('Failed to create goal');
      }
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
      if (expandedPlanId) refetchPlanDetail(expandedPlanId);
    } catch (err) {
      if (err.message === 'SESSION_EXPIRED') {
        setShowLogin(true);
      } else {
        toast.error('Failed to update goal');
      }
    }
  };

  const handleDeleteGoal = async () => {
    if (!deleteGoalTarget) return;
    setDeleting(true);
    try {
      const res = await authFetch(`${API_BASE}/api/development-goals/${deleteGoalTarget.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      toast.success('Goal deleted');
      setDeleteGoalTarget(null);
      if (expandedPlanId) refetchPlanDetail(expandedPlanId);
    } catch (err) {
      if (err.message === 'SESSION_EXPIRED') {
        setShowLogin(true);
      } else {
        toast.error('Failed to delete goal');
      }
    } finally {
      setDeleting(false);
    }
  };

  // --- Action CRUD ---
  const handleCreateAction = async (formData) => {
    try {
      const { goalId } = actionModal;
      const res = await authFetch(`${API_BASE}/api/development-goals/${goalId}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error('Failed to create action');
      toast.success('Action added');
      setActionModal(null);
      if (expandedPlanId) refetchPlanDetail(expandedPlanId);
    } catch (err) {
      if (err.message === 'SESSION_EXPIRED') {
        setShowLogin(true);
      } else {
        toast.error('Failed to create action');
      }
    }
  };

  const handleUpdateAction = async (updatedAction) => {
    // Optimistic update from ActionRow toggle
    setPlans(prev => prev.map(p => ({
      ...p,
      goals: (p.goals || []).map(g => ({
        ...g,
        actions: (g.actions || []).map(a => a.id === updatedAction.id ? updatedAction : a),
      })),
    })));
  };

  const handleActionStatusChange = async (actionId, newStatus) => {
    try {
      const res = await authFetch(`${API_BASE}/api/development-actions/${actionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      const updated = await res.json();
      // Optimistic update in place
      setPlans(prev => prev.map(p => ({
        ...p,
        goals: (p.goals || []).map(g => ({
          ...g,
          actions: (g.actions || []).map(a => a.id === actionId ? updated : a),
        })),
      })));
      toast.success(`Status changed to ${ACTION_STATUS_MAP[newStatus]?.label || newStatus}`);
    } catch (err) {
      if (err.message === 'SESSION_EXPIRED') {
        setShowLogin(true);
      } else {
        toast.error('Failed to update action status');
        // Refetch to restore correct state
        if (expandedPlanId) refetchPlanDetail(expandedPlanId);
      }
    }
  };

  const handleDeleteAction = async () => {
    if (!deleteActionTarget) return;
    setDeleting(true);
    try {
      const res = await authFetch(`${API_BASE}/api/development-actions/${deleteActionTarget.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      toast.success('Action deleted');
      setDeleteActionTarget(null);
      if (expandedPlanId) refetchPlanDetail(expandedPlanId);
    } catch (err) {
      if (err.message === 'SESSION_EXPIRED') {
        setShowLogin(true);
      } else {
        toast.error('Failed to delete action');
      }
    } finally {
      setDeleting(false);
    }
  };

  // --- Completion prompts ---
  const handleCompleteGoal = async (goalId) => {
    try {
      const res = await authFetch(`${API_BASE}/api/development-goals/${goalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      });
      if (!res.ok) throw new Error('Failed');
      toast.success('Goal marked as completed!');
      if (expandedPlanId) refetchPlanDetail(expandedPlanId);
    } catch (err) {
      if (err.message === 'SESSION_EXPIRED') setShowLogin(true);
      else toast.error('Failed to complete goal');
    }
  };

  const handleCompletePlan = async (planId) => {
    try {
      const res = await authFetch(`${API_BASE}/api/development-plans/${planId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      });
      if (!res.ok) throw new Error('Failed');
      toast.success('Plan marked as completed!');
      fetchPlans();
    } catch (err) {
      if (err.message === 'SESSION_EXPIRED') setShowLogin(true);
      else toast.error('Failed to complete plan');
    }
  };

  // --- Helpers ---
  const getPlanProgress = (plan) => {
    const goals = plan.goals || [];
    const countableActions = goals.reduce((sum, g) => sum + (g.actions?.filter(a => a.status !== 'skipped').length || 0), 0);
    const completedActions = goals.reduce(
      (sum, g) => sum + (g.actions?.filter(a => a.status === 'completed').length || 0), 0
    );
    return countableActions > 0 ? Math.round((completedActions / countableActions) * 100) : 0;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // --- Loading ---
  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-gray-200 rounded" />
              <div className="h-5 bg-gray-200 rounded-full w-14" />
              <div className="flex-1 h-4 bg-gray-200 rounded w-48" />
              <div className="h-3 bg-gray-100 rounded w-16" />
              <div className="w-20 h-2 bg-gray-100 rounded-full" />
              <div className="h-3 bg-gray-100 rounded w-8" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with Create button */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {plans.length} {plans.length === 1 ? 'plan' : 'plans'}
        </p>
        <Button onClick={() => setPlanModal({ mode: 'create' })}>
          <Plus size={18} className="mr-1.5" /> New Plan
        </Button>
      </div>

      {/* Plans list */}
      {plans.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No development plans"
          description="Create your first plan to start growing your team."
          actionLabel="Create Plan"
          onAction={() => setPlanModal({ mode: 'create' })}
        />
      ) : (
        <div className="space-y-3">
          {plans.map(plan => {
            const isExpanded = expandedPlanId === plan.id;
            const status = STATUS_BADGES[plan.status] || STATUS_BADGES.draft;
            const progress = getPlanProgress(plan);
            const goals = plan.goals || [];

            return (
              <div key={plan.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                {/* Plan row */}
                <div
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedPlanId(isExpanded ? null : plan.id)}
                  role="button"
                  tabIndex={0}
                  aria-expanded={isExpanded}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpandedPlanId(isExpanded ? null : plan.id); } }}
                >
                  <span className="text-gray-400 flex-shrink-0">
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </span>

                  {/* Status badge */}
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${status.bg} ${status.text}`}>
                    {status.label}
                  </span>

                  {/* Title + Collaborator */}
                  <div className="flex-1 min-w-0 flex items-center gap-2">
                    <span className="font-medium text-sm text-gray-800 truncate">{plan.title}</span>
                    {plan.collaborator && (
                      <>
                        <span className="text-gray-300">&bull;</span>
                        <span className="text-sm text-gray-500 truncate">{plan.collaborator.nombre}</span>
                      </>
                    )}
                  </div>

                  {/* Goals count */}
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {goals.length} {goals.length === 1 ? 'goal' : 'goals'}
                  </span>

                  {/* Progress bar */}
                  <div className="w-20 h-2 bg-gray-100 rounded-full flex-shrink-0 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${status.bar}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 w-8 text-right flex-shrink-0">{progress}%</span>

                  {/* Edit / Delete buttons */}
                  <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setPlanModal({ mode: 'edit', plan })}
                      className="p-1.5 text-gray-400 hover:text-primary rounded transition-colors"
                      title="Edit plan"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => setDeletePlanTarget(plan)}
                      className="p-1.5 text-gray-400 hover:text-critical rounded transition-colors"
                      title="Delete plan"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Expanded: Goals */}
                {isExpanded && (
                  <div className="border-t border-gray-100 px-4 py-4 bg-gray-50/50 animate-expand">
                    {/* Plan details */}
                    <div className="flex flex-wrap gap-4 text-xs text-gray-400 mb-4">
                      {plan.collaborator && (
                        <span className="text-sm text-gray-600 w-full mb-1 font-medium">
                          Collaborator: {plan.collaborator.nombre}{plan.collaborator.rol ? ` (${plan.collaborator.rol})` : ''}
                        </span>
                      )}
                      {plan.description && (
                        <p className="text-sm text-gray-500 w-full mb-1">{plan.description}</p>
                      )}
                      {plan.status === 'completed' && plan.completedAt ? (
                        <span className="flex items-center gap-1">
                          <CheckCircle2 size={12} className="text-emerald-500" />
                          {formatDate(plan.startDate)}{plan.startDate ? ' - ' : ''}{formatDate(plan.completedAt)}
                        </span>
                      ) : (plan.startDate || plan.endDate) ? (
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {plan.startDate && plan.endDate
                            ? `${formatDate(plan.startDate)} - ${formatDate(plan.endDate)}`
                            : plan.startDate
                              ? `Started ${formatDate(plan.startDate)}`
                              : `Due ${formatDate(plan.endDate)}`
                          }
                        </span>
                      ) : null}
                    </div>

                    {/* Goals header */}
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Goals</h3>
                      <Button
                        size="sm"
                        onClick={() => setGoalModal({ mode: 'create', planId: plan.id, collaboratorId: plan.collaboratorId })}
                      >
                        <Plus size={14} className="mr-1" /> Add Goal
                      </Button>
                    </div>

                    {goals.length === 0 ? (
                      <div className="text-center py-6 bg-white rounded-lg border border-dashed border-gray-200">
                        <Target size={24} className="mx-auto text-gray-300 mb-2" />
                        <p className="text-xs text-gray-400">No goals yet. Add one to get started.</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {goals.map(goal => {
                          const isGoalExpanded = expandedGoalId === goal.id;
                          const actions = goal.actions || [];
                          const countableActions = actions.filter(a => a.status !== 'skipped');
                          const completedActions = countableActions.filter(a => a.status === 'completed').length;
                          const goalProgress = countableActions.length > 0 ? Math.round((completedActions / countableActions.length) * 100) : 0;
                          const priorityColor = PRIORITY_COLORS[goal.priority] || PRIORITY_COLORS.medium;

                          return (
                            <div key={goal.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                              {/* Goal row */}
                              <div
                                className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-gray-50 transition-colors"
                                onClick={() => setExpandedGoalId(isGoalExpanded ? null : goal.id)}
                                role="button"
                                tabIndex={0}
                                aria-expanded={isGoalExpanded}
                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpandedGoalId(isGoalExpanded ? null : goal.id); } }}
                              >
                                <span className="text-gray-400 flex-shrink-0">
                                  {isGoalExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                </span>

                                {/* Priority dot */}
                                <span
                                  className={`w-2 h-2 rounded-full flex-shrink-0 ${priorityColor}`}
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
                                    {goal.skill.nombre}
                                  </span>
                                )}

                                {/* Progress */}
                                <span className="text-xs text-gray-400 flex-shrink-0">
                                  {completedActions}/{countableActions.length}
                                </span>

                                <div className="w-12 h-2 bg-gray-100 rounded-full flex-shrink-0 overflow-hidden">
                                  <div
                                    className="h-full bg-primary rounded-full transition-all duration-300"
                                    style={{ width: `${goalProgress}%` }}
                                  />
                                </div>

                                {/* Completion date */}
                                {goal.completedAt && (
                                  <span className="flex items-center gap-1 text-xs text-gray-400 flex-shrink-0">
                                    <CheckCircle2 size={12} className="text-emerald-500" />
                                    {formatDate(goal.completedAt)}
                                  </span>
                                )}

                                {/* Edit / Delete */}
                                <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    onClick={() => setGoalModal({ mode: 'edit', goal })}
                                    className="p-1 text-gray-400 hover:text-primary rounded transition-colors"
                                    title="Edit goal"
                                  >
                                    <Edit2 size={12} />
                                  </button>
                                  <button
                                    onClick={() => setDeleteGoalTarget(goal)}
                                    className="p-1 text-gray-400 hover:text-critical rounded transition-colors"
                                    title="Delete goal"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>

                              {/* Expanded: Actions */}
                              {isGoalExpanded && (
                                <div className="border-t border-gray-100 px-3 py-3 animate-expand">
                                  {goal.description && (
                                    <p className="text-sm text-gray-500 mb-3">{goal.description}</p>
                                  )}

                                  {/* Actions header */}
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Actions</span>
                                    <button
                                      onClick={() => setActionModal({ mode: 'create', goalId: goal.id })}
                                      className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                                    >
                                      <Plus size={14} /> Add Action
                                    </button>
                                  </div>

                                  {actions.length === 0 ? (
                                    <p className="text-xs text-gray-400 italic py-2">No actions yet</p>
                                  ) : (
                                    <div className="space-y-1">
                                      {actions.map(action => {
                                        const isCompleted = action.status === 'completed';
                                        const typeConfig = ACTION_TYPE_BADGES[action.type] || ACTION_TYPE_BADGES.experience;

                                        return (
                                          <div
                                            key={action.id}
                                            className="flex items-center gap-3 py-2 px-3 rounded-lg group hover:bg-gray-50 transition-colors"
                                          >
                                            {/* Status dropdown */}
                                            <ActionStatusDropdown
                                              action={action}
                                              onStatusChange={handleActionStatusChange}
                                            />

                                            {/* Type badge */}
                                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${typeConfig.bg} ${typeConfig.text}`}>
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

                                            {/* Delete */}
                                            <button
                                              onClick={() => setDeleteActionTarget(action)}
                                              className="flex-shrink-0 text-gray-300 hover:text-critical transition-colors opacity-0 group-hover:opacity-100"
                                              title="Delete action"
                                            >
                                              <Trash2 size={14} />
                                            </button>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}

                                  {/* Goal completion prompt */}
                                  {actions.length > 0
                                    && actions.every(a => a.status === 'completed' || a.status === 'skipped')
                                    && goal.status !== 'completed'
                                    && goal.status !== 'cancelled'
                                    && (
                                    <div className="mt-3 mx-3 mb-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between">
                                      <span className="text-sm text-emerald-700 flex items-center gap-2">
                                        <CheckCircle2 size={16} />
                                        All actions completed! Mark this goal as completed?
                                      </span>
                                      <button
                                        onClick={() => handleCompleteGoal(goal.id)}
                                        className="px-3 py-1 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 transition-colors"
                                      >
                                        Complete Goal
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Plan completion prompt */}
                    {goals.length > 0
                      && goals.every(g => g.status === 'completed' || g.status === 'cancelled')
                      && plan.status !== 'completed'
                      && plan.status !== 'cancelled'
                      && (
                      <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between">
                        <span className="text-sm text-emerald-700 flex items-center gap-2">
                          <CheckCircle2 size={18} />
                          All goals completed! Mark this plan as completed?
                        </span>
                        <button
                          onClick={() => handleCompletePlan(plan.id)}
                          className="px-4 py-1.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
                        >
                          Complete Plan
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* --- Modals --- */}

      {/* Plan Form */}
      {planModal && (
        <PlanFormModal
          plan={planModal.mode === 'edit' ? planModal.plan : null}
          onClose={() => setPlanModal(null)}
          onSubmit={planModal.mode === 'edit' ? handleUpdatePlan : handleCreatePlan}
        />
      )}

      {/* Delete Plan */}
      <ConfirmModal
        isOpen={!!deletePlanTarget}
        onClose={() => setDeletePlanTarget(null)}
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
          collaboratorId={goalModal.collaboratorId || goalModal.goal?.plan?.collaboratorId}
          skills={skills}
          categories={categories}
          onClose={() => setGoalModal(null)}
          onSubmit={goalModal.mode === 'edit' ? handleUpdateGoal : handleCreateGoal}
        />
      )}

      {/* Delete Goal */}
      <ConfirmModal
        isOpen={!!deleteGoalTarget}
        onClose={() => setDeleteGoalTarget(null)}
        onConfirm={handleDeleteGoal}
        title="Delete Goal"
        message="This will delete this goal and all its actions."
        confirmText="Delete"
        isLoading={deleting}
      />

      {/* Action Form */}
      {actionModal && (
        <ActionFormModal
          action={actionModal.mode === 'edit' ? actionModal.action : null}
          onClose={() => setActionModal(null)}
          onSubmit={handleCreateAction}
        />
      )}

      {/* Delete Action */}
      <ConfirmModal
        isOpen={!!deleteActionTarget}
        onClose={() => setDeleteActionTarget(null)}
        onConfirm={handleDeleteAction}
        title="Delete Action"
        message="This action will be permanently deleted."
        confirmText="Delete"
        isLoading={deleting}
      />

      {/* Login modal for auth errors */}
      {showLogin && (
        <LoginModal onClose={() => setShowLogin(false)} onSuccess={() => setShowLogin(false)} />
      )}
    </div>
  );
}
