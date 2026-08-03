import { beforeAll, afterAll, beforeEach } from 'vitest';
import { mkdtempSync, rmSync, existsSync, readdirSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { prisma, ensureDatabase } from '../db.js';

// Redirect pre-restore snapshots to a throwaway dir so the suite never writes
// recovery files into prisma/. Emptied before each test (see beforeEach).
const SNAPSHOT_DIR = mkdtempSync(join(tmpdir(), 'skima-test-snap-'));
process.env.BACKUP_SNAPSHOT_DIR = SNAPSHOT_DIR;

// Initialize test database schema
beforeAll(async () => {
  await ensureDatabase();
});

// Clean database before each test
beforeEach(async () => {
  // Start each test with an empty snapshot dir so file-count assertions are exact.
  if (existsSync(SNAPSHOT_DIR)) {
    for (const f of readdirSync(SNAPSHOT_DIR)) unlinkSync(join(SNAPSHOT_DIR, f));
  }
  // Append-only audit log — cleared here so backup-log tests are isolated.
  await prisma.backupLog.deleteMany();
  // Delete in order due to foreign key constraints
  // Development tables (actions -> goals -> plans)
  await prisma.developmentAction.deleteMany();
  await prisma.developmentGoal.deleteMany();
  await prisma.developmentPlan.deleteMany();
  // Assessment references: Collaborator, Skill, Snapshot, EvaluationSession
  await prisma.assessment.deleteMany();
  // EvaluationSession references: Collaborator
  await prisma.evaluationSession.deleteMany();
  // RoleProfile has no FK dependencies
  await prisma.roleProfile.deleteMany();
  // Snapshot has no FK dependencies (Assessments already deleted)
  await prisma.snapshot.deleteMany();
  // Collaborator has no FK dependencies (Assessments/EvaluationSessions already deleted)
  await prisma.collaborator.deleteMany();
  // Skill references: Category
  await prisma.skill.deleteMany();
  // Category has no FK dependencies (Skills already deleted)
  await prisma.category.deleteMany();
});

// Disconnect after all tests
afterAll(async () => {
  await prisma.$disconnect();
  rmSync(SNAPSHOT_DIR, { recursive: true, force: true });
});
