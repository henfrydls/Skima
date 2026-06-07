import { describe, it, expect } from 'vitest';
import { getPriorityMeta } from '../goalPriority';

describe('getPriorityMeta', () => {
  // The API stores priority as an integer (1=high, 2=medium, 3=low). This is
  // the case that was previously broken: a string-keyed color map never
  // matched the integer, so every goal rendered as medium (#36).
  it('maps integer 1 to high', () => {
    expect(getPriorityMeta(1)).toMatchObject({ key: 'high', color: 'bg-critical' });
  });

  it('maps integer 2 to medium', () => {
    expect(getPriorityMeta(2)).toMatchObject({ key: 'medium', color: 'bg-warning' });
  });

  it('maps integer 3 to low', () => {
    expect(getPriorityMeta(3)).toMatchObject({ key: 'low', color: 'bg-gray-300' });
  });

  // Legacy/string values are tolerated for backward compatibility.
  it('maps string "high" to high', () => {
    expect(getPriorityMeta('high')).toMatchObject({ key: 'high' });
  });

  it('maps string "low" to low', () => {
    expect(getPriorityMeta('low')).toMatchObject({ key: 'low' });
  });

  it('falls back to medium for null/unknown values', () => {
    expect(getPriorityMeta(null)).toMatchObject({ key: 'medium' });
    expect(getPriorityMeta(undefined)).toMatchObject({ key: 'medium' });
    expect(getPriorityMeta(99)).toMatchObject({ key: 'medium' });
  });

  it('exposes a human label', () => {
    expect(getPriorityMeta(1).label).toBe('High');
    expect(getPriorityMeta(3).label).toBe('Low');
  });
});
