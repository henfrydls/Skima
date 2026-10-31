import { describe, it, expect, vi } from 'vitest';
import { installApiHeader, isApiUrl, API_HEADER } from '../apiBase';

function install(base) {
  const original = vi.fn(async () => ({ ok: true }));
  const target = { fetch: original };
  installApiHeader(target, base);
  return { target, original, sent: (i = 0) => original.mock.calls[i] };
}

describe('installApiHeader', () => {
  it('adds the header to a relative API call (web)', async () => {
    const { target, sent } = install('');
    await target.fetch('/api/use', { method: 'POST' });
    const [url, init] = sent();
    expect(url).toBe('/api/use');
    expect(init.method).toBe('POST');
    expect(init.headers.get(API_HEADER)).toBe('1');
  });

  it('adds the header to the sidecar URL (desktop)', async () => {
    const { target, sent } = install('http://localhost:11420');
    await target.fetch('http://localhost:11420/api/export');
    expect(sent()[1].headers.get(API_HEADER)).toBe('1');
  });

  it('keeps the headers the caller set', async () => {
    const { target, sent } = install('');
    await target.fetch('/api/checkin-on', {
      method: 'POST',
      headers: { Authorization: 'Bearer t', 'Content-Type': 'application/json' },
    });
    const headers = sent()[1].headers;
    expect(headers.get('Authorization')).toBe('Bearer t');
    expect(headers.get('Content-Type')).toBe('application/json');
    expect(headers.get(API_HEADER)).toBe('1');
  });

  it('never sends the header to another site', async () => {
    const { target, sent } = install('http://localhost:11420');
    const init = { headers: { Accept: 'application/json' } };
    await target.fetch('https://api.github.com/repos/x/y/releases/latest', init);
    expect(sent()[1]).toBe(init);
  });
});

describe('isApiUrl', () => {
  it('matches only paths under /api/ on the base', () => {
    expect(isApiUrl('/api/config', '')).toBe(true);
    expect(isApiUrl('/apidocs', '')).toBe(false);
    expect(isApiUrl('http://localhost:11420/api/use', 'http://localhost:11420')).toBe(true);
    expect(isApiUrl('http://localhost:11420.evil.example/api/use', 'http://localhost:11420')).toBe(false);
  });
});
