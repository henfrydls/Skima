import { useState, useEffect, useCallback } from 'react';
import { API_BASE } from '../lib/apiBase';

/**
 * useEvolutionData - Custom hook for fetching evolution data from API
 * 
 * Manages loading, error states, and automatic refetching on timeRange change.
 * 
 * @param {string} initialRange - Initial time range ('6m', '12m', '24m', 'ytd', 'all')
 * @returns {{ data, loading, error, timeRange, setTimeRange, refetch }}
 */
export function useEvolutionData(initialRange = '12m') {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState(initialRange);

  const fetchData = useCallback(async (range) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE}/api/skills/evolution?range=${range}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const json = await response.json();
      setData(json);
    } catch (err) {
      console.error('[useEvolutionData] Fetch failed:', err);
      setError(err.message || 'Error al cargar datos de evolución');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount and when timeRange changes
  useEffect(() => {
    fetchData(timeRange);
  }, [timeRange, fetchData]);

  // Manual refetch function
  const refetch = useCallback(() => {
    fetchData(timeRange);
  }, [timeRange, fetchData]);

  return {
    data,
    loading,
    error,
    timeRange,
    setTimeRange,
    refetch
  };
}

export default useEvolutionData;
