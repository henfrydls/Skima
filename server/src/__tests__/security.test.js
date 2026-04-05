import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../index.js';

describe('Security Headers', () => {
  let app;

  beforeEach(() => {
    app = createApp();
  });

  it('sets X-Content-Type-Options header', async () => {
    const res = await request(app).get('/api/config');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  it('sets X-Frame-Options header', async () => {
    const res = await request(app).get('/api/config');
    expect(res.headers['x-frame-options']).toBe('DENY');
  });

  it('removes X-Powered-By header', async () => {
    const res = await request(app).get('/api/config');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('limits JSON body size to 1MB', async () => {
    const largeBody = { data: 'x'.repeat(2 * 1024 * 1024) };
    const res = await request(app)
      .post('/api/setup')
      .send(largeBody);
    expect(res.status).toBe(413);
  });
});

describe('Input Validation', () => {
  let app;

  beforeEach(() => {
    app = createApp();
  });

  it('rejects setup with missing companyName', async () => {
    const res = await request(app)
      .post('/api/setup')
      .send({ adminName: 'Admin', adminPassword: 'pass123' });
    expect(res.status).toBe(400);
  });

  it('rejects setup with empty companyName', async () => {
    const res = await request(app)
      .post('/api/setup')
      .send({ companyName: '', adminName: 'Admin', adminPassword: 'pass123' });
    expect(res.status).toBe(400);
  });

  it('rejects setup with companyName exceeding 200 chars', async () => {
    const res = await request(app)
      .post('/api/setup')
      .send({ companyName: 'x'.repeat(201), adminName: 'Admin', adminPassword: 'pass123' });
    expect(res.status).toBe(400);
  });

  it('rejects collaborator creation with missing nombre', async () => {
    const res = await request(app)
      .post('/api/collaborators')
      .send({ rol: 'Developer', area: 'Engineering' });
    expect(res.status).toBe(400);
  });
});

describe('Demo Mode — Completeness Check', () => {
  let app;

  beforeEach(() => {
    process.env.DEMO_MODE = 'true';
    app = createApp();
  });

  afterEach(() => {
    delete process.env.DEMO_MODE;
  });

  const destructiveEndpoints = [
    ['POST', '/api/reset-database'],
    ['POST', '/api/setup'],
    ['POST', '/api/reset-demo'],
    ['POST', '/api/import'],
    ['PUT', '/api/config'],
    ['DELETE', '/api/categories/1'],
    ['DELETE', '/api/collaborators/1'],
    ['DELETE', '/api/skills/1'],
    ['DELETE', '/api/role-profiles/TestRole'],
    ['DELETE', '/api/evaluations/test-uuid'],
    ['DELETE', '/api/development-plans/1'],
    ['DELETE', '/api/development-goals/1'],
    ['DELETE', '/api/development-actions/1'],
    ['POST', '/api/development-plans'],
    ['PUT', '/api/development-plans/1'],
    ['POST', '/api/development-plans/1/goals'],
    ['PUT', '/api/development-goals/1'],
    ['POST', '/api/development-goals/1/actions'],
    ['PUT', '/api/development-actions/1'],
  ];

  destructiveEndpoints.forEach(([method, path]) => {
    it(`blocks ${method} ${path} in demo mode`, async () => {
      const res = await request(app)[method.toLowerCase()](path).send({});
      expect(res.status).toBe(403);
      expect(res.body.error).toBe('DEMO_MODE');
    });
  });

  it('allows GET /api/config in demo mode', async () => {
    const res = await request(app).get('/api/config');
    expect(res.status).not.toBe(403);
  });

  it('allows POST /api/seed-demo in demo mode', async () => {
    const res = await request(app).post('/api/seed-demo');
    expect(res.status).not.toBe(403);
  });
});

describe('JWT Security', () => {
  let app;

  beforeEach(() => {
    app = createApp();
  });

  it('rejects requests with malformed JWT to protected routes', async () => {
    const res = await request(app)
      .get('/api/export')
      .set('Authorization', 'Bearer not-a-valid-jwt');
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('INVALID_TOKEN');
  });

  it('rejects requests with expired JWT', async () => {
    const jwt = await import('jsonwebtoken');
    const { JWT_SECRET } = await import('../jwtSecret.js');
    const expiredToken = jwt.default.sign(
      { role: 'admin' },
      JWT_SECRET,
      { expiresIn: '0s' }
    );
    await new Promise(r => setTimeout(r, 100));

    const res = await request(app)
      .get('/api/export')
      .set('Authorization', `Bearer ${expiredToken}`);
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('TOKEN_EXPIRED');
  });

  it('rejects JWT signed with wrong secret', async () => {
    const jwt = await import('jsonwebtoken');
    const fakeToken = jwt.default.sign(
      { role: 'admin' },
      'wrong-secret-key',
      { expiresIn: '1h' }
    );

    const res = await request(app)
      .get('/api/export')
      .set('Authorization', `Bearer ${fakeToken}`);
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('INVALID_TOKEN');
  });
});
