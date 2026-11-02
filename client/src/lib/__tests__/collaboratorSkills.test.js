import { describe, it, expect } from 'vitest';
import { withCurrentSkills } from '../collaboratorSkills';

describe('withCurrentSkills', () => {
  it('adds the current levels from /api/data to the full list', () => {
    const all = [
      { id: 1, nombre: 'Ana', isActive: true },
      { id: 2, nombre: 'Luis', isActive: false },
    ];
    const data = [{ id: 1, nombre: 'Ana', skills: { 10: { nivel: 4, frecuencia: 'D' } } }];

    expect(withCurrentSkills(all, data)).toEqual([
      { id: 1, nombre: 'Ana', isActive: true, skills: { 10: { nivel: 4, frecuencia: 'D' } } },
      { id: 2, nombre: 'Luis', isActive: false, skills: {} },
    ]);
  });

  it('copes with missing lists', () => {
    expect(withCurrentSkills(undefined, undefined)).toEqual([]);
    expect(withCurrentSkills([{ id: 1 }], undefined)).toEqual([{ id: 1, skills: {} }]);
  });
});
