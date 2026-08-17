/**
 * Formatting for DATE-ONLY values (issue #73).
 *
 * Date-only fields (plan start/end, goal targetDate, action dueDate/completedAt,
 * time periods…) are stored at UTC midnight (`new Date('2026-01-01')` →
 * `2026-01-01T00:00:00.000Z`). Rendering them with a plain
 * `toLocaleDateString()` uses the LOCAL timezone, so anywhere west of UTC the
 * calendar day shifts back by one (UTC-4: "2026-01-01" → "Dec 31, 2025").
 *
 * Fix strategy (one strategy, applied everywhere): always render date-only
 * values in UTC, so the stored calendar day is the displayed calendar day in
 * every timezone. This also displays legacy noon-UTC data (the old #32
 * joinedAt mitigation) correctly.
 *
 * NOT for real timestamps (evaluatedAt, createdAt, lastEvaluated…): those are
 * moments in time and should keep rendering in the user's local timezone.
 */
export function formatDateOnly(value, options = { month: 'short', day: 'numeric', year: 'numeric' }, locale = 'en-US') {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(locale, { ...options, timeZone: 'UTC' });
}
