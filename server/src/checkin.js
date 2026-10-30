import { randomUUID } from 'crypto';
import { existsSync, readFileSync, writeFileSync, mkdirSync, unlinkSync } from 'fs';
import { dirname, join } from 'path';
import { createRequire } from 'module';

// Build-time injection replaces these strings (see release.yml / build-sidecars.mjs).
// In development, env var fallback; empty = disabled. Neither value appears in source.
const BUILTIN_CHECKIN_URL = '__CHECKIN_URL__';
const BUILTIN_WEBSITE_ID = '__CHECKIN_WEBSITE_ID__';
const BUILTIN_VERSION = '__SKIMA_VERSION__';
const ID_FILE = '.skima-instance-id';
const DATE_FILE = '.skima-checkin-date';
const OFF_FILE = '.skima-checkin-off';
const NOTICE_FILE = '.skima-checkin-notice-seen';

// A copy that existed before the check-in did was installed under the promise that it
// sent nothing. true: such a copy starts with the check-in off and is told it can turn
// it on. false: it starts on, like a new install. New installs always start on.
export const UPGRADES_START_OFF = false;

export function getCheckinUrl() {
  if (BUILTIN_CHECKIN_URL !== '__CHECKIN' + '_URL__') return BUILTIN_CHECKIN_URL;
  return process.env.CHECKIN_URL || '';
}

export function getWebsiteId() {
  if (BUILTIN_WEBSITE_ID !== '__CHECKIN_WEBSITE' + '_ID__') return BUILTIN_WEBSITE_ID;
  return process.env.CHECKIN_WEBSITE_ID || '';
}

// Sending needs both; with only one, sendCheckin refuses. Every caller asks here so
// the status endpoint cannot report "configured" for a build that would send nothing.
export function isConfigured() {
  return !!getCheckinUrl() && !!getWebsiteId();
}

// The one gate: SKIMA_DISABLE_CHECKIN set to anything (including empty) means no
// check-in, no endpoint, nothing sent. Every CI job that starts the binary sets it,
// and its smoke test fails if the gate does not hold. One gate, not a check per CI
// path, so a new path cannot forget its own and write to production.
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

// Set up before, yet no trace of the check-in ever having run: an update from a version
// without it. A new install reaches its first start not set up; any copy that has run the
// check-in once has an ID, a date or the off file.
export function isUpgradeFromBeforeCheckin(dir, isSetup) {
  return !!isSetup
    && !readId(dir)
    && !existsSync(join(dir, DATE_FILE))
    && !isOff(dir);
}

export function noticeSeen(dir) {
  return existsSync(join(dir, NOTICE_FILE));
}

export function markNoticeSeen(dir) {
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, NOTICE_FILE), todayDate(), 'utf8');
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

export function getVersion() {
  if (BUILTIN_VERSION !== '__SKIMA_' + 'VERSION__') return BUILTIN_VERSION;
  if (process.env.SKIMA_VERSION) return process.env.SKIMA_VERSION;
  try {
    const require = createRequire(import.meta.url);
    return require('../package.json').version;
  } catch {
    return 'unknown';
  }
}

// The data fields: what the check-in carries about this copy. Nothing else.
// Key names are shared with other apps on the same receiver so one set of
// queries reads all of them: keep id/version/os/source/date/last stable.
export function buildData(instanceId, source, { last = false } = {}) {
  const d = {
    id: instanceId,
    version: getVersion(),
    os: process.platform === 'win32' ? 'windows' : process.platform === 'darwin' ? 'macos' : process.platform,
    arch: process.arch === 'x64' ? 'x64' : process.arch,
    source,
    date: todayDate(),
  };
  if (last) d.last = true;
  return d;
}

// The Umami event envelope: the panel reads `data` for the
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
  if (!isConfigured()) return null;
  const dir = dataDir();
  return {
    id: readId(dir),
    version: getVersion(),
    os: process.platform === 'win32' ? 'windows' : process.platform === 'darwin' ? 'macos' : process.platform,
    arch: process.arch === 'x64' ? 'x64' : process.arch,
    source: detectSource(),
  };
}

function checkinNowFailed(reason) {
  console.error(`[check-in] --checkin-now failed: ${reason}`);
  return 1;
}

// The CI canary: send once, now, with the given ID, and report it through the exit code.
// Every way it cannot send is a failure here, never a silent no-op, so a broken build
// turns the job red instead of passing.
export async function checkinNow(id) {
  if (!id || id.startsWith('--')) return checkinNowFailed('it needs an ID');
  if (isDisabled()) return checkinNowFailed('SKIMA_DISABLE_CHECKIN is set');
  if (process.env.DEMO_MODE === 'true') return checkinNowFailed('demo mode never sends');
  if (!isConfigured()) return checkinNowFailed('this build has no check-in URL and website ID');
  try {
    await sendCheckin(buildData(id, detectSource()), getCheckinUrl());
  } catch (err) {
    return checkinNowFailed(err.message);
  }
  console.info(`[check-in] sent ${id} (--checkin-now)`);
  return 0;
}

export async function maybeCheckin({ isSetup = false, upgradesStartOff = UPGRADES_START_OFF } = {}) {
  if (hasCliFlag('--checkin-now')) {
    const code = await checkinNow(parseCliArg('--checkin-now'));
    if (!hasCliFlag('--port')) process.exit(code);
    return;
  }

  if (isDisabled()) return;
  if (process.env.DEMO_MODE === 'true') return;
  if (!isConfigured()) return;
  const url = getCheckinUrl();
  const dir = dataDir();
  const source = detectSource();

  if (upgradesStartOff && isUpgradeFromBeforeCheckin(dir, isSetup)) {
    markOff(dir);
    console.info('[check-in] off: this copy predates the check-in');
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

// Turn the check-in on. The ID is made now, not at the next start: it is the trace that
// keeps the next start from taking this copy for an update and turning it off again, and
// it lets "What gets sent" show the real number at once. Nothing is sent until then.
export function handleCheckinOn() {
  const dir = dataDir();
  clearOff(dir);
  return { off: false, id: getOrCreateId(dir) };
}

// Turn off the check-in. Deletes the ID, sends a last message, then returns.
// Delete first, so a failed send cannot leave the ID behind; the goodbye carries the old ID.
export async function handleCheckinOff() {
  const dir = dataDir();
  const id = readId(dir);
  deleteId(dir);
  markOff(dir);
  if (!id) return { sent: false };

  if (isDisabled() || !isConfigured()) return { sent: false };
  const url = getCheckinUrl();

  const source = detectSource();
  const data = buildData(id, source, { last: true });
  try {
    await sendCheckin(data, url);
    return { sent: true };
  } catch {
    return { sent: false };
  }
}
