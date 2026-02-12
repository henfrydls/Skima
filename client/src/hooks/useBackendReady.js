import { useState, useEffect } from 'react';
import { API_BASE } from '../lib/apiBase';

/**
 * Hook that polls the backend health endpoint until it responds.
 * Used in Tauri desktop mode where the sidecar takes a moment to start.
 * In dev mode with Vite proxy, it resolves almost instantly.
 *
 * @param {object} options
 * @param {number} options.interval - Polling interval in ms (default: 500)
 * @param {number} options.timeout - Max wait time in ms (default: 15000)
 * @returns {{ ready: boolean, error: string|null }}
 */
export function useBackendReady({ interval = 500, timeout = 15000 } = {}) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const start = Date.now();

    async function poll() {
      while (!cancelled) {
        try {
          const res = await fetch(`${API_BASE}/api/config`, { signal: AbortSignal.timeout(2000) });
          if (res.ok) {
            if (!cancelled) setReady(true);
            return;
          }
        } catch {
          // Backend not ready yet
        }

        if (Date.now() - start > timeout) {
          if (!cancelled) setError('Backend did not respond in time');
          return;
        }

        await new Promise(r => setTimeout(r, interval));
      }
    }

    poll();
    return () => { cancelled = true; };
  }, [interval, timeout]);

  return { ready, error };
}
