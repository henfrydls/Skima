import { describe, it, expect, beforeEach } from 'vitest';
import { readdirSync, readFileSync, existsSync, rmSync } from 'fs';
import { join } from 'path';
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
      expect(res.body.version).toBe('2.0');
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

  // Full backup covering ALL 20 exportable models — the regression net for the
  // destructive wipe+restore. Today export dumps only 5 models and import wipes
  // ~18 but restores 5, so people-dev data is lost; worse, import crashes on any
  // DB with evaluation sessions (RESTRICT FK, collaborator wiped before session).
  describe('Full backup (all 20 models)', () => {
    // leaves -> roots, so a full wipe never hits an FK constraint
    const wipeOrder = [
      'developmentAction', 'checkIn', 'reviewSkillRating', 'kPIEntry', 'assessment',
      'developmentGoal', 'keyResult', 'review', 'kPI', 'checkInNote', 'skill',
      'evaluationSession', 'developmentPlan', 'objective', 'category', 'collaborator',
      'snapshot', 'roleProfile', 'timePeriod', 'reviewCycle',
    ];

    beforeEach(async () => {
      await prisma.systemConfig.deleteMany();
      for (const m of wipeOrder) await prisma[m].deleteMany();
    });

    async function seedAll() {
      const category = await prisma.category.create({ data: { nombre: 'Backend', abrev: 'BE' } });
      const skill = await prisma.skill.create({ data: { nombre: 'Node.js', categoriaId: category.id } });
      const collaborator = await prisma.collaborator.create({
        data: { nombre: 'Ana', rol: 'Developer', lastEvaluated: new Date('2026-05-01T10:00:00.000Z') },
      });
      const snapshot = await prisma.snapshot.create({ data: { nombre: 'Q1 2026' } });
      const roleProfile = await prisma.roleProfile.create({
        data: { rol: 'Developer', skills: JSON.stringify({ [skill.id]: 'C' }) },
      });
      const session = await prisma.evaluationSession.create({
        data: { collaboratorId: collaborator.id, collaboratorNombre: 'Ana', collaboratorRol: 'Developer' },
      });
      const assessment = await prisma.assessment.create({
        data: { collaboratorId: collaborator.id, skillId: skill.id, nivel: 3, criticidad: 'C', frecuencia: 'D', evaluationSessionId: session.id },
      });
      const plan = await prisma.developmentPlan.create({ data: { collaboratorId: collaborator.id, title: 'Growth Plan' } });
      const goal = await prisma.developmentGoal.create({ data: { planId: plan.id, title: 'Master Node', skillId: skill.id } });
      const action = await prisma.developmentAction.create({
        data: { goalId: goal.id, title: 'Course', status: 'completed', completedAt: new Date('2026-04-15T00:00:00.000Z') },
      });
      const period = await prisma.timePeriod.create({ data: { name: 'Q2 2026', startDate: new Date('2026-04-01'), endDate: new Date('2026-06-30') } });
      const objective = await prisma.objective.create({ data: { title: 'Ship feature', collaboratorId: collaborator.id, timePeriodId: period.id } });
      const kr = await prisma.keyResult.create({ data: { title: 'Coverage 80%', objectiveId: objective.id, currentValue: 42 } });
      await prisma.checkIn.create({ data: { keyResultId: kr.id, value: 42 } });
      const cycle = await prisma.reviewCycle.create({ data: { name: 'H1 Review', periodStart: new Date('2026-01-01'), periodEnd: new Date('2026-06-30'), createdBy: 'Manager' } });
      const review = await prisma.review.create({ data: { cycleId: cycle.id, collaboratorId: collaborator.id, developmentPlanId: plan.id, overallRating: 4 } });
      await prisma.reviewSkillRating.create({ data: { reviewId: review.id, skillId: skill.id, rating: 4 } });
      const kpi = await prisma.kPI.create({ data: { name: 'Velocity', collaboratorId: collaborator.id, objectiveId: objective.id } });
      await prisma.kPIEntry.create({ data: { kpiId: kpi.id, value: 30, recordedAt: new Date('2026-05-01') } });
      await prisma.checkInNote.create({ data: { collaboratorId: collaborator.id, content: '1:1 notes', meetingDate: new Date('2026-05-10') } });
      return { skill, collaborator, session, plan, cycle, review };
    }

    const ALL_KEYS = [
      'categories', 'skills', 'collaborators', 'assessments', 'snapshots', 'roleProfiles',
      'evaluationSessions', 'developmentPlans', 'developmentGoals', 'developmentActions',
      'timePeriods', 'objectives', 'keyResults', 'checkIns', 'reviewCycles', 'reviews',
      'reviewSkillRatings', 'kpis', 'kpiEntries', 'checkInNotes',
    ];

    it('exports every model as a non-empty collection (version 2.0)', async () => {
      await seedAll();
      const res = await request(app).get('/api/export');
      expect(res.status).toBe(200);
      expect(res.body.version).toBe('2.0');
      for (const key of ALL_KEYS) {
        expect(Array.isArray(res.body.data[key])).toBe(true);
        expect(res.body.data[key].length).toBeGreaterThan(0);
      }
    });

    it('round-trips all models through wipe+restore with ids, relations, JSON and dates intact', async () => {
      const seeded = await seedAll();
      const exported = await request(app).get('/api/export');

      const res = await request(app).post('/api/import').send({ data: exported.body.data });
      expect(res.status).toBe(200);

      // UUID PKs + FKs to them preserved (Review chain)
      const review = await prisma.review.findFirst({ include: { skillRatings: true } });
      expect(review.id).toBe(seeded.review.id);
      expect(review.cycleId).toBe(seeded.cycle.id);
      expect(review.developmentPlanId).toBe(seeded.plan.id);
      expect(review.skillRatings).toHaveLength(1);

      // Assessment -> EvaluationSession FK preserved (the crash case)
      const assessment = await prisma.assessment.findFirst();
      expect(assessment.evaluationSessionId).toBe(seeded.session.id);

      // JSON-as-string intact (not reformatted)
      const rp = await prisma.roleProfile.findUnique({ where: { rol: 'Developer' } });
      expect(rp.skills).toBe(JSON.stringify({ [seeded.skill.id]: 'C' }));

      // Denormalized field round-trips as-is
      const kr = await prisma.keyResult.findFirst();
      expect(kr.currentValue).toBe(42);

      // Date preserved exactly (no truncation/epoch)
      const action = await prisma.developmentAction.findFirst();
      expect(new Date(action.completedAt).toISOString()).toBe('2026-04-15T00:00:00.000Z');

      // Everything present
      expect(await prisma.objective.count()).toBe(1);
      expect(await prisma.checkInNote.count()).toBe(1);
      expect(await prisma.kPIEntry.count()).toBe(1);
    });

    it('rejects a payload whose collections are not arrays and does NOT wipe', async () => {
      await seedAll();
      const res = await request(app).post('/api/import').send({ data: { categories: {}, skills: {} } });
      expect(res.status).toBe(400);
      // the transaction must not have run — data is intact
      expect(await prisma.collaborator.count()).toBeGreaterThan(0);
      expect(await prisma.objective.count()).toBeGreaterThan(0);
    });

    it('accepts an import payload larger than 1MB (a backup must be restorable)', async () => {
      const bigCategories = Array.from({ length: 1400 }, (_, i) => ({ id: i + 1, nombre: 'x'.repeat(900), abrev: 'C' }));
      const size = JSON.stringify({ data: { categories: bigCategories, skills: [] } }).length;
      expect(size).toBeGreaterThan(1024 * 1024); // > 1MB

      const res = await request(app).post('/api/import').send({ data: { categories: bigCategories, skills: [] } });
      expect(res.status).toBe(200);
      expect(await prisma.category.count()).toBe(1400);
    });

    it('imports a legacy v1.0 backup (only 5 collections) without crashing', async () => {
      await seedAll();
      const res = await request(app).post('/api/import').send({
        data: { categories: [{ id: 100, nombre: 'Legacy', abrev: 'LG' }], skills: [] },
      });
      expect(res.status).toBe(200);
      const cats = await prisma.category.findMany();
      expect(cats).toHaveLength(1);
      expect(cats[0].nombre).toBe('Legacy');
      // absent collections are wiped and not restored
      expect(await prisma.objective.count()).toBe(0);
      expect(await prisma.review.count()).toBe(0);
    });
  });

  // Install-local history + recoverability. BackupLog lives OUTSIDE BACKUP_MODELS,
  // so it must survive the very restore it records; a pre-restore snapshot dumps
  // the current state to disk before the destructive wipe.
  // setup.js points BACKUP_SNAPSHOT_DIR at a throwaway dir and empties it before
  // each test, so snapshot files never land in prisma/ and counts stay exact.
  describe('Backup log & pre-restore snapshot', () => {
    it('records an export in the backup log (type=export, recordCount)', async () => {
      await request(app).get('/api/export').expect(200);
      const log = await prisma.backupLog.findFirst({ where: { type: 'export' } });
      expect(log).toBeTruthy();
      expect(log.status).toBe('success');
      expect(log.recordCount).toBeGreaterThan(0);
    });

    it('records a restore with provenance and counts, and the log survives the wipe', async () => {
      const res = await request(app).post('/api/import').send({
        data: { categories: [{ id: 10, nombre: 'Frontend', abrev: 'FE' }], skills: [] },
        fileName: 'skima-backup-2026-08-01.json',
        sourceExportDate: '2026-08-01T00:00:00.000Z',
        sourceVersion: '2.0',
      });
      expect(res.status).toBe(200);
      expect(res.body.recordsInserted).toBe(1);
      expect(res.body.recordsDeleted).toBeGreaterThan(0);

      // The restore wipes all BACKUP_MODELS; BackupLog is not one of them, so its
      // row (written in the same transaction) is still here afterwards.
      const logs = await prisma.backupLog.findMany({ where: { type: 'restore' } });
      expect(logs).toHaveLength(1);
      const log = logs[0];
      expect(log.status).toBe('success');
      expect(log.fileName).toBe('skima-backup-2026-08-01.json');
      expect(log.sourceVersion).toBe('2.0');
      expect(new Date(log.sourceExportDate).toISOString()).toBe('2026-08-01T00:00:00.000Z');
      expect(log.recordCount).toBe(1);
      expect(log.recordsDeleted).toBeGreaterThan(0);
      expect(log.snapshotFile).toContain('pre-restore-');
    });

    it('does not let a malformed sourceExportDate abort an otherwise-valid restore', async () => {
      const res = await request(app).post('/api/import').send({
        data: { categories: [{ id: 5, nombre: 'Ops', abrev: 'OP' }], skills: [] },
        fileName: 'hand-edited.json',
        sourceExportDate: 'not-a-real-date',
        sourceVersion: '2.0',
      });
      expect(res.status).toBe(200);
      expect(await prisma.category.count()).toBe(1);
      // the bad date degrades to null instead of rolling back the restore
      const log = await prisma.backupLog.findFirst({ where: { type: 'restore', status: 'success' } });
      expect(log).toBeTruthy();
      expect(log.sourceExportDate).toBeNull();
    });

    it('writes a pre-restore snapshot of the current state before wiping', async () => {
      const snapDir = process.env.BACKUP_SNAPSHOT_DIR;
      await request(app).post('/api/import').send({ data: { categories: [], skills: [] } }).expect(200);
      const files = readdirSync(snapDir).filter((f) => f.startsWith('pre-restore-'));
      expect(files.length).toBe(1);
      const snap = JSON.parse(readFileSync(join(snapDir, files[0]), 'utf8'));
      // Snapshot holds the state BEFORE the wipe — the seeded "Backend" category.
      expect(snap.version).toBe('2.0');
      expect(snap.data.categories).toHaveLength(1);
      expect(snap.data.categories[0].nombre).toBe('Backend');
    });

    it('logs a failed restore and leaves data intact when the transaction throws', async () => {
      // A skill pointing at a non-existent category passes array validation but
      // trips the FK inside the tx, forcing a rollback.
      const res = await request(app).post('/api/import').send({
        data: { categories: [], skills: [{ id: 1, nombre: 'Orphan', categoriaId: 999 }] },
        fileName: 'broken.json',
      });
      expect(res.status).toBe(500);
      // Rolled back: the originally-seeded data is untouched.
      expect(await prisma.category.count()).toBe(1);
      expect(await prisma.skill.count()).toBe(1);
      // No success row; exactly one failed row was recorded outside the rollback.
      expect(await prisma.backupLog.count({ where: { type: 'restore', status: 'success' } })).toBe(0);
      const failed = await prisma.backupLog.findFirst({ where: { type: 'restore', status: 'failed' } });
      expect(failed).toBeTruthy();
      expect(failed.fileName).toBe('broken.json');
    });

    it('keeps a prior export log through a later restore (BackupLog is not wiped)', async () => {
      // An export writes a log row; a subsequent restore wipes all BACKUP_MODELS.
      // Because BackupLog is not one of them, BOTH rows must remain afterwards —
      // this is the invariant a naive "add it to BACKUP_MODELS" change would break.
      await request(app).get('/api/export').expect(200);
      expect(await prisma.backupLog.count({ where: { type: 'export' } })).toBe(1);

      await request(app).post('/api/import').send({ data: { categories: [], skills: [] } }).expect(200);

      expect(await prisma.backupLog.count({ where: { type: 'export' } })).toBe(1); // survived the wipe
      expect(await prisma.backupLog.count({ where: { type: 'restore' } })).toBe(1);
    });

    it('GET /api/backup-log returns { lastExport, entries } newest-first, without the server path', async () => {
      for (let i = 0; i < 3; i++) await request(app).get('/api/export').expect(200);
      const res = await request(app).get('/api/backup-log');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.entries)).toBe(true);
      expect(res.body.entries.length).toBeGreaterThanOrEqual(3);
      // newest-first
      const times = res.body.entries.map((e) => new Date(e.createdAt).getTime());
      for (let i = 1; i < times.length; i++) expect(times[i - 1]).toBeGreaterThanOrEqual(times[i]);
      // most-recent export surfaced separately
      expect(res.body.lastExport).toBeTruthy();
      expect(res.body.lastExport.type).toBe('export');
      // snapshotFile (a server-side path) is never exposed to the client
      expect(res.body.entries[0]).not.toHaveProperty('snapshotFile');
      expect(res.body.lastExport).not.toHaveProperty('snapshotFile');
    });

    it('lastExport stays accurate even when restores push the export out of the 20-row window', async () => {
      await request(app).get('/api/export').expect(200); // the only export
      // 21 restores bury the export beyond take:20
      for (let i = 0; i < 21; i++) {
        await request(app).post('/api/import').send({ data: { categories: [], skills: [] } }).expect(200);
      }
      const res = await request(app).get('/api/backup-log');
      expect(res.body.entries).toHaveLength(20);
      // the export is no longer in the entries window...
      expect(res.body.entries.some((e) => e.type === 'export')).toBe(false);
      // ...but lastExport still reports it, so the "last backup" status is correct
      expect(res.body.lastExport?.type).toBe('export');
    });

    it('recreates the snapshot dir when it is missing', async () => {
      const dir = process.env.BACKUP_SNAPSHOT_DIR;
      rmSync(dir, { recursive: true, force: true });
      expect(existsSync(dir)).toBe(false);
      await request(app).post('/api/import').send({ data: { categories: [], skills: [] } }).expect(200);
      expect(existsSync(dir)).toBe(true);
      expect(readdirSync(dir).filter((f) => f.startsWith('pre-restore-'))).toHaveLength(1);
    });

    it('prunes old pre-restore snapshots to the retention limit', async () => {
      const dir = process.env.BACKUP_SNAPSHOT_DIR;
      // 12 restores => 12 snapshots written, but only the newest 10 kept.
      for (let i = 0; i < 12; i++) {
        await request(app).post('/api/import').send({ data: { categories: [], skills: [] } }).expect(200);
      }
      const dumps = readdirSync(dir).filter((f) => f.startsWith('pre-restore-'));
      expect(dumps.length).toBeLessThanOrEqual(10);
    });

    it('does not write an export log in demo mode (read-only invariant)', async () => {
      process.env.DEMO_MODE = 'true';
      try {
        await request(app).get('/api/export').expect(200);
        expect(await prisma.backupLog.count()).toBe(0);
      } finally {
        delete process.env.DEMO_MODE;
      }
    });
  });
});
