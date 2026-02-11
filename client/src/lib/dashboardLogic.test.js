import { describe, it, expect, vi } from 'vitest';
import {
  calculateDelta,
  getTopChanges,
  prioritizeGaps,
  calculateDistribution,
  detectUnderutilizedTalent,
  detectBusFactorRisk,
  calculateExecutiveMetrics,
  calculateDistributionByCategory,
  calculateComparisonDeltas
} from './dashboardLogic';

// ============================================
// Test Fixtures (shared data builders)
// ============================================

/** Creates a collaborator with sensible defaults */
const makeCollab = (overrides = {}) => ({
  id: 1,
  nombre: 'Ana',
  rol: 'Developer',
  skills: {},
  promedio: 3.0,
  ...overrides
});

/** Creates a skill entry in a collaborator's skills map */
const makeSkillData = (overrides = {}) => ({
  nivel: 3,
  criticidad: 'I',
  frecuencia: 'M',
  ...overrides
});

/** Creates a skill definition */
const makeSkill = (overrides = {}) => ({
  id: 1,
  nombre: 'JavaScript',
  categoria: 1,
  ...overrides
});

/** Creates a category definition */
const makeCategory = (overrides = {}) => ({
  id: 1,
  nombre: 'Frontend',
  abrev: 'FE',
  ...overrides
});

// ============================================
// calculateDelta
// ============================================
describe('calculateDelta', () => {
  it('should detect upward trend when delta > 0.05', () => {
    const result = calculateDelta(3.5, 3.0);
    expect(result.delta).toBe('0.5');
    expect(result.deltaRaw).toBeCloseTo(0.5);
    expect(result.trend).toBe('up');
    expect(result.percentage).toBe('16.7');
  });

  it('should detect downward trend when delta < -0.05', () => {
    const result = calculateDelta(2.5, 3.0);
    expect(result.delta).toBe('-0.5');
    expect(result.deltaRaw).toBeCloseTo(-0.5);
    expect(result.trend).toBe('down');
    expect(result.percentage).toBe('-16.7');
  });

  it('should detect stable trend when delta is within +-0.05', () => {
    const result = calculateDelta(3.02, 3.0);
    expect(result.trend).toBe('stable');
  });

  it('should return stable for exactly equal values', () => {
    const result = calculateDelta(4.0, 4.0);
    expect(result.delta).toBe('0.0');
    expect(result.deltaRaw).toBe(0);
    expect(result.trend).toBe('stable');
    expect(result.percentage).toBe('0.0');
  });

  it('should return 0 percentage when previous is 0', () => {
    const result = calculateDelta(3.0, 0);
    expect(result.percentage).toBe('0.0');
    expect(result.delta).toBe('3.0');
    expect(result.trend).toBe('up');
  });

  it('should handle both values being 0', () => {
    const result = calculateDelta(0, 0);
    expect(result.delta).toBe('0.0');
    expect(result.percentage).toBe('0.0');
    expect(result.trend).toBe('stable');
  });

  it('should treat boundary +0.05 as stable', () => {
    const result = calculateDelta(3.05, 3.0);
    expect(result.trend).toBe('stable');
  });

  it('should treat boundary -0.05 as stable', () => {
    const result = calculateDelta(2.95, 3.0);
    expect(result.trend).toBe('stable');
  });

  it('should detect up just above +0.05 boundary', () => {
    const result = calculateDelta(3.06, 3.0);
    expect(result.trend).toBe('up');
  });

  it('should detect down just below -0.05 boundary', () => {
    const result = calculateDelta(2.94, 3.0);
    expect(result.trend).toBe('down');
  });

  it('should handle large values', () => {
    const result = calculateDelta(100, 50);
    expect(result.delta).toBe('50.0');
    expect(result.percentage).toBe('100.0');
    expect(result.trend).toBe('up');
  });

  it('should handle negative values', () => {
    const result = calculateDelta(-1.0, -2.0);
    expect(result.delta).toBe('1.0');
    expect(result.trend).toBe('up');
  });
});

// ============================================
// getTopChanges
// ============================================
describe('getTopChanges', () => {
  const categories = [
    { id: 1, nombre: 'Frontend', promedioActual: 4.0, promedioAnterior: 3.0 },
    { id: 2, nombre: 'Backend', promedioActual: 2.5, promedioAnterior: 3.5 },
    { id: 3, nombre: 'DevOps', promedioActual: 3.5, promedioAnterior: 3.5 },
    { id: 4, nombre: 'Design', promedioActual: 4.5, promedioAnterior: 3.8 },
    { id: 5, nombre: 'QA', promedioActual: 2.0, promedioAnterior: 2.8 },
  ];

  it('should return improvements sorted by delta descending', () => {
    const { improvements } = getTopChanges(categories);
    expect(improvements.length).toBe(2);
    expect(improvements[0].nombre).toBe('Frontend');
    expect(improvements[0].delta).toBeCloseTo(1.0);
    expect(improvements[1].nombre).toBe('Design');
    expect(improvements[1].delta).toBeCloseTo(0.7);
  });

  it('should return regressions sorted by delta ascending (most negative first)', () => {
    const { regressions } = getTopChanges(categories);
    expect(regressions.length).toBe(2);
    expect(regressions[0].nombre).toBe('Backend');
    expect(regressions[0].delta).toBeCloseTo(-1.0);
    expect(regressions[1].nombre).toBe('QA');
    expect(regressions[1].delta).toBeCloseTo(-0.8);
  });

  it('should exclude items with zero delta from both lists', () => {
    const { improvements, regressions } = getTopChanges(categories);
    const allNames = [...improvements, ...regressions].map(c => c.nombre);
    expect(allNames).not.toContain('DevOps');
  });

  it('should respect the limit parameter', () => {
    const { improvements, regressions } = getTopChanges(categories, 1);
    expect(improvements.length).toBe(1);
    expect(regressions.length).toBe(1);
  });

  it('should handle empty categories array', () => {
    const { improvements, regressions } = getTopChanges([]);
    expect(improvements).toEqual([]);
    expect(regressions).toEqual([]);
  });

  it('should handle all categories with same value (no changes)', () => {
    const unchanged = [
      { id: 1, nombre: 'A', promedioActual: 3.0, promedioAnterior: 3.0 },
      { id: 2, nombre: 'B', promedioActual: 4.0, promedioAnterior: 4.0 },
    ];
    const { improvements, regressions } = getTopChanges(unchanged);
    expect(improvements).toEqual([]);
    expect(regressions).toEqual([]);
  });

  it('should handle single category with improvement', () => {
    const single = [{ id: 1, nombre: 'Solo', promedioActual: 5.0, promedioAnterior: 1.0 }];
    const { improvements, regressions } = getTopChanges(single);
    expect(improvements.length).toBe(1);
    expect(improvements[0].delta).toBeCloseTo(4.0);
    expect(regressions).toEqual([]);
  });

  it('should use default limit of 3', () => {
    const manyImproved = Array.from({ length: 5 }, (_, i) => ({
      id: i + 1,
      nombre: `Cat${i}`,
      promedioActual: 4.0 + i * 0.1,
      promedioAnterior: 1.0,
    }));
    const { improvements } = getTopChanges(manyImproved);
    expect(improvements.length).toBe(3);
  });

  it('should include current and previous in each change object', () => {
    const { improvements } = getTopChanges(categories);
    expect(improvements[0]).toHaveProperty('current');
    expect(improvements[0]).toHaveProperty('previous');
    expect(improvements[0]).toHaveProperty('id');
  });
});

// ============================================
// prioritizeGaps
// ============================================
describe('prioritizeGaps', () => {
  const isCriticalGap = (skillData) => {
    if (!skillData) return false;
    return skillData.nivel < 3 && skillData.criticidad === 'C';
  };

  it('should identify and score gaps by frequency * criticality weights', () => {
    const collaborators = [
      makeCollab({
        id: 1, nombre: 'Ana',
        skills: {
          1: makeSkillData({ nivel: 2, criticidad: 'C', frecuencia: 'D' }), // 4*3 = 12
        }
      })
    ];
    const skills = [makeSkill({ id: 1, categoria: 1 })];
    const categories = [makeCategory({ id: 1, nombre: 'Frontend' })];

    const result = prioritizeGaps(collaborators, skills, categories, isCriticalGap);
    expect(result.length).toBe(1);
    expect(result[0].categoria).toBe('Frontend');
    expect(result[0].impactScore).toBe(12); // D=4 * C=3
    expect(result[0].afectados).toBe(1);
    expect(result[0].skillsAfectados).toBe(1);
  });

  it('should sort gaps by impactScore descending', () => {
    const collaborators = [
      makeCollab({
        id: 1, nombre: 'Ana',
        skills: {
          1: makeSkillData({ nivel: 1, criticidad: 'C', frecuencia: 'D' }), // FE: 12
          2: makeSkillData({ nivel: 2, criticidad: 'C', frecuencia: 'S' }), // BE: 9
        }
      })
    ];
    const skills = [
      makeSkill({ id: 1, categoria: 1 }),
      makeSkill({ id: 2, categoria: 2 }),
    ];
    const categories = [
      makeCategory({ id: 1, nombre: 'Frontend' }),
      makeCategory({ id: 2, nombre: 'Backend' }),
    ];

    const result = prioritizeGaps(collaborators, skills, categories, isCriticalGap);
    expect(result.length).toBe(2);
    expect(result[0].categoria).toBe('Frontend');
    expect(result[0].impactScore).toBe(12);
    expect(result[1].categoria).toBe('Backend');
    expect(result[1].impactScore).toBe(9);
  });

  it('should assign severity levels based on impactScore', () => {
    const collaborators = [
      makeCollab({
        id: 1, nombre: 'Ana',
        skills: {
          1: makeSkillData({ nivel: 1, criticidad: 'C', frecuencia: 'D' }), // 12 > 10 => warning
        }
      }),
      makeCollab({
        id: 2, nombre: 'Bob',
        skills: {
          1: makeSkillData({ nivel: 2, criticidad: 'C', frecuencia: 'D' }), // 12 => total 24 > 20 => critical
        }
      })
    ];
    const skills = [makeSkill({ id: 1, categoria: 1 })];
    const categories = [makeCategory({ id: 1, nombre: 'Frontend' })];

    const result = prioritizeGaps(collaborators, skills, categories, isCriticalGap);
    expect(result[0].impactScore).toBe(24);
    expect(result[0].severidad).toBe('critical');
  });

  it('should assign warning severity for impactScore 11-20', () => {
    const collaborators = [
      makeCollab({
        id: 1, nombre: 'Ana',
        skills: {
          1: makeSkillData({ nivel: 2, criticidad: 'C', frecuencia: 'D' }), // 12
        }
      })
    ];
    const skills = [makeSkill({ id: 1, categoria: 1 })];
    const categories = [makeCategory({ id: 1, nombre: 'Frontend' })];

    const result = prioritizeGaps(collaborators, skills, categories, isCriticalGap);
    expect(result[0].severidad).toBe('warning');
  });

  it('should assign info severity for impactScore <= 10', () => {
    const collaborators = [
      makeCollab({
        id: 1, nombre: 'Ana',
        skills: {
          1: makeSkillData({ nivel: 2, criticidad: 'C', frecuencia: 'T' }), // T=1, C=3 => 3
        }
      })
    ];
    const skills = [makeSkill({ id: 1, categoria: 1 })];
    const categories = [makeCategory({ id: 1, nombre: 'Frontend' })];

    const result = prioritizeGaps(collaborators, skills, categories, isCriticalGap);
    expect(result[0].impactScore).toBe(3);
    expect(result[0].severidad).toBe('info');
  });

  it('should track unique affected collaborator names', () => {
    const collaborators = [
      makeCollab({
        id: 1, nombre: 'Ana',
        skills: {
          1: makeSkillData({ nivel: 1, criticidad: 'C', frecuencia: 'D' }),
          2: makeSkillData({ nivel: 2, criticidad: 'C', frecuencia: 'S' }),
        }
      })
    ];
    const skills = [
      makeSkill({ id: 1, categoria: 1 }),
      makeSkill({ id: 2, categoria: 1 }),
    ];
    const categories = [makeCategory({ id: 1, nombre: 'Frontend' })];

    const result = prioritizeGaps(collaborators, skills, categories, isCriticalGap);
    // Ana appears twice in same category but should be counted only once
    expect(result[0].afectados).toBe(1);
    expect(result[0].colaboradores).toEqual(['Ana']);
    expect(result[0].skillsAfectados).toBe(2);
  });

  it('should return empty array when no gaps exist', () => {
    const collaborators = [
      makeCollab({
        id: 1, nombre: 'Expert',
        skills: {
          1: makeSkillData({ nivel: 5, criticidad: 'C', frecuencia: 'D' }),
        }
      })
    ];
    const skills = [makeSkill({ id: 1, categoria: 1 })];
    const categories = [makeCategory({ id: 1 })];

    const result = prioritizeGaps(collaborators, skills, categories, isCriticalGap);
    expect(result).toEqual([]);
  });

  it('should return empty array for empty collaborators', () => {
    const skills = [makeSkill({ id: 1, categoria: 1 })];
    const categories = [makeCategory({ id: 1 })];
    const result = prioritizeGaps([], skills, categories, isCriticalGap);
    expect(result).toEqual([]);
  });

  it('should return empty array for empty skills', () => {
    const collaborators = [makeCollab({ skills: { 1: makeSkillData({ nivel: 1, criticidad: 'C' }) } })];
    const categories = [makeCategory({ id: 1 })];
    const result = prioritizeGaps(collaborators, [], categories, isCriticalGap);
    expect(result).toEqual([]);
  });

  it('should return empty array for empty categories', () => {
    const collaborators = [makeCollab({ skills: { 1: makeSkillData({ nivel: 1, criticidad: 'C' }) } })];
    const skills = [makeSkill({ id: 1, categoria: 1 })];
    const result = prioritizeGaps(collaborators, skills, [], isCriticalGap);
    expect(result).toEqual([]);
  });

  it('should handle frequency N with zero weight', () => {
    const collaborators = [
      makeCollab({
        id: 1, nombre: 'Ana',
        skills: {
          1: makeSkillData({ nivel: 1, criticidad: 'C', frecuencia: 'N' }), // N=0 * C=3 = 0
        }
      })
    ];
    const skills = [makeSkill({ id: 1, categoria: 1 })];
    const categories = [makeCategory({ id: 1, nombre: 'Frontend' })];

    const result = prioritizeGaps(collaborators, skills, categories, isCriticalGap);
    expect(result[0].impactScore).toBe(0);
  });

  it('should handle missing skill data gracefully via isCriticalGap', () => {
    // The isCriticalGap returns false for null/undefined
    const collaborators = [
      makeCollab({ id: 1, nombre: 'Ana', skills: {} })
    ];
    const skills = [makeSkill({ id: 1, categoria: 1 })];
    const categories = [makeCategory({ id: 1 })];

    const result = prioritizeGaps(collaborators, skills, categories, isCriticalGap);
    expect(result).toEqual([]);
  });
});

// ============================================
// calculateDistribution
// ============================================
describe('calculateDistribution', () => {
  // Thresholds from source: beginner < 2.5, competent 2.5-3.5, expert > 3.5

  it('should classify beginner (promedio < 2.5)', () => {
    const collabs = [makeCollab({ nombre: 'Newbie', promedio: 1.5 })];
    const dist = calculateDistribution(collabs);
    expect(dist.beginners.count).toBe(1);
    expect(dist.beginners.names).toContain('Newbie');
    expect(dist.competent.count).toBe(0);
    expect(dist.experts.count).toBe(0);
  });

  it('should classify competent (2.5 <= promedio <= 3.5)', () => {
    const collabs = [makeCollab({ nombre: 'Mid', promedio: 3.0 })];
    const dist = calculateDistribution(collabs);
    expect(dist.competent.count).toBe(1);
    expect(dist.competent.names).toContain('Mid');
  });

  it('should classify expert (promedio > 3.5)', () => {
    const collabs = [makeCollab({ nombre: 'Pro', promedio: 4.5 })];
    const dist = calculateDistribution(collabs);
    expect(dist.experts.count).toBe(1);
    expect(dist.experts.names).toContain('Pro');
  });

  it('should handle boundary at 2.5 (competent threshold)', () => {
    const collabs = [makeCollab({ nombre: 'Boundary', promedio: 2.5 })];
    const dist = calculateDistribution(collabs);
    // 2.5 is NOT < 2.5, so goes to competent branch (avg <= 3.5)
    expect(dist.competent.count).toBe(1);
    expect(dist.beginners.count).toBe(0);
  });

  it('should handle boundary at 3.5 (expert threshold)', () => {
    const collabs = [makeCollab({ nombre: 'Upper', promedio: 3.5 })];
    const dist = calculateDistribution(collabs);
    // 3.5 is NOT < 2.5, and 3.5 <= 3.5, so competent
    expect(dist.competent.count).toBe(1);
    expect(dist.experts.count).toBe(0);
  });

  it('should classify just above 3.5 as expert', () => {
    const collabs = [makeCollab({ nombre: 'AlmostPro', promedio: 3.6 })];
    const dist = calculateDistribution(collabs);
    expect(dist.experts.count).toBe(1);
  });

  it('should distribute multiple collaborators correctly', () => {
    const collabs = [
      makeCollab({ nombre: 'A', promedio: 1.0 }),
      makeCollab({ nombre: 'B', promedio: 2.0 }),
      makeCollab({ nombre: 'C', promedio: 3.0 }),
      makeCollab({ nombre: 'D', promedio: 4.0 }),
      makeCollab({ nombre: 'E', promedio: 5.0 }),
    ];
    const dist = calculateDistribution(collabs);
    expect(dist.beginners.count).toBe(2); // 1.0, 2.0
    expect(dist.competent.count).toBe(1); // 3.0
    expect(dist.experts.count).toBe(2);   // 4.0, 5.0
  });

  it('should handle empty collaborators array', () => {
    const dist = calculateDistribution([]);
    expect(dist.beginners.count).toBe(0);
    expect(dist.competent.count).toBe(0);
    expect(dist.experts.count).toBe(0);
    expect(dist.beginners.names).toEqual([]);
  });

  it('should handle promedio of 0', () => {
    const collabs = [makeCollab({ nombre: 'Zero', promedio: 0 })];
    const dist = calculateDistribution(collabs);
    expect(dist.beginners.count).toBe(1);
  });

  it('should collect names in the correct buckets', () => {
    const collabs = [
      makeCollab({ nombre: 'Alice', promedio: 1.0 }),
      makeCollab({ nombre: 'Bob', promedio: 1.5 }),
      makeCollab({ nombre: 'Charlie', promedio: 3.0 }),
    ];
    const dist = calculateDistribution(collabs);
    expect(dist.beginners.names).toEqual(['Alice', 'Bob']);
    expect(dist.competent.names).toEqual(['Charlie']);
  });
});

// ============================================
// detectUnderutilizedTalent
// ============================================
describe('detectUnderutilizedTalent', () => {
  it('should detect high skill (>=4) in low criticality (D or N)', () => {
    const collabs = [
      makeCollab({
        nombre: 'Ana',
        skills: {
          1: makeSkillData({ nivel: 4, criticidad: 'D', frecuencia: 'M' }),
        }
      })
    ];
    const skills = [makeSkill({ id: 1, nombre: 'Design Patterns' })];

    const insights = detectUnderutilizedTalent(collabs, skills);
    expect(insights.length).toBe(1);
    expect(insights[0].type).toBe('underutilized');
    expect(insights[0].colaborador).toBe('Ana');
    expect(insights[0].skill).toBe('Design Patterns');
    expect(insights[0].nivel).toBe(4);
    expect(insights[0].criticidad).toBe('D');
    expect(insights[0].suggestion).toBeTruthy();
  });

  it('should detect with criticidad N', () => {
    const collabs = [
      makeCollab({
        nombre: 'Bob',
        skills: { 1: makeSkillData({ nivel: 5, criticidad: 'N' }) }
      })
    ];
    const skills = [makeSkill({ id: 1, nombre: 'Obsolete Tech' })];

    const insights = detectUnderutilizedTalent(collabs, skills);
    expect(insights.length).toBe(1);
    expect(insights[0].criticidad).toBe('N');
  });

  it('should NOT detect when criticidad is C or I', () => {
    const collabs = [
      makeCollab({
        nombre: 'Ana',
        skills: {
          1: makeSkillData({ nivel: 5, criticidad: 'C' }),
          2: makeSkillData({ nivel: 4, criticidad: 'I' }),
        }
      })
    ];
    const skills = [
      makeSkill({ id: 1, nombre: 'JS' }),
      makeSkill({ id: 2, nombre: 'TS' }),
    ];

    const insights = detectUnderutilizedTalent(collabs, skills);
    expect(insights).toEqual([]);
  });

  it('should NOT detect when nivel < 4', () => {
    const collabs = [
      makeCollab({
        nombre: 'Low',
        skills: { 1: makeSkillData({ nivel: 3, criticidad: 'D' }) }
      })
    ];
    const skills = [makeSkill({ id: 1, nombre: 'X' })];

    const insights = detectUnderutilizedTalent(collabs, skills);
    expect(insights).toEqual([]);
  });

  it('should detect exactly nivel 4 (boundary)', () => {
    const collabs = [
      makeCollab({
        nombre: 'Boundary',
        skills: { 1: makeSkillData({ nivel: 4, criticidad: 'N' }) }
      })
    ];
    const skills = [makeSkill({ id: 1, nombre: 'Skill' })];

    const insights = detectUnderutilizedTalent(collabs, skills);
    expect(insights.length).toBe(1);
  });

  it('should skip skill if not found in skills list', () => {
    const collabs = [
      makeCollab({
        nombre: 'Ghost',
        skills: { 999: makeSkillData({ nivel: 5, criticidad: 'D' }) }
      })
    ];
    const skills = [makeSkill({ id: 1, nombre: 'Only Skill' })];

    const insights = detectUnderutilizedTalent(collabs, skills);
    expect(insights).toEqual([]);
  });

  it('should handle empty collaborators', () => {
    const skills = [makeSkill({ id: 1 })];
    expect(detectUnderutilizedTalent([], skills)).toEqual([]);
  });

  it('should handle empty skills list', () => {
    const collabs = [
      makeCollab({
        skills: { 1: makeSkillData({ nivel: 5, criticidad: 'D' }) }
      })
    ];
    expect(detectUnderutilizedTalent(collabs, [])).toEqual([]);
  });

  it('should detect multiple insights across collaborators', () => {
    const collabs = [
      makeCollab({
        nombre: 'Ana',
        skills: { 1: makeSkillData({ nivel: 5, criticidad: 'D' }) }
      }),
      makeCollab({
        nombre: 'Bob',
        skills: { 2: makeSkillData({ nivel: 4, criticidad: 'N' }) }
      })
    ];
    const skills = [
      makeSkill({ id: 1, nombre: 'A' }),
      makeSkill({ id: 2, nombre: 'B' }),
    ];

    const insights = detectUnderutilizedTalent(collabs, skills);
    expect(insights.length).toBe(2);
    expect(insights.map(i => i.colaborador)).toEqual(['Ana', 'Bob']);
  });

  it('should handle collaborator with no skills', () => {
    const collabs = [makeCollab({ nombre: 'Empty', skills: {} })];
    const skills = [makeSkill({ id: 1 })];
    expect(detectUnderutilizedTalent(collabs, skills)).toEqual([]);
  });
});

// ============================================
// detectBusFactorRisk
// ============================================
describe('detectBusFactorRisk', () => {
  it('should detect risk when exactly 1 person has high level in critical skill', () => {
    const collabs = [
      makeCollab({
        nombre: 'Solo Expert',
        skills: { 1: makeSkillData({ nivel: 4, criticidad: 'C' }) }
      }),
      makeCollab({
        nombre: 'Others',
        skills: { 1: makeSkillData({ nivel: 2, criticidad: 'C' }) }
      })
    ];
    const skills = [makeSkill({ id: 1, nombre: 'Kubernetes' })];

    const risks = detectBusFactorRisk(collabs, skills);
    expect(risks.length).toBe(1);
    expect(risks[0].type).toBe('busFactor');
    expect(risks[0].skill).toBe('Kubernetes');
    expect(risks[0].expert).toBe('Solo Expert');
    expect(risks[0].nivel).toBe(4);
    expect(risks[0].suggestion).toBeTruthy();
  });

  it('should NOT detect risk when 2+ people have high level in critical skill', () => {
    const collabs = [
      makeCollab({
        nombre: 'Expert1',
        skills: { 1: makeSkillData({ nivel: 5, criticidad: 'C' }) }
      }),
      makeCollab({
        nombre: 'Expert2',
        skills: { 1: makeSkillData({ nivel: 4, criticidad: 'C' }) }
      })
    ];
    const skills = [makeSkill({ id: 1, nombre: 'Kubernetes' })];

    const risks = detectBusFactorRisk(collabs, skills);
    expect(risks).toEqual([]);
  });

  it('should NOT detect risk when 0 people are experts in critical skill', () => {
    const collabs = [
      makeCollab({
        nombre: 'A',
        skills: { 1: makeSkillData({ nivel: 3, criticidad: 'C' }) }
      }),
    ];
    const skills = [makeSkill({ id: 1, nombre: 'Docker' })];

    const risks = detectBusFactorRisk(collabs, skills);
    expect(risks).toEqual([]);
  });

  it('should NOT detect risk for non-critical skills (criticidad != C)', () => {
    const collabs = [
      makeCollab({
        nombre: 'Expert',
        skills: { 1: makeSkillData({ nivel: 5, criticidad: 'I' }) }
      })
    ];
    const skills = [makeSkill({ id: 1, nombre: 'Nice to have' })];

    const risks = detectBusFactorRisk(collabs, skills);
    expect(risks).toEqual([]);
  });

  it('should handle missing skill data for a collaborator', () => {
    const collabs = [
      makeCollab({
        nombre: 'HasIt',
        skills: { 1: makeSkillData({ nivel: 5, criticidad: 'C' }) }
      }),
      makeCollab({ nombre: 'NoSkill', skills: {} }),
    ];
    const skills = [makeSkill({ id: 1, nombre: 'Critical' })];

    const risks = detectBusFactorRisk(collabs, skills);
    expect(risks.length).toBe(1);
    expect(risks[0].expert).toBe('HasIt');
  });

  it('should detect multiple bus factor risks across different skills', () => {
    const collabs = [
      makeCollab({
        nombre: 'Ana',
        skills: {
          1: makeSkillData({ nivel: 5, criticidad: 'C' }),
          2: makeSkillData({ nivel: 2, criticidad: 'C' }),
        }
      }),
      makeCollab({
        nombre: 'Bob',
        skills: {
          1: makeSkillData({ nivel: 2, criticidad: 'C' }),
          2: makeSkillData({ nivel: 4, criticidad: 'C' }),
        }
      })
    ];
    const skills = [
      makeSkill({ id: 1, nombre: 'Skill A' }),
      makeSkill({ id: 2, nombre: 'Skill B' }),
    ];

    const risks = detectBusFactorRisk(collabs, skills);
    expect(risks.length).toBe(2);
    expect(risks.map(r => r.skill).sort()).toEqual(['Skill A', 'Skill B']);
  });

  it('should handle empty collaborators', () => {
    const skills = [makeSkill({ id: 1, nombre: 'X' })];
    expect(detectBusFactorRisk([], skills)).toEqual([]);
  });

  it('should handle empty skills', () => {
    const collabs = [makeCollab({ skills: { 1: makeSkillData({ nivel: 5, criticidad: 'C' }) } })];
    expect(detectBusFactorRisk(collabs, [])).toEqual([]);
  });

  it('should require nivel >= 4 (boundary test nivel=3 should not count)', () => {
    const collabs = [
      makeCollab({
        nombre: 'AlmostExpert',
        skills: { 1: makeSkillData({ nivel: 3, criticidad: 'C' }) }
      })
    ];
    const skills = [makeSkill({ id: 1, nombre: 'Skill' })];

    const risks = detectBusFactorRisk(collabs, skills);
    expect(risks).toEqual([]);
  });
});

// ============================================
// calculateExecutiveMetrics
// ============================================
describe('calculateExecutiveMetrics', () => {
  const isCriticalGap = (skillData) => {
    if (!skillData) return false;
    return skillData.nivel < 3 && skillData.criticidad === 'C';
  };

  it('should calculate team average from collaborator skills', () => {
    const collabs = [
      makeCollab({ skills: { 1: makeSkillData({ nivel: 4 }), 2: makeSkillData({ nivel: 2 }) } }),
      makeCollab({ skills: { 1: makeSkillData({ nivel: 3 }), 2: makeSkillData({ nivel: 5 }) } }),
    ];
    const skills = [makeSkill({ id: 1, categoria: 1 }), makeSkill({ id: 2, categoria: 1 })];
    const categories = [makeCategory({ id: 1 })];

    const result = calculateExecutiveMetrics(collabs, skills, categories, isCriticalGap);
    // Collab 1 avg: (4+2)/2=3, Collab 2 avg: (3+5)/2=4, team avg: (3+4)/2=3.5
    expect(result.teamAverageRaw).toBeCloseTo(3.5);
    expect(result.teamAverage).toBe('3.5');
  });

  it('should count strengths (categories with avg >= 3.5)', () => {
    const collabs = [
      makeCollab({
        skills: {
          1: makeSkillData({ nivel: 4 }),  // Cat 1 avg = 4
          2: makeSkillData({ nivel: 2 }),  // Cat 2 avg = 2
        }
      })
    ];
    const skills = [
      makeSkill({ id: 1, categoria: 1 }),
      makeSkill({ id: 2, categoria: 2 }),
    ];
    const categories = [
      makeCategory({ id: 1, nombre: 'Strong' }),
      makeCategory({ id: 2, nombre: 'Weak' }),
    ];

    const result = calculateExecutiveMetrics(collabs, skills, categories, isCriticalGap);
    expect(result.strengths).toBe(1);
  });

  it('should count critical gaps', () => {
    const collabs = [
      makeCollab({
        skills: {
          1: makeSkillData({ nivel: 1, criticidad: 'C' }), // critical gap
          2: makeSkillData({ nivel: 4, criticidad: 'C' }), // not a gap
        }
      })
    ];
    const skills = [makeSkill({ id: 1, categoria: 1 }), makeSkill({ id: 2, categoria: 1 })];
    const categories = [makeCategory({ id: 1 })];

    const result = calculateExecutiveMetrics(collabs, skills, categories, isCriticalGap);
    expect(result.criticalGaps).toBe(1);
  });

  it('should calculate expert density (% of skills at nivel >= 4)', () => {
    const collabs = [
      makeCollab({
        skills: {
          1: makeSkillData({ nivel: 4 }), // expert
          2: makeSkillData({ nivel: 5 }), // expert
          3: makeSkillData({ nivel: 2 }), // not expert
          4: makeSkillData({ nivel: 3 }), // not expert
        }
      })
    ];
    const skills = [1, 2, 3, 4].map(id => makeSkill({ id, categoria: 1 }));
    const categories = [makeCategory({ id: 1 })];

    const result = calculateExecutiveMetrics(collabs, skills, categories, isCriticalGap);
    expect(result.expertDensity).toBe(50); // 2 of 4
  });

  it('should calculate role coverage', () => {
    const roleProfiles = {
      Developer: { 1: 'C', 2: 'C' }
    };
    const collabs = [
      makeCollab({
        id: 1, nombre: 'Good Dev', rol: 'Developer',
        skills: {
          1: makeSkillData({ nivel: 3 }),
          2: makeSkillData({ nivel: 4 }),
        }
      }),
      makeCollab({
        id: 2, nombre: 'Bad Dev', rol: 'Developer',
        skills: {
          1: makeSkillData({ nivel: 2 }), // fails critical requirement
          2: makeSkillData({ nivel: 4 }),
        }
      })
    ];
    const skills = [makeSkill({ id: 1, categoria: 1 }), makeSkill({ id: 2, categoria: 1 })];
    const categories = [makeCategory({ id: 1 })];

    const result = calculateExecutiveMetrics(collabs, skills, categories, isCriticalGap, roleProfiles);
    // 1 of 2 meets requirements => 50%
    expect(result.roleCoverage).toBe(50);
  });

  it('should return 0 role coverage when no role profiles provided', () => {
    const collabs = [
      makeCollab({
        skills: { 1: makeSkillData({ nivel: 5 }) }
      })
    ];
    const skills = [makeSkill({ id: 1, categoria: 1 })];
    const categories = [makeCategory({ id: 1 })];

    const result = calculateExecutiveMetrics(collabs, skills, categories, isCriticalGap);
    expect(result.roleCoverage).toBe(0);
  });

  it('should return correct metadata counts', () => {
    const collabs = [makeCollab({ skills: {} }), makeCollab({ skills: {} })];
    const skills = [makeSkill({ id: 1 }), makeSkill({ id: 2 }), makeSkill({ id: 3 })];
    const categories = [makeCategory({ id: 1 }), makeCategory({ id: 2 })];

    const result = calculateExecutiveMetrics(collabs, skills, categories, isCriticalGap);
    expect(result.teamSize).toBe(2);
    expect(result.totalSkills).toBe(3);
    expect(result.totalCategories).toBe(2);
  });

  it('should handle empty collaborators', () => {
    const result = calculateExecutiveMetrics([], [], [], isCriticalGap);
    expect(result.teamAverage).toBe('0.0');
    expect(result.teamAverageRaw).toBe(0);
    expect(result.strengths).toBe(0);
    expect(result.criticalGaps).toBe(0);
    expect(result.expertDensity).toBe(0);
    expect(result.roleCoverage).toBe(0);
    expect(result.teamSize).toBe(0);
  });

  it('should skip skills with nivel 0 in expert density and gap counting', () => {
    const collabs = [
      makeCollab({
        skills: {
          1: makeSkillData({ nivel: 0, criticidad: 'C' }), // should be skipped
          2: makeSkillData({ nivel: 4, criticidad: 'I' }),  // counted
        }
      })
    ];
    const skills = [makeSkill({ id: 1, categoria: 1 }), makeSkill({ id: 2, categoria: 1 })];
    const categories = [makeCategory({ id: 1 })];

    const result = calculateExecutiveMetrics(collabs, skills, categories, isCriticalGap);
    expect(result.expertDensity).toBe(100); // 1 of 1 (nivel 0 skipped)
    expect(result.criticalGaps).toBe(0);    // nivel 0 is skipped entirely
  });

  it('should handle collaborator with all expert-level skills', () => {
    const collabs = [
      makeCollab({
        skills: {
          1: makeSkillData({ nivel: 5 }),
          2: makeSkillData({ nivel: 4 }),
        }
      })
    ];
    const skills = [makeSkill({ id: 1, categoria: 1 }), makeSkill({ id: 2, categoria: 1 })];
    const categories = [makeCategory({ id: 1 })];

    const result = calculateExecutiveMetrics(collabs, skills, categories, isCriticalGap);
    expect(result.expertDensity).toBe(100);
  });

  it('should handle role coverage with no critical skills in profile', () => {
    const roleProfiles = {
      Designer: { 1: 'I', 2: 'D' }  // no 'C' skills
    };
    const collabs = [
      makeCollab({
        rol: 'Designer',
        skills: { 1: makeSkillData({ nivel: 1 }), 2: makeSkillData({ nivel: 1 }) }
      })
    ];
    const skills = [makeSkill({ id: 1, categoria: 1 }), makeSkill({ id: 2, categoria: 1 })];
    const categories = [makeCategory({ id: 1 })];

    const result = calculateExecutiveMetrics(collabs, skills, categories, isCriticalGap, roleProfiles);
    // No critical skills => totalCriticalSkills=0 => condition (totalCriticalSkills > 0 && ...) is false
    // So meetingRequirements stays 0 => roleCoverage = 0%
    expect(result.roleCoverage).toBe(0);
  });
});

// ============================================
// calculateDistributionByCategory
// ============================================
describe('calculateDistributionByCategory', () => {
  it('should classify skills into brechas, competent, and experts buckets', () => {
    const collabs = [
      makeCollab({
        skills: {
          // Skill 1: nivel=1, freq=D, crit=C => BRECHA CRITICA
          1: makeSkillData({ nivel: 1, criticidad: 'C', frecuencia: 'D' }),
          // Skill 2: nivel=5, freq=D, crit=C => FORTALEZA
          2: makeSkillData({ nivel: 5, criticidad: 'C', frecuencia: 'D' }),
          // Skill 3: nivel=3.5, freq=M, crit=D => COMPETENTE
          3: makeSkillData({ nivel: 3.5, criticidad: 'D', frecuencia: 'M' }),
        }
      })
    ];
    const skills = [
      makeSkill({ id: 1, categoria: 1 }),
      makeSkill({ id: 2, categoria: 1 }),
      makeSkill({ id: 3, categoria: 1 }),
    ];
    const categories = [makeCategory({ id: 1, nombre: 'Frontend', abrev: 'FE' })];

    const result = calculateDistributionByCategory(collabs, skills, categories);
    expect(result.length).toBe(1);
    expect(result[0].name).toBe('FE');
    expect(result[0].fullName).toBe('Frontend');
    expect(result[0].brechas).toBe(1);
    expect(result[0].experts).toBe(1);
    expect(result[0].competent).toBe(1);
    expect(result[0].total).toBe(3);
  });

  it('should use abrev for name when available, otherwise truncated nombre', () => {
    const categories = [
      makeCategory({ id: 1, nombre: 'Very Long Category Name', abrev: 'VLCN' }),
      makeCategory({ id: 2, nombre: 'Another Long Name Here', abrev: undefined }),
    ];
    const skills = [
      makeSkill({ id: 1, categoria: 1 }),
      makeSkill({ id: 2, categoria: 2 }),
    ];
    const collabs = [
      makeCollab({
        skills: {
          1: makeSkillData({ nivel: 3, criticidad: 'D', frecuencia: 'M' }),
          2: makeSkillData({ nivel: 3, criticidad: 'D', frecuencia: 'M' }),
        }
      })
    ];

    const result = calculateDistributionByCategory(collabs, skills, categories);
    expect(result[0].name).toBe('VLCN');
    // When abrev is undefined/falsy, should use first 12 chars of nombre
    expect(result[1].name).toBe('Another Long');
  });

  it('should skip skills with nivel 0', () => {
    const collabs = [
      makeCollab({
        skills: {
          1: makeSkillData({ nivel: 0, criticidad: 'C', frecuencia: 'D' }),
        }
      })
    ];
    const skills = [makeSkill({ id: 1, categoria: 1 })];
    const categories = [makeCategory({ id: 1 })];

    const result = calculateDistributionByCategory(collabs, skills, categories);
    expect(result[0].total).toBe(0);
    expect(result[0].brechas).toBe(0);
  });

  it('should handle missing skill data for collaborator', () => {
    const collabs = [makeCollab({ skills: {} })];
    const skills = [makeSkill({ id: 1, categoria: 1 })];
    const categories = [makeCategory({ id: 1 })];

    const result = calculateDistributionByCategory(collabs, skills, categories);
    expect(result[0].total).toBe(0);
  });

  it('should handle empty inputs', () => {
    expect(calculateDistributionByCategory([], [], [])).toEqual([]);
  });

  it('should return one entry per category', () => {
    const categories = [
      makeCategory({ id: 1, nombre: 'A', abrev: 'A' }),
      makeCategory({ id: 2, nombre: 'B', abrev: 'B' }),
    ];
    const skills = [
      makeSkill({ id: 1, categoria: 1 }),
      makeSkill({ id: 2, categoria: 2 }),
    ];
    const collabs = [
      makeCollab({
        skills: {
          1: makeSkillData({ nivel: 3, criticidad: 'D', frecuencia: 'M' }),
          2: makeSkillData({ nivel: 4, criticidad: 'C', frecuencia: 'D' }),
        }
      })
    ];

    const result = calculateDistributionByCategory(collabs, skills, categories);
    expect(result.length).toBe(2);
    expect(result[0].name).toBe('A');
    expect(result[1].name).toBe('B');
  });

  it('should aggregate across multiple collaborators', () => {
    const collabs = [
      makeCollab({
        nombre: 'Ana',
        skills: { 1: makeSkillData({ nivel: 1, criticidad: 'C', frecuencia: 'D' }) } // BRECHA
      }),
      makeCollab({
        nombre: 'Bob',
        skills: { 1: makeSkillData({ nivel: 5, criticidad: 'C', frecuencia: 'D' }) } // FORTALEZA
      }),
    ];
    const skills = [makeSkill({ id: 1, categoria: 1 })];
    const categories = [makeCategory({ id: 1, nombre: 'Cat', abrev: 'C' })];

    const result = calculateDistributionByCategory(collabs, skills, categories);
    expect(result[0].total).toBe(2);
    expect(result[0].brechas).toBe(1);
    expect(result[0].experts).toBe(1);
  });

  it('should classify AREA DE MEJORA as brechas', () => {
    // C criticidad, nivel < 3.5 but not D/S frequency => AREA DE MEJORA
    const collabs = [
      makeCollab({
        skills: {
          1: makeSkillData({ nivel: 2, criticidad: 'C', frecuencia: 'T' }), // AREA DE MEJORA
        }
      })
    ];
    const skills = [makeSkill({ id: 1, categoria: 1 })];
    const categories = [makeCategory({ id: 1 })];

    const result = calculateDistributionByCategory(collabs, skills, categories);
    expect(result[0].brechas).toBe(1);
  });

  it('should default frecuencia to M when missing', () => {
    const collabs = [
      makeCollab({
        skills: {
          1: { nivel: 3, criticidad: 'D' }, // no frecuencia
        }
      })
    ];
    const skills = [makeSkill({ id: 1, categoria: 1 })];
    const categories = [makeCategory({ id: 1 })];

    // Should not throw and should classify correctly
    const result = calculateDistributionByCategory(collabs, skills, categories);
    expect(result[0].total).toBe(1);
  });
});

// ============================================
// calculateComparisonDeltas
// ============================================
describe('calculateComparisonDeltas', () => {
  it('should return null when historicalMetrics is null', () => {
    const currentMetrics = { teamAverageRaw: 3.5, criticalGaps: 2, expertDensity: 40, roleCoverage: 60 };
    expect(calculateComparisonDeltas(currentMetrics, null)).toBeNull();
  });

  it('should return null when historicalMetrics is undefined', () => {
    const currentMetrics = { teamAverageRaw: 3.5 };
    expect(calculateComparisonDeltas(currentMetrics, undefined)).toBeNull();
  });

  it('should return historical values for comparison', () => {
    const current = { teamAverageRaw: 3.5, criticalGaps: 2, expertDensity: 40, roleCoverage: 60 };
    const historical = { teamAverageRaw: 3.0, criticalGaps: 5, expertDensity: 30, roleCoverage: 50 };

    const result = calculateComparisonDeltas(current, historical);
    expect(result).not.toBeNull();
    expect(result.teamAverageRaw).toBe(3.0);
    expect(result.criticalGaps).toBe(5);
    expect(result.expertDensity).toBe(30);
    expect(result.roleCoverage).toBe(50);
  });

  it('should handle zero values in historical metrics', () => {
    const current = { teamAverageRaw: 3.5 };
    const historical = { teamAverageRaw: 0, criticalGaps: 0, expertDensity: 0, roleCoverage: 0 };

    const result = calculateComparisonDeltas(current, historical);
    expect(result.teamAverageRaw).toBe(0);
    expect(result.criticalGaps).toBe(0);
    expect(result.expertDensity).toBe(0);
    expect(result.roleCoverage).toBe(0);
  });

  it('should handle historical metrics with same values as current', () => {
    const metrics = { teamAverageRaw: 3.5, criticalGaps: 2, expertDensity: 40, roleCoverage: 60 };
    const result = calculateComparisonDeltas(metrics, metrics);
    expect(result.teamAverageRaw).toBe(3.5);
  });
});
