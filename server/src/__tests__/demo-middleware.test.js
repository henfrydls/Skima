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

    it('POST /api/seed-demo returns 403', async () => {
      const res = await request(app).post('/api/seed-demo');

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
});
