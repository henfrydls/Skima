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
    it('should seed rich demo data on empty database', async () => {
      const res = await request(app).post('/api/seed-demo');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.isSetup).toBe(true);
      expect(res.body.companyName).toBe('Empresa Demo');
      expect(res.body.adminName).toBe('Administrador');

      // Verify stats match the rich seed data
      expect(res.body.stats.categories).toBe(7);
      expect(res.body.stats.skills).toBe(40);
      expect(res.body.stats.collaborators).toBe(10);
      expect(res.body.stats.roleProfiles).toBe(7);
      expect(res.body.stats.evaluationSessions).toBe(66);
    }, 30000);

    it('should re-seed cleanly when data already exists', async () => {
      // Seed first
      await request(app).post('/api/seed-demo');

      // Seed again — should clear and re-seed
      const res = await request(app).post('/api/seed-demo');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.stats.collaborators).toBe(10);

      // Verify no duplicate data
      const collabs = await prisma.collaborator.findMany();
      expect(collabs.length).toBe(10);
    }, 30000);

    it('should create demo collaborators with esDemo flag', async () => {
      await request(app).post('/api/seed-demo');

      const collabs = await prisma.collaborator.findMany();
      expect(collabs.length).toBe(10);
      expect(collabs.every(c => c.esDemo === true)).toBe(true);
    }, 30000);

    it('should create evaluation sessions with assessments', async () => {
      await request(app).post('/api/seed-demo');

      const sessions = await prisma.evaluationSession.findMany();
      expect(sessions.length).toBe(66);

      const assessments = await prisma.assessment.findMany();
      expect(assessments.length).toBe(2528);
    }, 30000);

    it('should set SystemConfig as demo setup', async () => {
      await request(app).post('/api/seed-demo');

      const config = await prisma.systemConfig.findFirst();
      expect(config.isSetup).toBe(true);
      expect(config.companyName).toBe('Empresa Demo');
      expect(config.adminName).toBe('Administrador');
      expect(config.adminPassword).toBeNull();
    }, 30000);

    it('should set lastEvaluated on evaluated collaborators', async () => {
      await request(app).post('/api/seed-demo');

      const collabs = await prisma.collaborator.findMany();
      // Juana (External Consultant) has no evaluations, so lastEvaluated stays null
      const evaluated = collabs.filter(c => c.rol !== 'External Consultant');
      expect(evaluated.every(c => c.lastEvaluated !== null)).toBe(true);

      const juana = collabs.find(c => c.rol === 'External Consultant');
      expect(juana.lastEvaluated).toBeNull();
    }, 30000);

    it('should create role profiles', async () => {
      await request(app).post('/api/seed-demo');

      const profiles = await prisma.roleProfile.findMany();
      expect(profiles.length).toBe(7);
      expect(profiles.map(p => p.rol).sort()).toEqual([
        'Backend Developer',
        'Frontend Developer',
        'Innovation Specialist',
        'Product Owner',
        'Security Guard',
        'Tech Lead',
        'UX Designer',
      ]);
    }, 30000);

    it('should include inactive collaborator and legacy category', async () => {
      await request(app).post('/api/seed-demo');

      const inactive = await prisma.collaborator.findMany({ where: { isActive: false } });
      expect(inactive.length).toBe(1);
      expect(inactive[0].nombre).toBe('Roberto Fantasma');

      const legacyCat = await prisma.category.findFirst({ where: { isActive: false } });
      expect(legacyCat).not.toBeNull();
      expect(legacyCat.nombre).toBe('Legacy Systems');

      const legacySkills = await prisma.skill.findMany({ where: { isActive: false } });
      expect(legacySkills.length).toBe(2);
    }, 30000);
  });

  describe('GET /api/config (demo state)', () => {
    it('should return isDemo true when demo data exists', async () => {
      await request(app).post('/api/seed-demo');

      const res = await request(app).get('/api/config');

      expect(res.status).toBe(200);
      expect(res.body.isDemo).toBe(true);
      expect(res.body.isSetup).toBe(true);
      expect(res.body.hasPassword).toBe(false);
    }, 30000);

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
