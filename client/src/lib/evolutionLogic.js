/**
 * Evolution Logic - Data Transformation Helpers
 * 
 * Transforms HISTORY_SNAPSHOTS into UI-consumable structures
 * for charts, sparklines, and KPI calculations.
 * 
 * Handles edge cases: gaps, one-shots, inactive users, legacy skills
 */

import { HISTORY_SNAPSHOTS, COLLABORATORS_BASE, getCollaboratorHistory } from '../data/richSeedData';

// ============================================
// CONSTANTS
// ============================================
const LEGACY_CATEGORY_ID = 99;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Format date to quarter string (e.g., "Q1 2024")
 */
export const formatQuarter = (dateString) => {
  const date = new Date(dateString);
  const quarter = Math.ceil((date.getMonth() + 1) / 3);
  return `Q${quarter} ${date.getFullYear()}`;
};

/**
 * Format date to month string (e.g., "Mar 2024")
 */
export const formatMonth = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
};

/**
 * Calculate average excluding zeros and null values
 */
const calculateNonZeroAverage = (values) => {
  const valid = values.filter(v => v !== null && v !== undefined && v > 0);
  if (valid.length === 0) return null;
  return Math.round((valid.reduce((a, b) => a + b, 0) / valid.length) * 10) / 10;
};

// ============================================
// MAIN FUNCTIONS
// ============================================

/**
 * Get all unique dates from snapshots, sorted chronologically
 */
export const getAllDates = () => {
  const dates = [...new Set(HISTORY_SNAPSHOTS.map(s => s.date))];
  return dates.sort((a, b) => new Date(a) - new Date(b));
};

/**
 * Process chart data - group by date and calculate team average
 * Excludes: Legacy skills (category 99), inactive users
 */
export const processChartData = (includeInactive = false) => {
  const dates = getAllDates();
  const activeCollaborators = COLLABORATORS_BASE.filter(c => includeInactive || c.active);
  const activeIds = activeCollaborators.map(c => c.id);
  
  return dates.map(date => {
    const snapshotsAtDate = HISTORY_SNAPSHOTS.filter(
      s => s.date === date && activeIds.includes(s.collaboratorId)
    );
    
    // Calculate team average (excluding legacy skills)
    const averages = snapshotsAtDate.map(s => {
      const skillValues = Object.entries(s.skills)
        .filter(([skillId]) => {
          // Exclude legacy category skills
          const id = parseInt(skillId);
          return id < 97; // Legacy skills are 97, 98
        })
        .map(([, data]) => data.nivel)
        .filter(v => v > 0);
      
      return skillValues.length > 0 
        ? skillValues.reduce((a, b) => a + b, 0) / skillValues.length 
        : null;
    }).filter(v => v !== null);
    
    const teamAverage = averages.length > 0 
      ? Math.round((averages.reduce((a, b) => a + b, 0) / averages.length) * 10) / 10
      : null;
    
    // Find NEW HIRES for this period
    // Logic: Look for anyone whose joinedAt falls within the month of this snapshot
    const snapshotDate = new Date(date);
    const newHires = activeCollaborators.filter(c => {
        if (!c.joinedAt) return false;
        const joinedDate = new Date(c.joinedAt);
        return joinedDate.getMonth() === snapshotDate.getMonth() && joinedDate.getFullYear() === snapshotDate.getFullYear();
    }).map(c => c.nombre);

    return {
      date,
      quarter: formatQuarter(date),
      month: formatMonth(date),
      teamAverage,
      count: snapshotsAtDate.length,
      newHires // Array of names
    };
  });
};

/**
 * Get collaborator trend data (sparkline-ready)
 * Returns array with null for missing dates (gaps)
 */
export const getCollaboratorTrend = (collaboratorId) => {
  const allDates = getAllDates();
  const history = getCollaboratorHistory(collaboratorId);
  
  return allDates.map(date => {
    const snapshot = history.find(h => h.date === date);
    if (!snapshot) {
      return { date, promedio: null }; // Gap - null value
    }
    return { date, promedio: snapshot.promedio };
  });
};

/**
 * Detect if collaborator had a recent role change
 */
export const detectRoleChange = (collaboratorId) => {
  const history = getCollaboratorHistory(collaboratorId);
  
  if (history.length < 2) {
    return { changed: false };
  }
  
  const latest = history[history.length - 1];
  const previous = history[history.length - 2];
  
  if (latest.rol !== previous.rol) {
    return {
      changed: true,
      prev: previous.rol,
      new: latest.rol,
      date: latest.date,
    };
  }
  
  return { changed: false };
};

/**
 * Calculate delta (improvement/decline) for a collaborator
 * Compares last snapshot to first snapshot
 */
export const calculateDelta = (collaboratorId, period = 'all') => {
  const history = getCollaboratorHistory(collaboratorId);
  
  if (history.length < 2) {
    return { delta: null, insufficient: true };
  }
  
  const latest = history[history.length - 1];
  let baseline;
  
  if (period === 'yoy') {
    // Year over Year: compare to same quarter last year
    const currentYear = new Date(latest.date).getFullYear();
    baseline = history.find(h => {
      const hYear = new Date(h.date).getFullYear();
      return hYear === currentYear - 1;
    });
  } else if (period === '6months') {
    // Last 6 months: ~2-3 snapshots back
    baseline = history[Math.max(0, history.length - 4)];
  } else {
    // All time: first snapshot
    baseline = history[0];
  }
  
  if (!baseline) {
    return { delta: null, insufficient: true };
  }
  
  const delta = Math.round((latest.promedio - baseline.promedio) * 10) / 10;
  
  return {
    delta,
    from: baseline.promedio,
    to: latest.promedio,
    insufficient: false,
    trend: delta > 0 ? 'up' : delta < 0 ? 'down' : 'stable',
  };
};

/**
 * Get Team Velocity (YoY comparison)
 */
export const getTeamVelocity = () => {
  const chartData = processChartData(false);
  
  if (chartData.length < 5) {
    return { current: null, previous: null, delta: null, insufficient: true };
  }
  
  const latest = chartData[chartData.length - 1];
  const currentYear = new Date(latest.date).getFullYear();
  
  // Find same quarter last year
  const sameQuarterLastYear = chartData.find(d => {
    const dYear = new Date(d.date).getFullYear();
    const dQuarter = Math.ceil((new Date(d.date).getMonth() + 1) / 3);
    const latestQuarter = Math.ceil((new Date(latest.date).getMonth() + 1) / 3);
    return dYear === currentYear - 1 && dQuarter === latestQuarter;
  });
  
  if (!sameQuarterLastYear || sameQuarterLastYear.teamAverage === null) {
    return { current: latest.teamAverage, previous: null, delta: null, insufficient: true };
  }
  
  const delta = Math.round((latest.teamAverage - sameQuarterLastYear.teamAverage) * 10) / 10;
  
  return {
    current: latest.teamAverage,
    previous: sameQuarterLastYear.teamAverage,
    delta,
    insufficient: false,
    trend: delta > 0 ? 'up' : delta < 0 ? 'down' : 'stable',
  };
};

/**
 * Get Top Improver - collaborator with highest positive delta
 */
export const getTopImprover = () => {
  const activeCollabs = COLLABORATORS_BASE.filter(c => c.active);
  
  let topImprover = null;
  let maxDelta = -Infinity;
  
  activeCollabs.forEach(collab => {
    const { delta, insufficient } = calculateDelta(collab.id, '6months');
    if (!insufficient && delta !== null && delta > maxDelta) {
      maxDelta = delta;
      topImprover = { ...collab, delta };
    }
  });
  
  return topImprover;
};

/**
 * Calculate aggregated evolution metrics
 * Returns: { topImprover, attentionCount, teamVelocity }
 */
export const calculateEvolutionMetrics = () => {
  const teamVelocity = getTeamVelocity();
  const topImprover = getTopImprover();
  
  // Count collaborators requiring attention (delta < -0.3)
  // Instead of singling out one person ("Name & Shame"), we show the scale of the issue.
  const activeCollabs = COLLABORATORS_BASE.filter(c => c.active);
  let attentionCount = 0;
  
  activeCollabs.forEach(collab => {
    const { delta, insufficient } = calculateDelta(collab.id, '6months');
    // Threshold: < -0.3 (Significant drop)
    if (!insufficient && delta !== null && delta < -0.3) {
      attentionCount++;
    }
  });

  return { 
    topImprover, 
    attentionCount, 
    teamVelocity 
  };
};

/**
 * Get all collaborators with their evolution data
 */
export const getCollaboratorsEvolution = (includeInactive = false) => {
  const collabs = includeInactive 
    ? COLLABORATORS_BASE 
    : COLLABORATORS_BASE.filter(c => c.active);
  
  return collabs.map(collab => {
    const history = getCollaboratorHistory(collab.id);
    const latestSnapshot = history[history.length - 1];
    const roleChange = detectRoleChange(collab.id);
    const deltaInfo = calculateDelta(collab.id, '6months');
    const trend = getCollaboratorTrend(collab.id);
    
    // Count non-null data points for sparkline
    const dataPoints = trend.filter(t => t.promedio !== null).length;
    const isOneShot = dataPoints === 1;
    const hasGaps = trend.some((t, i) => 
      t.promedio === null && 
      i > 0 && 
      i < trend.length - 1 &&
      trend.slice(0, i).some(tt => tt.promedio !== null)
    );
    
    return {
      ...collab,
      latestPromedio: latestSnapshot?.promedio ?? null,
      latestRol: latestSnapshot?.rol ?? collab.rol,
      latestDate: latestSnapshot?.date ?? null,
      roleChange,
      delta: deltaInfo.delta,
      deltaTrend: deltaInfo.trend,
      trend,
      dataPoints,
      isOneShot,
      hasGaps,
      isAtRisk: deltaInfo.trend === 'down' && deltaInfo.delta < -0.5,
    };
  }).sort((a, b) => {
    // Sort: active first, then by latest average descending
    if (a.active !== b.active) return a.active ? -1 : 1;
    return (b.latestPromedio ?? 0) - (a.latestPromedio ?? 0);
  });
};
