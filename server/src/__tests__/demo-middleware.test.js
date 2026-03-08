import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createApp, prisma } from '../index.js';

describe('Demo Mode Middleware', () => {
  let app;

  beforeEach(async () => {
    process.env.DEMO_MODE = 'true';
    app = createApp();

    await prisma.assessment.deleteMany();
    await prisma.evaluationSession.deleteMany();
    await prisma.roleProfile.deleteMany();
    await prisma.collaborator.deleteMany();
    await prisma.skill.deleteMany();
    await prisma.category.deleteMany();
    await prisma.systemConfig.deleteMany();
  });

  afterEach(() => {
    delete process.env.DEMO_MODE;
  });

  // ---------------------------------------------------------------------------
  // Group 1: Blocked endpoints return 403
  // ---------------------------------------------------------------------------
  describe('Blocked endpoints return 403 when DEMO_MODE=true', () => {
    it('POST /api/setup returns 403', async () => {
      const res = await request(app)
        .post('/api/setup')
        .send({ companyName: 'Test', adminName: 'Admin' });

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('DEMO_MODE');
    });

    it('POST /api/reset-database returns 403', async () => {
      const res = await request(app).post('/api/reset-database');

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('DEMO_MODE');
    });

    it('POST /api/reset-demo returns 403', async () => {
      const res = await request(app).post('/api/reset-demo');

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('DEMO_MODE');
    });

    it('POST /api/import returns 403', async () => {
      const res = await request(app).post('/api/import');

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('DEMO_MODE');
    });

    it('PUT /api/config returns 403', async () => {
      const res = await request(app)
        .put('/api/config')
        .send({ companyName: 'Updated' });

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('DEMO_MODE');
    });

    it('DELETE /api/categories/1 returns 403', async () => {
      const res = await request(app).delete('/api/categories/1');

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('DEMO_MODE');
    });

    it('DELETE /api/collaborators/1 returns 403', async () => {
      const res = await request(app).delete('/api/collaborators/1');

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('DEMO_MODE');
    });

    it('DELETE /api/skills/1 returns 403', async () => {
      const res = await request(app).delete('/api/skills/1');

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('DEMO_MODE');
    });

    it('DELETE /api/role-profiles/Frontend%20Developer returns 403', async () => {
      const res = await request(app).delete('/api/role-profiles/Frontend%20Developer');

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('DEMO_MODE');
    });

    it('DELETE /api/evaluations/some-uuid-here returns 403', async () => {
      const res = await request(app).delete('/api/evaluations/some-uuid-here');

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('DEMO_MODE');
    });
  });

  // ---------------------------------------------------------------------------
  // Group 2: Allowed endpoints pass through (not 403)
  // ---------------------------------------------------------------------------
  describe('Allowed endpoints pass through when DEMO_MODE=true', () => {
    it('GET /api/config is not blocked', async () => {
      const res = await request(app).get('/api/config');

      expect(res.status).not.toBe(403);
    });

    it('POST /api/auth/login is not blocked', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ password: 'wrong' });

      expect(res.status).not.toBe(403);
    });

    it('GET /api/data is not blocked', async () => {
      const res = await request(app).get('/api/data');

      expect(res.status).not.toBe(403);
    });

    it('POST /api/collaborators is not blocked', async () => {
      const res = await request(app)
        .post('/api/collaborators')
        .send({ nombre: 'Test', rol: 'Dev', area: 'Eng' });

      expect(res.status).not.toBe(403);
    });

    it('POST /api/config/verify is not blocked', async () => {
      const res = await request(app)
        .post('/api/config/verify')
        .send({ password: 'test' });

      expect(res.status).not.toBe(403);
    });

    it('GET /api/export is not blocked', async () => {
      const res = await request(app).get('/api/export');

      expect(res.status).not.toBe(403);
    });

    it('POST /api/seed-demo is not blocked', async () => {
      const res = await request(app).post('/api/seed-demo');

      expect(res.status).not.toBe(403);
    });
  });

  // ---------------------------------------------------------------------------
  // Group 3: Middleware disabled when DEMO_MODE is not set
  // ---------------------------------------------------------------------------
  describe('Middleware is disabled when DEMO_MODE is not set', () => {
    it('POST /api/setup is NOT blocked when DEMO_MODE is unset', async () => {
      delete process.env.DEMO_MODE;
      const freshApp = createApp();

      const res = await request(freshApp)
        .post('/api/setup')
        .send({ companyName: 'Test Co', adminName: 'Admin' });

      expect(res.status).not.toBe(403);
    });

    it('POST /api/setup is NOT blocked when DEMO_MODE=false', async () => {
      process.env.DEMO_MODE = 'false';
      const freshApp = createApp();

      const res = await request(freshApp)
        .post('/api/setup')
        .send({ companyName: 'Test Co', adminName: 'Admin' });

      expect(res.status).not.toBe(403);
    });
  });

  // ---------------------------------------------------------------------------
  // Group 4: isOnlineDemo field in GET /api/config
  // ---------------------------------------------------------------------------
  describe('isOnlineDemo in GET /api/config', () => {
    it('returns isOnlineDemo: true when DEMO_MODE=true', async () => {
      const res = await request(app).get('/api/config');

      expect(res.status).toBe(200);
      expect(res.body.isOnlineDemo).toBe(true);
    });

    it('returns isOnlineDemo: false when DEMO_MODE is unset', async () => {
      delete process.env.DEMO_MODE;
      const freshApp = createApp();

      const res = await request(freshApp).get('/api/config');

      expect(res.status).toBe(200);
      expect(res.body.isOnlineDemo).toBe(false);
    });
  });
});
