import { describe, it, expect, afterEach } from 'vitest';
import request from 'supertest';
import { createApp, prisma } from '../index.js';
import { DESKTOP_ORIGINS } from '../middleware/apiHeader.js';

// CORS answers only Skima's own origins: the Tauri webview and the Vite dev
// server by default, nothing extra in Docker (same-origin), and exactly
// ALLOWED_ORIGINS when a deployment sets it.
describe('CORS configuration', () => {
  afterEach(() => {
    delete process.env.ALLOWED_ORIGINS;
    delete process.env.DOCKER;
  });

  it('never answers with a wildcard', async () => {
    const app = createApp();
    const res = await request(app).get('/api/config').set('Origin', 'http://anything.example');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it.each(DESKTOP_ORIGINS)('allows the desktop origin %s by default', async (origin) => {
    const app = createApp();
    const res = await request(app).get('/api/config').set('Origin', origin);
    expect(res.headers['access-control-allow-origin']).toBe(origin);
  });

  it('lets the Tauri webview preflight a request with the API header', async () => {
    const app = createApp();
    const res = await request(app)
      .options('/api/checkin-on')
      .set('Origin', 'tauri://localhost')
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'x-skima,content-type');
    expect(res.headers['access-control-allow-origin']).toBe('tauri://localhost');
    expect(res.headers['access-control-allow-headers']).toMatch(/x-skima/i);
  });

  it('fails the preflight of any other site', async () => {
    const app = createApp();
    const res = await request(app)
      .options('/api/checkin-on')
      .set('Origin', 'https://evil.example')
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'x-skima');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('allows no other origin in Docker without ALLOWED_ORIGINS', async () => {
    process.env.DOCKER = 'true';
    const app = createApp();
    const res = await request(app).get('/api/config').set('Origin', 'tauri://localhost');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
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

  it('ALLOWED_ORIGINS replaces the desktop origins', async () => {
    process.env.ALLOWED_ORIGINS = 'https://skima.example';
    const app = createApp();
    const res = await request(app).get('/api/config').set('Origin', 'tauri://localhost');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });
});

// A request another site can send without a preflight (form POST, fetch no-cors)
// cannot carry X-Skima, so the server refuses it before any handler runs.
describe('API header guard', () => {
  it.each([
    ['post', '/api/checkin-on'],
    ['post', '/api/checkin-off'],
    ['post', '/api/use'],
    ['post', '/api/auth/login'],
    ['post', '/api/setup'],
    ['post', '/api/import'],
    ['post', '/api/reset-database'],
    ['put', '/api/categories/reorder'],
    ['delete', '/api/skills/1'],
    ['get', '/api/export'],
    ['get', '/api/checkin-fields'],
  ])('refuses %s %s without the header', async (method, path) => {
    const res = await request(createApp())[method](path)
      .set('Origin', 'https://evil.example')
      .set('Content-Type', 'text/plain');
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('API_HEADER_REQUIRED');
  });

  it('a refused write changes nothing', async () => {
    const res = await request(createApp())
      .post('/api/collaborators')
      .set('Content-Type', 'application/json')
      .send({ nombre: 'Planted', rol: 'X' });
    expect(res.status).toBe(403);
    expect(await prisma.collaborator.count()).toBe(0);
  });

  it('lets the same write through with the header', async () => {
    const res = await request(createApp())
      .post('/api/collaborators')
      .set('X-Skima', '1')
      .send({ nombre: 'Real', rol: 'X' });
    expect(res.status).toBeLessThan(300);
    expect(await prisma.collaborator.count()).toBe(1);
  });

  it.each(['/api/config', '/api/checkin-status', '/api/collaborators'])(
    'leaves the plain read %s open',
    async (path) => {
      const res = await request(createApp()).get(path);
      expect(res.status).toBe(200);
    }
  );

  it('does not guard the static client outside /api', async () => {
    const res = await request(createApp()).post('/not-api');
    expect(res.status).not.toBe(403);
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
