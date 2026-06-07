import { describe, it, expect, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../index.js';

// CORS is permissive by default (desktop Tauri webview + local dev rely on
// it) and locks down to an allowlist only when ALLOWED_ORIGINS is set, which
// the hosted demo / self-host deployments do.
describe('CORS configuration', () => {
  afterEach(() => {
    delete process.env.ALLOWED_ORIGINS;
  });

  it('allows any origin by default (permissive for desktop / dev)', async () => {
    const app = createApp();
    const res = await request(app).get('/api/config').set('Origin', 'http://anything.example');
    expect(res.headers['access-control-allow-origin']).toBe('*');
  });

  it('reflects an allowlisted origin when ALLOWED_ORIGINS is set', async () => {
    process.env.ALLOWED_ORIGINS = 'https://skima.henfrydls.com';
    const app = createApp();
    const res = await request(app)
      .get('/api/config')
      .set('Origin', 'https://skima.henfrydls.com');
    expect(res.headers['access-control-allow-origin']).toBe('https://skima.henfrydls.com');
  });

  it('omits the CORS header for a non-allowlisted origin', async () => {
    process.env.ALLOWED_ORIGINS = 'https://skima.henfrydls.com';
    const app = createApp();
    const res = await request(app)
      .get('/api/config')
      .set('Origin', 'https://evil.example');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });
});

// trust proxy must be enabled behind Cloudflare/Nginx so the login rate
// limiter buckets by the real client IP, not the proxy's. Off by default so a
// directly-exposed instance can't be IP-spoofed via X-Forwarded-For.
describe('trust proxy configuration', () => {
  afterEach(() => {
    delete process.env.TRUST_PROXY;
  });

  it('does not trust proxy headers by default', () => {
    const app = createApp();
    expect(app.get('trust proxy')).toBe(false);
  });

  it('trusts the first proxy hop when TRUST_PROXY is set', () => {
    process.env.TRUST_PROXY = '1';
    const app = createApp();
    expect(app.get('trust proxy')).toBe(1);
  });
});
