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
    // Check if tables exist by querying SystemConfig
    await prisma.systemConfig.findFirst();
  } catch {
    // Tables don't exist - create them
    console.log('[Skima Server] Initializing database schema...');
    const statements = [
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
    ];
    for (const sql of statements) {
      await prisma.$executeRawUnsafe(sql);
    }
    console.log('[Skima Server] Database schema initialized.');
  }
}

// Export for use in migration logic
export { customDbPath };
