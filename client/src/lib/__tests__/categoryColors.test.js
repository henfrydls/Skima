import { describe, it, expect, beforeEach } from 'vitest';
import { getCategoryColor, setCategoryColor, PRESET_COLORS } from '../categoryColors';

describe('categoryColors', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns a preset color for unknown category', () => {
    const color = getCategoryColor(1);
    expect(PRESET_COLORS).toContain(color);
  });

  it('returns stored color after setCategoryColor', () => {
    setCategoryColor(5, '#ff0000');
    expect(getCategoryColor(5)).toBe('#ff0000');
  });

  it('PRESET_COLORS has 9 colors', () => {
    expect(PRESET_COLORS).toHaveLength(9);
  });

  it('falls back to preset when localStorage is corrupted', () => {
    localStorage.setItem('skima_category_colors', 'not-json');
    const color = getCategoryColor(2);
    expect(PRESET_COLORS).toContain(color);
  });

  it('assigns different presets based on categoryId modulo', () => {
    const color0 = getCategoryColor(0);
    const color1 = getCategoryColor(1);
    expect(color0).toBe(PRESET_COLORS[0]);
    expect(color1).toBe(PRESET_COLORS[1]);
  });
});
