import { resolve, dirname, isAbsolute } from 'path';
import { fileURLToPath } from 'url';

/**
 * Prisma driver adapter factory (Rust-free client).
 *
 * Selects the SQLite driver by runtime:
 * - Node (dev, Docker demo, vitest): better-sqlite3 via the official adapter.
 * - Bun (the packaged desktop sidecar): bun:sqlite via the vendored adapter in
 *   vendor/prisma-bun-sqlite-adapter (patched — see its VENDORED.md).
 *
 * Both branches use dynamic imports with static string literals: Bun bundles
 * them into the standalone binary, and each runtime only loads its own driver
 * (the sidecar must not drag better-sqlite3's native-addon machinery along).
 *
 * timestampFormat 'unixepoch-ms' (and the vendored adapter's date patch) is
 * REQUIRED: the legacy Rust engine stored DateTime columns as unix-epoch-ms
 * integers, so every v1.4.x database on users' machines uses that dialect.
 * ISO-8601 text (the adapters' default) would corrupt those databases with
 * mixed formats. Never remove this.
 */

// The legacy engine resolved a relative `file:` path in DATABASE_URL against
// the schema directory (server/prisma/), not the process cwd — prisma/.env
// says `file:./skills.db` and has always meant server/prisma/skills.db.
// The drivers resolve against cwd, so normalize to keep dev/test parity.
// (The packaged sidecar always receives an absolute path via --db-path, so
// this never applies there and the bundled import.meta.url quirk is moot.)
const SCHEMA_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../prisma');

export function normalizeSqliteUrl(databaseUrl) {
  if (!databaseUrl || !databaseUrl.startsWith('file:')) return databaseUrl;
  const rest = databaseUrl.slice('file:'.length);
  // Prisma SQLite URLs may carry params (e.g. ?connection_limit=1) — they must
  // not become part of the filesystem path.
  const qIdx = rest.indexOf('?');
  const path = qIdx === -1 ? rest : rest.slice(0, qIdx);
  const params = qIdx === -1 ? '' : rest.slice(qIdx);
  if (path === ':memory:' || isAbsolute(path)) return databaseUrl;
  return `file:${resolve(SCHEMA_DIR, path)}${params}`;
}

export async function createPrismaAdapter(databaseUrl) {
  const url = normalizeSqliteUrl(databaseUrl);
  if (typeof process !== 'undefined' && process.versions?.bun) {
    // Packaged sidecar (bun build --compile): bun:sqlite, no native addon.
    const { PrismaBunSQLite } = await import('../vendor/prisma-bun-sqlite-adapter/index.js');
    return new PrismaBunSQLite({ url });
  }
  const { PrismaBetterSQLite3 } = await import('@prisma/adapter-better-sqlite3');
  return new PrismaBetterSQLite3({ url }, { timestampFormat: 'unixepoch-ms' });
}
