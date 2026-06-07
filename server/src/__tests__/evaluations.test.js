import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp, prisma } from '../index.js';

// Characterization tests for the evaluation endpoints. These lock in the
// CURRENT correct behavior of the highest-risk write paths in index.js
// (PUT /collaborators/:id/skills, POST/GET/DELETE /evaluations) so that the
// Prisma 6->7 migration and the demo-mode hardening can't silently regress
// them. Auth is open in tests (no admin password configured).

describe('Evaluation endpoints', () => {
  let app;
  let collab;

  beforeEach(async () => {
    app = createApp();

    // setup.js does not clean systemConfig; clear any leftover admin password
    // so authMiddleware runs in open (no-password / desktop) mode for these tests.
    await prisma.systemConfig.deleteMany();

    await prisma.category.create({ data: { id: 1, nombre: 'Backend', abrev: 'BE' } });
    await prisma.skill.create({ data: { id: 1, nombre: 'Node.js', categoriaId: 1 } });
    await prisma.skill.create({ data: { id: 2, nombre: 'SQL', categoriaId: 1 } });
    // Role profile assigns criticidad 'C' to skill 1 only.
    await prisma.roleProfile.create({
      data: { rol: 'Developer', skills: JSON.stringify({ 1: 'C' }) },
    });
    collab = await prisma.collaborator.create({
      data: { nombre: 'Ana', rol: 'Developer', esDemo: false },
    });
  });

  describe('PUT /api/collaborators/:id/skills', () => {
    it('saves a new current assessment and returns success', async () => {
      const res = await request(app)
        .put(`/api/collaborators/${collab.id}/skills`)
        .send({ 1: { nivel: 3, frecuencia: 'D' } });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const assessments = await prisma.assessment.findMany({
        where: { collaboratorId: collab.id, snapshotId: null },
      });
      expect(assessments.length).toBe(1);
      expect(assessments[0].nivel).toBe(3);
      expect(assessments[0].frecuencia).toBe('D');
      // criticidad pulled from the role profile
      expect(assessments[0].criticidad).toBe('C');
    });

    it("defaults criticidad to 'N' when the skill is not in the role profile", async () => {
      await request(app)
        .put(`/api/collaborators/${collab.id}/skills`)
        .send({ 2: { nivel: 2, frecuencia: 'S' } });

      const a = await prisma.assessment.findFirst({
        where: { collaboratorId: collab.id, skillId: 2, snapshotId: null },
      });
      expect(a.criticidad).toBe('N');
    });

    it('updates an existing current assessment instead of duplicating', async () => {
      await request(app)
        .put(`/api/collaborators/${collab.id}/skills`)
        .send({ 1: { nivel: 2, frecuencia: 'D' } });
      await request(app)
        .put(`/api/collaborators/${collab.id}/skills`)
        .send({ 1: { nivel: 4, frecuencia: 'S' } });

      const assessments = await prisma.assessment.findMany({
        where: { collaboratorId: collab.id, skillId: 1, snapshotId: null },
      });
      expect(assessments.length).toBe(1);
      expect(assessments[0].nivel).toBe(4);
      expect(assessments[0].frecuencia).toBe('S');
    });

    it('returns 404 for a nonexistent collaborator', async () => {
      const res = await request(app)
        .put('/api/collaborators/99999/skills')
        .send({ 1: { nivel: 3, frecuencia: 'D' } });
      expect(res.status).toBe(404);
    });

    it('returns 400 for a level out of the 0-5 range', async () => {
      const res = await request(app)
        .put(`/api/collaborators/${collab.id}/skills`)
        .send({ 1: { nivel: 6, frecuencia: 'D' } });
      expect(res.status).toBe(400);
    });

    it('returns 400 for an invalid frequency', async () => {
      const res = await request(app)
        .put(`/api/collaborators/${collab.id}/skills`)
        .send({ 1: { nivel: 3, frecuencia: 'X' } });
      expect(res.status).toBe(400);
    });

    it('stamps lastEvaluated on the collaborator', async () => {
      expect(collab.lastEvaluated).toBeNull();
      await request(app)
        .put(`/api/collaborators/${collab.id}/skills`)
        .send({ 1: { nivel: 3, frecuencia: 'D' } });
      const after = await prisma.collaborator.findUnique({ where: { id: collab.id } });
      expect(after.lastEvaluated).not.toBeNull();
    });
  });

  describe('POST /api/evaluations', () => {
    it('creates a session and returns a uuid', async () => {
      const res = await request(app)
        .post('/api/evaluations')
        .send({ collaboratorId: collab.id, skills: { 1: { nivel: 4, frecuencia: 'D' } } });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(typeof res.body.uuid).toBe('string');

      const session = await prisma.evaluationSession.findUnique({
        where: { uuid: res.body.uuid },
        include: { assessments: true },
      });
      expect(session).not.toBeNull();
      // session-linked assessment
      expect(session.assessments.length).toBe(1);
      expect(session.assessments[0].nivel).toBe(4);
      // also mirrors into the current assessment (snapshotId null)
      const current = await prisma.assessment.findFirst({
        where: { collaboratorId: collab.id, skillId: 1, snapshotId: null },
      });
      expect(current).not.toBeNull();
      expect(current.nivel).toBe(4);
    });

    it('returns 400 without a collaboratorId', async () => {
      const res = await request(app).post('/api/evaluations').send({ skills: {} });
      expect(res.status).toBe(400);
    });

    it('returns 404 for a nonexistent collaborator', async () => {
      const res = await request(app)
        .post('/api/evaluations')
        .send({ collaboratorId: 99999, skills: {} });
      expect(res.status).toBe(404);
    });

    it('snapshots the collaborator name and role on the session', async () => {
      const res = await request(app)
        .post('/api/evaluations')
        .send({ collaboratorId: collab.id, skills: {} });
      const session = await prisma.evaluationSession.findUnique({ where: { uuid: res.body.uuid } });
      expect(session.collaboratorNombre).toBe('Ana');
      expect(session.collaboratorRol).toBe('Developer');
    });

    it('silently skips invalid skills but still creates the session', async () => {
      const res = await request(app)
        .post('/api/evaluations')
        .send({
          collaboratorId: collab.id,
          skills: {
            1: { nivel: 9, frecuencia: 'D' }, // invalid level -> skipped
            2: { nivel: 3, frecuencia: 'S' }, // valid
          },
        });
      const session = await prisma.evaluationSession.findUnique({
        where: { uuid: res.body.uuid },
        include: { assessments: true },
      });
      expect(session.assessments.length).toBe(1);
      expect(session.assessments[0].skillId).toBe(2);
    });

    it('records a role-change note when the role differs from the last session', async () => {
      // Prior session captured the collaborator as a 'Junior'
      await prisma.evaluationSession.create({
        data: { collaboratorId: collab.id, collaboratorNombre: 'Ana', collaboratorRol: 'Junior' },
      });
      const res = await request(app)
        .post('/api/evaluations')
        .send({ collaboratorId: collab.id, skills: {} });
      const session = await prisma.evaluationSession.findUnique({ where: { uuid: res.body.uuid } });
      expect(session.notes).toContain('Role change: Junior → Developer');
    });
  });

  describe('GET /api/collaborators/:id/evaluations', () => {
    it('lists sessions newest-first with assessment counts', async () => {
      const first = await request(app)
        .post('/api/evaluations')
        .send({ collaboratorId: collab.id, skills: { 1: { nivel: 3, frecuencia: 'D' } } });
      const second = await request(app)
        .post('/api/evaluations')
        .send({ collaboratorId: collab.id, skills: {} });

      const res = await request(app).get(`/api/collaborators/${collab.id}/evaluations`);
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
      // newest first
      expect(res.body[0].uuid).toBe(second.body.uuid);
      expect(res.body[1].uuid).toBe(first.body.uuid);
      expect(res.body[1].assessmentCount).toBe(1);
    });
  });

  describe('GET /api/evaluations/:uuid', () => {
    it('returns the session with a skills map', async () => {
      const created = await request(app)
        .post('/api/evaluations')
        .send({ collaboratorId: collab.id, skills: { 1: { nivel: 4, frecuencia: 'D' } } });

      const res = await request(app).get(`/api/evaluations/${created.body.uuid}`);
      expect(res.status).toBe(200);
      expect(res.body.uuid).toBe(created.body.uuid);
      expect(res.body.skills['1'].nivel).toBe(4);
      expect(res.body.skills['1'].skillName).toBe('Node.js');
      expect(res.body.skills['1'].categoryName).toBe('Backend');
    });

    it('returns 404 for an unknown uuid', async () => {
      const res = await request(app).get('/api/evaluations/does-not-exist');
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/evaluations/:uuid', () => {
    it('deletes the session and its linked assessments', async () => {
      const created = await request(app)
        .post('/api/evaluations')
        .send({ collaboratorId: collab.id, skills: { 1: { nivel: 4, frecuencia: 'D' } } });
      const uuid = created.body.uuid;

      const res = await request(app).delete(`/api/evaluations/${uuid}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const session = await prisma.evaluationSession.findUnique({ where: { uuid } });
      expect(session).toBeNull();
      const linked = await prisma.assessment.findMany({ where: { evaluationSessionId: { not: null } } });
      expect(linked.length).toBe(0);
    });

    it('returns 404 for an unknown uuid', async () => {
      const res = await request(app).delete('/api/evaluations/does-not-exist');
      expect(res.status).toBe(404);
    });
  });
});
