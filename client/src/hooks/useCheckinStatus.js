import { useCallback, useEffect, useState } from 'react';
import { API_BASE } from '../lib/apiBase';

/**
 * State of the anonymous check-in from the public /api/checkin-status.
 * `status` is null while loading or if the server could not be reached.
 * `sends` is true only for a build that would really send: configured and not disabled.
 */
export function useCheckinStatus() {
  const [status, setStatus] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/checkin-status`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setStatus(await res.json());
    } catch {
      setStatus(null);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const sends = !!status && status.configured && !status.disabled;
  return { status, sends, refresh };
}
