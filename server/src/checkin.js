import { randomUUID } from 'crypto';
import { existsSync, readFileSync, writeFileSync, mkdirSync, unlinkSync } from 'fs';
import { dirname, join } from 'path';
import { createRequire } from 'module';

// Build-time injection replaces this string (see release.yml / build-sidecars.mjs).
// In development, falls back to the CHECKIN_URL env var (empty = disabled).
const BUILTIN_CHECKIN_URL = '__CHECKIN_URL__';
const ID_FILE = '.skima-instance-id';
const DATE_FILE = '.skima-checkin-date';

export function getCheckinUrl() {
  if (BUILTIN_CHECKIN_URL !== '__CHECKIN' + '_URL__') return BUILTIN_CHECKIN_URL;
  return process.env.CHECKIN_URL || '';
}

// The one gate: SKIMA_DISABLE_CHECKIN set to anything (including empty) means no
// check-in, no endpoint, nothing sent. Every CI job that starts the binary sets it,
// and a guardian step fails the job if it does not arrive. Lesson: four CI paths
// wrote to production in Daylo because each had its own check; one gate prevents that.
export function isDisabled() {
  return process.env.SKIMA_DISABLE_CHECKIN !== undefined;
}

export function parseCliArg(name) {
  const idx = process.argv.indexOf(name);
  return idx !== -1 && process.argv[idx + 1] ? process.argv[idx + 1] : null;
}

function hasCliFlag(name) {
  return process.argv.includes(name);
}

export function dataDir() {
  const dbPath = parseCliArg('--db-path');
  if (dbPath) return dirname(dbPath);
  return join(process.cwd(), 'prisma');
}

export function getOrCreateId(dir) {
  const file = join(dir, ID_FILE);
  if (existsSync(file)) {
    const id = readFileSync(file, 'utf8').trim();
    if (id) return id;
  }
  const id = randomUUID();
  mkdirSync(dir, { recursive: true });
  writeFileSync(file, id, 'utf8');
  return id;
}

export function deleteId(dir) {
  const file = join(dir, ID_FILE);
  if (existsSync(file)) unlinkSync(file);
}

export function readId(dir) {
  const file = join(dir, ID_FILE);
  if (!existsSync(file)) return null;
  const id = readFileSync(file, 'utf8').trim();
  return id || null;
}

export function alreadySentToday(dir) {
  const file = join(dir, DATE_FILE);
  if (!existsSync(file)) return false;
  const stored = readFileSync(file, 'utf8').trim();
  return stored === todayDate();
}

export function markSentToday(dir) {
  writeFileSync(join(dir, DATE_FILE), todayDate(), 'utf8');
}

export function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

export function detectSource() {
  const cliSource = parseCliArg('--install-source');
  if (cliSource) return cliSource;
  if (process.env.DOCKER === 'true') return 'docker';
  return 'unknown';
}

function getVersion() {
  try {
    const require = createRequire(import.meta.url);
    return require('../../package.json').version;
  } catch {
    return 'unknown';
  }
}

export function buildPayload(instanceId, source, { last = false } = {}) {
  const p = {
    id: instanceId,
    v: getVersion(),
    os: process.platform === 'win32' ? 'windows' : process.platform,
    arch: process.arch === 'x64' ? 'x64' : process.arch,
    source,
    d: todayDate(),
  };
  if (process.env.CHECKIN_INTERNAL === '1') p.internal = true;
  if (last) p.last = true;
  return p;
}

export async function sendCheckin(payload, url) {
  if (isDisabled()) throw new Error('SKIMA_DISABLE_CHECKIN is set');
  const endpoint = (url || getCheckinUrl()).replace(/\/+$/, '') + '/checkin';
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
}

// The check-in fields as the UI would show them (for "What gets sent?" in About).
export function getCheckinFields() {
  if (isDisabled()) return null;
  if (!getCheckinUrl()) return null;
  const dir = dataDir();
  return {
    id: readId(dir),
    v: getVersion(),
    os: process.platform === 'win32' ? 'windows' : process.platform,
    arch: process.arch === 'x64' ? 'x64' : process.arch,
    source: detectSource(),
  };
}

export async function maybeCheckin() {
  if (isDisabled()) return;
  if (process.env.DEMO_MODE === 'true') return;
  const url = getCheckinUrl();
  if (!url) return;

  const checkinNowId = parseCliArg('--checkin-now');
  const dir = dataDir();
  const source = detectSource();

  if (checkinNowId) {
    const payload = buildPayload(checkinNowId, source);
    try {
      await sendCheckin(payload, url);
      console.info('[check-in] sent (--checkin-now)');
    } catch (err) {
      console.warn(`[check-in] failed: ${err.message}`);
    }
    if (hasCliFlag('--checkin-now') && !hasCliFlag('--port')) {
      process.exit(0);
    }
    return;
  }

  if (alreadySentToday(dir)) return;

  const instanceId = getOrCreateId(dir);
  const payload = buildPayload(instanceId, source);

  setTimeout(async () => {
    try {
      await sendCheckin(payload, url);
      markSentToday(dir);
      console.info('[check-in] sent');
    } catch (err) {
      console.warn(`[check-in] failed: ${err.message}`);
    }
  }, 5_000);
}

// API endpoint handler: turn off the check-in. Deletes the ID, sends a last message,
// then returns. The order follows Daylo: delete first, send goodbye with the old ID.
export async function handleCheckinOff() {
  const dir = dataDir();
  const id = readId(dir);
  deleteId(dir);
  if (!id) return { sent: false };

  const url = getCheckinUrl();
  if (!url || isDisabled()) return { sent: false };

  const source = detectSource();
  const payload = buildPayload(id, source, { last: true });
  try {
    await sendCheckin(payload, url);
    return { sent: true };
  } catch {
    return { sent: false };
  }
}

export const checkinUrl = getCheckinUrl();
