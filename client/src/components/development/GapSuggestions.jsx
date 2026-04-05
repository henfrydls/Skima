import { useState, useEffect } from 'react';
import { Lightbulb, Plus, AlertTriangle } from 'lucide-react';
import { API_BASE } from '../../lib/apiBase';

/**
 * GapSuggestions - Shows skill gap suggestions when creating a goal
 * Fetches from /api/collaborators/:id/suggested-goals
 */
export default function GapSuggestions({ collaboratorId, onSelect }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!collaboratorId) {
      setSuggestions([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetch(`${API_BASE}/api/collaborators/${collaboratorId}/suggested-goals`)
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        if (!cancelled) setSuggestions(data);
      })
      .catch(() => {
        if (!cancelled) setSuggestions([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [collaboratorId]);

  if (!collaboratorId || loading || suggestions.length === 0) return null;

  return (
    <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
      <div className="flex items-center gap-2 text-amber-700 text-xs font-medium mb-2">
        <Lightbulb size={14} />
        Suggested from skill gaps
      </div>
      <div className="space-y-1.5">
        {suggestions.slice(0, 5).map((suggestion, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onSelect(suggestion)}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-sm hover:bg-amber-100 transition-colors group"
          >
            <Plus size={14} className="text-amber-500 group-hover:text-amber-700 flex-shrink-0" />
            <span className="flex-1 text-amber-800">{suggestion.title || suggestion.skillName}</span>
            {suggestion.currentLevel != null && (
              <span className="text-xs text-amber-500">
                Lvl {suggestion.currentLevel} / {suggestion.targetLevel || 4}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
