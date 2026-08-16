import { describe, it, expect } from 'vitest';
import { normalizeSqliteUrl } from '../dbAdapter.js';
import { resolve } from 'path';
import { createRequire } from 'module';

// The vendored bun:sqlite adapter is CJS (see its package.json).
const require = createRequire(import.meta.url);
const { mapQueryArgs } = require('../../vendor/prisma-bun-sqlite-adapter/conversion.js');

// ── The date-dialect invariant (INFRA-1's #1 data-integrity rule) ──
// Every v1.4.x database stores DateTime as unix-epoch-ms INTEGERs (legacy Rust
// engine dialect). The Node adapter enforces this via timestampFormat
// 'unixepoch-ms'; the vendored Bun adapter enforces it via the SKIMA PATCH in
// mapQueryArgs. If these tests fail, the sidecar would corrupt user databases
// with mixed date formats. See vendor/prisma-bun-sqlite-adapter/VENDORED.md.
describe('vendored bun:sqlite adapter — mapQueryArgs (SKIMA PATCH)', () => {
  const T = (scalarType) => [{ scalarType }];

  it('serializes a datetime ISO string arg to epoch-ms integer', () => {
    // Prisma 6.19 passes datetimes as ISO strings typed scalarType:'datetime'
    const [v] = mapQueryArgs(['2026-05-01T10:30:00.000Z'], T('datetime'));
    expect(v).toBe(1777631400000);
  });

  it('serializes a Date object arg to epoch-ms integer', () => {
    const d = new Date('2026-08-16T03:00:00.000Z');
    const [v] = mapQueryArgs([d], T('datetime'));
    expect(v).toBe(d.getTime());
  });

  it('never emits ISO text for datetimes', () => {
    const [v] = mapQueryArgs([new Date()], T('datetime'));
    expect(typeof v).toBe('number');
  });

  // Null guard (upstream let null Int? args become NaN via parseInt)
  it('passes null through for nullable int args', () => {
    expect(mapQueryArgs([null], T('int'))).toEqual([null]);
    expect(mapQueryArgs([undefined], T('int'))).toEqual([null]);
  });

  it('passes null through for nullable float and datetime args', () => {
    expect(mapQueryArgs([null], T('float'))).toEqual([null]);
    expect(mapQueryArgs([null], T('datetime'))).toEqual([null]);
  });

  it('still converts non-null ints, floats and booleans', () => {
    expect(mapQueryArgs(['42'], T('int'))).toEqual([42]);
    expect(mapQueryArgs(['2.5'], T('float'))).toEqual([2.5]);
    expect(mapQueryArgs([true], T('unknown'))).toEqual([1]);
    expect(mapQueryArgs([false], T('unknown'))).toEqual([0]);
  });
});

// ── URL normalization (legacy-engine parity) ──
describe('normalizeSqliteUrl', () => {
  const SCHEMA_DIR = resolve(import.meta.dirname, '../../prisma');

  it('resolves a relative file: path against the schema dir (legacy parity)', () => {
    expect(normalizeSqliteUrl('file:./skills.db')).toBe(`file:${resolve(SCHEMA_DIR, './skills.db')}`);
  });

  it('leaves absolute file: paths untouched', () => {
    expect(normalizeSqliteUrl('file:/tmp/x.db')).toBe('file:/tmp/x.db');
  });

  it('leaves :memory: untouched', () => {
    expect(normalizeSqliteUrl('file::memory:')).toBe('file::memory:');
  });

  it('preserves query params without treating them as path', () => {
    expect(normalizeSqliteUrl('file:./dev.db?connection_limit=1')).toBe(
      `file:${resolve(SCHEMA_DIR, './dev.db')}?connection_limit=1`
    );
  });

  it('passes through undefined and non-file URLs', () => {
    expect(normalizeSqliteUrl(undefined)).toBe(undefined);
    expect(normalizeSqliteUrl('postgres://x')).toBe('postgres://x');
  });
});
