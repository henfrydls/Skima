/**
 * skillsLogic.js - Pure utility functions for skills data processing
 * 
 * These functions transform raw API data into the format expected by UX components.
 * All functions are pure (no side effects) for easy testing.
 */

// --- CONSTANTS & WEIGHTS ---

const WEIGHTS = {
  CRITICIDAD: { 'C': 3, 'I': 2, 'D': 1, 'N': 0 }, // C=Crítico es lo más alto
  FRECUENCIA: { 'D': 3, 'S': 2, 'M': 1.5, 'T': 1, 'N': 0 } // D=Diario es lo más alto
};

// --- CORE EVALUATION LOGIC ---

/**
 * Evalúa una skill basándose en su nivel, frecuencia y criticidad.
 * Retorna un objeto con el estado, color, score y acción sugerida.
 * 
 * @param {number} nivel - Nivel actual (0-5)
 * @param {string} frecuencia - Frecuencia de uso (D, S, M, T, N)
 * @param {string} criticidad - Criticidad del rol (C, I, D, N)
 * @returns {Object} { estado, color, score, accion }
 */
export const evaluarSkill = (nivel, frecuencia, criticidad) => {
  const wInv = WEIGHTS.CRITICIDAD[criticidad] || 0; // Importance weight
  const wFreq = WEIGHTS.FRECUENCIA[frecuencia] || 0; // Frequency weight
  
  // Base Score: Importance * Frequency (This gives us "Urgency")
  // Range: 0 (N*N) to 9 (C*D)
  const score = wInv * wFreq;

  // Estado Determinations
  
  // 1. BRECHA CRÍTICA (Critical Gap)
  // Logic: Critical Skill (C) AND High Frequency (D/S) AND Low Level (< 3)
  // This is the "Red Zone" - Urgent
  if (criticidad === 'C' && ['D', 'S'].includes(frecuencia) && nivel < 3) {
    return {
      estado: "BRECHA CRÍTICA",
      color: "text-amber-600", // Amber (Visible but not alarmist red)
      score: score + 10, // Boost score to ensure it's top priority
      accion: "Capacitación urgente"
    };
  }

  // 2. ÁREA DE MEJORA (Area for Improvement)
  // Logic: 
  //   - Critical (C) but low frequency/better level (e.g. C + M, level < 3) 
  //   - OR Important (I) with low level
  //   - Basically any significant gap that isn't "Burning Red"
  if (
    (criticidad === 'C' && nivel < 3.5) || // Critical but maybe barely competent or low freq
    (criticidad === 'I' && nivel < 3)      // Important and weak
  ) {
    return {
      estado: "ÁREA DE MEJORA",
      color: "text-amber-500", // Amber (Softer)
      score: score, // Use calculated score
      accion: "Plan de desarrollo"
    };
  }

  // 3. FORTALEZA (Strength)
  // Logic: High Level (>= 4) in relevant skills (Not N)
  if (nivel >= 4 && criticidad !== 'N') {
    return {
      estado: "FORTALEZA",
      color: "text-indigo-600", // Indigo (Premium Strength)
      score: score,
      accion: "Mentorear a otros"
    };
  }

  // 4. COMPETENTE (Competent / Neutral)
  // Default state: doing okay, or skill is not critical
  return {
    estado: "COMPETENTE",
    color: "text-blue-500", // Blue (Active/Stable)
    score: 0, // Low priority
    accion: "Mantener"
  };
};

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
    const catName = a.categoriaNombre; // Assuming backend sends this or we need to lookup? 
    // Note: Backend might not send categoriaNombre directly in nested assessments unless included.
    // If missing, this might rely on specific data shape. Existing code assumed it worked.
    // We'll keep existing logic/assumption.
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
 * Identify skill gaps (brechas) using new weighted logic
 * Returns sorted list of gap objects
 * @param {Object} skills - Skills map { skillId: { nivel, criticidad, frecuencia } }
 * @param {Array} skillsList - Full skills list from API with nombres
 * @returns {Object[]} Array of gap objects { name, estado, color, score, accion } sorted by score desc
 */
export const identifyGaps = (skills = {}, skillsList = []) => {
  const gaps = [];
  
  Object.entries(skills).forEach(([skillId, data]) => {
    // data must have { nivel, criticidad, frecuencia }
    // If frecuencia is missing, default to 'M' (Medium) or 'N'? Let's assume passed or check.
    const frecuencia = data.frecuencia || 'M'; 

    const result = evaluarSkill(data.nivel, frecuencia, data.criticidad);

    if (result.estado === "BRECHA CRÍTICA" || result.estado === "ÁREA DE MEJORA") {
      // Find skill name from list
      const skill = skillsList.find(s => s.id === parseInt(skillId));
      if (skill) {
        gaps.push({
          name: skill.nombre,
          ...result
        });
      }
    }
  });
  
  // Sort by score descending (highest priority first)
  return gaps.sort((a, b) => b.score - a.score);
};

/**
 * Identify strengths (fortalezas) using new weighted logic
 * @param {Object} skills - Skills map { skillId: { nivel, criticidad, frecuencia } }
 * @param {Array} skillsList - Full skills list from API with nombres
 * @returns {Object[]} Array of strength objects sorted by score desc
 */
export const identifyStrengths = (skills = {}, skillsList = []) => {
  const strengths = [];
  
  Object.entries(skills).forEach(([skillId, data]) => {
    const frecuencia = data.frecuencia || 'M';
    const result = evaluarSkill(data.nivel, frecuencia, data.criticidad);

    if (result.estado === "FORTALEZA") {
      const skill = skillsList.find(s => s.id === parseInt(skillId));
      if (skill) {
        strengths.push({
          name: skill.nombre,
          ...result
        });
      }
    }
  });
  
  return strengths.sort((a, b) => b.score - a.score);
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
    
    // Check if relevant for profile? Existing logic in TeamMatrixPage filters this?
    // The previous implementation here didn't filter by criticality, just aggregated what is evaluated.
    // TeamMatrixPage passed `roleProfile` to a DIFFERENT `calculateCategoryAverages` internal helper.
    // This export was for general use. We'll keep it as is: aggregate all evaluated skills.
    
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
