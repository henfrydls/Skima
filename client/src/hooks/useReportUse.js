import { useEffect } from 'react';
import { API_BASE } from '../lib/apiBase';
import { useConfig } from '../contexts/ConfigContext';

// How often, at most, the interface tells the server Skima is in use. The server sends
// the check-in on the first report of each day and skips the rest from memory.
export const REPORT_EVERY_MS = 10 * 60 * 1000;

const ACTIVITY_EVENTS = ['pointerdown', 'keydown'];

/**
 * Reports that someone is using Skima: when the app opens, and then at most every few
 * minutes when the person clicks, types or comes back to the window. A window left open
 * with nobody at it reports nothing, so a day counts only if Skima was used that day.
 */
export function useReportUse() {
  const { isSetup, isOnlineDemo } = useConfig();

  useEffect(() => {
    if (!isSetup || isOnlineDemo) return undefined;

    let last = -Infinity;
    const report = () => {
      if (document.visibilityState === 'hidden') return;
      const now = Date.now();
      if (now - last < REPORT_EVERY_MS) return;
      last = now;
      fetch(`${API_BASE}/api/use`, { method: 'POST' }).catch(() => {});
    };

    report();
    ACTIVITY_EVENTS.forEach((name) => window.addEventListener(name, report, { passive: true }));
    document.addEventListener('visibilitychange', report);
    return () => {
      ACTIVITY_EVENTS.forEach((name) => window.removeEventListener(name, report));
      document.removeEventListener('visibilitychange', report);
    };
  }, [isSetup, isOnlineDemo]);
}
