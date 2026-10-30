import { randomUUID } from 'crypto';
import { existsSync, readFileSync, writeFileSync, mkdirSync, unlinkSync } from 'fs';
import { dirname, join } from 'path';
import { createRequire } from 'module';

// Build-time injection replaces these strings (see release.yml / build-sidecars.mjs).
// In development, env var fallback; empty = disabled. Neither value appears in source.
const BUILTIN_CHECKIN_URL = '__CHECKIN_URL__';
const BUILTIN_WEBSITE_ID = '__CHECKIN_WEBSITE_ID__';
const ID_FILE = '.skima-instance-id';
const DATE_FILE = '.skima-checkin-date';
const OFF_FILE = '.skima-checkin-off';

export function getCheckinUrl() {
  if (BUILTIN_CHECKIN_URL !== '__CHECKIN' + '_URL__') return BUILTIN_CHECKIN_URL;
  return process.env.CHECKIN_URL || '';
}

export function getWebsiteId() {
  if (BUILTIN_WEBSITE_ID !== '__CHECKIN_WEBSITE' + '_ID__') return BUILTIN_WEBSITE_ID;
  return process.env.CHECKIN_WEBSITE_ID || '';
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
  const dbUrl = process.env.DATABASE_URL || '';
  if (dbUrl.startsWith('file:')) return dirname(dbUrl.slice(5));
  return join(process.cwd(), 'prisma');
}

export function isOff(dir) {
  return existsSync(join(dir, OFF_FILE));
}

export function markOff(dir) {
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, OFF_FILE), todayDate(), 'utf8');
}

export function clearOff(dir) {
  const file = join(dir, OFF_FILE);
  if (existsSync(file)) unlinkSync(file);
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

// The data fields: what the check-in carries about this copy. Nothing else.
export function buildData(instanceId, source, { last = false } = {}) {
  const d = {
    id: instanceId,
    v: getVersion(),
    os: process.platform === 'win32' ? 'windows' : process.platform,
    arch: process.arch === 'x64' ? 'x64' : process.arch,
    source,
    d: todayDate(),
  };
  if (last) d.last = true;
  return d;
}

// The Umami event envelope. Same structure Daylo uses: the panel reads `data` for the
// fields, `payload.id` as the distinct session identifier (so Umami can count devices),
// and `name` as the event type.
export function buildEnvelope(data, websiteId) {
  const payload = {
    website: websiteId || getWebsiteId(),
    hostname: 'app',
    url: '/',
    name: 'check-in',
    data,
  };
  if (data.id) payload.id = data.id;
  return { type: 'event', payload };
}

export async function sendCheckin(data, url, websiteId) {
  if (isDisabled()) throw new Error('SKIMA_DISABLE_CHECKIN is set');
  const endpoint = url || getCheckinUrl();
  if (!endpoint) throw new Error('no CHECKIN_URL configured');
  const wid = websiteId || getWebsiteId();
  if (!wid) throw new Error('no CHECKIN_WEBSITE_ID configured');

  const envelope = buildEnvelope(data, wid);
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Skima',
    },
    body: JSON.stringify(envelope),
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
  if (!getWebsiteId()) return;

  const checkinNowId = parseCliArg('--checkin-now');
  const dir = dataDir();
  const source = detectSource();

  if (checkinNowId) {
    const data = buildData(checkinNowId, source);
    try {
      await sendCheckin(data, url);
      console.info('[check-in] sent (--checkin-now)');
    } catch (err) {
      console.warn(`[check-in] failed: ${err.message}`);
    }
    if (hasCliFlag('--checkin-now') && !hasCliFlag('--port')) {
      process.exit(0);
    }
    return;
  }

  if (isOff(dir)) return;
  if (alreadySentToday(dir)) return;

  const instanceId = getOrCreateId(dir);
  const data = buildData(instanceId, source);

  setTimeout(async () => {
    try {
      await sendCheckin(data, url);
      markSentToday(dir);
      console.info('[check-in] sent');
    } catch (err) {
      console.warn(`[check-in] failed: ${err.message}`);
    }
  }, 5_000);
}

// Turn off the check-in. Deletes the ID, sends a last message, then returns.
// The order follows Daylo: delete first, send goodbye with the old ID.
export async function handleCheckinOff() {
  const dir = dataDir();
  const id = readId(dir);
  deleteId(dir);
  markOff(dir);
  if (!id) return { sent: false };

  const url = getCheckinUrl();
  if (!url || isDisabled() || !getWebsiteId()) return { sent: false };

  const source = detectSource();
  const data = buildData(id, source, { last: true });
  try {
    await sendCheckin(data, url);
    return { sent: true };
  } catch {
    return { sent: false };
  }
}

export const checkinUrl = getCheckinUrl();
