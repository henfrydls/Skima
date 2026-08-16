import { describe, it, expect, vi, beforeEach } from 'vitest';
import { track } from '../analytics';

// The Umami script is injected at runtime by docker/entrypoint.sh (demo only),
// so this module just forwards custom events. It must be a safe no-op whenever
// the script isn't present (desktop, dev, forks) and never throw.
describe('analytics.track', () => {
  beforeEach(() => {
    delete window.umami;
  });

  it('is a safe no-op when the Umami script has not loaded', () => {
    expect(() => track('download', { os: 'macos' })).not.toThrow();
  });

  it('forwards event + data to window.umami when present', () => {
    const spy = vi.fn();
    window.umami = { track: spy };
    track('download', { os: 'linux', asset: 'Skima.AppImage' });
    expect(spy).toHaveBeenCalledWith('download', { os: 'linux', asset: 'Skima.AppImage' });
  });

  it('forwards a bare event with no data', () => {
    const spy = vi.fn();
    window.umami = { track: spy };
    track('github');
    expect(spy).toHaveBeenCalledWith('github');
  });

  it('does not throw if window.umami.track throws', () => {
    window.umami = { track: () => { throw new Error('boom'); } };
    expect(() => track('demo')).not.toThrow();
  });
});
