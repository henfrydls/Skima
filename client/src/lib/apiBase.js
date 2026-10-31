/**
 * API base URL - detects Tauri desktop vs web browser at runtime.
 * In Tauri: backend runs as sidecar on localhost:11420
 * In browser dev: Vite proxy handles /api -> localhost:3001
 */
export const API_BASE = window.__TAURI_INTERNALS__ ? 'http://localhost:11420' : '';

/**
 * The server refuses state changes (and the export) without this header: another
 * site cannot add it without a CORS preflight that only Skima's origins pass.
 * Must match server/src/middleware/apiHeader.js.
 */
export const API_HEADER = 'X-Skima';

function requestUrl(input) {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.href;
  return input?.url ?? '';
}

export function isApiUrl(url, base = API_BASE) {
  return url.startsWith(`${base}/api/`);
}

/**
 * Wrap fetch so every call to the API carries API_HEADER, whichever component
 * makes it. Installed once at startup (main.jsx); other URLs pass through untouched.
 */
export function installApiHeader(target = window, base = API_BASE) {
  const original = target.fetch.bind(target);
  target.fetch = (input, init = {}) => {
    if (!isApiUrl(requestUrl(input), base)) return original(input, init);
    const headers = new Headers(init.headers ?? (input instanceof Request ? input.headers : undefined));
    headers.set(API_HEADER, '1');
    return original(input, { ...init, headers });
  };
}
