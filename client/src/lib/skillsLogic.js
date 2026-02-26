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

// Centralized color palette for skill status (Modern Cool)
export const STATUS_COLORS = {
  CRITICAL: 'text-rose-600',   // Para Brecha Crítica (Urgente)
  WARNING: 'text-amber-600',   // Para Área de Mejora (Atención)
  STRENGTH: 'text-indigo-600', // Para Fortaleza (Expertos)
  NEUTRAL: 'text-blue-600',    // Para Competente (Base)
  MUTE: 'text-slate-400'       // Default / N/A
};

// ============================================
// CENTRALIZED SKILL THRESHOLDS (Single Source of Truth)
// ============================================
export const SKILL_THRESHOLDS = {
  COMPETENT: 2.5,   // >= 2.5 = Competente
  STRENGTH: 3.5,    // >= 3.5 = Fortaleza / Experto
  GOAL: 4.0,        // Meta visual para gráficos
};

/**
 * Get skill level status based on score
 * Single source of truth for level classification
 * 
 * @param {number} score - The skill level score (0-5)
 * @returns {{ label: string, color: string, value: string, tailwindColor: string }}
 */
export const getSkillLevelStatus = (score) => {
  if (score >= SKILL_THRESHOLDS.STRENGTH) {
    return { 
      label: 'Fortaleza', 
      color: '#6366f1', // Indigo
      value: 'strength',
      tailwindColor: 'text-primary'
    };
  }
  if (score >= SKILL_THRESHOLDS.COMPETENT) {
    return { 
      label: 'Competente', 
      color: '#a6ae3d', // Lime/Competent
      value: 'competent',
      tailwindColor: 'text-competent'
    };
  }
  return { 
    label: 'Requiere Atención', 
    color: '#f59e0b', // Amber/Warning
    value: 'attention',
    tailwindColor: 'text-warning'
  };
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
      color: STATUS_COLORS.CRITICAL,
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
      color: STATUS_COLORS.WARNING,
      score: score, // Use calculated score
      accion: "Plan de desarrollo"
    };
  }

  // 3. FORTALEZA (Strength)
  // Logic: High Level (>= 4) in relevant skills (Not N)
  if (nivel >= 4 && criticidad !== 'N') {
    return {
      estado: "FORTALEZA",
      color: STATUS_COLORS.STRENGTH,
      score: score,
      accion: "Mentorear a otros"
    };
  }

  // 4. COMPETENTE (Competent / Neutral)
  // Default state: doing okay, or skill is not critical
  return {
    estado: "COMPETENTE",
    color: STATUS_COLORS.NEUTRAL,
    score: 0, // Low priority
    accion: "Mantener"
  };
};

/**
 * Calculate average nivel from an array of assessments, respecting Role Profile if provided
 * @param {Array} assessments - Array of { skillId, nivel }
 * @param {Object} roleProfile - Map of skillId -> criticality ('C','I','D','N'). If 'N', ignore.
 * @returns {number} Average nivel rounded to 1 decimal
 */
export const calculateSessionAverage = (assessments = [], roleProfile = null) => {
  if (!assessments || assessments.length === 0) return 0;
  
  let validAssessments = assessments.filter(a => a.nivel && a.nivel > 0);
  
  // If Role Profile provided, filter out N/A skills
  if (roleProfile) {
    validAssessments = validAssessments.filter(a => {
      const skillId = a.skillId?.toString();
      const criticality = roleProfile[skillId] || 'N';
      return criticality !== 'N';
    });
  }

  if (validAssessments.length === 0) return 0;
  
  const sum = validAssessments.reduce((acc, a) => acc + a.nivel, 0);
  return Math.round((sum / validAssessments.length) * 10) / 10;
};

/**
 * Calculate sparkline data from evaluation sessions
 * @param {Array} sessions - Array of evaluation sessions (ordered by date desc)
 * @param {Object} roleProfile - Map of skillId -> criticality
 * @returns {{ points: number[], trend: 'up' | 'down' | 'neutral' }}
 */
export const calculateSparkline = (sessions = [], roleProfile = null) => {
  if (!sessions || sessions.length < 2) {
    return { 
      points: sessions?.length === 1 ? [calculateSessionAverage(sessions[0].assessments, roleProfile)] : [], 
      trend: 'neutral' 
    };
  }
  
  // Create points in chronological order (sessions are usually desc, so reverse)
  // Take last 6 sessions max for sparkline
  const sortedSessions = [...sessions].sort((a, b) => new Date(a.evaluatedAt) - new Date(b.evaluatedAt));
  const recentSessions = sortedSessions.slice(-6);
  
  const points = recentSessions.map(s => calculateSessionAverage(s.assessments, roleProfile));
  
  // Determine trend
  let trend = 'neutral';
  if (points.length >= 2) {
    const first = points[0];
    const last = points[points.length - 1];
    const diff = last - first;
    
    if (diff > 0.1) trend = 'up';
    else if (diff < -0.1) trend = 'down';
  }
  
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
