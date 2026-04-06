/**
 * Shared constants for the Development Plans feature.
 * Used by PlanCard, DevelopmentPlanDetail, DevelopmentTab, etc.
 */

export const PLAN_STATUS_BADGES = {
  draft: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200', label: 'Draft', bar: 'bg-gray-400' },
  active: { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/20', label: 'Active', bar: 'bg-primary' },
  completed: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Completed', bar: 'bg-emerald-500' },
  cancelled: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200', label: 'Cancelled', bar: 'bg-red-400' },
};

export const ACTION_TYPE_BADGES = {
  experience: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Experience' },
  social: { bg: 'bg-purple-50', text: 'text-purple-700', label: 'Social' },
  formal: { bg: 'bg-green-50', text: 'text-green-700', label: 'Formal' },
  self_directed: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Self-directed' },
};

export const PRIORITY_COLORS = {
  high: 'bg-critical',
  medium: 'bg-warning',
  low: 'bg-gray-300',
};
