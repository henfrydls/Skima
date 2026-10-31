import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { existsSync, readFileSync, writeFileSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  getOrCreateId,
  deleteId,
  readId,
  alreadySentToday,
  markSentToday,
  todayDate,
  detectSource,
  buildData,
  buildEnvelope,
  sendCheckin,
  getCheckinUrl,
  getWebsiteId,
  isDisabled,
  getCheckinFields,
  isOff,
  markOff,
  clearOff,
  dataDir,
  handleCheckinOff,
  getVersion,
  isConfigured,
} from '../checkin.js';

const TEST_DIR = join(tmpdir(), `skima-checkin-test-${process.pid}`);
const EXPECTED_OS = process.platform === 'win32' ? 'windows' : process.platform === 'darwin' ? 'macos' : process.platform;

// CI runs the suite with SKIMA_DISABLE_CHECKIN=1. Tests here exercise the open
// gate, so each starts without it and tests that need it closed stub it.
const ciGate = process.env.SKIMA_DISABLE_CHECKIN;

beforeEach(() => {
  mkdirSync(TEST_DIR, { recursive: true });
  delete process.env.SKIMA_DISABLE_CHECKIN;
});

afterEach(async () => {
  (await import('../checkin.js')).forgetHandledDay();
  rmSync(TEST_DIR, { recursive: true, force: true });
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  if (ciGate === undefined) delete process.env.SKIMA_DISABLE_CHECKIN;
  else process.env.SKIMA_DISABLE_CHECKIN = ciGate;
});

// ============================================================
// ID persistence
// ============================================================

describe('getOrCreateId', () => {
  it('creates a UUID v4 file on first call', () => {
    const id = getOrCreateId(TEST_DIR);
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(readFileSync(join(TEST_DIR, '.skima-instance-id'), 'utf8').trim()).toBe(id);
  });

  it('returns the same ID on subsequent calls', () => {
    const id1 = getOrCreateId(TEST_DIR);
    const id2 = getOrCreateId(TEST_DIR);
    expect(id1).toBe(id2);
  });

  it('reads an existing ID file', () => {
    writeFileSync(join(TEST_DIR, '.skima-instance-id'), 'my-test-id', 'utf8');
    expect(getOrCreateId(TEST_DIR)).toBe('my-test-id');
  });

  it('regenerates if file is empty', () => {
    writeFileSync(join(TEST_DIR, '.skima-instance-id'), '', 'utf8');
    const id = getOrCreateId(TEST_DIR);
    expect(id).toMatch(/^[0-9a-f]{8}/);
  });
});

describe('deleteId / readId', () => {
  it('deleteId removes the file', () => {
    getOrCreateId(TEST_DIR);
    expect(existsSync(join(TEST_DIR, '.skima-instance-id'))).toBe(true);
    deleteId(TEST_DIR);
    expect(existsSync(join(TEST_DIR, '.skima-instance-id'))).toBe(false);
  });

  it('deleteId is safe when file does not exist', () => {
    expect(() => deleteId(TEST_DIR)).not.toThrow();
  });

  it('readId returns null when no file', () => {
    expect(readId(TEST_DIR)).toBeNull();
  });

  it('readId returns the stored ID', () => {
    writeFileSync(join(TEST_DIR, '.skima-instance-id'), 'test-id-123', 'utf8');
    expect(readId(TEST_DIR)).toBe('test-id-123');
  });
});

// ============================================================
// Off state persistence (Fix #1)
// ============================================================

describe('isOff / markOff / clearOff', () => {
  it('isOff returns false when no file', () => {
    expect(isOff(TEST_DIR)).toBe(false);
  });

  it('markOff creates the file and isOff returns true', () => {
    markOff(TEST_DIR);
    expect(isOff(TEST_DIR)).toBe(true);
    expect(existsSync(join(TEST_DIR, '.skima-checkin-off'))).toBe(true);
  });

  it('clearOff removes the file', () => {
    markOff(TEST_DIR);
    clearOff(TEST_DIR);
    expect(isOff(TEST_DIR)).toBe(false);
  });

  it('clearOff is safe when file does not exist', () => {
    expect(() => clearOff(TEST_DIR)).not.toThrow();
  });
});

describe('handleCheckinOff persists off state', () => {
  it('off → restart → no new ID created', () => {
    markOff(TEST_DIR);
    expect(isOff(TEST_DIR)).toBe(true);
    expect(readId(TEST_DIR)).toBeNull();
    // getOrCreateId would create an ID, but maybeCheckin checks isOff first
    // We verify the guard condition that maybeCheckin uses:
    if (!isOff(TEST_DIR)) {
      getOrCreateId(TEST_DIR);
    }
    expect(readId(TEST_DIR)).toBeNull();
  });

  it('off → clearOff → ID can be created again', () => {
    markOff(TEST_DIR);
    clearOff(TEST_DIR);
    expect(isOff(TEST_DIR)).toBe(false);
    const id = getOrCreateId(TEST_DIR);
    expect(id).toMatch(/^[0-9a-f]{8}/);
  });
});

// ============================================================
// Date-based dedup
// ============================================================

describe('alreadySentToday / markSentToday', () => {
  it('returns false when no date file exists', () => {
    expect(alreadySentToday(TEST_DIR)).toBe(false);
  });

  it('returns true after markSentToday', () => {
    markSentToday(TEST_DIR);
    expect(alreadySentToday(TEST_DIR)).toBe(true);
  });

  it('returns false for a different date', () => {
    writeFileSync(join(TEST_DIR, '.skima-checkin-date'), '1999-01-01', 'utf8');
    expect(alreadySentToday(TEST_DIR)).toBe(false);
  });
});

describe('todayDate', () => {
  it('returns YYYY-MM-DD', () => {
    expect(todayDate()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

// ============================================================
// dataDir (Fix #2: Docker DATABASE_URL)
// ============================================================

describe('dataDir', () => {
  it('uses DATABASE_URL directory when no --db-path', () => {
    vi.stubEnv('DATABASE_URL', 'file:/app/data/skills.db');
    const dir = dataDir();
    expect(dir).toBe('/app/data');
  });

  it('falls back to cwd/prisma with no DATABASE_URL', () => {
    vi.stubEnv('DATABASE_URL', '');
    const dir = dataDir();
    expect(dir).toBe(join(process.cwd(), 'prisma'));
  });

  it('prefers --db-path over DATABASE_URL', () => {
    const orig = process.argv;
    process.argv = [...orig, '--db-path', '/custom/path/db.sqlite'];
    vi.stubEnv('DATABASE_URL', 'file:/app/data/skills.db');
    const dir = dataDir();
    expect(dir).toBe('/custom/path');
    process.argv = orig;
  });
});

// ============================================================
// Source detection
// ============================================================

describe('detectSource', () => {
  it('returns "unknown" with no indicators', () => {
    expect(detectSource()).toBe('unknown');
  });

  it('returns "docker" when DOCKER=true', () => {
    vi.stubEnv('DOCKER', 'true');
    expect(detectSource()).toBe('docker');
  });

  it('prefers --install-source over env', () => {
    const orig = process.argv;
    process.argv = [...orig, '--install-source', 'store'];
    vi.stubEnv('DOCKER', 'true');
    expect(detectSource()).toBe('store');
    process.argv = orig;
  });
});

// ============================================================
// Payload building
// ============================================================

describe('buildData', () => {
  it('includes required fields', () => {
    const d = buildData('test-id', 'installer');
    expect(d.id).toBe('test-id');
    expect(d.source).toBe('installer');
    expect(d.version).toBe(getVersion());
    expect(d.os).toBe(EXPECTED_OS);
    expect(d.arch).toBe(process.arch === 'x64' ? 'x64' : process.arch);
    expect(d.date).toBe(todayDate());
    expect(d.last).toBeUndefined();
  });

  it('includes last:true when turning off', () => {
    const d = buildData('test-id', 'installer', { last: true });
    expect(d.last).toBe(true);
  });

  // The receiver's queries read these exact keys; renaming one silently empties a metric.
  it('carries exactly the shared key set', () => {
    expect(Object.keys(buildData('x', 'deb')).sort())
      .toEqual(['arch', 'date', 'id', 'os', 'source', 'version']);
    expect(Object.keys(buildData('x', 'deb', { last: true })).sort())
      .toEqual(['arch', 'date', 'id', 'last', 'os', 'source', 'version']);
  });
});

describe('buildEnvelope', () => {
  it('wraps data in Umami event format', () => {
    const data = { id: 'abc', version: '1.6.0', os: 'linux', arch: 'x64', source: 'deb', date: '2026-11-01' };
    const env = buildEnvelope(data, 'website-123');
    expect(env.type).toBe('event');
    expect(env.payload.website).toBe('website-123');
    expect(env.payload.hostname).toBe('app');
    expect(env.payload.url).toBe('/');
    expect(env.payload.name).toBe('check-in');
    expect(env.payload.data).toBe(data);
    expect(env.payload.id).toBe('abc');
  });

  it('omits payload.id when data has no id', () => {
    const data = { version: '1.6.0' };
    const env = buildEnvelope(data, 'w');
    expect(env.payload.id).toBeUndefined();
  });

  it('carries exactly the expected payload keys', () => {
    const data = { id: 'x', version: '1.6.0', os: 'linux', arch: 'x64', source: 'deb', date: '2026-11-01' };
    const env = buildEnvelope(data, 'w');
    const keys = Object.keys(env.payload).sort();
    expect(keys).toEqual(['data', 'hostname', 'id', 'name', 'url', 'website']);
  });
});

// ============================================================
// SKIMA_DISABLE_CHECKIN gate
// ============================================================

describe('isDisabled (SKIMA_DISABLE_CHECKIN)', () => {
  it('returns false when not set', () => {
    delete process.env.SKIMA_DISABLE_CHECKIN;
    expect(isDisabled()).toBe(false);
  });

  it('returns true when set to "1"', () => {
    vi.stubEnv('SKIMA_DISABLE_CHECKIN', '1');
    expect(isDisabled()).toBe(true);
  });

  it('returns true when set to empty string', () => {
    vi.stubEnv('SKIMA_DISABLE_CHECKIN', '');
    expect(isDisabled()).toBe(true);
  });
});

// ============================================================
// sendCheckin
// ============================================================

describe('sendCheckin', () => {
  it('POSTs Umami envelope to URL with User-Agent Skima', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', mockFetch);

    const data = { id: 'x', version: '1.0.0' };
    await sendCheckin(data, 'http://example.com/api/send', 'test-website');
    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toBe('http://example.com/api/send');
    expect(opts.method).toBe('POST');
    expect(opts.headers['User-Agent']).toBe('Skima');
    const body = JSON.parse(opts.body);
    expect(body.type).toBe('event');
    expect(body.payload.website).toBe('test-website');
    expect(body.payload.data).toEqual(data);
    expect(body.payload.id).toBe('x');
  });

  it('throws on non-OK response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    await expect(sendCheckin({}, 'http://example.com', 'w')).rejects.toThrow('HTTP 500');
  });

  it('refuses when SKIMA_DISABLE_CHECKIN is set', async () => {
    vi.stubEnv('SKIMA_DISABLE_CHECKIN', '1');
    const mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);
    await expect(sendCheckin({}, 'http://example.com', 'w')).rejects.toThrow('SKIMA_DISABLE_CHECKIN');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('refuses when no URL provided', async () => {
    await expect(sendCheckin({}, '', 'w')).rejects.toThrow('no CHECKIN_URL');
  });

  it('refuses when no websiteId provided', async () => {
    await expect(sendCheckin({}, 'http://example.com', '')).rejects.toThrow('no CHECKIN_WEBSITE_ID');
  });
});

// ============================================================
// URL / website ID helpers
// ============================================================

describe('getCheckinUrl', () => {
  it('falls back to CHECKIN_URL env var in dev', () => {
    vi.stubEnv('CHECKIN_URL', 'http://test.local');
    expect(getCheckinUrl()).toBe('http://test.local');
  });

  it('returns empty string when no URL configured', () => {
    vi.stubEnv('CHECKIN_URL', '');
    expect(getCheckinUrl()).toBe('');
  });
});

describe('getWebsiteId', () => {
  it('falls back to CHECKIN_WEBSITE_ID env var in dev', () => {
    vi.stubEnv('CHECKIN_WEBSITE_ID', 'test-id');
    expect(getWebsiteId()).toBe('test-id');
  });
});

// ============================================================
// getCheckinFields
// ============================================================

describe('isConfigured', () => {
  it('needs both the URL and the website ID', () => {
    vi.stubEnv('CHECKIN_URL', '');
    vi.stubEnv('CHECKIN_WEBSITE_ID', '');
    expect(isConfigured()).toBe(false);
    vi.stubEnv('CHECKIN_URL', 'http://test.local');
    expect(isConfigured()).toBe(false);
    vi.stubEnv('CHECKIN_URL', '');
    vi.stubEnv('CHECKIN_WEBSITE_ID', 'w');
    expect(isConfigured()).toBe(false);
    vi.stubEnv('CHECKIN_URL', 'http://test.local');
    expect(isConfigured()).toBe(true);
  });
});

describe('getCheckinFields', () => {
  it('returns null when disabled', () => {
    vi.stubEnv('SKIMA_DISABLE_CHECKIN', '1');
    expect(getCheckinFields()).toBeNull();
  });

  it('returns null when no URL', () => {
    vi.stubEnv('CHECKIN_URL', '');
    expect(getCheckinFields()).toBeNull();
  });

  it('returns null with a URL but no website ID', () => {
    vi.stubEnv('CHECKIN_URL', 'http://test.local');
    vi.stubEnv('CHECKIN_WEBSITE_ID', '');
    expect(getCheckinFields()).toBeNull();
  });

  it('returns fields when configured', () => {
    vi.stubEnv('CHECKIN_URL', 'http://test.local');
    vi.stubEnv('CHECKIN_WEBSITE_ID', 'w');
    const fields = getCheckinFields();
    expect(fields).not.toBeNull();
    expect(fields.version).toBe(getVersion());
    expect(fields.os).toBe(EXPECTED_OS);
    expect(fields.source).toBeDefined();
  });
});

// ============================================================
// getVersion
// ============================================================

describe('getVersion', () => {
  it('returns a semver string in dev (reads package.json)', () => {
    expect(getVersion()).toMatch(/^\d+\.\d+\.\d+/);
  });

  it('does not return "unknown" in dev', () => {
    expect(getVersion()).not.toBe('unknown');
  });
});

// ============================================================
// maybeCheckin paths (Fix #5)
// ============================================================

describe('maybeCheckin', () => {
  let originalArgv;

  beforeEach(() => {
    originalArgv = process.argv;
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
  });

  afterEach(() => {
    process.argv = originalArgv;
  });

  it('skips when SKIMA_DISABLE_CHECKIN is set', async () => {
    vi.stubEnv('SKIMA_DISABLE_CHECKIN', '1');
    vi.stubEnv('CHECKIN_URL', 'http://test.local');
    const { maybeCheckin: mc } = await import('../checkin.js');
    await mc();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('skips when DEMO_MODE=true', async () => {
    vi.stubEnv('DEMO_MODE', 'true');
    vi.stubEnv('CHECKIN_URL', 'http://test.local');
    vi.stubEnv('CHECKIN_WEBSITE_ID', 'w');
    const { maybeCheckin: mc } = await import('../checkin.js');
    await mc();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('skips when no CHECKIN_URL', async () => {
    vi.stubEnv('CHECKIN_URL', '');
    const { maybeCheckin: mc } = await import('../checkin.js');
    await mc();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('skips when no CHECKIN_WEBSITE_ID', async () => {
    vi.stubEnv('CHECKIN_URL', 'http://test.local');
    vi.stubEnv('CHECKIN_WEBSITE_ID', '');
    const { maybeCheckin: mc } = await import('../checkin.js');
    await mc();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('skips when off file is present (off → restart → no network)', async () => {
    vi.stubEnv('CHECKIN_URL', 'http://test.local');
    vi.stubEnv('CHECKIN_WEBSITE_ID', 'w');
    // Ensure dataDir points to TEST_DIR
    process.argv = [...originalArgv, '--db-path', join(TEST_DIR, 'db.sqlite')];
    markOff(TEST_DIR);
    const { maybeCheckin: mc } = await import('../checkin.js');
    await mc();
    expect(fetch).not.toHaveBeenCalled();
    expect(readId(TEST_DIR)).toBeNull();
  });

  it('--checkin-now sends immediately and exits', async () => {
    vi.stubEnv('CHECKIN_URL', 'http://test.local');
    vi.stubEnv('CHECKIN_WEBSITE_ID', 'w');
    const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {});
    process.argv = [...originalArgv, '--checkin-now', 'canary-id'];
    const { maybeCheckin: mc } = await import('../checkin.js');
    await mc();
    expect(fetch).toHaveBeenCalledOnce();
    const body = JSON.parse(fetch.mock.calls[0][1].body);
    expect(body.payload.data.id).toBe('canary-id');
    expect(mockExit).toHaveBeenCalledWith(0);
  });

  describe('--checkin-now exit code (the CI canary)', () => {
    let mockExit;

    beforeEach(() => {
      vi.stubEnv('CHECKIN_URL', 'http://checkin.invalid/api/send');
      vi.stubEnv('CHECKIN_WEBSITE_ID', 'w');
      mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {});
    });

    async function run(...args) {
      process.argv = [...originalArgv, ...args];
      const { maybeCheckin: mc } = await import('../checkin.js');
      await mc();
    }

    it('exits 1 when the receiver answers non-2xx', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));
      await run('--checkin-now', 'ci-canary-1');
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('exits 1 on a network error', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('getaddrinfo ENOTFOUND')));
      await run('--checkin-now', 'ci-canary-1');
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it.each([
      ['the build has no URL', () => vi.stubEnv('CHECKIN_URL', '')],
      ['the build has no website ID', () => vi.stubEnv('CHECKIN_WEBSITE_ID', '')],
      ['SKIMA_DISABLE_CHECKIN is set', () => vi.stubEnv('SKIMA_DISABLE_CHECKIN', '1')],
      ['in demo mode', () => vi.stubEnv('DEMO_MODE', 'true')],
    ])('exits 1 without sending when %s', async (_, setup) => {
      setup();
      await run('--checkin-now', 'ci-canary-1');
      expect(fetch).not.toHaveBeenCalled();
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('exits 1 without sending when no ID is given', async () => {
      await run('--checkin-now');
      expect(fetch).not.toHaveBeenCalled();
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('does not take the next flag as the ID', async () => {
      await run('--checkin-now', '--install-source', 'canary');
      expect(fetch).not.toHaveBeenCalled();
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('with --port it keeps serving instead of exiting', async () => {
      await run('--checkin-now', 'ci-canary-1', '--port', '11998');
      expect(fetch).toHaveBeenCalledOnce();
      expect(mockExit).not.toHaveBeenCalled();
    });

    it('sends source=canary when started as the canary', async () => {
      await run('--install-source', 'canary', '--checkin-now', 'ci-canary-7');
      const body = JSON.parse(fetch.mock.calls[0][1].body);
      expect(body.payload.data).toMatchObject({ id: 'ci-canary-7', source: 'canary' });
      expect(mockExit).toHaveBeenCalledWith(0);
    });
  });
});

// ============================================================
// HTTP endpoint tests
// ============================================================

describe('checkin-status endpoint', () => {
  it('GET /api/checkin-status returns configured, disabled, off, and version', async () => {
    const { default: request } = await import('supertest');
    const { createApp } = await import('../index.js');
    const app = createApp();
    const res = await request(app).get('/api/checkin-status');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('configured');
    expect(res.body).toHaveProperty('disabled');
    expect(res.body).toHaveProperty('off');
    expect(res.body).toHaveProperty('version');
    expect(res.body.version).toMatch(/^\d+\.\d+\.\d+/);
  });

  it('reports configured:false with a URL but no website ID, true with both', async () => {
    const { default: request } = await import('supertest');
    const { createApp } = await import('../index.js');
    const app = createApp();
    vi.stubEnv('CHECKIN_URL', 'http://checkin.invalid/api/send');
    vi.stubEnv('CHECKIN_WEBSITE_ID', '');
    expect((await request(app).get('/api/checkin-status')).body.configured).toBe(false);
    vi.stubEnv('CHECKIN_WEBSITE_ID', '00000000-0000-0000-0000-000000000000');
    expect((await request(app).get('/api/checkin-status')).body.configured).toBe(true);
  });
});

describe('checkin-fields endpoint (auth required)', () => {
  it('GET /api/checkin-fields returns 401 when password is set and no token', async () => {
    const { default: request } = await import('supertest');
    const { createApp } = await import('../index.js');
    const { ensureDatabase } = await import('../db.js');
    const { prisma } = await import('../db.js');
    await ensureDatabase();
    // Set a password so auth is required
    const bcrypt = await import('bcryptjs');
    const hashed = await bcrypt.default.hash('test', 10);
    await prisma.systemConfig.upsert({
      where: { id: 1 },
      update: { adminPassword: hashed },
      create: { id: 1, companyName: 'Test', adminName: 'Admin', adminPassword: hashed, isSetup: true },
    });
    const app = createApp();
    const res = await request(app).get('/api/checkin-fields');
    expect(res.status).toBe(401);
    // Clean up
    await prisma.systemConfig.deleteMany();
  });

  it('GET /api/checkin-fields returns 200 when no password configured', async () => {
    const { default: request } = await import('supertest');
    const { createApp } = await import('../index.js');
    const { ensureDatabase } = await import('../db.js');
    const { prisma } = await import('../db.js');
    await ensureDatabase();
    await prisma.systemConfig.upsert({
      where: { id: 1 },
      update: { adminPassword: null },
      create: { id: 1, companyName: 'Test', adminName: 'Admin', adminPassword: null, isSetup: true },
    });
    const app = createApp();
    const res = await request(app).get('/api/checkin-fields');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('available');
    await prisma.systemConfig.deleteMany();
  });
});

describe('copies that predate the check-in', () => {
  let originalArgv;

  beforeEach(() => {
    originalArgv = process.argv;
    process.argv = [...originalArgv, '--db-path', join(TEST_DIR, 'db.sqlite')];
    vi.stubEnv('CHECKIN_URL', 'http://checkin.invalid/api/send');
    vi.stubEnv('CHECKIN_WEBSITE_ID', 'w');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    process.argv = originalArgv;
  });

  it('detects an update: set up, with no ID, date or off file', async () => {
    const { isUpgradeFromBeforeCheckin: up } = await import('../checkin.js');
    expect(up(TEST_DIR, true)).toBe(true);
    expect(up(TEST_DIR, false)).toBe(false);
  });

  it('any trace of a previous check-in means it is not an update', async () => {
    const { isUpgradeFromBeforeCheckin: up } = await import('../checkin.js');
    getOrCreateId(TEST_DIR);
    expect(up(TEST_DIR, true)).toBe(false);
    deleteId(TEST_DIR);
    markSentToday(TEST_DIR);
    expect(up(TEST_DIR, true)).toBe(false);
    rmSync(join(TEST_DIR, '.skima-checkin-date'));
    markOff(TEST_DIR);
    expect(up(TEST_DIR, true)).toBe(false);
  });

  it('defaults to starting updates on', async () => {
    const { UPGRADES_START_OFF } = await import('../checkin.js');
    expect(UPGRADES_START_OFF).toBe(false);
  });

  it('by default an update sends on its first use, and still has the one-time notice to see', async () => {
    const { maybeCheckin: mc, recordUse, noticeSeen } = await import('../checkin.js');
    await mc({ isSetup: true });
    await recordUse();
    expect(isOff(TEST_DIR)).toBe(false);
    expect(fetch).toHaveBeenCalledOnce();
    // The notice is now the only thing that tells this user something is sent.
    expect(noticeSeen(TEST_DIR)).toBe(false);
  });

  it('with updates starting off: an update is turned off, gets no ID and sends nothing', async () => {
    const { maybeCheckin: mc } = await import('../checkin.js');
    await mc({ isSetup: true, upgradesStartOff: true });
    await vi.advanceTimersByTimeAsync(10_000);
    expect(isOff(TEST_DIR)).toBe(true);
    expect(readId(TEST_DIR)).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('with updates starting on: an update gets an ID at start, like a new install, and sends nothing until used', async () => {
    const { maybeCheckin: mc } = await import('../checkin.js');
    await mc({ isSetup: true, upgradesStartOff: false });
    await vi.advanceTimersByTimeAsync(10_000);
    expect(isOff(TEST_DIR)).toBe(false);
    expect(readId(TEST_DIR)).not.toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('a new install (not set up yet) starts on either way', async () => {
    const { maybeCheckin: mc } = await import('../checkin.js');
    await mc({ isSetup: false, upgradesStartOff: true });
    await vi.advanceTimersByTimeAsync(10_000);
    expect(isOff(TEST_DIR)).toBe(false);
    expect(readId(TEST_DIR)).not.toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('once turned off as an update, later starts stay off', async () => {
    const { maybeCheckin: mc } = await import('../checkin.js');
    await mc({ isSetup: true, upgradesStartOff: true });
    await mc({ isSetup: true, upgradesStartOff: true });
    await vi.advanceTimersByTimeAsync(10_000);
    expect(isOff(TEST_DIR)).toBe(true);
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe('one-time notice', () => {
  it('is unseen until marked, then seen', async () => {
    const { noticeSeen, markNoticeSeen } = await import('../checkin.js');
    expect(noticeSeen(TEST_DIR)).toBe(false);
    markNoticeSeen(TEST_DIR);
    expect(noticeSeen(TEST_DIR)).toBe(true);
  });
});

describe('checkin-on and checkin-notice-seen endpoints', () => {
  async function appWithPassword(password) {
    const { default: request } = await import('supertest');
    const { createApp } = await import('../index.js');
    const { ensureDatabase, prisma } = await import('../db.js');
    await ensureDatabase();
    const bcrypt = await import('bcryptjs');
    const hashed = password ? await bcrypt.default.hash(password, 10) : null;
    await prisma.systemConfig.upsert({
      where: { id: 1 },
      update: { adminPassword: hashed },
      create: { id: 1, companyName: 'Test', adminName: 'Admin', adminPassword: hashed, isSetup: true },
    });
    // db.js already bound Prisma at import; this only redirects dataDir().
    vi.stubEnv('DATABASE_URL', `file:${join(TEST_DIR, 'db.sqlite')}`);
    return { request, app: createApp(), prisma };
  }

  it('an update turned on stays on: start (off) → checkin-on → start → use sends the ID shown in "What gets sent"', async () => {
    const { request, app, prisma } = await appWithPassword(null);
    vi.stubEnv('CHECKIN_URL', 'http://checkin.invalid/api/send');
    vi.stubEnv('CHECKIN_WEBSITE_ID', 'w');
    const mockFetch = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', mockFetch);
    const { maybeCheckin: mc } = await import('../checkin.js');

    // First start of the new version on a copy set up before: it starts off.
    await mc({ isSetup: true, upgradesStartOff: true });
    expect(isOff(TEST_DIR)).toBe(true);

    expect((await request(app).post('/api/checkin-on')).status).toBe(200);
    expect(isOff(TEST_DIR)).toBe(false);
    const shown = (await request(app).get('/api/checkin-fields')).body.fields.id;
    expect(shown).toMatch(/^[0-9a-f-]{36}$/);

    // Next start: it must not be mistaken for an update again. Then someone uses it.
    await mc({ isSetup: true, upgradesStartOff: true });
    expect(isOff(TEST_DIR)).toBe(false);
    expect(mockFetch).not.toHaveBeenCalled();
    expect((await request(app).post('/api/use')).status).toBe(204);
    await vi.waitFor(() => expect(mockFetch).toHaveBeenCalledOnce());
    expect(JSON.parse(mockFetch.mock.calls[0][1].body).payload.data.id).toBe(shown);
    await prisma.systemConfig.deleteMany();
  });

  it('checkin-on requires auth when a password is set', async () => {
    const { request, app, prisma } = await appWithPassword('test');
    markOff(TEST_DIR);
    expect((await request(app).post('/api/checkin-on')).status).toBe(401);
    expect(isOff(TEST_DIR)).toBe(true);
    await prisma.systemConfig.deleteMany();
  });

  it('checkin-on clears the off state and sends nothing now', async () => {
    const { request, app, prisma } = await appWithPassword(null);
    const mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);
    markOff(TEST_DIR);
    const res = await request(app).post('/api/checkin-on');
    expect(res.status).toBe(200);
    expect(isOff(TEST_DIR)).toBe(false);
    expect(mockFetch).not.toHaveBeenCalled();
    await prisma.systemConfig.deleteMany();
  });

  it('an update started with the defaults reports on and notice unseen, so the notice shows', async () => {
    const { request, app, prisma } = await appWithPassword(null);
    vi.stubEnv('CHECKIN_URL', 'http://checkin.invalid/api/send');
    vi.stubEnv('CHECKIN_WEBSITE_ID', 'w');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
    const { maybeCheckin: mc } = await import('../checkin.js');
    vi.useFakeTimers();
    try {
      await mc({ isSetup: true });
      await vi.advanceTimersByTimeAsync(10_000);
    } finally {
      vi.useRealTimers();
    }
    const status = (await request(app).get('/api/checkin-status')).body;
    expect(status.off).toBe(false);
    expect(status.noticeSeen).toBe(false);
    await prisma.systemConfig.deleteMany();
  });

  it('checkin-notice-seen requires auth, then shows up in checkin-status', async () => {
    const { request, app, prisma } = await appWithPassword('test');
    expect((await request(app).post('/api/checkin-notice-seen')).status).toBe(401);
    expect((await request(app).get('/api/checkin-status')).body.noticeSeen).toBe(false);
    await prisma.systemConfig.update({ where: { id: 1 }, data: { adminPassword: null } });
    expect((await request(app).post('/api/checkin-notice-seen')).status).toBe(200);
    expect((await request(app).get('/api/checkin-status')).body.noticeSeen).toBe(true);
    await prisma.systemConfig.deleteMany();
  });
});

describe('checkin-off endpoint (auth required)', () => {
  it('POST /api/checkin-off returns 401 when password is set and no token', async () => {
    const { default: request } = await import('supertest');
    const { createApp } = await import('../index.js');
    const { ensureDatabase } = await import('../db.js');
    const { prisma } = await import('../db.js');
    await ensureDatabase();
    const bcrypt = await import('bcryptjs');
    const hashed = await bcrypt.default.hash('test', 10);
    await prisma.systemConfig.upsert({
      where: { id: 1 },
      update: { adminPassword: hashed },
      create: { id: 1, companyName: 'Test', adminName: 'Admin', adminPassword: hashed, isSetup: true },
    });
    // db.js already bound Prisma at import; this only redirects dataDir().
    vi.stubEnv('DATABASE_URL', `file:${join(TEST_DIR, 'db.sqlite')}`);
    const app = createApp();
    const res = await request(app).post('/api/checkin-off');
    expect(res.status).toBe(401);
    expect(isOff(TEST_DIR)).toBe(false);
    await prisma.systemConfig.deleteMany();
  });

  it('POST /api/checkin-off persists the off state when no password', async () => {
    const { default: request } = await import('supertest');
    const { createApp } = await import('../index.js');
    const { ensureDatabase } = await import('../db.js');
    const { prisma } = await import('../db.js');
    await ensureDatabase();
    await prisma.systemConfig.upsert({
      where: { id: 1 },
      update: { adminPassword: null },
      create: { id: 1, companyName: 'Test', adminName: 'Admin', adminPassword: null, isSetup: true },
    });
    vi.stubEnv('DATABASE_URL', `file:${join(TEST_DIR, 'db.sqlite')}`);
    getOrCreateId(TEST_DIR);
    const app = createApp();
    const res = await request(app).post('/api/checkin-off');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('sent');
    expect(isOff(TEST_DIR)).toBe(true);
    expect(readId(TEST_DIR)).toBeNull();
    await prisma.systemConfig.deleteMany();
  });
});

describe('config endpoint includes isStoreInstall', () => {
  it('GET /api/config returns isStoreInstall=false by default', async () => {
    const { default: request } = await import('supertest');
    const { createApp } = await import('../index.js');
    const { ensureDatabase } = await import('../db.js');
    await ensureDatabase();
    const app = createApp();
    const res = await request(app).get('/api/config');
    expect(res.status).toBe(200);
    expect(res.body.isStoreInstall).toBe(false);
  });
});

describe('a day counts when Skima is used (recordUse)', () => {
  let originalArgv;
  const sentDates = () => fetch.mock.calls.map(([, o]) => JSON.parse(o.body).payload.data.date);

  beforeEach(() => {
    originalArgv = process.argv;
    process.argv = [...originalArgv, '--db-path', join(TEST_DIR, 'db.sqlite')];
    vi.stubEnv('CHECKIN_URL', 'http://checkin.invalid/api/send');
    vi.stubEnv('CHECKIN_WEBSITE_ID', 'w');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-02T09:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    process.argv = originalArgv;
  });

  it('starting the server sends nothing', async () => {
    const { maybeCheckin: mc } = await import('../checkin.js');
    await mc({ isSetup: true });
    await vi.advanceTimersByTimeAsync(60_000);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('server on for 3 days, used on 2 of them: 2 check-ins, one per day of use', async () => {
    const { maybeCheckin: mc, recordUse } = await import('../checkin.js');
    await mc({ isSetup: true });
    await recordUse();
    await recordUse();
    vi.setSystemTime(new Date('2026-11-03T09:00:00Z')); // nobody uses it
    vi.setSystemTime(new Date('2026-11-04T15:00:00Z'));
    await recordUse();
    await recordUse();
    expect(sentDates()).toEqual(['2026-11-02', '2026-11-04']);
  });

  it('server on for 3 days, never used: no check-in', async () => {
    const { maybeCheckin: mc } = await import('../checkin.js');
    await mc({ isSetup: true });
    for (const day of ['2026-11-03', '2026-11-04']) {
      vi.setSystemTime(new Date(`${day}T09:00:00Z`));
      await vi.advanceTimersByTimeAsync(60_000);
    }
    expect(fetch).not.toHaveBeenCalled();
  });

  it('app left open across midnight: the first use of the new day sends', async () => {
    const { recordUse } = await import('../checkin.js');
    vi.setSystemTime(new Date('2026-11-02T23:58:00Z'));
    await recordUse();
    vi.setSystemTime(new Date('2026-11-03T00:01:00Z'));
    await recordUse();
    expect(sentDates()).toEqual(['2026-11-02', '2026-11-03']);
  });

  it('later uses of the day are answered from memory, without reading the disk', async () => {
    const { recordUse } = await import('../checkin.js');
    expect(await recordUse()).toBe(true);
    // With the files gone, a disk read would find nothing sent today and send again.
    rmSync(TEST_DIR, { recursive: true, force: true });
    expect(await recordUse()).toBe(false);
    expect(fetch).toHaveBeenCalledOnce();
  });

  it('a new process the same day does not send twice (the date on disk holds)', async () => {
    const { recordUse, forgetHandledDay } = await import('../checkin.js');
    await recordUse();
    forgetHandledDay(); // as after a restart
    await recordUse();
    expect(fetch).toHaveBeenCalledOnce();
  });

  it('a failed send is tried again on a later use the same day', async () => {
    fetch.mockRejectedValueOnce(new Error('offline'));
    const { recordUse } = await import('../checkin.js');
    expect(await recordUse()).toBe(false);
    expect(await recordUse()).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(alreadySentToday(TEST_DIR)).toBe(true);
  });

  it('turned on later the same day: the next use sends', async () => {
    const { recordUse, handleCheckinOn } = await import('../checkin.js');
    markOff(TEST_DIR);
    expect(await recordUse()).toBe(false);
    handleCheckinOn();
    expect(await recordUse()).toBe(true);
    expect(fetch).toHaveBeenCalledOnce();
  });

  it.each([
    ['the gate is closed', () => vi.stubEnv('SKIMA_DISABLE_CHECKIN', '1')],
    ['in demo mode', () => vi.stubEnv('DEMO_MODE', 'true')],
    ['with no URL', () => vi.stubEnv('CHECKIN_URL', '')],
    ['when turned off', () => markOff(TEST_DIR)],
  ])('sends nothing when %s', async (_, setup) => {
    setup();
    const { recordUse } = await import('../checkin.js');
    expect(await recordUse()).toBe(false);
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe('POST /api/use is the only thing that counts a day', () => {
  async function app() {
    const { default: request } = await import('supertest');
    const { createApp } = await import('../index.js');
    const { ensureDatabase } = await import('../db.js');
    await ensureDatabase();
    // db.js already bound Prisma at import; this only redirects dataDir().
    vi.stubEnv('DATABASE_URL', `file:${join(TEST_DIR, 'db.sqlite')}`);
    vi.stubEnv('CHECKIN_URL', 'http://checkin.invalid/api/send');
    vi.stubEnv('CHECKIN_WEBSITE_ID', 'w');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
    return { request, app: createApp() };
  }

  it('a monitor polling the server sends nothing', async () => {
    const { request, app: a } = await app();
    for (const path of ['/', '/api/config', '/api/checkin-status', '/api/collaborators', '/api/health']) {
      await request(a).get(path);
    }
    expect(fetch).not.toHaveBeenCalled();
  });

  it('the interface reporting use answers 204 at once and sends the day\'s check-in', async () => {
    const { request, app: a } = await app();
    expect((await request(a).post('/api/use')).status).toBe(204);
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledOnce());
    expect((await request(a).post('/api/use')).status).toBe(204);
    expect(fetch).toHaveBeenCalledOnce();
  });
});
