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
  buildPayload,
  sendCheckin,
  getCheckinUrl,
  isDisabled,
  getCheckinFields,
} from '../checkin.js';

const TEST_DIR = join(tmpdir(), `skima-checkin-test-${process.pid}`);

beforeEach(() => {
  mkdirSync(TEST_DIR, { recursive: true });
});

afterEach(() => {
  rmSync(TEST_DIR, { recursive: true, force: true });
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

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

describe('buildPayload', () => {
  it('includes required fields', () => {
    const p = buildPayload('test-id', 'installer');
    expect(p.id).toBe('test-id');
    expect(p.source).toBe('installer');
    expect(p.v).toBe('1.5.0');
    expect(p.os).toBe('linux');
    expect(p.arch).toBe('x64');
    expect(p.d).toBe(todayDate());
    expect(p.internal).toBeUndefined();
    expect(p.last).toBeUndefined();
  });

  it('includes internal:true when CHECKIN_INTERNAL=1', () => {
    vi.stubEnv('CHECKIN_INTERNAL', '1');
    const p = buildPayload('test-id', 'docker');
    expect(p.internal).toBe(true);
  });

  it('includes last:true when turning off', () => {
    const p = buildPayload('test-id', 'installer', { last: true });
    expect(p.last).toBe(true);
  });
});

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

describe('sendCheckin', () => {
  it('POSTs JSON to url/checkin', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', mockFetch);

    await sendCheckin({ id: 'x', v: '1.0.0' }, 'http://example.com');
    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toBe('http://example.com/checkin');
    expect(opts.method).toBe('POST');
    expect(JSON.parse(opts.body)).toEqual({ id: 'x', v: '1.0.0' });
  });

  it('strips trailing slashes from the base URL', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', mockFetch);

    await sendCheckin({}, 'http://example.com///');
    expect(mockFetch.mock.calls[0][0]).toBe('http://example.com/checkin');
  });

  it('throws on non-OK response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    await expect(sendCheckin({}, 'http://example.com')).rejects.toThrow('HTTP 500');
  });

  it('refuses when SKIMA_DISABLE_CHECKIN is set', async () => {
    vi.stubEnv('SKIMA_DISABLE_CHECKIN', '1');
    const mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);
    await expect(sendCheckin({}, 'http://example.com')).rejects.toThrow('SKIMA_DISABLE_CHECKIN');
    expect(mockFetch).not.toHaveBeenCalled();
  });
});

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

describe('getCheckinFields', () => {
  it('returns null when disabled', () => {
    vi.stubEnv('SKIMA_DISABLE_CHECKIN', '1');
    expect(getCheckinFields()).toBeNull();
  });

  it('returns null when no URL', () => {
    vi.stubEnv('CHECKIN_URL', '');
    expect(getCheckinFields()).toBeNull();
  });

  it('returns fields when configured', () => {
    vi.stubEnv('CHECKIN_URL', 'http://test.local');
    const fields = getCheckinFields();
    expect(fields).not.toBeNull();
    expect(fields.v).toBe('1.5.0');
    expect(fields.os).toBe('linux');
    expect(fields.source).toBeDefined();
  });
});

describe('checkin-status endpoint', () => {
  it('GET /api/checkin-status returns configured and disabled state', async () => {
    const { default: request } = await import('supertest');
    const { createApp } = await import('../index.js');
    const app = createApp();
    const res = await request(app).get('/api/checkin-status');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('configured');
    expect(res.body).toHaveProperty('disabled');
    expect(typeof res.body.configured).toBe('boolean');
    expect(typeof res.body.disabled).toBe('boolean');
  });
});

describe('checkin-fields endpoint', () => {
  it('GET /api/checkin-fields returns availability', async () => {
    const { default: request } = await import('supertest');
    const { createApp } = await import('../index.js');
    const app = createApp();
    const res = await request(app).get('/api/checkin-fields');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('available');
  });
});

describe('checkin-off endpoint', () => {
  it('POST /api/checkin-off returns sent status', async () => {
    const { default: request } = await import('supertest');
    const { createApp } = await import('../index.js');
    const app = createApp();
    const res = await request(app).post('/api/checkin-off');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('sent');
    expect(res.body.sent).toBe(false);
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
