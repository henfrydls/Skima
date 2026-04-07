import { PrismaClient } from '@prisma/client';
import { resolve, dirname } from 'path';
import { existsSync, mkdirSync } from 'fs';

/**
 * Database configuration with dynamic path support for Tauri sidecar.
 *
 * In development: uses default prisma/.env DATABASE_URL
 * In desktop (sidecar): receives --db-path CLI arg pointing to OS app data dir
 */

// Parse --db-path from CLI args (passed by Tauri sidecar)
function getDbPath() {
  const dbPathIdx = process.argv.indexOf('--db-path');
  if (dbPathIdx !== -1 && process.argv[dbPathIdx + 1]) {
    return resolve(process.argv[dbPathIdx + 1]);
  }
  return null;
}

const customDbPath = getDbPath();

if (customDbPath) {
  // Ensure directory exists
  const dir = dirname(customDbPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  // Override DATABASE_URL for Prisma when running as sidecar
  process.env.DATABASE_URL = `file:${customDbPath}`;
}

// Singleton Prisma client for the entire app
export const prisma = new PrismaClient();

/**
 * Auto-initialize the database schema on first run.
 * Uses raw SQL from the init migration to create tables if they don't exist.
 * Works in all environments: dev, sidecar (Tauri), Docker.
 */
export async function ensureDatabase() {
  try {
    // Always run CREATE TABLE IF NOT EXISTS — safe for both fresh install and upgrade.
    // Previous logic skipped table creation when SystemConfig existed, which broke
    // upgrades from v1.1.x to v1.3.x (IDP/OKR/Review/KPI tables were missing).
    console.log('[Skima Server] Ensuring database schema...');
    const statements = [
      // ── Original tables (v1.0.0) ──
      `CREATE TABLE IF NOT EXISTS "Category" ("id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, "nombre" TEXT NOT NULL, "abrev" TEXT NOT NULL, "orden" INTEGER NOT NULL DEFAULT 0, "isActive" BOOLEAN NOT NULL DEFAULT true)`,
      `CREATE TABLE IF NOT EXISTS "Skill" ("id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, "nombre" TEXT NOT NULL, "categoriaId" INTEGER NOT NULL, "isActive" BOOLEAN NOT NULL DEFAULT true, CONSTRAINT "Skill_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE)`,
      `CREATE TABLE IF NOT EXISTS "Collaborator" ("id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, "nombre" TEXT NOT NULL, "rol" TEXT NOT NULL, "email" TEXT, "esDemo" BOOLEAN NOT NULL DEFAULT false, "isActive" BOOLEAN NOT NULL DEFAULT true, "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "lastEvaluated" DATETIME)`,
      `CREATE TABLE IF NOT EXISTS "Snapshot" ("id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, "nombre" TEXT NOT NULL, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
      `CREATE TABLE IF NOT EXISTS "EvaluationSession" ("id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, "uuid" TEXT NOT NULL, "collaboratorId" INTEGER NOT NULL, "collaboratorNombre" TEXT, "collaboratorRol" TEXT, "evaluatedBy" TEXT, "notes" TEXT, "evaluatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "EvaluationSession_collaboratorId_fkey" FOREIGN KEY ("collaboratorId") REFERENCES "Collaborator" ("id") ON DELETE RESTRICT ON UPDATE CASCADE)`,
      `CREATE TABLE IF NOT EXISTS "Assessment" ("id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, "collaboratorId" INTEGER NOT NULL, "skillId" INTEGER NOT NULL, "nivel" REAL NOT NULL, "criticidad" TEXT NOT NULL, "frecuencia" TEXT NOT NULL, "snapshotId" INTEGER, "evaluationSessionId" INTEGER, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "Assessment_collaboratorId_fkey" FOREIGN KEY ("collaboratorId") REFERENCES "Collaborator" ("id") ON DELETE RESTRICT ON UPDATE CASCADE, CONSTRAINT "Assessment_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill" ("id") ON DELETE RESTRICT ON UPDATE CASCADE, CONSTRAINT "Assessment_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "Snapshot" ("id") ON DELETE SET NULL ON UPDATE CASCADE, CONSTRAINT "Assessment_evaluationSessionId_fkey" FOREIGN KEY ("evaluationSessionId") REFERENCES "EvaluationSession" ("id") ON DELETE SET NULL ON UPDATE CASCADE)`,
      `CREATE TABLE IF NOT EXISTS "RoleProfile" ("id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, "rol" TEXT NOT NULL, "skills" TEXT NOT NULL, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL)`,
      `CREATE TABLE IF NOT EXISTS "SystemConfig" ("id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1, "companyName" TEXT NOT NULL, "adminName" TEXT NOT NULL, "adminPassword" TEXT, "isSetup" BOOLEAN NOT NULL DEFAULT false, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL)`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "Assessment_collaboratorId_skillId_snapshotId_key" ON "Assessment"("collaboratorId", "skillId", "snapshotId")`,
      `CREATE INDEX IF NOT EXISTS "Assessment_collaboratorId_idx" ON "Assessment"("collaboratorId")`,
      `CREATE INDEX IF NOT EXISTS "Assessment_skillId_idx" ON "Assessment"("skillId")`,
      `CREATE INDEX IF NOT EXISTS "Assessment_snapshotId_idx" ON "Assessment"("snapshotId")`,
      `CREATE INDEX IF NOT EXISTS "Assessment_evaluationSessionId_idx" ON "Assessment"("evaluationSessionId")`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "RoleProfile_rol_key" ON "RoleProfile"("rol")`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "EvaluationSession_uuid_key" ON "EvaluationSession"("uuid")`,
      `CREATE INDEX IF NOT EXISTS "EvaluationSession_collaboratorId_idx" ON "EvaluationSession"("collaboratorId")`,
      `CREATE INDEX IF NOT EXISTS "EvaluationSession_evaluatedAt_idx" ON "EvaluationSession"("evaluatedAt")`,
      // ── IDP tables (v1.3.0) ──
      `CREATE TABLE IF NOT EXISTS "DevelopmentPlan" ("id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, "collaboratorId" INTEGER NOT NULL, "title" TEXT NOT NULL, "description" TEXT, "targetRole" TEXT, "status" TEXT NOT NULL DEFAULT 'draft', "startDate" DATETIME, "endDate" DATETIME, "completedAt" DATETIME, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL, CONSTRAINT "DevelopmentPlan_collaboratorId_fkey" FOREIGN KEY ("collaboratorId") REFERENCES "Collaborator" ("id") ON DELETE RESTRICT ON UPDATE CASCADE)`,
      `CREATE TABLE IF NOT EXISTS "DevelopmentGoal" ("id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, "planId" INTEGER NOT NULL, "title" TEXT NOT NULL, "description" TEXT, "skillId" INTEGER, "currentLevel" REAL, "targetLevel" REAL, "priority" INTEGER NOT NULL DEFAULT 2, "status" TEXT NOT NULL DEFAULT 'not_started', "targetDate" DATETIME, "completedAt" DATETIME, "sortOrder" INTEGER NOT NULL DEFAULT 0, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL, CONSTRAINT "DevelopmentGoal_planId_fkey" FOREIGN KEY ("planId") REFERENCES "DevelopmentPlan" ("id") ON DELETE CASCADE ON UPDATE CASCADE, CONSTRAINT "DevelopmentGoal_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill" ("id") ON DELETE SET NULL ON UPDATE CASCADE)`,
      `CREATE TABLE IF NOT EXISTS "DevelopmentAction" ("id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, "goalId" INTEGER NOT NULL, "title" TEXT NOT NULL, "description" TEXT, "actionType" TEXT NOT NULL DEFAULT 'experience', "status" TEXT NOT NULL DEFAULT 'not_started', "dueDate" DATETIME, "completedAt" DATETIME, "evidence" TEXT, "sortOrder" INTEGER NOT NULL DEFAULT 0, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL, CONSTRAINT "DevelopmentAction_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "DevelopmentGoal" ("id") ON DELETE CASCADE ON UPDATE CASCADE)`,
      `CREATE INDEX IF NOT EXISTS "DevelopmentPlan_collaboratorId_idx" ON "DevelopmentPlan"("collaboratorId")`,
      `CREATE INDEX IF NOT EXISTS "DevelopmentPlan_status_idx" ON "DevelopmentPlan"("status")`,
      `CREATE INDEX IF NOT EXISTS "DevelopmentGoal_planId_idx" ON "DevelopmentGoal"("planId")`,
      `CREATE INDEX IF NOT EXISTS "DevelopmentGoal_skillId_idx" ON "DevelopmentGoal"("skillId")`,
      `CREATE INDEX IF NOT EXISTS "DevelopmentGoal_status_idx" ON "DevelopmentGoal"("status")`,
      `CREATE INDEX IF NOT EXISTS "DevelopmentAction_goalId_idx" ON "DevelopmentAction"("goalId")`,
      `CREATE INDEX IF NOT EXISTS "DevelopmentAction_status_idx" ON "DevelopmentAction"("status")`,
      // ── OKR tables (v1.3.0) ──
      `CREATE TABLE IF NOT EXISTS "TimePeriod" ("id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, "name" TEXT NOT NULL, "startDate" DATETIME NOT NULL, "endDate" DATETIME NOT NULL, "status" TEXT NOT NULL DEFAULT 'ACTIVE', "closedAt" DATETIME, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL)`,
      `CREATE TABLE IF NOT EXISTS "Objective" ("id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, "title" TEXT NOT NULL, "description" TEXT, "collaboratorId" INTEGER NOT NULL, "timePeriodId" INTEGER NOT NULL, "type" TEXT NOT NULL DEFAULT 'ASPIRATIONAL', "status" TEXT NOT NULL DEFAULT 'DRAFT', "score" REAL, "sortOrder" INTEGER NOT NULL DEFAULT 0, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL, CONSTRAINT "Objective_collaboratorId_fkey" FOREIGN KEY ("collaboratorId") REFERENCES "Collaborator" ("id") ON DELETE CASCADE ON UPDATE CASCADE, CONSTRAINT "Objective_timePeriodId_fkey" FOREIGN KEY ("timePeriodId") REFERENCES "TimePeriod" ("id") ON DELETE CASCADE ON UPDATE CASCADE)`,
      `CREATE TABLE IF NOT EXISTS "KeyResult" ("id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, "title" TEXT NOT NULL, "objectiveId" INTEGER NOT NULL, "metricType" TEXT NOT NULL DEFAULT 'NUMBER', "targetDirection" TEXT NOT NULL DEFAULT 'INCREASE', "startValue" REAL NOT NULL DEFAULT 0, "currentValue" REAL NOT NULL DEFAULT 0, "targetValue" REAL NOT NULL DEFAULT 1, "unit" TEXT, "weight" INTEGER NOT NULL DEFAULT 1, "confidence" TEXT NOT NULL DEFAULT 'ON_TRACK', "score" REAL, "sortOrder" INTEGER NOT NULL DEFAULT 0, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL, CONSTRAINT "KeyResult_objectiveId_fkey" FOREIGN KEY ("objectiveId") REFERENCES "Objective" ("id") ON DELETE CASCADE ON UPDATE CASCADE)`,
      `CREATE TABLE IF NOT EXISTS "CheckIn" ("id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, "keyResultId" INTEGER NOT NULL, "value" REAL NOT NULL, "confidence" TEXT NOT NULL DEFAULT 'ON_TRACK', "note" TEXT, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "CheckIn_keyResultId_fkey" FOREIGN KEY ("keyResultId") REFERENCES "KeyResult" ("id") ON DELETE CASCADE ON UPDATE CASCADE)`,
      `CREATE INDEX IF NOT EXISTS "Objective_collaboratorId_timePeriodId_idx" ON "Objective"("collaboratorId", "timePeriodId")`,
      `CREATE INDEX IF NOT EXISTS "Objective_status_idx" ON "Objective"("status")`,
      `CREATE INDEX IF NOT EXISTS "KeyResult_objectiveId_idx" ON "KeyResult"("objectiveId")`,
      `CREATE INDEX IF NOT EXISTS "CheckIn_keyResultId_createdAt_idx" ON "CheckIn"("keyResultId", "createdAt")`,
      // ── Review tables (v1.3.0) ──
      `CREATE TABLE IF NOT EXISTS "ReviewCycle" ("id" TEXT NOT NULL PRIMARY KEY, "name" TEXT NOT NULL, "periodStart" DATETIME NOT NULL, "periodEnd" DATETIME NOT NULL, "status" TEXT NOT NULL DEFAULT 'draft', "createdBy" TEXT NOT NULL, "completedAt" DATETIME, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL)`,
      `CREATE TABLE IF NOT EXISTS "Review" ("id" TEXT NOT NULL PRIMARY KEY, "cycleId" TEXT NOT NULL, "collaboratorId" INTEGER NOT NULL, "reviewerId" TEXT, "developmentPlanId" INTEGER, "status" TEXT NOT NULL DEFAULT 'not_started', "overallRating" INTEGER, "strengths" TEXT, "areasForImprovement" TEXT, "overallComments" TEXT, "startedAt" DATETIME, "completedAt" DATETIME, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL, CONSTRAINT "Review_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "ReviewCycle" ("id") ON DELETE CASCADE ON UPDATE CASCADE, CONSTRAINT "Review_collaboratorId_fkey" FOREIGN KEY ("collaboratorId") REFERENCES "Collaborator" ("id") ON DELETE CASCADE ON UPDATE CASCADE, CONSTRAINT "Review_developmentPlanId_fkey" FOREIGN KEY ("developmentPlanId") REFERENCES "DevelopmentPlan" ("id") ON DELETE SET NULL ON UPDATE CASCADE)`,
      `CREATE TABLE IF NOT EXISTS "ReviewSkillRating" ("id" TEXT NOT NULL PRIMARY KEY, "reviewId" TEXT NOT NULL, "skillId" INTEGER NOT NULL, "rating" INTEGER, "previousLevel" REAL, "currentLevel" REAL, "comment" TEXT, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL, CONSTRAINT "ReviewSkillRating_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review" ("id") ON DELETE CASCADE ON UPDATE CASCADE, CONSTRAINT "ReviewSkillRating_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill" ("id") ON DELETE CASCADE ON UPDATE CASCADE)`,
      `CREATE INDEX IF NOT EXISTS "Review_collaboratorId_idx" ON "Review"("collaboratorId")`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "Review_cycleId_collaboratorId_key" ON "Review"("cycleId", "collaboratorId")`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "ReviewSkillRating_reviewId_skillId_key" ON "ReviewSkillRating"("reviewId", "skillId")`,
      // ── KPI tables (v1.3.0) ──
      `CREATE TABLE IF NOT EXISTS "KPI" ("id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, "name" TEXT NOT NULL, "description" TEXT, "unit" TEXT, "baselineValue" REAL, "targetValue" REAL, "targetDirection" TEXT NOT NULL DEFAULT 'HIGHER_IS_BETTER', "department" TEXT, "collaboratorId" INTEGER, "objectiveId" INTEGER, "isActive" BOOLEAN NOT NULL DEFAULT true, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL, CONSTRAINT "KPI_collaboratorId_fkey" FOREIGN KEY ("collaboratorId") REFERENCES "Collaborator" ("id") ON DELETE SET NULL ON UPDATE CASCADE, CONSTRAINT "KPI_objectiveId_fkey" FOREIGN KEY ("objectiveId") REFERENCES "Objective" ("id") ON DELETE SET NULL ON UPDATE CASCADE)`,
      `CREATE TABLE IF NOT EXISTS "KPIEntry" ("id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, "kpiId" INTEGER NOT NULL, "value" REAL NOT NULL, "note" TEXT, "recordedAt" DATETIME NOT NULL, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "KPIEntry_kpiId_fkey" FOREIGN KEY ("kpiId") REFERENCES "KPI" ("id") ON DELETE CASCADE ON UPDATE CASCADE)`,
      `CREATE INDEX IF NOT EXISTS "KPI_collaboratorId_idx" ON "KPI"("collaboratorId")`,
      `CREATE INDEX IF NOT EXISTS "KPI_objectiveId_idx" ON "KPI"("objectiveId")`,
      `CREATE INDEX IF NOT EXISTS "KPI_isActive_idx" ON "KPI"("isActive")`,
      `CREATE INDEX IF NOT EXISTS "KPIEntry_kpiId_recordedAt_idx" ON "KPIEntry"("kpiId", "recordedAt")`,
      // ── CheckIn Notes table (v1.3.0) ──
      `CREATE TABLE IF NOT EXISTS "CheckInNote" ("id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, "collaboratorId" INTEGER NOT NULL, "title" TEXT, "content" TEXT NOT NULL, "meetingDate" DATETIME NOT NULL, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL, CONSTRAINT "CheckInNote_collaboratorId_fkey" FOREIGN KEY ("collaboratorId") REFERENCES "Collaborator" ("id") ON DELETE CASCADE ON UPDATE CASCADE)`,
      `CREATE INDEX IF NOT EXISTS "CheckInNote_collaboratorId_meetingDate_idx" ON "CheckInNote"("collaboratorId", "meetingDate")`,
    ];
    for (const sql of statements) {
      await prisma.$executeRawUnsafe(sql);
    }
    console.log('[Skima Server] Database schema verified.');
  } catch (error) {
    console.error('[Skima Server] Database initialization error:', error.message);
  }
}

// Export for use in migration logic
export { customDbPath };
