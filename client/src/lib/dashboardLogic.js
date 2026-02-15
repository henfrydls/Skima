/**
 * Dashboard Logic Utilities
 * 
 * Funciones de lógica de negocio para el Dashboard Ejecutivo.
 * Incluye: cálculos de métricas, priorización de gaps, detección de insights.
 */
import { evaluarSkill, SKILL_THRESHOLDS } from './skillsLogic';

// ============================================
// WEIGHTS & CONSTANTS
// ============================================
const FREQUENCY_WEIGHTS = { D: 4, S: 3, M: 2, T: 1, N: 0 };
const CRITICALITY_WEIGHTS = { C: 3, I: 2, D: 1, N: 0 };

// NOTE: Use SKILL_THRESHOLDS from skillsLogic.js instead of local definition
// Keeping this alias for backward compatibility if any code still references it
const LEVEL_THRESHOLDS = {
  beginner: SKILL_THRESHOLDS.COMPETENT,    // < 2.5 = Principiante
  competent: SKILL_THRESHOLDS.STRENGTH,    // 2.5-3.5 = Competente
  expert: SKILL_THRESHOLDS.STRENGTH        // >= 3.5 = Experto
};

// ============================================
// SNAPSHOT COMPARISON
// ============================================

/**
 * Calcula el delta entre dos snapshots
 * @param {number} current - Promedio actual
 * @param {number} previous - Promedio anterior
 * @returns {{ delta: string, percentage: string, trend: 'up'|'down'|'stable' }}
 */
export function calculateDelta(current, previous) {
  if (current == null || previous == null) {
    return { delta: '0.0', deltaRaw: 0, percentage: '0.0', trend: 'stable' };
  }
  const delta = current - previous;
  const percentage = previous !== 0 ? ((delta / previous) * 100) : 0;
  
  return {
    delta: delta.toFixed(1),
    deltaRaw: delta,
    percentage: percentage.toFixed(1),
    trend: delta > 0.05 ? 'up' : delta < -0.05 ? 'down' : 'stable'
  };
}

/**
 * Obtiene los top cambios (mejoras y retrocesos) entre snapshots
 * @param {Array} categories - Lista de categorías con promedios actuales y anteriores
 * @param {number} limit - Cantidad de items a retornar
 */
export function getTopChanges(categories, limit = 3) {
  const changes = categories.map(cat => ({
    id: cat.id,
    nombre: cat.nombre,
    current: cat.promedioActual,
    previous: cat.promedioAnterior,
    delta: cat.promedioActual - cat.promedioAnterior
  }));

  const improvements = changes
    .filter(c => c.delta > 0)
    .sort((a, b) => b.delta - a.delta)
    .slice(0, limit);

  const regressions = changes
    .filter(c => c.delta < 0)
    .sort((a, b) => a.delta - b.delta)
    .slice(0, limit);

  return { improvements, regressions };
}

// ============================================
// GAP PRIORITIZATION
// ============================================

/**
 * Prioriza los gaps por impacto de negocio
 * @param {Array} collaborators - Lista de colaboradores con skills
 * @param {Array} skills - Lista de skills
 * @param {Array} categories - Lista de categorías
 * @param {Function} isCriticalGap - Función para detectar gaps críticos
 */
export function prioritizeGaps(collaborators, skills, categories, isCriticalGap) {
  const gapsByCategory = {};

  categories.forEach(cat => {
    const categorySkills = skills.filter(s => s.categoria === cat.id);
    let totalImpact = 0;
    let affectedCount = 0;
    const affectedCollaborators = [];

    categorySkills.forEach(skill => {
      collaborators.forEach(collab => {
        const skillData = collab.skills?.[skill.id];

        if (isCriticalGap(skillData)) {
          const freqWeight = FREQUENCY_WEIGHTS[skillData?.frecuencia] || 0;
          const critWeight = CRITICALITY_WEIGHTS[skillData?.criticidad] || 0;

          totalImpact += freqWeight * critWeight;
          affectedCount++;
          
          if (!affectedCollaborators.includes(collab.nombre)) {
            affectedCollaborators.push(collab.nombre);
          }
        }
      });
    });

    if (affectedCount > 0) {
      gapsByCategory[cat.id] = {
        id: cat.id,
        categoria: cat.nombre,
        afectados: affectedCollaborators.length,
        colaboradores: affectedCollaborators,
        skillsAfectados: affectedCount,
        impactScore: totalImpact,
        severidad: totalImpact > 20 ? 'critical' : totalImpact > 10 ? 'warning' : 'info'
      };
    }
  });

  return Object.values(gapsByCategory)
    .sort((a, b) => b.impactScore - a.impactScore);
}

// ============================================
// TEAM DISTRIBUTION
// ============================================

/**
 * Calcula la distribución del equipo por nivel
 * @param {Array} collaborators - Lista de colaboradores con promedio
 */
export function calculateDistribution(collaborators) {
  const distribution = {
    beginners: { count: 0, names: [] },
    competent: { count: 0, names: [] },
    experts: { count: 0, names: [] }
  };

  collaborators.forEach(collab => {
    const avg = collab.promedio;
    
    if (avg < LEVEL_THRESHOLDS.beginner) {
      distribution.beginners.count++;
      distribution.beginners.names.push(collab.nombre);
    } else if (avg < LEVEL_THRESHOLDS.competent) {
      distribution.competent.count++;
      distribution.competent.names.push(collab.nombre);
    } else {
      distribution.experts.count++;
      distribution.experts.names.push(collab.nombre);
    }
  });

  return distribution;
}

// ============================================
// AUTOMATIC INSIGHTS
// ============================================

/**
 * Detecta talento subutilizado
 * Alta skill en área de baja criticidad
 */
export function detectUnderutilizedTalent(collaborators, skills) {
  const insights = [];

  collaborators.forEach(collab => {
    Object.entries(collab.skills).forEach(([skillId, data]) => {
      if (data.nivel >= 4 && (data.criticidad === 'D' || data.criticidad === 'N')) {
        const skill = skills.find(s => s.id === parseInt(skillId));
        if (skill) {
          insights.push({
            type: 'underutilized',
            colaborador: collab.nombre,
            skill: skill.nombre,
            nivel: data.nivel,
            criticidad: data.criticidad,
            suggestion: 'Considerar reasignar a tareas más críticas'
          });
        }
      }
    });
  });

  return insights;
}

/**
 * Detecta riesgo de Bus Factor
 * Skills críticas donde solo 1 persona tiene alto nivel
 */
export function detectBusFactorRisk(collaborators, skills) {
  const risks = [];

  skills.forEach(skill => {
    const expertsInSkill = collaborators.filter(collab => {
      const skillData = collab.skills[skill.id];
      return skillData && skillData.nivel >= 4 && skillData.criticidad === 'C';
    });

    if (expertsInSkill.length === 1) {
      risks.push({
        type: 'busFactor',
        skill: skill.nombre,
        expert: expertsInSkill[0].nombre,
        nivel: expertsInSkill[0].skills[skill.id].nivel,
        suggestion: 'Capacitar a otro colaborador como backup'
      });
    }
  });

  return risks;
}

/**
 * Calcula todas las métricas ejecutivas para el dashboard
 */
export function calculateExecutiveMetrics(collaborators, skills, categories, isCriticalGap, roleProfiles = {}) {
  // Helper to calculate average from skills object
  const calcAvg = (skillsObj) => {
    const vals = Object.values(skillsObj).map(s => s.nivel);
    if (vals.length === 0) return 0;
    return vals.reduce((sum, v) => sum + v, 0) / vals.length;
  };

  // Filter to collaborators that have skill data (active in this period)
  const activeCollaborators = collaborators.filter(c => Object.keys(c.skills).length > 0);

  // Promedio general - calculate dynamically from skills
  let totalSum = 0;
  activeCollaborators.forEach(c => {
    totalSum += calcAvg(c.skills);
  });
  const totalAvg = activeCollaborators.length > 0 ? totalSum / activeCollaborators.length : 0;
  
  // Contar fortalezas (categorías con promedio > 3.5)
  // Calculate category averages from collaborator skills
  const categoryAverages = categories.map(cat => {
    const catSkillIds = skills.filter(s => s.categoria === cat.id).map(s => s.id);
    let sum = 0;
    let count = 0;
    activeCollaborators.forEach(c => {
      catSkillIds.forEach(skillId => {
        if (c.skills?.[skillId]) {
          sum += c.skills[skillId].nivel;
          count++;
        }
      });
    });
    return { id: cat.id, promedio: count > 0 ? sum / count : 0 };
  });
  
  const strengths = categoryAverages.filter(cat => cat.promedio >= 3.5).length;
  
  // Contar gaps críticos
  let criticalGapsCount = 0;
  let totalSkillAssessments = 0;
  let expertSkillsCount = 0;

  activeCollaborators.forEach(collab => {
    Object.values(collab.skills).forEach(skillData => {
      if (skillData.nivel > 0) {
        totalSkillAssessments++;
        
        if (isCriticalGap(skillData)) {
          criticalGapsCount++;
        }
        
        // Count expert-level skills (nivel >= 4)
        if (skillData.nivel >= 4) {
          expertSkillsCount++;
        }
      }
    });
  });

  // Densidad de Expertos: % de skills en nivel 4-5
  const expertDensity = totalSkillAssessments > 0 
    ? Math.round((expertSkillsCount / totalSkillAssessments) * 100) 
    : 0;

  // Cobertura de Roles: % de colaboradores cumpliendo requisitos mínimos
  let meetingRequirements = 0;
  activeCollaborators.forEach(collab => {
    const profile = roleProfiles[collab.rol];
    if (!profile) return; // No profile = can't evaluate
    
    let criticalSkillsMet = 0;
    let totalCriticalSkills = 0;
    
    Object.entries(profile).forEach(([skillId, criticidad]) => {
      if (criticidad === 'C') {
        totalCriticalSkills++;
        const skillData = collab.skills[skillId];
        if (skillData && skillData.nivel >= 3) {
          criticalSkillsMet++;
        }
      }
    });
    
    if (totalCriticalSkills > 0 && criticalSkillsMet === totalCriticalSkills) {
      meetingRequirements++;
    }
  });
  
  const roleCoverage = activeCollaborators.length > 0
    ? Math.round((meetingRequirements / activeCollaborators.length) * 100)
    : 0;

  return {
    teamAverage: totalAvg.toFixed(1),
    teamAverageRaw: totalAvg,
    strengths,
    criticalGaps: criticalGapsCount,
    teamSize: activeCollaborators.length,
    totalSkills: skills.length,
    totalCategories: categories.length,
    expertDensity,
    roleCoverage
  };
}

/**
 * Calcula la distribución de talento por categoría para gráfico apilado
 */
export function calculateDistributionByCategory(collaborators, skills, categories) {
  return categories.map(cat => {
    // 1. Dynamic Category Generation (Iterates over 'categories' prop)
    const catSkillIds = skills.filter(s => s.categoria === cat.id).map(s => s.id);
    
    let brechas = 0;
    let competent = 0;
    let experts = 0;
    let total = 0;
    
    collaborators.forEach(collab => {
      catSkillIds.forEach(skillId => {
        const skillData = collab.skills[skillId];
        
        // Only evaluate if there is actual data
        if (skillData && skillData.nivel > 0) {
          total++;
          
          // 2. Weighted Logic Verification (Uses evaluarSkill)
          // We default frequency to 'M' if missing, consistent with skillsLogic
          const freq = skillData.frecuencia || 'M';
          const evaluation = evaluarSkill(skillData.nivel, freq, skillData.criticidad);

          // 3. Status Mapping to Visual Buckets
          if (evaluation.estado === "BRECHA CRÍTICA" || evaluation.estado === "ÁREA DE MEJORA") {
            brechas++;
          } else if (evaluation.estado === "FORTALEZA") {
            experts++;
          } else {
            // "COMPETENTE" (Includes low level but low criticality items)
            competent++; 
          }
        }
      });
    });
    
    return {
      name: cat.abrev || cat.nombre.slice(0, 12),
      fullName: cat.nombre,
      brechas,
      competent,
      experts,
      total
    };
  });
}

/**
 * Calcula deltas entre métricas actuales y snapshot histórico
 */
export function calculateComparisonDeltas(currentMetrics, historicalMetrics) {
  if (!historicalMetrics) {
    return null;
  }
  
  return {
    teamAverageRaw: historicalMetrics.teamAverageRaw,
    criticalGaps: historicalMetrics.criticalGaps,
    expertDensity: historicalMetrics.expertDensity,
    roleCoverage: historicalMetrics.roleCoverage,
  };
}

export default {
  calculateDelta,
  getTopChanges,
  prioritizeGaps,
  calculateDistribution,
  detectUnderutilizedTalent,
  detectBusFactorRisk,
  calculateExecutiveMetrics
};
