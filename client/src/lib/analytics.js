// Web-only, opt-in analytics (Umami) for the public landing/demo.
//
// Privacy contract:
// - NEVER runs inside the desktop app (Tauri). Skima's promise is "no account,
//   no cloud, no tracking" and the user's data never leaves their machine.
// - Disabled unless the build explicitly provides BOTH env vars below. Only the
//   demo/landing build sets them, so forks and dev builds ship with tracking
//   fully off by default (no reference to anyone's analytics server).
// - Every call is a safe no-op when disabled, so instrumentation can live in
//   shared components (landing + app) without leaking into desktop.
//
// Configure via build-time env (see Dockerfile / docker.yml):
//   VITE_UMAMI_SRC        e.g. https://analytics.example.com/script.js
//   VITE_UMAMI_WEBSITE_ID the Umami website UUID (public; appears in page source)

function isTauri() {
  return (
    typeof window !== 'undefined' &&
    (window.__TAURI__ !== undefined ||
      window.__TAURI_INTERNALS__ !== undefined ||
      window.isTauri === true)
  );
}

/**
 * Inject the Umami tracking script when — and only when — analytics is both
 * configured (env vars present) and running on the web (not Tauri). Idempotent.
 */
export function initAnalytics() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const src = import.meta.env.VITE_UMAMI_SRC;
  const websiteId = import.meta.env.VITE_UMAMI_WEBSITE_ID;
  if (!src || !websiteId) return; // not configured → disabled (forks, dev)
  if (isTauri()) return; // desktop app → never track
  if (document.querySelector('script[data-website-id]')) return; // already injected

  const script = document.createElement('script');
  script.async = true;
  script.defer = true;
  script.src = src;
  script.setAttribute('data-website-id', websiteId);
  document.head.appendChild(script);
}

/**
 * Record a custom event. Safe everywhere: a no-op if the Umami script never
 * loaded (desktop, dev, forks, or before the async script resolves).
 *
 * @param {string} event  event name, e.g. 'download'
 * @param {object} [data] event data, e.g. { os: 'macos', asset: 'Skima_1.4.3_aarch64.dmg' }
 */
export function track(event, data) {
  try {
    if (typeof window !== 'undefined' && window.umami && typeof window.umami.track === 'function') {
      if (data !== undefined) window.umami.track(event, data);
      else window.umami.track(event);
    }
  } catch {
    // Analytics must never break the app.
  }
}
