/**
 * skillsLogic.js - Pure utility functions for skills data processing
 * 
 * These functions transform raw API data into the format expected by UX components.
 * All functions are pure (no side effects) for easy testing.
 */

/**
 * Calculate average nivel from an array of assessments
 * @param {Array} assessments - Array of { nivel, criticidad }
 * @returns {number} Average nivel rounded to 1 decimal
 */
export const calculateSessionAverage = (assessments = []) => {
  if (!assessments || assessments.length === 0) return 0;
  
  const validAssessments = assessments.filter(a => a.nivel && a.nivel > 0);
  if (validAssessments.length === 0) return 0;
  
  const sum = validAssessments.reduce((acc, a) => acc + a.nivel, 0);
  return Math.round((sum / validAssessments.length) * 10) / 10;
};

/**
 * Calculate sparkline data from evaluation sessions
 * @param {Array} sessions - Array of evaluation sessions (ordered by date desc)
 * @returns {{ points: number[], trend: 'up' | 'down' | 'neutral' }}
 */
export const calculateSparkline = (sessions = []) => {
  if (!sessions || sessions.length < 2) {
    return { 
      points: sessions?.length === 1 ? [calculateSessionAverage(sessions[0].assessments)] : [], 
      trend: 'neutral' 
    };
  }
  
  // Take last 3 sessions and reverse to chronological order (oldest first)
  const recentSessions = sessions.slice(0, 3).reverse();
  
  const points = recentSessions.map(session => 
    calculateSessionAverage(session.assessments)
  );
  
  // Determine trend by comparing first and last points
  const first = points[0];
  const last = points[points.length - 1];
  
  let trend = 'neutral';
  if (last > first + 0.1) trend = 'up';      // More than 0.1 improvement
  else if (last < first - 0.1) trend = 'down'; // More than 0.1 decline
  
  return { points, trend };
};

/**
 * Build previous snapshot data for comparison in drawer
 * @param {Array} sessions - Array of evaluation sessions (ordered by date desc)
 * @returns {Object|null} Previous snapshot or null if not available
 */
export const buildPreviousSnapshot = (sessions = []) => {
  if (!sessions || sessions.length < 2) return null;
  
  const previousSession = sessions[1]; // Second most recent
  
  // Calculate category averages
  const categoryAverages = {};
  const categoryAssessments = {};
  
  previousSession.assessments.forEach(a => {
    const catName = a.categoriaNombre;
    if (!categoryAssessments[catName]) {
      categoryAssessments[catName] = [];
    }
    categoryAssessments[catName].push(a.nivel);
  });
  
  Object.entries(categoryAssessments).forEach(([catName, nivels]) => {
    categoryAverages[catName] = Math.round(
      (nivels.reduce((sum, n) => sum + n, 0) / nivels.length) * 10
    ) / 10;
  });
  
  return {
    id: previousSession.id,
    evaluatedAt: previousSession.evaluatedAt,
    rol: previousSession.collaboratorRol,
    promedio: calculateSessionAverage(previousSession.assessments),
    categorias: categoryAverages,
  };
};

/**
 * Identify skill gaps (brechas)
 * Business rule: Criticidad === 'C' AND Nivel < 3
 * @param {Object} skills - Skills map { skillId: { nivel, criticidad } }
 * @param {Array} skillsList - Full skills list from API with nombres
 * @returns {string[]} Array of skill names with gaps
 */
export const identifyGaps = (skills = {}, skillsList = []) => {
  const gaps = [];
  
  Object.entries(skills).forEach(([skillId, data]) => {
    if (data.criticidad === 'C' && data.nivel < 3) {
      // Find skill name from list
      const skill = skillsList.find(s => s.id === parseInt(skillId));
      if (skill) {
        gaps.push(skill.nombre);
      }
    }
  });
  
  return gaps;
};

/**
 * Identify strengths (fortalezas)
 * Business rule: Nivel >= 4 AND Criticidad !== 'N'
 * @param {Object} skills - Skills map { skillId: { nivel, criticidad } }
 * @param {Array} skillsList - Full skills list from API with nombres
 * @returns {string[]} Array of skill names that are strengths
 */
export const identifyStrengths = (skills = {}, skillsList = []) => {
  const strengths = [];
  
  Object.entries(skills).forEach(([skillId, data]) => {
    if (data.nivel >= 4 && data.criticidad !== 'N') {
      // Find skill name from list
      const skill = skillsList.find(s => s.id === parseInt(skillId));
      if (skill) {
        strengths.push(skill.nombre);
      }
    }
  });
  
  return strengths;
};

/**
 * Calculate category averages from skills map
 * @param {Object} skills - Skills map { skillId: { nivel, criticidad } }
 * @param {Array} skillsList - Full skills list with categoriaId
 * @param {Array} categories - Categories list with id, nombre
 * @returns {Object} { categoryName: average }
 */
export const calculateCategoryAverages = (skills = {}, skillsList = [], categories = []) => {
  const categoryData = {};
  
  // Initialize categories
  categories.forEach(cat => {
    categoryData[cat.nombre] = { sum: 0, count: 0 };
  });
  
  // Aggregate skills by category
  Object.entries(skills).forEach(([skillId, data]) => {
    if (!data.nivel || data.nivel <= 0) return;
    
    const skill = skillsList.find(s => s.id === parseInt(skillId));
    if (!skill) return;
    
    const category = categories.find(c => c.id === skill.categoriaId);
    if (!category) return;
    
    categoryData[category.nombre].sum += data.nivel;
    categoryData[category.nombre].count++;
  });
  
  // Calculate averages
  const result = {};
  Object.entries(categoryData).forEach(([catName, data]) => {
    if (data.count > 0) {
      result[catName] = Math.round((data.sum / data.count) * 10) / 10;
    }
  });
  
  return result;
};

/**
 * Get trend color based on trend direction
 * @param {string} trend - 'up' | 'down' | 'neutral'
 * @returns {string} Hex color code
 */
export const getTrendColor = (trend) => {
  if (trend === 'up') return '#10b981'; // success green
  if (trend === 'down') return '#ef4444'; // critical red
  return '#9ca3af'; // neutral gray
};

/**
 * Calculate delta between current and previous value
 * @param {number} current - Current value
 * @param {number} previous - Previous value
 * @returns {Object|null} { value, direction, formatted }
 */
export const calculateDelta = (current, previous) => {
  if (previous === null || previous === undefined) return null;
  
  const delta = current - previous;
  return {
    value: delta,
    direction: delta > 0.05 ? 'up' : delta < -0.05 ? 'down' : 'neutral',
    formatted: delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1),
  };
};
