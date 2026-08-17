import { describe, it, expect } from 'vitest';
import { formatDateOnly } from '../dateOnly';

// Issue #73: date-only values are stored at UTC midnight; rendering them in
// the local timezone shows the PREVIOUS day anywhere west of UTC (e.g.
// America/Santo_Domingo, UTC-4). These tests run under TZ=America/Santo_Domingo
// (see vitest config/env) — the exact repro from the issue.
describe('formatDateOnly (issue #73 — no off-by-one in negative-offset TZs)', () => {
  it('renders the stored calendar day, not the local-shifted one', () => {
    // The issue's exact repro: plan start 2026-01-01 displayed as Dec 31, 2025
    expect(formatDateOnly('2026-01-01T00:00:00.000Z')).toBe('Jan 1, 2026');
    expect(formatDateOnly('2026-12-31T00:00:00.000Z')).toBe('Dec 31, 2026');
  });

  it('accepts bare date strings and Date objects', () => {
    expect(formatDateOnly('2026-04-30')).toBe('Apr 30, 2026');
    expect(formatDateOnly(new Date('2026-04-30T00:00:00.000Z'))).toBe('Apr 30, 2026');
  });

  it('supports custom Intl options (month/year label)', () => {
    expect(formatDateOnly('2026-01-01', { month: 'short', year: 'numeric' })).toBe('Jan 2026');
    expect(formatDateOnly('2026-06-15', { month: 'short', day: 'numeric' })).toBe('Jun 15');
  });

  it('is safe on empty/invalid input', () => {
    expect(formatDateOnly(null)).toBe('');
    expect(formatDateOnly(undefined)).toBe('');
    expect(formatDateOnly('not-a-date')).toBe('');
  });

  it('noon-UTC legacy data (the old joinedAt mitigation) still shows the same day', () => {
    expect(formatDateOnly('2026-07-29T12:00:00.000Z')).toBe('Jul 29, 2026');
  });
});
