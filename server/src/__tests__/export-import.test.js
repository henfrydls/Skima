import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp, prisma } from '../index.js';

// Characterization tests for the data-portability endpoints (GET /api/export,
// POST /api/import). These guard the serialization/round-trip shape so the
// Prisma 6->7 migration (createMany, findMany) can't silently break backups.

describe('Data portability endpoints', () => {
  let app;

  beforeEach(async () => {
    app = createApp();
    // Open (no-password) auth mode; setup.js does not clean systemConfig.
    await prisma.systemConfig.deleteMany();

    await prisma.category.create({ data: { id: 1, nombre: 'Backend', abrev: 'BE' } });
    await prisma.skill.create({ data: { id: 1, nombre: 'Node.js', categoriaId: 1 } });
    const collab = await prisma.collaborator.create({
      data: { id: 1, nombre: 'Ana', rol: 'Developer', esDemo: false },
    });
    await prisma.assessment.create({
      data: { collaboratorId: collab.id, skillId: 1, nivel: 3, criticidad: 'C', frecuencia: 'D' },
    });
  });

  describe('GET /api/export', () => {
    it('returns the canonical envelope with version and data collections', async () => {
      const res = await request(app).get('/api/export');
      expect(res.status).toBe(200);
      expect(res.body.version).toBe('1.0');
      expect(typeof res.body.exportDate).toBe('string');
      expect(res.body.data).toHaveProperty('categories');
      expect(res.body.data).toHaveProperty('skills');
      expect(res.body.data).toHaveProperty('collaborators');
      expect(res.body.data).toHaveProperty('assessments');
      expect(res.body.data).toHaveProperty('snapshots');
    });

    it('includes the seeded rows in the dump', async () => {
      const res = await request(app).get('/api/export');
      expect(res.body.data.categories.length).toBe(1);
      expect(res.body.data.skills.length).toBe(1);
      expect(res.body.data.collaborators.length).toBe(1);
      expect(res.body.data.assessments.length).toBe(1);
      expect(res.body.data.categories[0].nombre).toBe('Backend');
    });
  });

  describe('POST /api/import', () => {
    it('returns 400 when the data envelope is missing', async () => {
      const res = await request(app).post('/api/import').send({});
      expect(res.status).toBe(400);
    });

    it('returns 400 when skills are missing from the payload', async () => {
      const res = await request(app).post('/api/import').send({ data: { categories: [] } });
      expect(res.status).toBe(400);
    });

    it('wipes existing data and replaces it on import', async () => {
      const res = await request(app)
        .post('/api/import')
        .send({
          data: {
            categories: [{ id: 10, nombre: 'Frontend', abrev: 'FE' }],
            skills: [],
          },
        });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const categories = await prisma.category.findMany();
      expect(categories.length).toBe(1);
      expect(categories[0].nombre).toBe('Frontend');
      // original Backend category + its skill/collaborator/assessment were wiped
      expect(await prisma.skill.count()).toBe(0);
      expect(await prisma.collaborator.count()).toBe(0);
      expect(await prisma.assessment.count()).toBe(0);
    });

    it('round-trips a full export back into the database', async () => {
      const exported = await request(app).get('/api/export');

      const res = await request(app).post('/api/import').send({ data: exported.body.data });
      expect(res.status).toBe(200);

      expect(await prisma.category.count()).toBe(1);
      expect(await prisma.skill.count()).toBe(1);
      expect(await prisma.collaborator.count()).toBe(1);
      expect(await prisma.assessment.count()).toBe(1);
      const a = await prisma.assessment.findFirst();
      expect(a.nivel).toBe(3);
      expect(a.criticidad).toBe('C');
    });
  });
});
