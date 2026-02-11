import { describe, it, expect } from 'vitest';
import {
  formatMonthShort,
  formatMonthFull,
  formatQuarter,
  transformChartData,
  getTrendColor,
  getTrendArrow,
  transformEmployeesForList,
  getNarrativeFromMeta,
  getTopImprover,
  getSupportCount,
  calculateTeamVelocity,
  SKILL_THRESHOLDS,
} from './evolutionLogic';

// ============================================
// DATE FORMATTING
// ============================================

describe('formatMonthShort', () => {
  it('should format an ISO date to short Spanish month + 2-digit year', () => {
    const result = formatMonthShort('2024-01-15');
    // "ene 24" in es-ES locale
    expect(result).toMatch(/ene\.?\s*24/i);
  });

  it('should handle mid-year dates', () => {
    // Use mid-month date to avoid UTC-to-local timezone boundary shifts
    const result = formatMonthShort('2025-07-15');
    expect(result).toMatch(/jul\.?\s*25/i);
  });

  it('should handle end-of-year dates', () => {
    const result = formatMonthShort('2023-12-31');
    expect(result).toMatch(/dic\.?\s*23/i);
  });

  it('should handle leap year date', () => {
    const result = formatMonthShort('2024-02-29');
    expect(result).toMatch(/feb\.?\s*24/i);
  });
});

describe('formatMonthFull', () => {
  it('should format an ISO date to full Spanish month + full year', () => {
    const result = formatMonthFull('2024-01-15');
    // "enero de 2024" or "enero 2024" depending on locale implementation
    expect(result.toLowerCase()).toContain('enero');
    expect(result).toContain('2024');
  });

  it('should handle different months', () => {
    const result = formatMonthFull('2025-06-10');
    expect(result.toLowerCase()).toContain('junio');
    expect(result).toContain('2025');
  });
});

describe('formatQuarter', () => {
  // Note: new Date('YYYY-MM-DD') parses as UTC midnight. In negative-offset timezones
  // (e.g., UTC-4), the 1st of a month at UTC midnight becomes the previous day locally.
  // We use mid-month dates to avoid these boundary issues.

  it('should return Q1 for January-March', () => {
    expect(formatQuarter('2024-01-15')).toBe('Q1 2024');
    expect(formatQuarter('2024-02-15')).toBe('Q1 2024');
    expect(formatQuarter('2024-03-15')).toBe('Q1 2024');
  });

  it('should return Q2 for April-June', () => {
    expect(formatQuarter('2024-04-15')).toBe('Q2 2024');
    expect(formatQuarter('2024-06-15')).toBe('Q2 2024');
  });

  it('should return Q3 for July-September', () => {
    expect(formatQuarter('2024-07-15')).toBe('Q3 2024');
    expect(formatQuarter('2024-09-15')).toBe('Q3 2024');
  });

  it('should return Q4 for October-December', () => {
    expect(formatQuarter('2024-10-15')).toBe('Q4 2024');
    expect(formatQuarter('2024-12-15')).toBe('Q4 2024');
  });

  it('should handle year boundaries', () => {
    expect(formatQuarter('2023-12-15')).toBe('Q4 2023');
    expect(formatQuarter('2025-01-15')).toBe('Q1 2025');
  });
});

// ============================================
// CHART DATA TRANSFORMATIONS
// ============================================

describe('transformChartData', () => {
  const sampleChartData = [
    { date: '2024-01-15', avgScore: 3.2, count: 10, newHires: ['Alice'], isCarryOver: false },
    { date: '2024-02-15', avgScore: 3.5, count: 12, newHires: [], isCarryOver: true },
    { date: '2024-03-15', avgScore: 3.8, count: 11 },
  ];

  it('should transform valid chart data with all fields', () => {
    const result = transformChartData(sampleChartData);
    expect(result).toHaveLength(3);

    expect(result[0].date).toBe('2024-01-15');
    expect(result[0].teamAverage).toBe(3.2);
    expect(result[0].count).toBe(10);
    expect(result[0].newHires).toEqual(['Alice']);
    expect(result[0].isCarryOver).toBe(false);
    // month is locale-formatted, just check it is a string
    expect(typeof result[0].month).toBe('string');
  });

  it('should default newHires to empty array when missing', () => {
    const result = transformChartData(sampleChartData);
    expect(result[2].newHires).toEqual([]);
  });

  it('should default isCarryOver to false when missing', () => {
    const result = transformChartData(sampleChartData);
    expect(result[2].isCarryOver).toBe(false);
  });

  it('should preserve isCarryOver when true', () => {
    const result = transformChartData(sampleChartData);
    expect(result[1].isCarryOver).toBe(true);
  });

  it('should return empty array for null input', () => {
    expect(transformChartData(null)).toEqual([]);
  });

  it('should return empty array for undefined input', () => {
    expect(transformChartData(undefined)).toEqual([]);
  });

  it('should return empty array for non-array input', () => {
    expect(transformChartData('not an array')).toEqual([]);
    expect(transformChartData(42)).toEqual([]);
    expect(transformChartData({})).toEqual([]);
  });

  it('should return empty array for empty array input', () => {
    expect(transformChartData([])).toEqual([]);
  });

  it('should handle a single data point', () => {
    const single = [{ date: '2024-06-01', avgScore: 4.0, count: 5 }];
    const result = transformChartData(single);
    expect(result).toHaveLength(1);
    expect(result[0].teamAverage).toBe(4.0);
    expect(result[0].count).toBe(5);
    expect(result[0].newHires).toEqual([]);
    expect(result[0].isCarryOver).toBe(false);
  });
});

// ============================================
// TREND COLOR
// ============================================

describe('getTrendColor', () => {
  describe('numeric growth values', () => {
    it('should return emerald for positive growth > 0.1', () => {
      expect(getTrendColor(0.5)).toBe('#10b981');
      expect(getTrendColor(1.0)).toBe('#10b981');
      expect(getTrendColor(0.2)).toBe('#10b981');
    });

    it('should return red for negative growth < -0.1', () => {
      expect(getTrendColor(-0.5)).toBe('#ef4444');
      expect(getTrendColor(-1.0)).toBe('#ef4444');
      expect(getTrendColor(-0.2)).toBe('#ef4444');
    });

    it('should return slate for near-zero growth (stable)', () => {
      expect(getTrendColor(0)).toBe('#64748b');
      expect(getTrendColor(0.05)).toBe('#64748b');
      expect(getTrendColor(-0.05)).toBe('#64748b');
      expect(getTrendColor(0.1)).toBe('#64748b');
      expect(getTrendColor(-0.1)).toBe('#64748b');
    });
  });

  describe('string trend values', () => {
    it('should return emerald for "up"', () => {
      expect(getTrendColor('up')).toBe('#10b981');
    });

    it('should return red for "down"', () => {
      expect(getTrendColor('down')).toBe('#ef4444');
    });

    it('should return slate for "stable"', () => {
      expect(getTrendColor('stable')).toBe('#64748b');
    });

    it('should return slate for any other string', () => {
      expect(getTrendColor('unknown')).toBe('#64748b');
      expect(getTrendColor('')).toBe('#64748b');
    });
  });
});

// ============================================
// TREND ARROW
// ============================================

describe('getTrendArrow', () => {
  it('should return up arrow for "up"', () => {
    expect(getTrendArrow('up')).toBe('↑');
  });

  it('should return down arrow for "down"', () => {
    expect(getTrendArrow('down')).toBe('↓');
  });

  it('should return right arrow for "stable"', () => {
    expect(getTrendArrow('stable')).toBe('→');
  });

  it('should return right arrow for any unrecognized trend', () => {
    expect(getTrendArrow('unknown')).toBe('→');
    expect(getTrendArrow(undefined)).toBe('→');
    expect(getTrendArrow(null)).toBe('→');
    expect(getTrendArrow('')).toBe('→');
  });
});

// ============================================
// EMPLOYEE DATA TRANSFORMATIONS
// ============================================

describe('transformEmployeesForList', () => {
  const makeEmployee = (overrides = {}) => ({
    id: 1,
    name: 'Ana Garcia',
    role: 'Developer',
    currentScore: 3.8,
    growth: 0.5,
    growthTrend: 'up',
    isNewHire: false,
    insufficientData: false,
    joinedAt: '2023-01-15',
    lastEvaluatedAt: '2024-06-01',
    sparkline: [2.5, 3.0, 3.5, 3.8],
    ...overrides,
  });

  it('should transform a valid employee list', () => {
    const employees = [makeEmployee()];
    const result = transformEmployeesForList(employees);

    expect(result).toHaveLength(1);
    const emp = result[0];
    expect(emp.id).toBe(1);
    expect(emp.nombre).toBe('Ana Garcia');
    expect(emp.rol).toBe('Developer');
    expect(emp.active).toBe(true);
    expect(emp.latestPromedio).toBe(3.8);
    expect(emp.delta).toBe(0.5);
    expect(emp.deltaTrend).toBe('up');
    expect(emp.isNewHire).toBe(false);
    expect(emp.insufficientData).toBe(false);
    expect(emp.joinedAt).toBe('2023-01-15');
    expect(emp.lastEvaluated).toBe('2024-06-01');
  });

  it('should map sparkline data with descriptive labels', () => {
    const employees = [makeEmployee({ sparkline: [2.0, 3.0, 4.0] })];
    const result = transformEmployeesForList(employees);
    const trend = result[0].trend;

    expect(trend).toHaveLength(3);
    expect(trend[0]).toEqual({ date: 'Inicio', promedio: 2.0 });
    expect(trend[1]).toEqual({ date: 'Hito 1', promedio: 3.0 });
    expect(trend[2]).toEqual({ date: 'Actual', promedio: 4.0 });
  });

  it('should handle single-point sparkline', () => {
    const employees = [makeEmployee({ sparkline: [3.5] })];
    const result = transformEmployeesForList(employees);
    const trend = result[0].trend;

    expect(trend).toHaveLength(1);
    // Single element is index 0 (first) AND index arr.length-1 (last)
    // The first condition (i === 0) wins in the if/else chain
    expect(trend[0]).toEqual({ date: 'Inicio', promedio: 3.5 });
  });

  it('should handle empty sparkline', () => {
    const employees = [makeEmployee({ sparkline: [] })];
    const result = transformEmployeesForList(employees);
    expect(result[0].trend).toEqual([]);
  });

  it('should handle null sparkline', () => {
    const employees = [makeEmployee({ sparkline: null })];
    const result = transformEmployeesForList(employees);
    expect(result[0].trend).toEqual([]);
  });

  it('should handle undefined sparkline', () => {
    const employees = [makeEmployee({ sparkline: undefined })];
    const result = transformEmployeesForList(employees);
    expect(result[0].trend).toEqual([]);
  });

  it('should compute status from currentScore using skill thresholds', () => {
    // Score >= 3.5 -> Fortaleza
    const strength = transformEmployeesForList([makeEmployee({ currentScore: 4.0 })]);
    expect(strength[0].status).toBe('strength');
    expect(strength[0].statusLabel).toBe('Fortaleza');

    // Score >= 2.5 and < 3.5 -> Competente
    const competent = transformEmployeesForList([makeEmployee({ currentScore: 3.0 })]);
    expect(competent[0].status).toBe('competent');
    expect(competent[0].statusLabel).toBe('Competente');

    // Score < 2.5 -> Requiere Atencion
    const attention = transformEmployeesForList([makeEmployee({ currentScore: 1.5 })]);
    expect(attention[0].status).toBe('attention');
    expect(attention[0].statusLabel).toBe('Requiere Atención');
  });

  it('should compute sparklineColor based on growth value', () => {
    const positive = transformEmployeesForList([makeEmployee({ growth: 0.5 })]);
    expect(positive[0].sparklineColor).toBe('#10b981');

    const negative = transformEmployeesForList([makeEmployee({ growth: -0.5 })]);
    expect(negative[0].sparklineColor).toBe('#ef4444');

    const stable = transformEmployeesForList([makeEmployee({ growth: 0 })]);
    expect(stable[0].sparklineColor).toBe('#64748b');
  });

  it('should return empty array for null input', () => {
    expect(transformEmployeesForList(null)).toEqual([]);
  });

  it('should return empty array for undefined input', () => {
    expect(transformEmployeesForList(undefined)).toEqual([]);
  });

  it('should return empty array for non-array input', () => {
    expect(transformEmployeesForList('not array')).toEqual([]);
    expect(transformEmployeesForList(123)).toEqual([]);
    expect(transformEmployeesForList({})).toEqual([]);
  });

  it('should return empty array for empty array input', () => {
    expect(transformEmployeesForList([])).toEqual([]);
  });

  it('should handle multiple employees', () => {
    const employees = [
      makeEmployee({ id: 1, name: 'Ana', currentScore: 4.5 }),
      makeEmployee({ id: 2, name: 'Bob', currentScore: 2.0 }),
      makeEmployee({ id: 3, name: 'Carlos', currentScore: 3.0 }),
    ];
    const result = transformEmployeesForList(employees);
    expect(result).toHaveLength(3);
    expect(result[0].nombre).toBe('Ana');
    expect(result[1].nombre).toBe('Bob');
    expect(result[2].nombre).toBe('Carlos');
  });

  it('should flag new hires correctly', () => {
    const employees = [makeEmployee({ isNewHire: true })];
    const result = transformEmployeesForList(employees);
    expect(result[0].isNewHire).toBe(true);
  });

  it('should flag insufficient data correctly', () => {
    const employees = [makeEmployee({ insufficientData: true })];
    const result = transformEmployeesForList(employees);
    expect(result[0].insufficientData).toBe(true);
  });
});

// ============================================
// NARRATIVE FROM META
// ============================================

describe('getNarrativeFromMeta', () => {
  it('should return success narrative for positive delta > 0.1', () => {
    const meta = { periodDelta: 0.5, currentMaturityIndex: 3.8 };
    const result = getNarrativeFromMeta(meta);

    expect(result.icon).toBe('↑');
    expect(result.iconBg).toBe('bg-emerald-50');
    expect(result.iconColor).toBe('text-emerald-600');
    expect(result.titlePrefix).toBe('Mejora constante: ');
    expect(result.titleHighlight).toBe('+0.5 puntos');
    expect(result.highlightColor).toBe('text-emerald-600 font-semibold');
    expect(result.variant).toBe('success');
  });

  it('should return warning narrative for negative delta < -0.1', () => {
    const meta = { periodDelta: -0.8, currentMaturityIndex: 2.5 };
    const result = getNarrativeFromMeta(meta);

    expect(result.icon).toBe('↓');
    expect(result.iconBg).toBe('bg-rose-50');
    expect(result.iconColor).toBe('text-rose-600');
    expect(result.titlePrefix).toBe('El promedio ha descendido ');
    expect(result.titleHighlight).toBe('0.8 puntos');
    expect(result.highlightColor).toBe('text-rose-600 font-semibold');
    expect(result.variant).toBe('warning');
  });

  it('should return neutral narrative for stable delta near zero', () => {
    const meta = { periodDelta: 0.05, currentMaturityIndex: 3.2 };
    const result = getNarrativeFromMeta(meta);

    expect(result.icon).toBe('→');
    expect(result.iconBg).toBe('bg-slate-100');
    expect(result.iconColor).toBe('text-slate-600');
    expect(result.titleHighlight).toBe('estable');
    expect(result.variant).toBe('neutral');
    expect(result.subtitle).toContain('3.2');
  });

  it('should handle exactly 0.1 as stable (not positive)', () => {
    const meta = { periodDelta: 0.1, currentMaturityIndex: 3.0 };
    const result = getNarrativeFromMeta(meta);
    expect(result.variant).toBe('neutral');
  });

  it('should handle exactly -0.1 as stable (not negative)', () => {
    const meta = { periodDelta: -0.1, currentMaturityIndex: 3.0 };
    const result = getNarrativeFromMeta(meta);
    expect(result.variant).toBe('neutral');
  });

  it('should handle exactly 0 as stable', () => {
    const meta = { periodDelta: 0, currentMaturityIndex: 3.5 };
    const result = getNarrativeFromMeta(meta);
    expect(result.variant).toBe('neutral');
  });

  it('should show "--" when currentMaturityIndex is missing', () => {
    const meta = { periodDelta: 0 };
    const result = getNarrativeFromMeta(meta);
    expect(result.subtitle).toContain('--');
  });

  it('should show "--" when currentMaturityIndex is null', () => {
    const meta = { periodDelta: 0.05, currentMaturityIndex: null };
    const result = getNarrativeFromMeta(meta);
    expect(result.subtitle).toContain('--');
  });

  it('should return null for null input', () => {
    expect(getNarrativeFromMeta(null)).toBeNull();
  });

  it('should return null for undefined input', () => {
    expect(getNarrativeFromMeta(undefined)).toBeNull();
  });

  it('should format positive delta with + sign and 1 decimal', () => {
    const meta = { periodDelta: 1.23, currentMaturityIndex: 4.0 };
    const result = getNarrativeFromMeta(meta);
    expect(result.titleHighlight).toBe('+1.2 puntos');
  });

  it('should format negative delta absolute value with 1 decimal', () => {
    const meta = { periodDelta: -2.67, currentMaturityIndex: 1.5 };
    const result = getNarrativeFromMeta(meta);
    expect(result.titleHighlight).toBe('2.7 puntos');
  });
});

// ============================================
// TOP IMPROVER
// ============================================

describe('getTopImprover', () => {
  it('should extract top improver data from insights', () => {
    const insights = {
      topImprover: { name: 'Maria Lopez', growth: 1.2 },
      supportCount: 3,
    };
    const result = getTopImprover(insights);
    expect(result).toEqual({ nombre: 'Maria Lopez', delta: 1.2 });
  });

  it('should return null when topImprover is missing', () => {
    expect(getTopImprover({ supportCount: 3 })).toBeNull();
  });

  it('should return null when insights is null', () => {
    expect(getTopImprover(null)).toBeNull();
  });

  it('should return null when insights is undefined', () => {
    expect(getTopImprover(undefined)).toBeNull();
  });

  it('should handle topImprover with zero growth', () => {
    const insights = { topImprover: { name: 'Carlos', growth: 0 } };
    const result = getTopImprover(insights);
    expect(result).toEqual({ nombre: 'Carlos', delta: 0 });
  });

  it('should handle topImprover with negative growth', () => {
    const insights = { topImprover: { name: 'Pedro', growth: -0.5 } };
    const result = getTopImprover(insights);
    expect(result).toEqual({ nombre: 'Pedro', delta: -0.5 });
  });
});

// ============================================
// SUPPORT COUNT
// ============================================

describe('getSupportCount', () => {
  it('should return supportCount from insights', () => {
    expect(getSupportCount({ supportCount: 5 })).toBe(5);
  });

  it('should return 0 when supportCount is missing', () => {
    expect(getSupportCount({})).toBe(0);
  });

  it('should return 0 when insights is null', () => {
    expect(getSupportCount(null)).toBe(0);
  });

  it('should return 0 when insights is undefined', () => {
    expect(getSupportCount(undefined)).toBe(0);
  });

  it('should return 0 when supportCount is 0', () => {
    expect(getSupportCount({ supportCount: 0 })).toBe(0);
  });

  it('should handle large support counts', () => {
    expect(getSupportCount({ supportCount: 100 })).toBe(100);
  });
});

// ============================================
// TEAM VELOCITY
// ============================================

describe('calculateTeamVelocity', () => {
  it('should calculate positive velocity from chart data', () => {
    const chartData = [
      { teamAverage: 3.0 },
      { teamAverage: 3.2 },
      { teamAverage: 3.5 },
    ];
    const result = calculateTeamVelocity(chartData);
    expect(result.current).toBe(3.5);
    expect(result.delta).toBe(0.5);
    expect(result.insufficient).toBe(false);
    expect(result.trend).toBe('up');
  });

  it('should calculate negative velocity', () => {
    const chartData = [
      { teamAverage: 4.0 },
      { teamAverage: 3.5 },
      { teamAverage: 3.0 },
    ];
    const result = calculateTeamVelocity(chartData);
    expect(result.current).toBe(3.0);
    expect(result.delta).toBe(-1);
    expect(result.insufficient).toBe(false);
    expect(result.trend).toBe('down');
  });

  it('should calculate stable velocity when no change', () => {
    const chartData = [
      { teamAverage: 3.5 },
      { teamAverage: 3.5 },
    ];
    const result = calculateTeamVelocity(chartData);
    expect(result.current).toBe(3.5);
    expect(result.delta).toBe(0);
    expect(result.insufficient).toBe(false);
    expect(result.trend).toBe('stable');
  });

  it('should handle exactly two data points', () => {
    const chartData = [
      { teamAverage: 2.0 },
      { teamAverage: 3.0 },
    ];
    const result = calculateTeamVelocity(chartData);
    expect(result.current).toBe(3.0);
    expect(result.delta).toBe(1);
    expect(result.trend).toBe('up');
    expect(result.insufficient).toBe(false);
  });

  it('should return insufficient for single data point', () => {
    const chartData = [{ teamAverage: 3.5 }];
    const result = calculateTeamVelocity(chartData);
    expect(result.current).toBeNull();
    expect(result.delta).toBeNull();
    expect(result.insufficient).toBe(true);
  });

  it('should return insufficient for empty array', () => {
    const result = calculateTeamVelocity([]);
    expect(result.current).toBeNull();
    expect(result.delta).toBeNull();
    expect(result.insufficient).toBe(true);
  });

  it('should return insufficient for null input', () => {
    const result = calculateTeamVelocity(null);
    expect(result.insufficient).toBe(true);
  });

  it('should return insufficient for undefined input', () => {
    const result = calculateTeamVelocity(undefined);
    expect(result.insufficient).toBe(true);
  });

  it('should round delta to 1 decimal place', () => {
    const chartData = [
      { teamAverage: 3.0 },
      { teamAverage: 3.33 },
    ];
    const result = calculateTeamVelocity(chartData);
    // 3.33 - 3.0 = 0.33 -> rounded to 0.3
    expect(result.delta).toBe(0.3);
  });

  it('should handle negative delta rounding correctly', () => {
    const chartData = [
      { teamAverage: 3.8 },
      { teamAverage: 3.0 },
    ];
    const result = calculateTeamVelocity(chartData);
    // 3.0 - 3.8 = -0.8 -> rounded to -0.8
    expect(result.delta).toBe(-0.8);
    expect(result.trend).toBe('down');
  });

  it('should use first and last elements only', () => {
    const chartData = [
      { teamAverage: 2.0 },
      { teamAverage: 5.0 }, // this spike in the middle should not affect delta
      { teamAverage: 3.0 },
    ];
    const result = calculateTeamVelocity(chartData);
    expect(result.delta).toBe(1); // 3.0 - 2.0
    expect(result.current).toBe(3.0);
  });
});

// ============================================
// RE-EXPORTED SKILL_THRESHOLDS
// ============================================

describe('SKILL_THRESHOLDS (re-export)', () => {
  it('should export COMPETENT threshold', () => {
    expect(SKILL_THRESHOLDS.COMPETENT).toBe(2.5);
  });

  it('should export STRENGTH threshold', () => {
    expect(SKILL_THRESHOLDS.STRENGTH).toBe(3.5);
  });

  it('should export GOAL threshold', () => {
    expect(SKILL_THRESHOLDS.GOAL).toBe(4.0);
  });
});
