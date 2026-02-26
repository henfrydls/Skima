/**
 * API base URL - detects Tauri desktop vs web browser at runtime.
 * In Tauri: backend runs as sidecar on localhost:3001
 * In browser dev: Vite proxy handles /api -> localhost:3001
 */
export const API_BASE = window.__TAURI_INTERNALS__ ? 'http://localhost:11420' : '';
