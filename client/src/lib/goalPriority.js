// Development-goal priority display metadata.
//
// Priority is persisted as an integer (1=high, 2=medium, 3=low). Older/string
// values ('high'|'medium'|'low') are tolerated so any cached or legacy payload
// still renders correctly.

export const PRIORITY_META = {
  high: { key: 'high', color: 'bg-critical', label: 'High' },
  medium: { key: 'medium', color: 'bg-warning', label: 'Medium' },
  low: { key: 'low', color: 'bg-gray-300', label: 'Low' },
};

export function getPriorityMeta(priority) {
  if (priority === 1 || priority === 'high') return PRIORITY_META.high;
  if (priority === 3 || priority === 'low') return PRIORITY_META.low;
  return PRIORITY_META.medium;
}
