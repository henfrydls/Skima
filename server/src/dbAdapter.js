import { PrismaBetterSQLite3 } from '@prisma/adapter-better-sqlite3';
import { resolve, dirname, isAbsolute } from 'path';
import { fileURLToPath } from 'url';

/**
 * Prisma driver adapter factory (Rust-free client).
 *
 * Selects the SQLite driver by runtime:
 * - Node (dev, Docker demo, vitest): better-sqlite3 via the official adapter.
 * - Bun (the packaged desktop sidecar): bun:sqlite via a vendored adapter —
 *   wired in the sidecar build (INFRA-1 Phase 2); until then Bun fails loudly
 *   here rather than silently using the wrong driver.
 *
 * timestampFormat 'unixepoch-ms' is REQUIRED: the legacy Rust engine stored
 * DateTime columns as unix-epoch-ms integers, so every v1.4.x database on
 * users' machines uses that dialect. The default (ISO-8601 text) would corrupt
 * those databases with mixed formats. Never remove this option.
 */

// The legacy engine resolved a relative `file:` path in DATABASE_URL against
// the schema directory (server/prisma/), not the process cwd — prisma/.env
// says `file:./skills.db` and has always meant server/prisma/skills.db.
// better-sqlite3 resolves against cwd, so normalize to keep dev/test parity.
// (The packaged sidecar always receives an absolute path via --db-path, so
// this never applies there and the bundled import.meta.url quirk is moot.)
const SCHEMA_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../prisma');

function normalizeSqliteUrl(databaseUrl) {
  if (!databaseUrl || !databaseUrl.startsWith('file:')) return databaseUrl;
  const path = databaseUrl.slice('file:'.length);
  if (path === ':memory:' || isAbsolute(path)) return databaseUrl;
  return `file:${resolve(SCHEMA_DIR, path)}`;
}

export async function createPrismaAdapter(databaseUrl) {
  const url = normalizeSqliteUrl(databaseUrl);
  if (typeof process !== 'undefined' && process.versions?.bun) {
    // Packaged sidecar (bun build --compile): bun:sqlite, no native addon.
    // Vendored + patched to write epoch-ms dates — see vendor/…/VENDORED.md.
    // Static string literal so Bun bundles it into the standalone binary.
    const { PrismaBunSQLite } = await import('../vendor/prisma-bun-sqlite-adapter/index.js');
    return new PrismaBunSQLite({ url });
  }
  return new PrismaBetterSQLite3({ url }, { timestampFormat: 'unixepoch-ms' });
}
