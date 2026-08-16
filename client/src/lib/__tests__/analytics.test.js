import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { initAnalytics, track } from '../analytics';

// Guards the privacy contract: analytics is web-only + opt-in and must NEVER
// load in the desktop app or in an unconfigured (fork/dev) build.
describe('analytics — web-only, opt-in', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    delete window.umami;
    delete window.__TAURI__;
    delete window.__TAURI_INTERNALS__;
    delete window.isTauri;
    vi.unstubAllEnvs();
  });
  afterEach(() => vi.unstubAllEnvs());

  const scriptCount = () => document.querySelectorAll('script[data-website-id]').length;
  const configure = () => {
    vi.stubEnv('VITE_UMAMI_SRC', 'https://analytics.example.com/script.js');
    vi.stubEnv('VITE_UMAMI_WEBSITE_ID', 'abc-123');
  };

  it('does not inject when env vars are unset (forks/dev disabled by default)', () => {
    initAnalytics();
    expect(scriptCount()).toBe(0);
  });

  it('does not inject inside the desktop app (Tauri) even when configured', () => {
    configure();
    window.__TAURI__ = {};
    initAnalytics();
    expect(scriptCount()).toBe(0);
  });

  it('does not inject when only one env var is set', () => {
    vi.stubEnv('VITE_UMAMI_SRC', 'https://analytics.example.com/script.js');
    initAnalytics();
    expect(scriptCount()).toBe(0);
  });

  it('injects exactly once when configured and on the web (idempotent)', () => {
    configure();
    initAnalytics();
    initAnalytics();
    expect(scriptCount()).toBe(1);
    const s = document.querySelector('script[data-website-id]');
    expect(s.src).toContain('analytics.example.com/script.js');
    expect(s.getAttribute('data-website-id')).toBe('abc-123');
  });

  it('track() is a safe no-op when Umami is not loaded (desktop/dev)', () => {
    expect(() => track('download', { os: 'macos' })).not.toThrow();
  });

  it('track() forwards event + data to window.umami when present', () => {
    const spy = vi.fn();
    window.umami = { track: spy };
    track('download', { os: 'linux', asset: 'Skima.AppImage' });
    expect(spy).toHaveBeenCalledWith('download', { os: 'linux', asset: 'Skima.AppImage' });
    track('github');
    expect(spy).toHaveBeenCalledWith('github');
  });
});
