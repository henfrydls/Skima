/**
 * Category color helpers — stored in localStorage to avoid DB schema changes.
 * Key: skima_category_colors → JSON { "1": "#2d676e", "3": "#6366f1" }
 */

export const PRESET_COLORS = [
  '#2d676e', // Teal (primary)
  '#a6ae3d', // Olive (competent)
  '#da8a0c', // Amber (warning)
  '#ef4444', // Red
  '#6366f1', // Indigo
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#06b6d4', // Cyan
];

const STORAGE_KEY = 'skima_category_colors';

export function getCategoryColor(categoryId) {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return stored[categoryId] || PRESET_COLORS[categoryId % PRESET_COLORS.length];
  } catch {
    return PRESET_COLORS[categoryId % PRESET_COLORS.length];
  }
}

export function setCategoryColor(categoryId, color) {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    stored[categoryId] = color;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // Silently fail if localStorage is unavailable
  }
}
