/**
 * Evolution Logic - API Adapter Layer
 * 
 * Transforms raw API data from /api/skills/evolution into UI-ready formats.
 * Uses centralized thresholds from skillsLogic.js for color/status decisions.
 * 
 * All functions are pure (no side effects) for easy testing.
 */

import { getSkillLevelStatus, SKILL_THRESHOLDS } from './skillsLogic';

// ============================================
// DATE FORMATTING
// ============================================

/**
 * Format ISO date to short month label (e.g., "ene 24")
 * @param {string} isoDate - ISO date string "2024-01-15"
 * @returns {string} - Formatted date "ene 24"
 */
export const formatMonthShort = (isoDate) => {
  const date = new Date(isoDate);
  return date.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });
};

/**
 * Format ISO date to full month label (e.g., "Enero 2024")
 * @param {string} isoDate - ISO date string
 * @returns {string} - Formatted date "Enero 2024"
 */
export const formatMonthFull = (isoDate) => {
  const date = new Date(isoDate);
  return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
};

/**
 * Format ISO date to quarter (e.g., "Q1 2024")
 * @param {string} isoDate - ISO date string
 * @returns {string}
 */
export const formatQuarter = (isoDate) => {
  const date = new Date(isoDate);
  const quarter = Math.ceil((date.getMonth() + 1) / 3);
  return `Q${quarter} ${date.getFullYear()}`;
};

// ============================================
// CHART DATA TRANSFORMATIONS
// ============================================

/**
 * Transform API chartData for Recharts AreaChart
 * Adds formatted month labels and team average key expected by chart
 * 
 * @param {Array} chartData - Raw chartData from API
 * @returns {Array} - Chart-ready data
 */
export const transformChartData = (chartData) => {
  if (!chartData || !Array.isArray(chartData)) return [];
  
  return chartData.map(point => ({
    date: point.date,
    month: formatMonthShort(point.date),
    teamAverage: point.avgScore,
    count: point.count,
    newHires: point.newHires || [],
    isCarryOver: point.isCarryOver || false
  }));
};

/**
 * Get trend color based on growth value
 * @param {number} growth - Delta value
 * @returns {string} - Tailwind color class
 */
export const getTrendColor = (growth) => {
  // Handle string inputs (e.g. from Team Matrix)
  if (typeof growth === 'string') {
    if (growth === 'up') return '#10b981'; // emerald-500
    if (growth === 'down') return '#ef4444'; // red-500
    return '#64748b'; // slate-500
  }
  
  // Handle numeric growth
  if (growth > 0.1) return '#10b981'; // emerald-500
  if (growth < -0.1) return '#ef4444'; // red-500
  return '#64748b'; // slate-500
};

/**
 * Get trend label
 * @param {string} trend - 'up' | 'down' | 'stable'
 * @returns {string} - Arrow character
 */
export const getTrendArrow = (trend) => {
  switch(trend) {
    case 'up': return '↑';
    case 'down': return '↓';
    default: return '→';
  }
};

// ============================================
// EMPLOYEE DATA TRANSFORMATIONS
// ============================================

/**
 * Transform API employees for EvolutionList component
 * Adds status colors and formatted dates
 * 
 * @param {Array} employees - Raw employees from API
 * @returns {Array} - UI-ready employee data
 */
export const transformEmployeesForList = (employees) => {
  if (!employees || !Array.isArray(employees)) return [];
  
  return employees.map(emp => {
    const status = getSkillLevelStatus(emp.currentScore);
    
    return {
      id: emp.id,
      nombre: emp.name,
      rol: emp.role,
      active: true, // API only returns active
      latestPromedio: emp.currentScore,
      delta: emp.growth,
      deltaTrend: emp.growthTrend,
      isNewHire: emp.isNewHire,
      insufficientData: emp.insufficientData,
      joinedAt: emp.joinedAt,
      lastEvaluated: emp.lastEvaluatedAt,
      // Sparkline data (array of scores) with descriptive labels
      trend: emp.sparkline?.map((score, i, arr) => {
        let label = '';
        if (i === 0) label = 'Inicio';
        else if (i === arr.length - 1) label = 'Actual';
        else label = `Hito ${i}`;
        
        return { 
          date: label, // Used as label in tooltip
          promedio: score 
        };
      }) || [],
      // Status for color coding
      status: status.value,
      statusLabel: status.label,
      statusColor: status.color,
      // Sparkline color
      sparklineColor: getTrendColor(emp.growth)
    };
  });
};

// ============================================
// METRICS HELPERS
// ============================================

/**
 * Calculate narrative data for chart header
 * @param {object} meta - API meta object
 * @returns {object} - Narrative config for EvolutionChart
 */
export const getNarrativeFromMeta = (meta) => {
  if (!meta) return null;
  
  const { periodDelta, currentMaturityIndex } = meta;
  
  if (periodDelta > 0.1) {
    return {
      icon: '↑',
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      titlePrefix: 'Mejora constante: ',
      titleHighlight: `+${periodDelta.toFixed(1)} puntos`,
      highlightColor: 'text-emerald-600 font-semibold',
      subtitle: 'El equipo ha ganado tracción en el período analizado.',
      variant: 'success'
    };
  }
  
  if (periodDelta < -0.1) {
    return {
      icon: '↓',
      iconBg: 'bg-rose-50',
      iconColor: 'text-rose-600',
      titlePrefix: 'El promedio ha descendido ',
      titleHighlight: `${Math.abs(periodDelta).toFixed(1)} puntos`,
      highlightColor: 'text-rose-600 font-semibold',
      subtitle: 'Se recomienda revisar las áreas de brechas críticas.',
      variant: 'warning'
    };
  }
  
  return {
    icon: '→',
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-600',
    titlePrefix: 'El rendimiento se mantiene ',
    titleHighlight: 'estable',
    highlightColor: 'text-slate-700 font-semibold',
    subtitle: `Índice de madurez actual: ${currentMaturityIndex?.toFixed(1) || '--'}`,
    variant: 'neutral'
  };
};

/**
 * Get top improver for StatCard
 * @param {object} insights - API insights object
 * @returns {object|null}
 */
export const getTopImprover = (insights) => {
  if (!insights?.topImprover) return null;
  return {
    nombre: insights.topImprover.name,
    delta: insights.topImprover.growth
  };
};

/**
 * Get support count for StatCard
 * @param {object} insights - API insights object
 * @returns {number}
 */
export const getSupportCount = (insights) => {
  return insights?.supportCount || 0;
};

// ============================================
// VELOCITY CALCULATION
// ============================================

/**
 * Calculate team velocity from chart data (YoY comparison)
 * @param {Array} chartData - Transformed chart data
 * @returns {object}
 */
export const calculateTeamVelocity = (chartData) => {
  if (!chartData || chartData.length < 2) {
    return { current: null, delta: null, insufficient: true };
  }
  
  const latest = chartData[chartData.length - 1];
  const first = chartData[0];
  
  const delta = Math.round((latest.teamAverage - first.teamAverage) * 10) / 10;
  
  return {
    current: latest.teamAverage,
    delta,
    insufficient: false,
    trend: delta > 0 ? 'up' : delta < 0 ? 'down' : 'stable'
  };
};

// Re-export constants for convenience
export { SKILL_THRESHOLDS };
