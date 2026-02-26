import { describe, it, expect } from 'vitest';
import {
  STATUS_COLORS,
  SKILL_THRESHOLDS,
  getSkillLevelStatus,
  evaluarSkill,
  calculateSessionAverage,
  calculateSparkline,
  buildPreviousSnapshot,
  identifyGaps,
  identifyStrengths,
  calculateCategoryAverages,
  getTrendColor,
  calculateDelta,
} from './skillsLogic';

// ============================================
// CONSTANTS
// ============================================

describe('STATUS_COLORS', () => {
  it('should have all expected color keys', () => {
    expect(STATUS_COLORS).toHaveProperty('CRITICAL');
    expect(STATUS_COLORS).toHaveProperty('WARNING');
    expect(STATUS_COLORS).toHaveProperty('STRENGTH');
    expect(STATUS_COLORS).toHaveProperty('NEUTRAL');
    expect(STATUS_COLORS).toHaveProperty('MUTE');
  });

  it('should use tailwind color classes', () => {
    expect(STATUS_COLORS.CRITICAL).toBe('text-rose-600');
    expect(STATUS_COLORS.WARNING).toBe('text-amber-600');
    expect(STATUS_COLORS.STRENGTH).toBe('text-indigo-600');
    expect(STATUS_COLORS.NEUTRAL).toBe('text-blue-600');
    expect(STATUS_COLORS.MUTE).toBe('text-slate-400');
  });
});

describe('SKILL_THRESHOLDS', () => {
  it('should have correct threshold values', () => {
    expect(SKILL_THRESHOLDS.COMPETENT).toBe(2.5);
    expect(SKILL_THRESHOLDS.STRENGTH).toBe(3.5);
    expect(SKILL_THRESHOLDS.GOAL).toBe(4.0);
  });

  it('should maintain COMPETENT < STRENGTH < GOAL ordering', () => {
    expect(SKILL_THRESHOLDS.COMPETENT).toBeLessThan(SKILL_THRESHOLDS.STRENGTH);
    expect(SKILL_THRESHOLDS.STRENGTH).toBeLessThan(SKILL_THRESHOLDS.GOAL);
  });
});

// ============================================
// getSkillLevelStatus
// ============================================

describe('getSkillLevelStatus', () => {
  it('should return Fortaleza for score >= 3.5 (STRENGTH threshold)', () => {
    const result = getSkillLevelStatus(3.5);
    expect(result.label).toBe('Fortaleza');
    expect(result.value).toBe('strength');
    expect(result.color).toBe('#6366f1');
    expect(result.tailwindColor).toBe('text-primary');
  });

  it('should return Fortaleza for score of 5 (max)', () => {
    const result = getSkillLevelStatus(5);
    expect(result.label).toBe('Fortaleza');
    expect(result.value).toBe('strength');
  });

  it('should return Fortaleza for score of 4.0', () => {
    const result = getSkillLevelStatus(4.0);
    expect(result.label).toBe('Fortaleza');
  });

  it('should return Competente for score exactly at 2.5 (COMPETENT threshold)', () => {
    const result = getSkillLevelStatus(2.5);
    expect(result.label).toBe('Competente');
    expect(result.value).toBe('competent');
    expect(result.color).toBe('#a6ae3d');
    expect(result.tailwindColor).toBe('text-competent');
  });

  it('should return Competente for score of 3.4 (just below STRENGTH)', () => {
    const result = getSkillLevelStatus(3.4);
    expect(result.label).toBe('Competente');
    expect(result.value).toBe('competent');
  });

  it('should return Competente for score of 3.0', () => {
    const result = getSkillLevelStatus(3.0);
    expect(result.label).toBe('Competente');
  });

  it('should return Requiere Atencion for score below 2.5', () => {
    const result = getSkillLevelStatus(2.4);
    expect(result.label).toBe('Requiere Atención');
    expect(result.value).toBe('attention');
    expect(result.color).toBe('#f59e0b');
    expect(result.tailwindColor).toBe('text-warning');
  });

  it('should return Requiere Atencion for score of 0', () => {
    const result = getSkillLevelStatus(0);
    expect(result.label).toBe('Requiere Atención');
    expect(result.value).toBe('attention');
  });

  it('should return Requiere Atencion for score of 1', () => {
    const result = getSkillLevelStatus(1);
    expect(result.label).toBe('Requiere Atención');
  });

  it('should return Requiere Atencion for negative score', () => {
    const result = getSkillLevelStatus(-1);
    expect(result.label).toBe('Requiere Atención');
  });
});

// ============================================
// evaluarSkill
// ============================================

describe('evaluarSkill', () => {
  describe('BRECHA CRITICA (Critical Gap)', () => {
    it('should return BRECHA CRITICA for Critical + Daily + low level', () => {
      const result = evaluarSkill(1, 'D', 'C');
      expect(result.estado).toBe('BRECHA CRÍTICA');
      expect(result.color).toBe(STATUS_COLORS.CRITICAL);
      expect(result.accion).toBe('Capacitación urgente');
      // score = (3 * 3) + 10 = 19
      expect(result.score).toBe(19);
    });

    it('should return BRECHA CRITICA for Critical + Weekly + level 0', () => {
      const result = evaluarSkill(0, 'S', 'C');
      expect(result.estado).toBe('BRECHA CRÍTICA');
      expect(result.accion).toBe('Capacitación urgente');
      // score = (3 * 2) + 10 = 16
      expect(result.score).toBe(16);
    });

    it('should return BRECHA CRITICA for Critical + Daily + level 2 (below 3)', () => {
      const result = evaluarSkill(2, 'D', 'C');
      expect(result.estado).toBe('BRECHA CRÍTICA');
    });

    it('should return BRECHA CRITICA for Critical + Weekly + level 2.9', () => {
      const result = evaluarSkill(2.9, 'S', 'C');
      expect(result.estado).toBe('BRECHA CRÍTICA');
    });

    it('should NOT return BRECHA CRITICA for Critical + Daily + level 3 (boundary)', () => {
      const result = evaluarSkill(3, 'D', 'C');
      expect(result.estado).not.toBe('BRECHA CRÍTICA');
      // Should fall to AREA DE MEJORA since C and nivel < 3.5
      expect(result.estado).toBe('ÁREA DE MEJORA');
    });

    it('should NOT return BRECHA CRITICA for Critical + Monthly + low level', () => {
      // Frequency M is not in ['D','S']
      const result = evaluarSkill(1, 'M', 'C');
      expect(result.estado).not.toBe('BRECHA CRÍTICA');
      expect(result.estado).toBe('ÁREA DE MEJORA');
    });
  });

  describe('AREA DE MEJORA (Improvement Area)', () => {
    it('should return AREA DE MEJORA for Critical + level < 3.5 (not BRECHA CRITICA)', () => {
      // C + Monthly + level 2 -> not BRECHA CRITICA (freq not D/S), hits AREA DE MEJORA
      const result = evaluarSkill(2, 'M', 'C');
      expect(result.estado).toBe('ÁREA DE MEJORA');
      expect(result.color).toBe(STATUS_COLORS.WARNING);
      expect(result.accion).toBe('Plan de desarrollo');
      // score = 3 * 1.5 = 4.5
      expect(result.score).toBe(4.5);
    });

    it('should return AREA DE MEJORA for Critical + Daily + level 3 (between 3 and 3.5)', () => {
      // nivel >= 3 so not BRECHA CRITICA, but < 3.5 so AREA DE MEJORA
      const result = evaluarSkill(3, 'D', 'C');
      expect(result.estado).toBe('ÁREA DE MEJORA');
      // score = 3 * 3 = 9
      expect(result.score).toBe(9);
    });

    it('should return AREA DE MEJORA for Critical + level 3.4 (just below 3.5)', () => {
      const result = evaluarSkill(3.4, 'T', 'C');
      expect(result.estado).toBe('ÁREA DE MEJORA');
    });

    it('should return AREA DE MEJORA for Important + level < 3', () => {
      const result = evaluarSkill(2, 'D', 'I');
      expect(result.estado).toBe('ÁREA DE MEJORA');
      expect(result.color).toBe(STATUS_COLORS.WARNING);
      // score = 2 * 3 = 6
      expect(result.score).toBe(6);
    });

    it('should return AREA DE MEJORA for Important + level 0', () => {
      const result = evaluarSkill(0, 'S', 'I');
      expect(result.estado).toBe('ÁREA DE MEJORA');
    });

    it('should NOT return AREA DE MEJORA for Important + level 3 (boundary)', () => {
      // I + nivel 3 -> not AREA DE MEJORA (condition is nivel < 3)
      // nivel < 4 so not FORTALEZA, falls to COMPETENTE
      const result = evaluarSkill(3, 'D', 'I');
      expect(result.estado).not.toBe('ÁREA DE MEJORA');
      expect(result.estado).toBe('COMPETENTE');
    });
  });

  describe('FORTALEZA (Strength)', () => {
    it('should return FORTALEZA for level >= 4 and criticidad != N', () => {
      const result = evaluarSkill(4, 'D', 'C');
      expect(result.estado).toBe('FORTALEZA');
      expect(result.color).toBe(STATUS_COLORS.STRENGTH);
      expect(result.accion).toBe('Mentorear a otros');
      // score = 3 * 3 = 9
      expect(result.score).toBe(9);
    });

    it('should return FORTALEZA for level 5 (max) + Important', () => {
      const result = evaluarSkill(5, 'S', 'I');
      expect(result.estado).toBe('FORTALEZA');
      // score = 2 * 2 = 4
      expect(result.score).toBe(4);
    });

    it('should return FORTALEZA for level 4 + Desirable', () => {
      const result = evaluarSkill(4, 'M', 'D');
      expect(result.estado).toBe('FORTALEZA');
      // score = 1 * 1.5 = 1.5
      expect(result.score).toBe(1.5);
    });

    it('should NOT return FORTALEZA for level >= 4 but criticidad N', () => {
      const result = evaluarSkill(5, 'D', 'N');
      expect(result.estado).not.toBe('FORTALEZA');
      expect(result.estado).toBe('COMPETENTE');
    });

    it('should NOT return FORTALEZA for level 3.9 (just below 4)', () => {
      const result = evaluarSkill(3.9, 'D', 'I');
      expect(result.estado).not.toBe('FORTALEZA');
      // I + nivel 3.9 -> not AREA DE MEJORA (nivel >= 3), not FORTALEZA (nivel < 4), so COMPETENTE
      expect(result.estado).toBe('COMPETENTE');
    });
  });

  describe('COMPETENTE (default state)', () => {
    it('should return COMPETENTE for Important + level 3 (no gap, no strength)', () => {
      const result = evaluarSkill(3, 'D', 'I');
      expect(result.estado).toBe('COMPETENTE');
      expect(result.color).toBe(STATUS_COLORS.NEUTRAL);
      expect(result.score).toBe(0);
      expect(result.accion).toBe('Mantener');
    });

    it('should return COMPETENTE for Desirable + low level', () => {
      const result = evaluarSkill(1, 'D', 'D');
      expect(result.estado).toBe('COMPETENTE');
      expect(result.score).toBe(0);
    });

    it('should return COMPETENTE for Not relevant + any level', () => {
      const result = evaluarSkill(0, 'D', 'N');
      expect(result.estado).toBe('COMPETENTE');
      expect(result.score).toBe(0);
    });

    it('should return COMPETENTE for Not relevant + high level', () => {
      const result = evaluarSkill(5, 'D', 'N');
      expect(result.estado).toBe('COMPETENTE');
    });

    it('should return COMPETENTE for Desirable + level 3', () => {
      const result = evaluarSkill(3, 'S', 'D');
      expect(result.estado).toBe('COMPETENTE');
    });
  });

  describe('score calculation with weights', () => {
    it('should calculate max score for C + D: 3 * 3 = 9', () => {
      // For AREA DE MEJORA (not BRECHA since nivel=3)
      const result = evaluarSkill(3, 'D', 'C');
      expect(result.score).toBe(9);
    });

    it('should calculate score for I + S: 2 * 2 = 4', () => {
      // Important + Weekly + high level
      const result = evaluarSkill(4, 'S', 'I');
      expect(result.estado).toBe('FORTALEZA');
      expect(result.score).toBe(4);
    });

    it('should calculate score for D + T: 1 * 1 = 1', () => {
      const result = evaluarSkill(4, 'T', 'D');
      expect(result.estado).toBe('FORTALEZA');
      expect(result.score).toBe(1);
    });

    it('should calculate score 0 for N criticidad', () => {
      const result = evaluarSkill(3, 'D', 'N');
      expect(result.score).toBe(0);
    });

    it('should calculate score 0 for N frecuencia', () => {
      const result = evaluarSkill(3, 'N', 'C');
      // C + N freq + nivel 3 -> AREA DE MEJORA (C and nivel < 3.5)
      expect(result.score).toBe(0);
    });
  });

  describe('unknown/missing weight values', () => {
    it('should default to 0 weight for unknown criticidad', () => {
      const result = evaluarSkill(3, 'D', 'X');
      expect(result.estado).toBe('COMPETENTE');
      expect(result.score).toBe(0);
    });

    it('should default to 0 weight for unknown frecuencia', () => {
      const result = evaluarSkill(3, 'X', 'C');
      // C + nivel 3 < 3.5 -> AREA DE MEJORA
      expect(result.estado).toBe('ÁREA DE MEJORA');
      expect(result.score).toBe(0);
    });
  });
});

// ============================================
// calculateSessionAverage
// ============================================

describe('calculateSessionAverage', () => {
  it('should return 0 for empty array', () => {
    expect(calculateSessionAverage([])).toBe(0);
  });

  it('should return 0 for undefined/null input', () => {
    expect(calculateSessionAverage(null)).toBe(0);
    expect(calculateSessionAverage(undefined)).toBe(0);
  });

  it('should return 0 when no arguments provided', () => {
    expect(calculateSessionAverage()).toBe(0);
  });

  it('should calculate average for single assessment', () => {
    const assessments = [{ skillId: 1, nivel: 4 }];
    expect(calculateSessionAverage(assessments)).toBe(4);
  });

  it('should calculate average for multiple assessments', () => {
    const assessments = [
      { skillId: 1, nivel: 3 },
      { skillId: 2, nivel: 5 },
      { skillId: 3, nivel: 4 },
    ];
    // (3 + 5 + 4) / 3 = 4.0
    expect(calculateSessionAverage(assessments)).toBe(4);
  });

  it('should round to 1 decimal place', () => {
    const assessments = [
      { skillId: 1, nivel: 3 },
      { skillId: 2, nivel: 4 },
      { skillId: 3, nivel: 4 },
    ];
    // (3 + 4 + 4) / 3 = 3.666... -> 3.7
    expect(calculateSessionAverage(assessments)).toBe(3.7);
  });

  it('should ignore assessments with nivel 0', () => {
    const assessments = [
      { skillId: 1, nivel: 4 },
      { skillId: 2, nivel: 0 },
      { skillId: 3, nivel: 2 },
    ];
    // Only 4 and 2 count: (4 + 2) / 2 = 3.0
    expect(calculateSessionAverage(assessments)).toBe(3);
  });

  it('should ignore assessments with null/undefined nivel', () => {
    const assessments = [
      { skillId: 1, nivel: 4 },
      { skillId: 2, nivel: null },
      { skillId: 3, nivel: undefined },
    ];
    expect(calculateSessionAverage(assessments)).toBe(4);
  });

  it('should return 0 when all assessments have nivel 0', () => {
    const assessments = [
      { skillId: 1, nivel: 0 },
      { skillId: 2, nivel: 0 },
    ];
    expect(calculateSessionAverage(assessments)).toBe(0);
  });

  describe('with roleProfile filtering', () => {
    const roleProfile = {
      '1': 'C',
      '2': 'I',
      '3': 'N', // Should be excluded
      '4': 'D',
    };

    it('should exclude skills with N criticality in roleProfile', () => {
      const assessments = [
        { skillId: 1, nivel: 4 },
        { skillId: 3, nivel: 5 }, // N -> excluded
      ];
      expect(calculateSessionAverage(assessments, roleProfile)).toBe(4);
    });

    it('should include skills with C, I, D criticality', () => {
      const assessments = [
        { skillId: 1, nivel: 3 }, // C
        { skillId: 2, nivel: 5 }, // I
        { skillId: 4, nivel: 4 }, // D
      ];
      // (3 + 5 + 4) / 3 = 4.0
      expect(calculateSessionAverage(assessments, roleProfile)).toBe(4);
    });

    it('should return 0 when all skills are N in roleProfile', () => {
      const allNProfile = { '1': 'N', '2': 'N' };
      const assessments = [
        { skillId: 1, nivel: 4 },
        { skillId: 2, nivel: 5 },
      ];
      expect(calculateSessionAverage(assessments, allNProfile)).toBe(0);
    });

    it('should treat missing skillId in roleProfile as N (excluded)', () => {
      const limitedProfile = { '1': 'C' };
      const assessments = [
        { skillId: 1, nivel: 4 },
        { skillId: 99, nivel: 5 }, // Not in profile -> defaults to N -> excluded
      ];
      expect(calculateSessionAverage(assessments, limitedProfile)).toBe(4);
    });

    it('should ignore roleProfile when null', () => {
      const assessments = [
        { skillId: 1, nivel: 4 },
        { skillId: 99, nivel: 2 },
      ];
      // No filtering: (4 + 2) / 2 = 3.0
      expect(calculateSessionAverage(assessments, null)).toBe(3);
    });
  });
});

// ============================================
// calculateSparkline
// ============================================

describe('calculateSparkline', () => {
  it('should return empty points and neutral trend for empty sessions', () => {
    const result = calculateSparkline([]);
    expect(result.points).toEqual([]);
    expect(result.trend).toBe('neutral');
  });

  it('should return empty points and neutral trend for null/undefined', () => {
    expect(calculateSparkline(null)).toEqual({ points: [], trend: 'neutral' });
    expect(calculateSparkline(undefined)).toEqual({ points: [], trend: 'neutral' });
  });

  it('should return single point and neutral trend for 1 session', () => {
    const sessions = [
      { evaluatedAt: '2025-01-01', assessments: [{ skillId: 1, nivel: 3 }] }
    ];
    const result = calculateSparkline(sessions);
    expect(result.points).toEqual([3]);
    expect(result.trend).toBe('neutral');
  });

  it('should return up trend when last > first by more than 0.1', () => {
    const sessions = [
      { evaluatedAt: '2025-01-01', assessments: [{ skillId: 1, nivel: 2 }] },
      { evaluatedAt: '2025-02-01', assessments: [{ skillId: 1, nivel: 4 }] },
    ];
    const result = calculateSparkline(sessions);
    expect(result.points).toEqual([2, 4]);
    expect(result.trend).toBe('up');
  });

  it('should return down trend when last < first by more than 0.1', () => {
    const sessions = [
      { evaluatedAt: '2025-01-01', assessments: [{ skillId: 1, nivel: 4 }] },
      { evaluatedAt: '2025-02-01', assessments: [{ skillId: 1, nivel: 2 }] },
    ];
    const result = calculateSparkline(sessions);
    expect(result.points).toEqual([4, 2]);
    expect(result.trend).toBe('down');
  });

  it('should return neutral trend when diff is within 0.1 threshold', () => {
    // Both sessions have the same single-item average (3.0), diff = 0 which is not > 0.1
    const sessions = [
      { evaluatedAt: '2025-01-01', assessments: [{ skillId: 1, nivel: 3 }] },
      { evaluatedAt: '2025-02-01', assessments: [{ skillId: 1, nivel: 3 }] },
    ];
    const result = calculateSparkline(sessions);
    expect(result.trend).toBe('neutral');
  });

  it('should sort sessions chronologically and take last 6', () => {
    // Provide 8 sessions out of order (desc), expect only last 6 chronologically
    const sessions = [
      { evaluatedAt: '2025-08-01', assessments: [{ skillId: 1, nivel: 5 }] },
      { evaluatedAt: '2025-07-01', assessments: [{ skillId: 1, nivel: 4.5 }] },
      { evaluatedAt: '2025-06-01', assessments: [{ skillId: 1, nivel: 4 }] },
      { evaluatedAt: '2025-05-01', assessments: [{ skillId: 1, nivel: 3.5 }] },
      { evaluatedAt: '2025-04-01', assessments: [{ skillId: 1, nivel: 3 }] },
      { evaluatedAt: '2025-03-01', assessments: [{ skillId: 1, nivel: 2.5 }] },
      { evaluatedAt: '2025-02-01', assessments: [{ skillId: 1, nivel: 2 }] },
      { evaluatedAt: '2025-01-01', assessments: [{ skillId: 1, nivel: 1 }] },
    ];
    const result = calculateSparkline(sessions);
    // Sorted chronologically: Jan(1), Feb(2), Mar(2.5), Apr(3), May(3.5), Jun(4), Jul(4.5), Aug(5)
    // Last 6: Mar(2.5), Apr(3), May(3.5), Jun(4), Jul(4.5), Aug(5)
    expect(result.points).toEqual([2.5, 3, 3.5, 4, 4.5, 5]);
    expect(result.trend).toBe('up');
  });

  it('should pass roleProfile through to calculateSessionAverage', () => {
    const roleProfile = { '1': 'C', '2': 'N' };
    const sessions = [
      { evaluatedAt: '2025-01-01', assessments: [{ skillId: 1, nivel: 2 }, { skillId: 2, nivel: 5 }] },
      { evaluatedAt: '2025-02-01', assessments: [{ skillId: 1, nivel: 4 }, { skillId: 2, nivel: 5 }] },
    ];
    const result = calculateSparkline(sessions, roleProfile);
    // With roleProfile, skillId 2 (N) is excluded
    // Session 1: only skillId 1 -> 2
    // Session 2: only skillId 1 -> 4
    expect(result.points).toEqual([2, 4]);
    expect(result.trend).toBe('up');
  });
});

// ============================================
// buildPreviousSnapshot
// ============================================

describe('buildPreviousSnapshot', () => {
  it('should return null for empty sessions', () => {
    expect(buildPreviousSnapshot([])).toBeNull();
  });

  it('should return null for single session', () => {
    const sessions = [
      { id: 1, evaluatedAt: '2025-02-01', assessments: [{ skillId: 1, nivel: 3, categoriaNombre: 'Tech' }] }
    ];
    expect(buildPreviousSnapshot(sessions)).toBeNull();
  });

  it('should return null for null/undefined', () => {
    expect(buildPreviousSnapshot(null)).toBeNull();
    expect(buildPreviousSnapshot(undefined)).toBeNull();
  });

  it('should build snapshot from the second session (index 1)', () => {
    const sessions = [
      {
        id: 10, evaluatedAt: '2025-02-01', collaboratorRol: 'Dev',
        assessments: [{ skillId: 1, nivel: 5, categoriaNombre: 'Tech' }]
      },
      {
        id: 9, evaluatedAt: '2025-01-01', collaboratorRol: 'QA',
        assessments: [
          { skillId: 1, nivel: 3, categoriaNombre: 'Tech' },
          { skillId: 2, nivel: 4, categoriaNombre: 'Tech' },
          { skillId: 3, nivel: 2, categoriaNombre: 'Soft' },
        ]
      },
    ];
    const result = buildPreviousSnapshot(sessions);
    expect(result).not.toBeNull();
    expect(result.id).toBe(9);
    expect(result.evaluatedAt).toBe('2025-01-01');
    expect(result.rol).toBe('QA');
    // promedio: (3 + 4 + 2) / 3 = 3.0
    expect(result.promedio).toBe(3);
    // Category averages
    expect(result.categorias['Tech']).toBe(3.5); // (3+4)/2 = 3.5
    expect(result.categorias['Soft']).toBe(2);   // 2/1 = 2
  });

  it('should round category averages to 1 decimal', () => {
    const sessions = [
      {
        id: 2, evaluatedAt: '2025-02-01', collaboratorRol: 'Dev',
        assessments: [{ skillId: 1, nivel: 4, categoriaNombre: 'A' }]
      },
      {
        id: 1, evaluatedAt: '2025-01-01', collaboratorRol: 'Dev',
        assessments: [
          { skillId: 1, nivel: 3, categoriaNombre: 'A' },
          { skillId: 2, nivel: 4, categoriaNombre: 'A' },
          { skillId: 3, nivel: 4, categoriaNombre: 'A' },
        ]
      },
    ];
    const result = buildPreviousSnapshot(sessions);
    // (3 + 4 + 4) / 3 = 3.666... -> 3.7
    expect(result.categorias['A']).toBe(3.7);
  });
});

// ============================================
// identifyGaps
// ============================================

describe('identifyGaps', () => {
  const skillsList = [
    { id: 1, nombre: 'JavaScript' },
    { id: 2, nombre: 'React' },
    { id: 3, nombre: 'Docker' },
    { id: 4, nombre: 'Communication' },
  ];

  it('should return empty array when no skills', () => {
    expect(identifyGaps({}, skillsList)).toEqual([]);
  });

  it('should return empty array when no gaps exist', () => {
    const skills = {
      '1': { nivel: 4, criticidad: 'C', frecuencia: 'D' }, // FORTALEZA
      '2': { nivel: 3, criticidad: 'I', frecuencia: 'S' }, // COMPETENTE
    };
    expect(identifyGaps(skills, skillsList)).toEqual([]);
  });

  it('should identify BRECHA CRITICA gaps', () => {
    const skills = {
      '1': { nivel: 1, criticidad: 'C', frecuencia: 'D' }, // BRECHA CRITICA
    };
    const gaps = identifyGaps(skills, skillsList);
    expect(gaps).toHaveLength(1);
    expect(gaps[0].name).toBe('JavaScript');
    expect(gaps[0].estado).toBe('BRECHA CRÍTICA');
  });

  it('should identify AREA DE MEJORA gaps', () => {
    const skills = {
      '2': { nivel: 2, criticidad: 'I', frecuencia: 'S' }, // AREA DE MEJORA
    };
    const gaps = identifyGaps(skills, skillsList);
    expect(gaps).toHaveLength(1);
    expect(gaps[0].name).toBe('React');
    expect(gaps[0].estado).toBe('ÁREA DE MEJORA');
  });

  it('should sort gaps by score descending (BRECHA CRITICA first)', () => {
    const skills = {
      '1': { nivel: 1, criticidad: 'C', frecuencia: 'D' },  // BRECHA CRITICA: score = 9 + 10 = 19
      '2': { nivel: 2, criticidad: 'I', frecuencia: 'S' },  // AREA DE MEJORA: score = 2*2 = 4
      '3': { nivel: 1, criticidad: 'C', frecuencia: 'S' },  // BRECHA CRITICA: score = 3*2 + 10 = 16
    };
    const gaps = identifyGaps(skills, skillsList);
    expect(gaps).toHaveLength(3);
    expect(gaps[0].name).toBe('JavaScript'); // score 19
    expect(gaps[1].name).toBe('Docker');     // score 16
    expect(gaps[2].name).toBe('React');      // score 4
  });

  it('should skip skills not found in skillsList', () => {
    const skills = {
      '999': { nivel: 1, criticidad: 'C', frecuencia: 'D' }, // Not in skillsList
    };
    const gaps = identifyGaps(skills, skillsList);
    expect(gaps).toEqual([]);
  });

  it('should default frecuencia to M when missing', () => {
    const skills = {
      '1': { nivel: 2, criticidad: 'C' }, // No frecuencia -> defaults to 'M'
    };
    const gaps = identifyGaps(skills, skillsList);
    expect(gaps).toHaveLength(1);
    expect(gaps[0].estado).toBe('ÁREA DE MEJORA');
    // score = 3 * 1.5 = 4.5
    expect(gaps[0].score).toBe(4.5);
  });

  it('should handle all skills being gaps', () => {
    const skills = {
      '1': { nivel: 0, criticidad: 'C', frecuencia: 'D' },
      '2': { nivel: 1, criticidad: 'I', frecuencia: 'S' },
      '3': { nivel: 2, criticidad: 'C', frecuencia: 'M' },
      '4': { nivel: 1, criticidad: 'C', frecuencia: 'S' },
    };
    const gaps = identifyGaps(skills, skillsList);
    expect(gaps).toHaveLength(4);
  });

  it('should handle empty skillsList', () => {
    const skills = {
      '1': { nivel: 1, criticidad: 'C', frecuencia: 'D' },
    };
    expect(identifyGaps(skills, [])).toEqual([]);
  });

  it('should use default empty params when called with no args', () => {
    expect(identifyGaps()).toEqual([]);
  });
});

// ============================================
// identifyStrengths
// ============================================

describe('identifyStrengths', () => {
  const skillsList = [
    { id: 1, nombre: 'JavaScript' },
    { id: 2, nombre: 'React' },
    { id: 3, nombre: 'Docker' },
    { id: 4, nombre: 'Leadership' },
  ];

  it('should return empty array when no skills', () => {
    expect(identifyStrengths({}, skillsList)).toEqual([]);
  });

  it('should return empty array when no strengths exist', () => {
    const skills = {
      '1': { nivel: 2, criticidad: 'C', frecuencia: 'D' }, // BRECHA CRITICA
      '2': { nivel: 3, criticidad: 'I', frecuencia: 'S' }, // COMPETENTE
    };
    expect(identifyStrengths(skills, skillsList)).toEqual([]);
  });

  it('should identify strengths (nivel >= 4, criticidad != N)', () => {
    const skills = {
      '1': { nivel: 4, criticidad: 'C', frecuencia: 'D' },
      '2': { nivel: 5, criticidad: 'I', frecuencia: 'S' },
    };
    const strengths = identifyStrengths(skills, skillsList);
    expect(strengths).toHaveLength(2);
    expect(strengths.every(s => s.estado === 'FORTALEZA')).toBe(true);
  });

  it('should sort strengths by score descending', () => {
    const skills = {
      '1': { nivel: 4, criticidad: 'C', frecuencia: 'D' },  // score = 3*3 = 9
      '2': { nivel: 5, criticidad: 'I', frecuencia: 'S' },  // score = 2*2 = 4
      '3': { nivel: 4, criticidad: 'D', frecuencia: 'T' },  // score = 1*1 = 1
    };
    const strengths = identifyStrengths(skills, skillsList);
    expect(strengths).toHaveLength(3);
    expect(strengths[0].name).toBe('JavaScript'); // 9
    expect(strengths[1].name).toBe('React');      // 4
    expect(strengths[2].name).toBe('Docker');     // 1
  });

  it('should NOT include nivel >= 4 with criticidad N', () => {
    const skills = {
      '1': { nivel: 5, criticidad: 'N', frecuencia: 'D' }, // evaluarSkill returns COMPETENTE
    };
    expect(identifyStrengths(skills, skillsList)).toEqual([]);
  });

  it('should skip skills not found in skillsList', () => {
    const skills = {
      '999': { nivel: 5, criticidad: 'C', frecuencia: 'D' },
    };
    expect(identifyStrengths(skills, skillsList)).toEqual([]);
  });

  it('should default frecuencia to M when missing', () => {
    const skills = {
      '1': { nivel: 4, criticidad: 'C' }, // frecuencia defaults to M
    };
    const strengths = identifyStrengths(skills, skillsList);
    expect(strengths).toHaveLength(1);
    // score = 3 * 1.5 = 4.5
    expect(strengths[0].score).toBe(4.5);
  });

  it('should use default empty params when called with no args', () => {
    expect(identifyStrengths()).toEqual([]);
  });
});

// ============================================
// calculateCategoryAverages
// ============================================

describe('calculateCategoryAverages', () => {
  const skillsList = [
    { id: 1, nombre: 'JS', categoriaId: 100 },
    { id: 2, nombre: 'React', categoriaId: 100 },
    { id: 3, nombre: 'Communication', categoriaId: 200 },
    { id: 4, nombre: 'Docker', categoriaId: 300 },
  ];

  const categories = [
    { id: 100, nombre: 'Technical' },
    { id: 200, nombre: 'Soft Skills' },
    { id: 300, nombre: 'DevOps' },
  ];

  it('should return empty object when no skills', () => {
    expect(calculateCategoryAverages({}, skillsList, categories)).toEqual({});
  });

  it('should calculate averages per category', () => {
    const skills = {
      '1': { nivel: 3 },
      '2': { nivel: 5 },
      '3': { nivel: 4 },
    };
    const result = calculateCategoryAverages(skills, skillsList, categories);
    expect(result['Technical']).toBe(4); // (3 + 5) / 2
    expect(result['Soft Skills']).toBe(4); // 4 / 1
    expect(result).not.toHaveProperty('DevOps'); // No skills evaluated
  });

  it('should round to 1 decimal place', () => {
    const skills = {
      '1': { nivel: 3 },
      '2': { nivel: 4 },
    };
    const result = calculateCategoryAverages(skills, skillsList, categories);
    // (3 + 4) / 2 = 3.5
    expect(result['Technical']).toBe(3.5);
  });

  it('should skip skills with nivel 0 or null', () => {
    const skills = {
      '1': { nivel: 4 },
      '2': { nivel: 0 },
      '3': { nivel: null },
    };
    const result = calculateCategoryAverages(skills, skillsList, categories);
    expect(result['Technical']).toBe(4); // Only skillId 1 counts
    expect(result).not.toHaveProperty('Soft Skills'); // nivel null -> skipped
  });

  it('should skip skills with negative nivel', () => {
    const skills = {
      '1': { nivel: -1 },
    };
    const result = calculateCategoryAverages(skills, skillsList, categories);
    expect(result).not.toHaveProperty('Technical');
  });

  it('should skip skills not found in skillsList', () => {
    const skills = {
      '999': { nivel: 5 },
    };
    const result = calculateCategoryAverages(skills, skillsList, categories);
    expect(Object.keys(result)).toHaveLength(0);
  });

  it('should skip skills whose category is not in categories list', () => {
    const limitedCategories = [{ id: 100, nombre: 'Technical' }];
    const skills = {
      '1': { nivel: 4 },
      '3': { nivel: 5 }, // categoriaId 200 not in limitedCategories
    };
    const result = calculateCategoryAverages(skills, skillsList, limitedCategories);
    expect(result['Technical']).toBe(4);
    expect(result).not.toHaveProperty('Soft Skills');
  });

  it('should use default empty params when called with no args', () => {
    expect(calculateCategoryAverages()).toEqual({});
  });
});

// ============================================
// getTrendColor
// ============================================

describe('getTrendColor', () => {
  it('should return green for up trend', () => {
    expect(getTrendColor('up')).toBe('#10b981');
  });

  it('should return red for down trend', () => {
    expect(getTrendColor('down')).toBe('#ef4444');
  });

  it('should return gray for neutral trend', () => {
    expect(getTrendColor('neutral')).toBe('#9ca3af');
  });

  it('should return gray for unknown trend value', () => {
    expect(getTrendColor('unknown')).toBe('#9ca3af');
  });

  it('should return gray for undefined', () => {
    expect(getTrendColor(undefined)).toBe('#9ca3af');
  });

  it('should return gray for null', () => {
    expect(getTrendColor(null)).toBe('#9ca3af');
  });
});

// ============================================
// calculateDelta
// ============================================

describe('calculateDelta', () => {
  it('should return null when previous is null', () => {
    expect(calculateDelta(3, null)).toBeNull();
  });

  it('should return null when previous is undefined', () => {
    expect(calculateDelta(3, undefined)).toBeNull();
  });

  it('should calculate positive delta with up direction', () => {
    const result = calculateDelta(4, 3);
    expect(result.value).toBe(1);
    expect(result.direction).toBe('up');
    expect(result.formatted).toBe('+1.0');
  });

  it('should calculate negative delta with down direction', () => {
    const result = calculateDelta(2, 4);
    expect(result.value).toBe(-2);
    expect(result.direction).toBe('down');
    expect(result.formatted).toBe('-2.0');
  });

  it('should return neutral for small delta within 0.05 threshold', () => {
    const result = calculateDelta(3.02, 3);
    expect(result.direction).toBe('neutral');
  });

  it('should return neutral for exactly 0 delta', () => {
    const result = calculateDelta(3, 3);
    expect(result.value).toBe(0);
    expect(result.direction).toBe('neutral');
    expect(result.formatted).toBe('0.0');
  });

  it('should return up for delta exactly at +0.06 (above threshold)', () => {
    const result = calculateDelta(3.06, 3);
    expect(result.direction).toBe('up');
  });

  it('should return down for delta exactly at -0.06 (below threshold)', () => {
    const result = calculateDelta(2.94, 3);
    expect(result.direction).toBe('down');
  });

  it('should return neutral for delta of +0.05 (at boundary)', () => {
    const result = calculateDelta(3.05, 3);
    expect(result.direction).toBe('neutral');
  });

  it('should return neutral for delta of -0.05 (at boundary)', () => {
    const result = calculateDelta(2.95, 3);
    expect(result.direction).toBe('neutral');
  });

  it('should handle previous = 0', () => {
    const result = calculateDelta(3, 0);
    expect(result).not.toBeNull();
    expect(result.value).toBe(3);
    expect(result.direction).toBe('up');
    expect(result.formatted).toBe('+3.0');
  });

  it('should handle decimal values', () => {
    const result = calculateDelta(3.7, 2.2);
    expect(result.value).toBeCloseTo(1.5);
    expect(result.direction).toBe('up');
  });
});
