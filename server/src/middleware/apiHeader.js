/**
 * Cross-site request guard for /api.
 *
 * The client sends API_HEADER on every call. A page on another site cannot add a
 * custom header without a CORS preflight, and the preflight only succeeds for the
 * allowed origins, so a request carrying it comes from Skima itself (or from a
 * non-browser client, which needs no protection here).
 *
 * Required on every method that changes state, and on the reads that hand out the
 * whole database or the check-in ID. Other reads stay open: without a CORS header
 * another site cannot read their answers.
 */
export const API_HEADER = 'X-Skima';

// Origins allowed when ALLOWED_ORIGINS is not set and this is not Docker: the Tauri
// webview (tauri://localhost on macOS and Linux, http(s)://tauri.localhost on
// Windows) and the Vite dev server that `tauri dev` loads.
export const DESKTOP_ORIGINS = [
  'tauri://localhost',
  'http://tauri.localhost',
  'https://tauri.localhost',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const GUARDED_READS = new Set(['/export', '/checkin-fields']);

// Express routes case-insensitively and accepts a trailing slash, so /EXPORT and
// /export/ reach the export route: compare the path the same way it is matched.
function routePath(path) {
  return path.toLowerCase().replace(/\/+$/, '');
}

// Mounted at /api, so req.path is relative to it.
export function requireApiHeader(req, res, next) {
  if (SAFE_METHODS.has(req.method) && !GUARDED_READS.has(routePath(req.path))) return next();
  if (req.get(API_HEADER) === '1') return next();
  return res.status(403).json({
    message: `Missing ${API_HEADER} header.`,
    code: 'API_HEADER_REQUIRED',
  });
}
