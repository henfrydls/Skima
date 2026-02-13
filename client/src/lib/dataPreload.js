import { API_BASE } from './apiBase';

/**
 * Data preload — starts /api/data fetch at module import time,
 * running in parallel with ConfigContext's /api/config fetch.
 * Pages consume the cached promise instead of making their own request.
 *
 * Call invalidatePreload() after any data mutation (settings changes, etc.)
 * so the next consumer gets fresh data.
 */

let _promise = null;

export function preloadData() {
  if (!_promise) {
    _promise = fetch(`${API_BASE}/api/data`)
      .then(res => res.ok ? res.json() : null)
      .catch(() => null);
  }
  return _promise;
}

export function invalidatePreload() {
  _promise = null;
}

// Start immediately on import
preloadData();
