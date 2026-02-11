import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp, prisma } from '../index.js';

describe('Demo Routes', () => {
  let app;

  beforeEach(async () => {
    app = createApp();

    // Clean all data for a fresh state
    await prisma.assessment.deleteMany();
    await prisma.evaluationSession.deleteMany();
    await prisma.roleProfile.deleteMany();
    await prisma.collaborator.deleteMany();
    await prisma.skill.deleteMany();
    await prisma.category.deleteMany();
    await prisma.systemConfig.deleteMany();
  });

  describe('POST /api/seed-demo', () => {
    it('should seed demo data on empty database', async () => {
      const res = await request(app).post('/api/seed-demo');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.isSetup).toBe(true);
      expect(res.body.companyName).toBe('Empresa Demo');
      expect(res.body.adminName).toBe('Administrador');

      // Verify stats
      expect(res.body.stats.categories).toBe(4);
      expect(res.body.stats.skills).toBe(12);
      expect(res.body.stats.collaborators).toBe(4);
      expect(res.body.stats.roleProfiles).toBe(4);
      expect(res.body.stats.evaluationSessions).toBe(12);
    });

    it('should return 409 if data already exists', async () => {
      // Seed first
      await request(app).post('/api/seed-demo');

      // Try again
      const res = await request(app).post('/api/seed-demo');

      expect(res.status).toBe(409);
      expect(res.body.error).toContain('Ya existen datos');
    });

    it('should create demo collaborators with esDemo flag', async () => {
      await request(app).post('/api/seed-demo');

      const collabs = await prisma.collaborator.findMany();
      expect(collabs.length).toBe(4);
      expect(collabs.every(c => c.esDemo === true)).toBe(true);
    });

    it('should create evaluation sessions with assessments', async () => {
      await request(app).post('/api/seed-demo');

      const sessions = await prisma.evaluationSession.findMany();
      expect(sessions.length).toBe(12); // 4 collaborators x 3 periods

      const assessments = await prisma.assessment.findMany();
      expect(assessments.length).toBe(144); // 12 sessions x 12 skills
    });

    it('should set SystemConfig as demo setup', async () => {
      await request(app).post('/api/seed-demo');

      const config = await prisma.systemConfig.findFirst();
      expect(config.isSetup).toBe(true);
      expect(config.companyName).toBe('Empresa Demo');
      expect(config.adminName).toBe('Administrador');
      expect(config.adminPassword).toBeNull();
    });

    it('should set lastEvaluated on collaborators', async () => {
      await request(app).post('/api/seed-demo');

      const collabs = await prisma.collaborator.findMany();
      expect(collabs.every(c => c.lastEvaluated !== null)).toBe(true);
    });

    it('should create role profiles', async () => {
      await request(app).post('/api/seed-demo');

      const profiles = await prisma.roleProfile.findMany();
      expect(profiles.length).toBe(4);
      expect(profiles.map(p => p.rol).sort()).toEqual([
        'Data Analyst',
        'Full Stack Developer',
        'Tech Lead',
        'UX Designer',
      ]);
    });
  });

  describe('GET /api/config (demo state)', () => {
    it('should return isDemo true when demo data exists', async () => {
      await request(app).post('/api/seed-demo');

      const res = await request(app).get('/api/config');

      expect(res.status).toBe(200);
      expect(res.body.isDemo).toBe(true);
      expect(res.body.isSetup).toBe(true);
      expect(res.body.hasPassword).toBe(false);
    });

    it('should return isDemo false when no demo data', async () => {
      await prisma.systemConfig.create({
        data: { id: 1, isSetup: true, companyName: 'Real Co', adminName: 'Admin', adminPassword: 'pass' },
      });

      const res = await request(app).get('/api/config');

      expect(res.status).toBe(200);
      expect(res.body.isDemo).toBe(false);
      expect(res.body.isSetup).toBe(true);
      expect(res.body.hasPassword).toBe(true);
    });
  });
});
