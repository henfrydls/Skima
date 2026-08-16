// Custom analytics events for the public demo funnel.
//
// The Umami tracking script is injected at RUNTIME by docker/entrypoint.sh, and
// ONLY in the online demo (DEMO_MODE=true + UMAMI_SRC + UMAMI_WEBSITE_ID). It is
// never in the source, the built image, the desktop app, or a fork's build —
// keeping Skima's "no account, no cloud, no tracking" promise.
//
// This module only records custom events on top of that script (e.g. what
// visitors download). Every call is a safe no-op when the script isn't present
// (desktop, dev, forks, or before it finishes loading), so instrumentation can
// live in shared components without leaking tracking anywhere it shouldn't.

/**
 * Record a custom event. No-op unless the Umami script has loaded.
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
