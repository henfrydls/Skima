import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target } from 'lucide-react';
import toast from 'react-hot-toast';
import { EmptyState, CardSkeleton } from '../components/common';
import { PlanCard } from '../components/development';
import { API_BASE } from '../lib/apiBase';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'draft', label: 'Draft' },
  { id: 'completed', label: 'Completed' },
];

/**
 * DevelopmentPage - Read-only IDP listing page
 * Shows all development plans with filter chips and a card grid.
 * All CRUD operations are handled in Settings > Development tab.
 */
export default function DevelopmentPage() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchPlans = useCallback(async () => {
    try {
      const url = filter === 'all'
        ? `${API_BASE}/api/development-plans`
        : `${API_BASE}/api/development-plans?status=${filter}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch plans');
      const data = await res.json();
      setPlans(data);
    } catch (err) {
      toast.error('Failed to load development plans');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    setLoading(true);
    fetchPlans();
  }, [fetchPlans]);

  return (
    <div className="min-h-full bg-gray-50 -m-6 p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-light text-slate-800">Development Plans</h1>
        <p className="text-sm text-gray-500 mt-1">
          Individual development plans to grow your team
        </p>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2">
        {FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === f.id
                ? 'bg-primary text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <CardSkeleton key={i} />)}
        </div>
      ) : plans.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No development plans yet"
          description={
            filter === 'all'
              ? 'Create plans in Settings \u2192 Development.'
              : `No ${filter} plans found.`
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {plans.map(plan => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </div>
      )}
    </div>
  );
}
